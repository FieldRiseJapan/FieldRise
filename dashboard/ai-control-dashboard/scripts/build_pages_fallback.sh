#!/usr/bin/env bash
set -euo pipefail

# Build the AI Control Dashboard for GitHub Pages at /ai-control-dashboard/.
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
APP_DIR="$REPO_ROOT/dashboard/ai-control-dashboard"
OUT_DIR="$REPO_ROOT/ai-control-dashboard"

cd "$APP_DIR"
pnpm install --frozen-lockfile
rm -rf "$OUT_DIR"
pnpm exec vite build --base=./ --outDir "$OUT_DIR"
mkdir -p "$OUT_DIR/data"
commit_sha="$(git -C "$REPO_ROOT" rev-parse HEAD)"
commit_date="$(git -C "$REPO_ROOT" log -1 --format=%cI)"
commit_message="$(git -C "$REPO_ROOT" log -1 --format=%s)"
printf '{\n  "sha": "%s",\n  "date": "%s",\n  "message": "%s"\n}\n' "$commit_sha" "$commit_date" "${commit_message//\"/\\\"}" > "$OUT_DIR/data/latest-commit.json"
touch "$OUT_DIR/.nojekyll"
printf 'GitHub Pages artifact created at %s\n' "$OUT_DIR"
