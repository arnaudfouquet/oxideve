#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${APP_DIR:-$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)}"

cd "$APP_DIR"

echo "[deploy] Updating repository"
git pull origin main

echo "[deploy] Installing dependencies"
npm install

echo "[deploy] Generating Prisma client"
npx prisma generate

echo "[deploy] Building Next.js frontend"
npm run build

echo "[deploy] Restarting Node process"
if [[ -n "${INFOMANIAK_RESTART_COMMAND:-}" ]]; then
  eval "$INFOMANIAK_RESTART_COMMAND"
elif command -v passenger-config >/dev/null 2>&1; then
  passenger-config restart-app "$APP_DIR"
elif command -v pm2 >/dev/null 2>&1; then
  pm2 restart oxideve || pm2 start server.js --name oxideve
elif [[ -d tmp ]]; then
  mkdir -p tmp
  touch tmp/restart.txt
else
  echo "No automatic restart command detected. Configure INFOMANIAK_RESTART_COMMAND."
fi

echo "[deploy] Completed"
