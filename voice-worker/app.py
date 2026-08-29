import gc
import os
import shutil
import subprocess
import tempfile
from pathlib import Path

from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.responses import FileResponse

app = FastAPI(title="VetroAI Voice Cover Worker", version="1.4.0")

MODEL_DIR = Path(os.getenv("OPENVOICE_MODEL_DIR", "/opt/models/openvoice-v2"))
MAX_BYTES = int(os.getenv("MAX_AUDIO_BYTES", str(50 * 1024 * 1024)))
CHUNK_SECONDS = max(2, int(os.getenv("VOICE_CHUNK_SECONDS", "4")))
_device = "cpu"
_converter = None


def converter_dir() -> Path:
    return MODEL_DIR / "checkpoints_v2" / "converter"


def get_converter():
    global _converter
    if _converter is None:
        # Import torch/OpenVoice only after FFmpeg stem extraction has finished.
        import torch
        torch.set_grad_enabled(False)
        torch.set_num_threads(1)
        try:
            torch.set_num_interop_threads(1)
        except RuntimeError:
            pass

        from openvoice.api import OpenVoiceBaseClass, ToneColorConverter

        cdir = converter_dir()
        config = cdir / "config.json"
        ckpt = cdir / "checkpoint.pth"
        if not config.exists() or not ckpt.exists():
            raise RuntimeError(f"OpenVoice model files are missing at {cdir}")

        # Avoid ToneColorConverter's optional wavmark model to save RAM.
        converter = ToneColorConverter.__new__(ToneColorConverter)
        OpenVoiceBaseClass.__init__(converter, str(config), device=_device)
        converter.watermark_model = None
        converter.version = getattr(converter.hps, "_version_", "v1")
        converter.load_ckpt(str(ckpt))
        _converter = converter
    return _converter


def unload_converter() -> None:
    global _converter
    _converter = None
    gc.collect()


def run(cmd: list[str], stage: str) -> str:
    result = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True)
    if result.returncode != 0:
        output = (result.stdout or "Audio command failed")[-5000:]
        raise RuntimeError(f"{stage} failed: {output}")
    return result.stdout or ""


def safe_suffix(filename: str | None, default: str) -> str:
    suffix = Path(filename or "").suffix.lower()
    if suffix in {".mp3", ".wav", ".m4a", ".aac", ".ogg", ".flac", ".webm", ".mp4"}:
        return suffix
    return default


async def save_upload(upload: UploadFile, path: Path) -> None:
    total = 0
    with path.open("wb") as out:
        while True:
            chunk = await upload.read(1024 * 1024)
            if not chunk:
                break
            total += len(chunk)
            if total > MAX_BYTES:
                raise HTTPException(status_code=413, detail="Audio file exceeds the 50 MB limit")
            out.write(chunk)


def normalize_song(source: Path, target: Path) -> None:
    # Preserve stereo because the free-tier stem method uses mid/side information.
    run([
        "ffmpeg", "-y", "-i", str(source),
        "-ac", "2", "-ar", "44100", "-c:a", "pcm_s16le", str(target),
    ], "Song normalization")


def normalize_reference(source: Path, target: Path) -> None:
    run([
        "ffmpeg", "-y", "-i", str(source),
        "-ac", "1", "-ar", "44100", "-c:a", "pcm_s16le", str(target),
    ], "Reference voice normalization")


def separate_vocals_lite(song_wav: Path, work: Path) -> tuple[Path, Path]:
    """Low-memory vocal approximation for Render's 512 MB free instance.

    The center (mid) channel is used as the vocal candidate. The instrumental is
    built mostly from the stereo side signal, with a quiet low-frequency copy of
    the original mixed back in so centered bass is not completely lost.
    """
    vocals = work / "vocals-lite.wav"
    instrumental = work / "instrumental-lite.wav"
    filters = (
        "[0:a]asplit=3[mid][sidein][bass];"
        "[mid]pan=mono|c0=0.5*c0+0.5*c1,highpass=f=90,lowpass=f=12000[v];"
        "[sidein]pan=stereo|c0=c0-c1|c1=c1-c0,volume=0.65[s];"
        "[bass]lowpass=f=180,volume=0.20[b];"
        "[s][b]amix=inputs=2:duration=longest:normalize=0[i]"
    )
    run([
        "ffmpeg", "-y", "-i", str(song_wav),
        "-filter_complex", filters,
        "-map", "[v]", "-ac", "1", "-ar", "44100", "-c:a", "pcm_s16le", str(vocals),
        "-map", "[i]", "-ac", "2", "-ar", "44100", "-c:a", "pcm_s16le", str(instrumental),
    ], "FFmpeg lite stem separation")
    if not vocals.exists() or not instrumental.exists():
        raise RuntimeError("FFmpeg lite separation did not create both tracks")
    return vocals, instrumental


def split_wav(source: Path, out_dir: Path, seconds: int = CHUNK_SECONDS) -> list[Path]:
    out_dir.mkdir(parents=True, exist_ok=True)
    pattern = out_dir / "chunk-%03d.wav"
    run([
        "ffmpeg", "-y", "-i", str(source),
        "-f", "segment", "-segment_time", str(seconds), "-reset_timestamps", "1",
        "-ac", "1", "-ar", "44100", "-c:a", "pcm_s16le", str(pattern),
    ], "Audio chunking")
    chunks = sorted(out_dir.glob("chunk-*.wav"))
    if not chunks:
        raise RuntimeError("Audio chunking failed: no chunks were produced")
    return chunks


