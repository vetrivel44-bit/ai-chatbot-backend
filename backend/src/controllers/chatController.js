const ApiError = require("../utils/apiError");
const logger = require("../utils/logger");
const { successResponse } = require("../utils/response");
const { config } = require("../config/env");
const providerManager = require("../services/ProviderManager");
const creditService = require("../services/creditService");
const medicalService = require("../services/medicalService");
const { verifyAccessToken } = require("../utils/token");
const AIOrchestrator = require("../services/AIOrchestrator");

function resolveBillingUserId(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) return null;
  const token = authHeader.slice(7).trim();
  if (!token || token.startsWith("local_")) return null;
  try {
    const decoded = verifyAccessToken(token);
    return decoded?.userId || null;
  } catch {
    return null;
  }
}

const SAFE_PATTERNS = [
  /ignore (all|previous|prior) instructions/gi,
  /reveal (system|hidden) prompt/gi,
  /developer instructions/gi,
];

const ALLOWED_ATTACHMENT_TYPES = new Set([
  "text/plain", "text/markdown", "text/csv",
  "application/json", "application/javascript",
  "application/pdf", "application/x-pdf",
]);

function normalizeMessages(rawMessages, input) {
  let parsed = [];
  if (rawMessages) {
    if (typeof rawMessages === "string") {
      try { parsed = JSON.parse(rawMessages); }
      catch { throw new ApiError(400, "Invalid messages payload"); }
    } else if (Array.isArray(rawMessages)) {
      parsed = rawMessages;
    }
  }

  if (!Array.isArray(parsed)) parsed = [];
  const clean = parsed
    .filter((m) => m && typeof m.content === "string" && ["system", "user", "assistant"].includes(m.role))
    .slice(-18)
    .map((m) => ({ role: m.role, content: m.content.slice(0, 12000) }));

  if (input && typeof input === "string" && input.trim()) {
    const last = clean[clean.length - 1];
    if (!last || last.role !== "user" || last.content.trim() !== input.trim()) {
      clean.push({ role: "user", content: input.trim().slice(0, 12000) });
    }
  }
  return clean;
}

function sanitizePrompt(input, safeMode) {
  if (!safeMode || !input) return input;
  let out = input;
  SAFE_PATTERNS.forEach((pattern) => { out = out.replace(pattern, "[filtered]"); });
  return out;
}

function getAttachmentContext(file) {
  if (!file) return null;
  const isTextLike = file.mimetype.startsWith("text/") || ALLOWED_ATTACHMENT_TYPES.has(file.mimetype);
  if (!isTextLike && !file.mimetype.startsWith("image/")) {
    throw new ApiError(400, "Unsupported attachment type. Use txt, md, csv, json, pdf, or images.");
  }
  if (file.mimetype.startsWith("image/")) return null;
  const text = file.buffer.toString("utf-8").trim();
  if (!text) return null;
  return `Attached file (${file.originalname}):\n${text.slice(0, 12000)}`;
}

