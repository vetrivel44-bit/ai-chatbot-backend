const logger = require("../utils/logger");

const debugMiddleware = (req, res, next) => {
  const reqId = req.headers["x-request-id"] || req.body?.reqId || `req_${Date.now()}`;
  
  logger.info("Debug.request.incoming", {
    reqId,
    method: req.method,
    url: req.url,
    headers: req.headers,
    body: req.method !== "GET" ? req.body : undefined
  });

  next();
};

module.exports = debugMiddleware;
