# VetroAI Voice Cover Worker

Self-hosted audio worker for VetroAI. It accepts a permitted song plus the user's own/authorized reference voice, separates vocals with Demucs, applies OpenVoice tone-colour conversion, and remixes the result with FFmpeg.

## API

- `GET /health` — health check
- `POST /process` — multipart request:
  - `song`: audio file
  - `reference_voice`: user's own/authorized reference recording
  - `output_format`: `mp3` or `wav`

The response is the final audio file.

## Render deployment

Create a **new Web Service** from the same `vetrivel44-bit/ai-chatbot-backend` GitHub repository.

Recommended settings:

- Language/runtime: Docker
- Root Directory: `voice-worker`
- Dockerfile Path: `./Dockerfile` (relative to the root directory)
- Health Check Path: `/health`

No ElevenLabs API key is required.

After deployment, open `/health`. It should return JSON similar to:

```json
{"ok":true,"device":"cpu"}
```

Copy the worker service URL (for example `https://your-worker.onrender.com`) and add it to the existing Node backend service as:

```text
VOICE_COVER_WORKER_URL=https://your-worker.onrender.com
```

Then redeploy the Node backend.

## Compute note

Demucs + PyTorch + OpenVoice are substantially heavier than the normal Node backend. CPU instances can be slow and low-memory/free instances may fail during model loading or processing. For reliable production use, deploy this worker on an instance with enough RAM; a GPU dramatically improves processing speed. This worker intentionally stays separate from the main backend so the chatbot service is not taken down by audio-model memory pressure.

## Model behavior

OpenVoice performs reference tone-colour conversion. It is not guaranteed to reproduce every singing characteristic perfectly. The isolated source vocal supplies the performance/timing while the converter changes voice characteristics toward the authorized reference recording.
