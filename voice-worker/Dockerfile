FROM python:3.10-slim-bullseye

# Cache-bust marker: cpu-openvoice-demucs-stable-20260829
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

# Render has no GPU. Install CPU PyTorch first, then keep OpenVoice's older
# dependency stack intact. DiffQ is installed without dependencies so it cannot
# replace CPU torch with CUDA torch or upgrade NumPy/Cython/setuptools.
RUN pip install --upgrade "pip<26" wheel \
    && pip install "setuptools==70.3.0" "Cython==0.29.37" \
    && pip install --index-url https://download.pytorch.org/whl/cpu "torch==2.5.1" "torchaudio==2.5.1" \
    && python -c "import torch; assert '+cpu' in torch.__version__ or not torch.cuda.is_available(); print('CPU-only PyTorch OK', torch.__version__)" \
    && pip install --no-build-isolation -r requirements.txt \
    && pip install --force-reinstall --no-deps "numpy==1.22.0" "MarkupSafe==2.1.5" "setuptools==70.3.0" "Cython==0.29.37" \
    && pip install --force-reinstall --no-deps "diffq==0.2.4" \
    && python -c "import torch, numpy, Cython, pkg_resources, librosa, diffq; assert not torch.cuda.is_available(); assert numpy.__version__ == '1.22.0'; assert Cython.__version__.startswith('0.29.'); print('Stable CPU OpenVoice stack OK', torch.__version__, numpy.__version__, Cython.__version__)"

RUN mkdir -p "${OPENVOICE_MODEL_DIR}/checkpoints_v2" \
    && python -c "from huggingface_hub import snapshot_download; snapshot_download(repo_id='myshell-ai/OpenVoiceV2', revision='fd981100305a0e4291f93a9ad169c6d9f7bed54a', local_dir='${OPENVOICE_MODEL_DIR}/checkpoints_v2', allow_patterns=['converter/*']); print('OpenVoice V2 downloaded')" \
    && test -f "${OPENVOICE_MODEL_DIR}/checkpoints_v2/converter/config.json" \
    && test -f "${OPENVOICE_MODEL_DIR}/checkpoints_v2/converter/checkpoint.pth" \
    && echo "OpenVoice V2 converter checkpoint ready"

RUN python -c "import diffq; from demucs.pretrained import get_model; get_model('${DEMUCS_MODEL}'); print('Demucs model cached')"

COPY app.py .

EXPOSE 10000
CMD ["sh", "-c", "uvicorn app:app --host 0.0.0.0 --port ${PORT:-10000}"]
