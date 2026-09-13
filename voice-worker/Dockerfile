FROM python:3.10-slim-bullseye

# Low-memory free-tier worker: FFmpeg lite stems + OpenVoice only.
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PORT=10000 \
    OPENVOICE_MODEL_DIR=/opt/models/openvoice-v2 \
    HF_HUB_DISABLE_XET=1 \
    OMP_NUM_THREADS=1 \
    MKL_NUM_THREADS=1 \
    OPENBLAS_NUM_THREADS=1 \
    NUMEXPR_NUM_THREADS=1 \
    MALLOC_ARENA_MAX=2 \
    VOICE_CHUNK_SECONDS=4

# Debian 11 (bullseye) is EOL. deb.debian.org stopped serving its security
# pool entirely (404s), and archive.debian.org — the permanent archive for
# the main suite — never mirrored debian-security in the first place (its
# own 404, confirmed directly against a real build). Drop the security
# source outright rather than redirect it: every package this image needs
# is available from the main bullseye/bullseye-updates suites, which
# archive.debian.org does carry. Also skip the Release-file expiry check
# the archive doesn't bother refreshing.
RUN sed -i '/deb.debian.org\/debian-security/d' /etc/apt/sources.list \
    && sed -i 's|deb.debian.org/debian |archive.debian.org/debian |g' /etc/apt/sources.list \
    && echo 'Acquire::Check-Valid-Until "false";' > /etc/apt/apt.conf.d/99no-check-valid-until

RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg git build-essential pkg-config libsndfile1 \
    libavcodec-dev libavdevice-dev libavfilter-dev libavformat-dev \
    libavutil-dev libswresample-dev libswscale-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY requirements.txt .

# Keep a CPU-only PyTorch/OpenVoice stack. Demucs and DiffQ are deliberately
# omitted from this free-tier image because Render's 512 MB instances cannot
# keep the Demucs process alive reliably.
RUN pip install --upgrade "pip<26" wheel \
    && pip install "setuptools==70.3.0" "Cython==0.29.37" \
    && pip install --index-url https://download.pytorch.org/whl/cpu "torch==2.5.1" "torchaudio==2.5.1" \
    && python -c "import torch; assert not torch.cuda.is_available(); print('CPU-only PyTorch OK', torch.__version__)" \
    && pip install --no-build-isolation -r requirements.txt \
    && pip install --force-reinstall --no-deps "numpy==1.22.0" "MarkupSafe==2.1.5" "setuptools==70.3.0" "Cython==0.29.37" \
    && python -c "import torch, numpy, Cython, pkg_resources, librosa; assert not torch.cuda.is_available(); print('Low-memory OpenVoice stack OK', torch.__version__)"

RUN mkdir -p "${OPENVOICE_MODEL_DIR}/checkpoints_v2" \
    && python -c "from huggingface_hub import snapshot_download; snapshot_download(repo_id='myshell-ai/OpenVoiceV2', revision='fd981100305a0e4291f93a9ad169c6d9f7bed54a', local_dir='${OPENVOICE_MODEL_DIR}/checkpoints_v2', allow_patterns=['converter/*']); print('OpenVoice V2 downloaded')" \
    && test -f "${OPENVOICE_MODEL_DIR}/checkpoints_v2/converter/config.json" \
    && test -f "${OPENVOICE_MODEL_DIR}/checkpoints_v2/converter/checkpoint.pth" \
    && echo "OpenVoice V2 converter checkpoint ready"

COPY app.py .

EXPOSE 10000
CMD ["sh", "-c", "uvicorn app:app --host 0.0.0.0 --port ${PORT:-10000} --workers 1"]
