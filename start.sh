#!/usr/bin/env bash
#
# Builds (when needed) and starts the app at http://localhost:3000/
#
#   ./start.sh          build if the code changed, then start
#   ./start.sh --build  force a full rebuild, then start
#

set -euo pipefail

cd "$(dirname "${BASH_SOURCE[0]}")"

major="$(node -p 'process.versions.node.split(".")[0]' 2>/dev/null || echo 0)"
if [ "${major}" -lt 26 ]; then
  echo "Node.js 26 or newer is required (found: $(node --version 2>/dev/null || echo none))."
  echo "Get it from https://nodejs.org/ and run this script again."
  exit 1
fi

[ -f .env ] || cp .env.example .env

stamp="root/.build-stamp"
# The build is current when neither the commit nor any uncommitted change
# (edited or new files) has moved since the last build.
head="$({
  git rev-parse HEAD
  git diff HEAD
  git ls-files --others --exclude-standard -z | xargs -0 cat 2>/dev/null
} 2>/dev/null | shasum | cut -d" " -f1)"

if [ "${1:-}" = "--build" ] || [ ! -d node_modules ] || [ ! -d root/lib ] ||
  [ "$(cat "${stamp}" 2>/dev/null)" != "${head}" ]; then
  echo "Building, this takes a few minutes the first time..."
  npm ci
  npm run compile
  npm run build
  echo "${head}" >"${stamp}"
fi

echo "Starting at http://localhost:3000/ (Ctrl+C to stop)"
exec env NODE_ENV=production node --enable-source-maps ./root/index.js
