const path = require("path");
require("dotenv").config();

const app = require("./backend/src/app");
const { config } = require("./backend/src/config/env");
const logger = require("./backend/src/utils/logger");

// Health check endpoints for robustness (placed before actual app routes if needed)
app.get("/api/health", (req, res) => res.json({ success: true, status: "ok", mode: "full-production" }));
app.get("/health", (req, res) => res.json({ success: true, status: "ok" }));

const PORT = process.env.PORT || config.port || 3000;

app.listen(PORT, "0.0.0.0", () => {
  logger.info("server.started.production", {
    port: PORT,
    env: config.nodeEnv,
    groqKey: process.env.GROQ_API_KEY ? "✅ configured" : "⚠️ missing",
    mongodb: "removed (offline mode)",
  });
});
