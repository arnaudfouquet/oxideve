const express = require("express");
const helmet = require("helmet");
const { apiLimiter, sanitizeInputs } = require("./middleware/security");
const { adminAuth } = require("./middleware/adminAuth");
const { requestLogger } = require("./middleware/requestLogger");
const { createApiRouter } = require("./routes/api");
const { errorHandler, notFoundHandler } = require("./middleware/errorHandler");

function createBackendApp({ handle }) {
  const app = express();

  app.set("trust proxy", 1);
  app.disable("x-powered-by");

  app.use(requestLogger);
  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false,
    })
  );
  app.use(express.json({ limit: "250kb" }));
  app.use(express.urlencoded({ extended: false }));
  app.use(sanitizeInputs);
  app.use("/api", apiLimiter);
  app.use("/api/admin", adminAuth);
  app.use("/admin", adminAuth);

  app.get("/health", async (_req, res) => {
    res.status(200).json({
      status: "ok",
      service: "oxideve",
      timestamp: new Date().toISOString(),
    });
  });

  app.use("/api", createApiRouter());

  app.all("*", (req, res, next) => {
    if (req.path.startsWith("/api")) {
      return next();
    }

    return handle(req, res);
  });

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

module.exports = {
  createBackendApp,
};
