import os
import shutil
import subprocess
import tempfile
from pathlib import Path

import torch
from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.responses import FileResponse
from huggingface_hub import snapshot_download
from openvoice import se_extractor
from openvoice.api import ToneColorConverter

app = FastAPI(title="VetroAI Voice Cover Worker", version="1.0.0")

MODEL_DIR = Path(os.getenv("OPENVOICE_MODEL_DIR", "/opt/models/openvoice-v2"))
DEMUCS_MODEL = os.getenv("DEMUCS_MODEL", "mdx_q")
MAX_BYTES = int(os.getenv("MAX_AUDIO_BYTES", str(50 * 1024 * 1024)))

_converter = None
_device = "cuda" if torch.cuda.is_available() else "cpu"


def ensure_openvoice_model() -> Path:
    converter_dir = MODEL_DIR / "converter"
    if (converter_dir / "config.json").exists() and (converter_dir / "checkpoint.pth").exists():
        return converter_dir
    MODEL_DIR.mkdir(parents=True, exist_ok=True)
    snapshot_download(
        repo_id="myshell-ai/OpenVoiceV2",
        local_dir=str(MODEL_DIR),
        allow_patterns=["converter/*"],
    )
    return converter_dir


def get_converter() -> ToneColorConverter:
    global _converter
    if _converter is None:
        converter_dir = ensure_openvoice_model()
        _converter = ToneColorConverter(str(converter_dir / "config.json"), device=_device)
        _converter.load_ckpt(str(converter_dir / "checkpoint.pth"))
    return _converter


def run(cmd: list[str]) -> None:
    result = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True)
    if result.returncode != 0:
        raise RuntimeError(result.stdout[-5000:] if result.stdout else "Audio command failed")


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


def normalize_to_wav(source: Path, target: Path) -> None:
    run([
        "ffmpeg", "-y", "-i", str(source),
        "-ac", "1", "-ar", "44100",
        str(target),
    ])


def separate_vocals(song_wav: Path, work: Path) -> tuple[Path, Path]:
    out_dir = work / "separated"
    run([
        "python", "-m", "demucs.separate",
        "-d", _device,
        "-n", DEMUCS_MODEL,
        "--two-stems", "vocals",
        "-o", str(out_dir),
        str(song_wav),
    ])
    stem_dir = out_dir / DEMUCS_MODEL / song_wav.stem
    vocals = stem_dir / "vocals.wav"
    instrumental = stem_dir / "no_vocals.wav"
    if not vocals.exists() or not instrumental.exists():
        raise RuntimeError("Demucs did not return vocals and instrumental stems")
    return vocals, instrumental


def convert_tone(vocals: Path, reference: Path, output: Path, work: Path) -> None:
    converter = get_converter()
    processed = work / "processed"
    processed.mkdir(parents=True, exist_ok=True)

    # OpenVoice's converter changes tone colour while retaining the source audio's timing/content.
    src_se, _ = se_extractor.get_se(str(vocals), converter, target_dir=str(processed / "source"), vad=True)
    tgt_se, _ = se_extractor.get_se(str(reference), converter, target_dir=str(processed / "target"), vad=True)
    converter.convert(
        audio_src_path=str(vocals),
        src_se=src_se,
        tgt_se=tgt_se,
        output_path=str(output),
        message="@VetroAI",
    )


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
    ])


@app.get("/")
def root():
    return {
        "ok": True,
        "service": "VetroAI Voice Cover Worker",
        "device": _device,
        "demucsModel": DEMUCS_MODEL,
    }


@app.get("/health")
def health():
    return {"ok": True, "device": _device}


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
        normalize_to_wav(song_in, song_wav)
        normalize_to_wav(voice_in, reference_wav)

        vocals, instrumental = separate_vocals(song_wav, temp_dir)
        converted = temp_dir / "converted.wav"
        convert_tone(vocals, reference_wav, converted, temp_dir)

        final_path = temp_dir / f"voice-cover.{fmt}"
        mix_tracks(converted, instrumental, final_path, fmt)

        media_type = "audio/wav" if fmt == "wav" else "audio/mpeg"
        # FileResponse needs the temp directory to remain until the response is sent.
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
        shutil.rmtree(temp_dir, ignore_errors=True)
        raise HTTPException(status_code=500, detail=str(exc)) from exc


class _CleanupTask:
    def __init__(self, path: Path):
        self.path = path

    async def __call__(self):
        shutil.rmtree(self.path, ignore_errors=True)
