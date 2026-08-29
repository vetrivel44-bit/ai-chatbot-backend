FROM python:3.10-slim-bullseye

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PORT=10000

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

COPY app.py .

EXPOSE 10000
CMD ["sh", "-c", "uvicorn app:app --host 0.0.0.0 --port ${PORT:-10000}"]