async function analyzeImagesWithVision(imageFiles, userQuery) {
  const apiKey = config.chatgptApiKey;
  if (!apiKey) throw new ApiError(500, "ChatGPT API key not configured.");

  const content = [{ type: "text", text: userQuery || "What's in these images? Describe them in detail." }];
  for (const file of imageFiles) {
    const base64 = file.buffer.toString("base64");
    content.push({ type: "image", url: `data:${file.mimetype};base64,${base64}` });
  }

  logger.info("vision.request", {
    imageCount: imageFiles.length,
    imageSizes: imageFiles.map((f) => `${f.originalname}:${Math.round(f.size / 1024)}KB`),
    query: userQuery?.slice(0, 100),
  });

  const attempts = [
    {
      name: "matagvision2",
      url: "https://chatgpt-vision1.p.rapidapi.com/matagvision2",
      host: "chatgpt-vision1.p.rapidapi.com",
      body: { messages: [{ role: "user", content }], web_access: false },
    },
    {
      name: "gpt4o",
      url: "https://chatgpt-vision1.p.rapidapi.com/gpt4",
      host: "chatgpt-vision1.p.rapidapi.com",
      body: {
        messages: [{
          role: "user",
          content: content.map((c) => c.type === "text"
            ? { type: "text", text: c.text }
            : { type: "image_url", image_url: { url: c.url } }),
        }],
        web_access: false,
      },
    },
  ];

  let lastError;
  for (const attempt of attempts) {
    try {
      const response = await fetch(attempt.url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-rapidapi-host": attempt.host,
          "x-rapidapi-key": apiKey,
        },
        body: JSON.stringify(attempt.body),
      });
      const rawText = await response.text();
      if (!response.ok) {
        lastError = new Error(`${attempt.name}: ${response.status} ${rawText.slice(0, 200)}`);
        continue;
      }
      let data;
      try { data = JSON.parse(rawText); } catch { return rawText; }
      const result = data.result || data.message || data.choices?.[0]?.message?.content
        || data.response || data.answer || data.output;
      if (typeof result === "string" && result.length > 20) return result;
      lastError = new Error(`${attempt.name}: Empty or unusable response`);
    } catch (err) {
      lastError = err;
      logger.warn(`vision.failed.${attempt.name}`, { error: err.message });
    }
  }
  throw lastError || new Error("All vision API attempts failed");
}

async function chat(req, res) {
  const reqId = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const provider = req.body?.provider;
  const mode = req.body?.mode;
  const safeMode = String(req.body?.safeMode || "false") === "true";
  const temperature = Number(req.body?.temperature ?? 0.7);
  const maxTokens = Number(req.body?.maxTokens ?? 2048);
  const input = sanitizePrompt(req.body?.input || "", safeMode);
  const messages = normalizeMessages(req.body?.messages, input);

  let memories = [];
  if (req.body?.memories) {
    try {
      memories = typeof req.body.memories === "string" ? JSON.parse(req.body.memories) : req.body.memories;
    } catch (e) {
      logger.warn("Failed to parse memories", { error: e.message });
    }
  }

  const systemPrompt = String(req.body?.systemPrompt || "").trim().slice(0, 2000);
  const webSearch = String(req.body?.webSearch || "false") === "true";
  const files = [
    ...(req.files?.files || []),
    ...(req.files?.file || []),
    ...(req.file ? [req.file] : []),
  ];
  const imageFiles = files.filter((f) => f.mimetype.startsWith("image/"));
  const textFiles = files.filter((f) => !f.mimetype.startsWith("image/"));

  for (const file of textFiles) {
    const attachmentContext = getAttachmentContext(file);
    if (attachmentContext) messages.push({ role: "user", content: attachmentContext });
  }
  if (!messages.length) throw new ApiError(400, "No valid messages provided");

  const billingUserId = resolveBillingUserId(req);
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders?.();

  if (billingUserId && creditService.isDbAvailable()) {
    const status = await creditService.getBillingStatus(billingUserId);
    if (status?.plan === "free" && typeof status.credits === "number" && status.credits <= 0) {
      res.write(`data: ${JSON.stringify({ type: "error", data: "You've used all your free credits for this period. Upgrade your plan to keep chatting.", code: "INSUFFICIENT_CREDITS" })}\n\n`);
      return res.end();
    }
  }

  const heartbeat = setInterval(() => { res.write(": ping\n\n"); }, 12000);
  const cleanup = () => clearInterval(heartbeat);

  if (imageFiles.length > 0) {
    try {
      res.write(`data: ${JSON.stringify({ type: "status", data: `Analyzing ${imageFiles.length} image(s) with Vision AI...` })}\n\n`);
      const visionResult = await analyzeImagesWithVision(imageFiles, input);
      const chunks = visionResult.split(/(?<=\.\s|\n)/);
      for (let i = 0; i < chunks.length; i += 2) {
        res.write(`data: ${JSON.stringify({ type: "content", data: chunks.slice(i, i + 2).join("") })}\n\n`);
        await new Promise((resolve) => setTimeout(resolve, 15));
      }
    } catch (err) {
      logger.error("chat.vision.failed", { reqId, error: err.message });
      res.write(`data: ${JSON.stringify({ type: "error", data: `Vision analysis failed: ${err.message}` })}\n\n`);
    } finally {
      cleanup();
      if (billingUserId) {
        creditService.consumeCredit(billingUserId, 1, "chat_message", { reqId, mode, provider }).catch(() => {});
      }
      return res.end();
    }
  }

  try {
    await AIOrchestrator.processRequest(reqId, {
      messages,
      mode,
      provider,
      memories,
      systemPrompt,
      webSearch,
      options: { temperature, maxTokens },
    }, res);
  } catch (err) {
    logger.error("chat.request.failed", { reqId, error: err.message });
    if (!res.writableEnded) {
      res.write(`data: ${JSON.stringify({ type: "error", data: "VetroAI is currently unreachable. Please check your connection." })}\n\n`);
    }
  } finally {
    cleanup();
    if (billingUserId) {
      creditService.consumeCredit(billingUserId, 1, "chat_message", { reqId, mode, provider }).catch(() => {});
    }
    res.end();
  }
}

