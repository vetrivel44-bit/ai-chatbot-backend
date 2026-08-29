const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "backend", ".env") });

const app = require("./backend/src/app");
const { config } = require("./backend/src/config/env");
const logger = require("./backend/src/utils/logger");

const PORT = process.env.PORT || config.port || 3000;

const server = app.listen(PORT, "0.0.0.0", () => {
  logger.info("server.started.production", {
    port: PORT,
    env: config.nodeEnv,
    mongodb: "removed (offline mode)",
  });
});

// Keep the Node server's connection timings friendly to Render's proxy and to
// long voice-worker responses. headersTimeout must stay above keepAliveTimeout.
server.keepAliveTimeout = 65000;
server.headersTimeout = 66000;
server.requestTimeout = 0;
