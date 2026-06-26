const { successResponse } = require("../utils/response");
const ApiError = require("../utils/apiError");
const logger = require("../utils/logger");
const { config } = require("../config/env");

async function generateVideo(req, res) {
  const { prompt, width, height } = req.body;
  if (!prompt || !prompt.trim()) {
    throw new ApiError(400, "Video prompt is required.");
  }
  if (!config.agnesApiKey) {
    throw new ApiError(500, "Agnes AI API key not configured.");
  }

  const endpoint = "https://apihub.agnes-ai.com/v1/videos";
  const body = {
    model: "agnes-video-v2.0",
    prompt: prompt.trim(),
    height: height || 768,
    width: width || 1152,
    num_frames: 121,
    frame_rate: 24,
  };

  // This call only enqueues the job and should return a task ID within seconds —
  // actual rendering happens async and is tracked separately via checkVideoStatus polling.
  // A short timeout here means a busy/down upstream surfaces in seconds, not minutes.
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 45000);
  let apiRes;
  try {
    apiRes = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.agnesApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
  } catch (err) {
    clearTimeout(timeout);
    if (err.name === "AbortError") {
      throw new ApiError(504, "Agnes AI video generation request timed out. The service may be busy — please try again later.");
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }

  if (!apiRes.ok) {
    const detail = await apiRes.text();
    logger.error("videoController.generateVideo.failed", { status: apiRes.status, detail });
    const isBusy = /busy|capacity|overloaded/i.test(detail);
    if (isBusy) {
      throw new ApiError(503, "Agnes AI video service is currently busy. Please try again in a few minutes.");
    }
    throw new ApiError(apiRes.status, `Agnes AI video generation failed: ${detail}`);
  }

  const json = await apiRes.json();
  const videoId = json?.video_id || json?.id;
  if (!videoId) {
    throw new ApiError(502, "Agnes AI returned no video task ID.");
  }

  return successResponse(res, "Video task created", {
    videoId,
    status: json.status || "queued",
    prompt: prompt.trim(),
  });
}

async function checkVideoStatus(req, res) {
  const { videoId } = req.params;
  if (!videoId) {
    throw new ApiError(400, "Video ID is required.");
  }
  if (!config.agnesApiKey) {
    throw new ApiError(500, "Agnes AI API key not configured.");
  }

  const apiRes = await fetch(
    `https://apihub.agnes-ai.com/agnesapi?video_id=${encodeURIComponent(videoId)}`,
    {
      headers: { Authorization: `Bearer ${config.agnesApiKey}` },
    }
  );

  if (!apiRes.ok) {
    const detail = await apiRes.text();
    logger.error("videoController.checkVideoStatus.failed", { status: apiRes.status, detail });
    throw new ApiError(apiRes.status, `Agnes AI video status check failed: ${detail}`);
  }

  const json = await apiRes.json();
  const status = json.status || "processing";
  const videoUrl =
    json.video_url ||
    json.url ||
    json.output_url ||
    json.result_url ||
    json.download_url ||
    json?.data?.url ||
    json?.output?.[0]?.url ||
    json?.assets?.video ||
    null;

  if (status === "completed" && !videoUrl) {
    logger.error("videoController.checkVideoStatus.noUrlField", { videoId, json });
  }

  return successResponse(res, "Video status", {
    status,
    progress: json.progress || 0,
    videoUrl: status === "completed" ? videoUrl : null,
  });
}

module.exports = { generateVideo, checkVideoStatus };