function cleanWords(text) {
  return text
    .replace(/https?:\/\/\S+/gi, "")
    .replace(/[^\p{L}\p{N}\s'-]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function titleEmoji(text) {
  const low = text.toLowerCase();
  if (/code|program|javascript|python|bug|error/.test(low)) return "💻";
  if (/study|exam|college|math|science|learn/.test(low)) return "📚";
  if (/money|price|invest|gold|stock|cash/.test(low)) return "💰";
  if (/travel|trip|place|hotel/.test(low)) return "✈️";
  if (/music|song|voice|audio/.test(low)) return "🎵";
  return "💬";
}

async function generateTitle(req, res) {
  const firstMessage = String(req.body?.firstMessage || "").trim();
  if (!firstMessage) throw new ApiError(400, "firstMessage is required");
  const clean = cleanWords(firstMessage);
  const words = clean.split(" ").filter(Boolean).slice(0, 6);
  const phrase = words.join(" ") || "New Chat";
  const title = `${titleEmoji(firstMessage)} ${phrase.charAt(0).toUpperCase()}${phrase.slice(1)}`.slice(0, 64);
  return successResponse(res, "Title generated", { title });
}

async function followUps(req, res) {
  const lastMessage = String(req.body?.lastMessage || "").trim();
  const userQuery = String(req.body?.userQuery || "").trim();
  if (!lastMessage) throw new ApiError(400, "lastMessage is required");

  const topic = cleanWords(userQuery).split(" ").filter(Boolean).slice(0, 8).join(" ") || "this";
  const suggestions = [
    `Can you explain ${topic} more simply?`,
    `What is the best next step for ${topic}?`,
    `Can you give me a practical example?`,
    `What should I watch out for?`,
  ];
  return successResponse(res, "Follow-ups generated", { suggestions });
}

async function getHealth(req, res) {
  return res.json({
    backend: "online",
    providers: providerManager.getStats(),
    uptime: process.uptime(),
    version: "1.2.0",
    environment: process.env.NODE_ENV || "development",
  });
}

async function medicalAnswer(req, res) {
  const query = String(req.body?.query || "").trim();
  if (!query) throw new ApiError(400, "query is required");
  const specialization = String(req.body?.specialization || "general medicine").slice(0, 60);
  const language = String(req.body?.language || "en").slice(0, 10);
  const result = await medicalService.fetchMedicalAnswer(query, specialization, language);
  if (!result) return successResponse(res, "No medical data available", null);
  return successResponse(res, "Medical answer generated", result);
}

async function textToSpeech(req, res) {
  const text = String(req.body?.text || "").trim();
  if (!text) throw new ApiError(400, "text is required");
  const voice = String(req.body?.voice || "en-US-JennyNeural").slice(0, 40);
  const { buffer, contentType } = await medicalService.synthesizeSpeech(text.slice(0, 2000), voice);
  res.setHeader("Content-Type", contentType);
  res.setHeader("Content-Length", buffer.length);
  return res.send(buffer);
}

module.exports = { chat, generateTitle, followUps, getHealth, medicalAnswer, textToSpeech };
