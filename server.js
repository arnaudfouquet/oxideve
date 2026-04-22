const path = require("path");
const fs = require("fs");
const next = require("next");
const { createBackendApp } = require("./backend/createApp");

function loadDotEnv(filePath) {
  if (!fs.existsSync(filePath)) {
    return;
  }

  const content = fs.readFileSync(filePath, "utf8");

  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();

    if (!line || line.startsWith("#")) {
      continue;
    }

    const separatorIndex = line.indexOf("=");

    if (separatorIndex === -1) {
      continue;
    }

    const key = line.slice(0, separatorIndex).trim();
    let value = line.slice(separatorIndex + 1).trim();

    if (!key || process.env[key] !== undefined) {
      continue;
    }

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    process.env[key] = value;
  }
}

loadDotEnv(path.join(__dirname, ".env"));

const port = Number.parseInt(process.env.PORT || "3000", 10);
const host = "0.0.0.0";
const dev = process.env.NODE_ENV === "development";
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
