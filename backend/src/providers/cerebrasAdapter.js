const { config } = require("../config/env");
const logger = require("../utils/logger");
const ApiError = require("../utils/apiError");

// Cerebras Cloud is OpenAI-compatible: standard chat/completions body, standard
// `data: {...}` SSE stream with choices[0].delta.content — AIOrchestrator's
// generic normalizeChunk already parses that shape, same as it does for Agnes.
async function generateStream(messages, options = {}) {
  if (!config.cerebrasApiKey) {
    throw new ApiError(500, "Cerebras API key not configured.");
  }

  const { temperature, maxTokens, model } = options;
  const endpoint = "https://api.cerebras.ai/v1/chat/completions";

  const body = {
    model: model || config.cerebrasModel,
    messages,
    temperature: temperature ?? 0.7,
    max_tokens: maxTokens ?? 2048,
    stream: true,
  };

  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.cerebrasApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      timeout: 30000,
    });

    if (!res.ok) {
      const detail = await res.text();
      const errorMsg = `Cerebras service error: ${res.status} ${detail}`;
      logger.error("cerebrasAdapter.generateStream.failed", { status: res.status, detail });
      throw new ApiError(res.status, errorMsg);
    }

    if (!res.body) {
      throw new Error("Cerebras returned empty response body");
    }

    return res.body;
  } catch (err) {
    logger.error("cerebrasAdapter.generateStream", { error: err.message, errorCode: err.code });
    throw err;
  }
}

module.exports = {
  generateStream,
};
