const path = require("path");
const next = require("next");
const { createBackendApp } = require("./backend/createApp");

const port = Number.parseInt(process.env.PORT || "3000", 10);
const host = "0.0.0.0";
const dev = process.env.NODE_ENV !== "production";
const frontendDir = path.join(__dirname, "frontend");

async function start() {
  const nextApp = next({ dev, dir: frontendDir });
  const handle = nextApp.getRequestHandler();

  await nextApp.prepare();

  const app = createBackendApp({ handle });
  const server = app.listen(port, host, () => {
    console.log(`Oxideve listening on http://${host}:${port}`);
  });

  const shutdown = (signal) => {
    console.log(`Received ${signal}, shutting down`);
    server.close((error) => {
      if (error) {
        console.error("HTTP server shutdown failed", error);
        process.exit(1);
      }

      process.exit(0);
    });
  };

  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
}

start().catch((error) => {
  console.error("Failed to start Oxideve", error);
  process.exit(1);
});
