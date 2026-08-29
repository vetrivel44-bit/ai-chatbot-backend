import os
import shutil
import subprocess
import tempfile
from pathlib import Path

import torch
from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.responses import FileResponse
from openvoice import se_extractor
from openvoice.api import ToneColorConverter

app = FastAPI(title="VetroAI Voice Cover Worker", version="1.1.0")

MODEL_DIR = Path(os.getenv("OPENVOICE_MODEL_DIR", "/opt/models/openvoice-v2"))
DEMUCS_MODEL = os.getenv("DEMUCS_MODEL", "mdx_q")
MAX_BYTES = int(os.getenv("MAX_AUDIO_BYTES", str(50 * 1024 * 1024)))

_converter = None
_device = "cuda" if torch.cuda.is_available() else "cpu"


def converter_dir() -> Path:
    # Official OpenVoice V2 archive extracts to checkpoints_v2/converter.
    return MODEL_DIR / "checkpoints_v2" / "converter"


def get_converter() -> ToneColorConverter:
    global _converter
    if _converter is None:
        cdir = converter_dir()
        config = cdir / "config.json"
        ckpt = cdir / "checkpoint.pth"
        if not config.exists() or not ckpt.exists():
            raise RuntimeError(
                f"OpenVoice model files are missing at {cdir}. "
                "Redeploy the latest voice-worker image so the V2 checkpoint is baked in."
            )
        _converter = ToneColorConverter(str(config), device=_device)
        _converter.load_ckpt(str(ckpt))
    return _converter


def run(cmd: list[str], stage: str) -> None:
    result = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True)
    if result.returncode != 0:
        output = (result.stdout or "Audio command failed")[-5000:]
        raise RuntimeError(f"{stage} failed: {output}")


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


def normalize_to_wav(source: Path, target: Path, label: str) -> None:
    run([
        "ffmpeg", "-y", "-i", str(source),
        "-ac", "1", "-ar", "44100",
        str(target),
    ], f"{label} normalization")


def separate_vocals(song_wav: Path, work: Path) -> tuple[Path, Path]:
    out_dir = work / "separated"
    run([
        "python", "-m", "demucs.separate",
        "-d", _device,
        "-n", DEMUCS_MODEL,
        "--two-stems", "vocals",
        "-o", str(out_dir),
        str(song_wav),
    ], "Demucs separation")
    stem_dir = out_dir / DEMUCS_MODEL / song_wav.stem
    vocals = stem_dir / "vocals.wav"
    instrumental = stem_dir / "no_vocals.wav"
    if not vocals.exists() or not instrumental.exists():
        raise RuntimeError("Demucs separation failed: vocals/no_vocals stems were not created")
    return vocals, instrumental


def convert_tone(vocals: Path, reference: Path, output: Path, work: Path) -> None:
    try:
        converter = get_converter()
    except Exception as exc:
        raise RuntimeError(f"OpenVoice model load failed: {exc}") from exc

    processed = work / "processed"
    processed.mkdir(parents=True, exist_ok=True)

    try:
        src_se, _ = se_extractor.get_se(str(vocals), converter, target_dir=str(processed / "source"), vad=True)
    except Exception as exc:
        raise RuntimeError(f"OpenVoice source-voice extraction failed: {exc}") from exc

    try:
        tgt_se, _ = se_extractor.get_se(str(reference), converter, target_dir=str(processed / "target"), vad=True)
    except Exception as exc:
        raise RuntimeError(f"OpenVoice reference-voice extraction failed: {exc}") from exc

    try:
        converter.convert(
            audio_src_path=str(vocals),
            src_se=src_se,
            tgt_se=tgt_se,
            output_path=str(output),
            message="@VetroAI",
        )
    except Exception as exc:
        raise RuntimeError(f"OpenVoice conversion failed: {exc}") from exc


def mix_tracks(converted_vocals: Path, instrumental: Path, output: Path, fmt: str) -> None:
    codec = ["-c:a", "pcm_s16le"] if fmt == "wav" else ["-c:a", "libmp3lame", "-b:a", "192k"]
    run([
        "ffmpeg", "-y",
        "-i", str(instrumental),
        "-i", str(converted_vocals),
        "-filter_complex", "[0:a][1:a]amix=inputs=2:duration=longest:dropout_transition=0,alimiter=limit=0.95[a]",
        "-map", "[a]",
        *codec,
        str(output),
    ], "Final mix")


@app.get("/")
def root():
    return {
        "ok": True,
        "service": "VetroAI Voice Cover Worker",
        "version": "1.1.0",
        "device": _device,
        "demucsModel": DEMUCS_MODEL,
        "openVoiceConverterReady": (converter_dir() / "config.json").exists() and (converter_dir() / "checkpoint.pth").exists(),
    }


@app.get("/health")
def health():
    cdir = converter_dir()
    return {
        "ok": True,
        "device": _device,
        "demucsModel": DEMUCS_MODEL,
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
        normalize_to_wav(song_in, song_wav, "Song")
        normalize_to_wav(voice_in, reference_wav, "Reference voice")

        vocals, instrumental = separate_vocals(song_wav, temp_dir)
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


class _CleanupTask:
    def __init__(self, path: Path):
        self.path = path

    async def __call__(self):
        shutil.rmtree(self.path, ignore_errors=True)