def representative_chunk(source: Path, out_dir: Path) -> Path:
    chunks = split_wav(source, out_dir, seconds=6)
    return chunks[len(chunks) // 2]


def extract_embedding(converter, source: Path, out_dir: Path, label: str):
    try:
        ref = representative_chunk(source, out_dir)
        embedding = converter.extract_se(str(ref))
        gc.collect()
        return embedding
    except Exception as exc:
        raise RuntimeError(f"OpenVoice {label} embedding failed: {exc}") from exc


def concat_wavs(chunks: list[Path], output: Path, work: Path) -> None:
    list_file = work / "concat.txt"
    with list_file.open("w", encoding="utf-8") as f:
        for chunk in chunks:
            escaped = str(chunk).replace("'", "'\\''")
            f.write(f"file '{escaped}'\n")
    run([
        "ffmpeg", "-y", "-f", "concat", "-safe", "0", "-i", str(list_file),
        "-ac", "1", "-ar", "44100", "-c:a", "pcm_s16le", str(output),
    ], "Converted vocal concatenation")


def convert_tone(vocals: Path, reference: Path, output: Path, work: Path) -> None:
    try:
        converter = get_converter()
    except Exception as exc:
        raise RuntimeError(f"OpenVoice model load failed: {exc}") from exc

    src_se = extract_embedding(converter, vocals, work / "source-embedding", "source voice")
    tgt_se = extract_embedding(converter, reference, work / "target-embedding", "reference voice")

    source_chunks = split_wav(vocals, work / "vocal-chunks")
    converted_chunks: list[Path] = []
    for index, source_chunk in enumerate(source_chunks):
        converted_chunk = work / "converted-chunks" / f"converted-{index:03d}.wav"
        converted_chunk.parent.mkdir(parents=True, exist_ok=True)
        try:
            converter.convert(
                audio_src_path=str(source_chunk),
                src_se=src_se,
                tgt_se=tgt_se,
                output_path=str(converted_chunk),
                message="@VetroAI",
            )
        except Exception as exc:
            raise RuntimeError(
                f"OpenVoice conversion failed on chunk {index + 1}/{len(source_chunks)}: {exc}"
            ) from exc
        converted_chunks.append(converted_chunk)
        gc.collect()

    concat_wavs(converted_chunks, output, work)


def mix_tracks(converted_vocals: Path, instrumental: Path, output: Path, fmt: str) -> None:
    codec = ["-c:a", "pcm_s16le"] if fmt == "wav" else ["-c:a", "libmp3lame", "-b:a", "192k"]
    run([
        "ffmpeg", "-y",
        "-i", str(instrumental),
        "-i", str(converted_vocals),
        "-filter_complex", "[0:a][1:a]amix=inputs=2:duration=longest:dropout_transition=0,alimiter=limit=0.95[a]",
        "-map", "[a]", *codec, str(output),
    ], "Final mix")


@app.get("/")
def root():
    return {
        "ok": True,
        "service": "VetroAI Voice Cover Worker",
        "version": "1.4.0",
        "device": _device,
        "stemMode": "ffmpeg-lite",
        "chunkSeconds": CHUNK_SECONDS,
        "openVoiceConverterReady": (converter_dir() / "config.json").exists() and (converter_dir() / "checkpoint.pth").exists(),
    }


@app.get("/health")
def health():
    cdir = converter_dir()
    return {
        "ok": True,
        "version": "1.4.0",
        "device": _device,
        "stemMode": "ffmpeg-lite",
        "openVoiceConverterReady": (cdir / "config.json").exists() and (cdir / "checkpoint.pth").exists(),
    }


@app.post("/process")
async def process_cover(
    song: UploadFile = File(...),
    reference_voice: UploadFile = File(...),
    output_format: str = Form("mp3"),
):
    fmt = output_format.lower().strip()
    if fmt not in {"mp3", "wav"}:
        raise HTTPException(status_code=400, detail="output_format must be mp3 or wav")

    temp_dir = Path(tempfile.mkdtemp(prefix="vetro-cover-"))
    try:
        song_in = temp_dir / f"song{safe_suffix(song.filename, '.mp3')}"
        voice_in = temp_dir / f"reference{safe_suffix(reference_voice.filename, '.wav')}"
        await save_upload(song, song_in)
        await save_upload(reference_voice, voice_in)

        song_wav = temp_dir / "song.wav"
        reference_wav = temp_dir / "reference.wav"
        normalize_song(song_in, song_wav)
        normalize_reference(voice_in, reference_wav)

        vocals, instrumental = separate_vocals_lite(song_wav, temp_dir)
        converted = temp_dir / "converted.wav"
        convert_tone(vocals, reference_wav, converted, temp_dir)

        final_path = temp_dir / f"voice-cover.{fmt}"
        mix_tracks(converted, instrumental, final_path, fmt)

        media_type = "audio/wav" if fmt == "wav" else "audio/mpeg"
        response = FileResponse(
            path=str(final_path),
            media_type=media_type,
            filename=f"vetroai-voice-cover.{fmt}",
        )
        response.background = _CleanupTask(temp_dir)
        return response
    except HTTPException:
        shutil.rmtree(temp_dir, ignore_errors=True)
        raise
    except Exception as exc:
        print(f"[voice-cover] processing failed: {exc}", flush=True)
        shutil.rmtree(temp_dir, ignore_errors=True)
        raise HTTPException(status_code=500, detail=str(exc)) from exc
    finally:
        unload_converter()


class _CleanupTask:
    def __init__(self, path: Path):
        self.path = path

    async def __call__(self):
        shutil.rmtree(self.path, ignore_errors=True)
