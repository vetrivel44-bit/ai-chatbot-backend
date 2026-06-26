const { successResponse } = require("../utils/response");
const ApiError = require("../utils/apiError");
const logger = require("../utils/logger");
const { config } = require("../config/env");

async function generateImage(req, res) {
  const { prompt, size } = req.body;
  if (!prompt || !prompt.trim()) {
    throw new ApiError(400, "Image prompt is required.");
  }
  if (!config.agnesApiKey) {
    throw new ApiError(500, "Agnes AI API key not configured.");
  }

  const endpoint = "https://apihub.agnes-ai.com/v1/images/generations";
  const body = {
    model: "agnes-image-2.0-flash",
    prompt: prompt.trim(),
    size: size || "1024x768",
    extra_body: { response_format: "url" },
  };

  const apiRes = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.agnesApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!apiRes.ok) {
    const detail = await apiRes.text();
    logger.error("imageController.generateImage.failed", { status: apiRes.status, detail });
    throw new ApiError(apiRes.status, `Agnes AI image generation failed: ${detail}`);
  }

  const json = await apiRes.json();
  const imageUrl = json?.data?.[0]?.url;
  if (!imageUrl) {
    throw new ApiError(502, "Agnes AI returned no image URL.");
  }

  return successResponse(res, "Image generated", { url: imageUrl, prompt: prompt.trim() });
}

module.exports = { generateImage };
