FROM python:3.10-slim-bullseye

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PORT=10000 \
    OPENVOICE_MODEL_DIR=/opt/models/openvoice-v2 \
    DEMUCS_MODEL=mdx_q \
    HF_HUB_DISABLE_XET=1

RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg git build-essential pkg-config libsndfile1 \
    libavcodec-dev libavdevice-dev libavfilter-dev libavformat-dev \
    libavutil-dev libswresample-dev libswscale-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY requirements.txt .

# OpenVoice's older librosa/faster-whisper stack expects pkg_resources and
# PyAV 10 expects pre-Cython-3 build semantics. Pin both explicitly.
RUN pip install --upgrade "pip<26" wheel \
    && pip install "setuptools==70.3.0" "Cython<3" \
    && python -c "import pkg_resources; print('pkg_resources OK')" \
    && pip install --no-build-isolation -r requirements.txt \
    && pip install --force-reinstall --no-deps "setuptools==70.3.0" \
    && python -c "import pkg_resources, librosa; print('OpenVoice runtime dependencies OK')"

# The old MyShell S3 archive URL now returns 404. The official V2 converter
# is available from myshell-ai/OpenVoiceV2 on Hugging Face. Download only the
# converter files and place them in the layout expected by app.py.
RUN mkdir -p "${OPENVOICE_MODEL_DIR}/checkpoints_v2" \
    && python -c "from huggingface_hub import snapshot_download; snapshot_download(repo_id='myshell-ai/OpenVoiceV2', revision='fd981100305a0e4291f93a9ad169c6d9f7bed54a', local_dir='${OPENVOICE_MODEL_DIR}/checkpoints_v2', allow_patterns=['converter/*']); print('OpenVoice V2 downloaded')" \
    && test -f "${OPENVOICE_MODEL_DIR}/checkpoints_v2/converter/config.json" \
    && test -f "${OPENVOICE_MODEL_DIR}/checkpoints_v2/converter/checkpoint.pth" \
    && echo "OpenVoice V2 converter checkpoint ready"

# Cache the Demucs stem-separation weights in the Docker image as well.
RUN python -c "from demucs.pretrained import get_model; get_model('${DEMUCS_MODEL}'); print('Demucs model cached')"

COPY app.py .

EXPOSE 10000
CMD ["sh", "-c", "uvicorn app:app --host 0.0.0.0 --port ${PORT:-10000}"]
