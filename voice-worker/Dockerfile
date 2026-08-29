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

# OpenVoice currently pulls faster-whisper 0.9 -> PyAV 10.x, which is not
# compatible with Cython 3's stricter noexcept callback typing. Use the
# legacy build toolchain expected by that dependency stack.
RUN pip install --upgrade "pip<26" wheel \
    && pip install "setuptools<81" "Cython<3" \
    && pip install --no-build-isolation -r requirements.txt

COPY app.py .

EXPOSE 10000
CMD ["sh", "-c", "uvicorn app:app --host 0.0.0.0 --port ${PORT:-10000}"]
