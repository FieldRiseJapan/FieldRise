#!/usr/bin/env bash
# Build the current Sonata Desk source into the repository-root GitHub Pages fallback.
# This intentionally preserves existing hashed assets; index.html always references the latest bundle.
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
APP_DIR="$ROOT_DIR/dashboard/sonata-desk"
PUBLISH_DIR="$ROOT_DIR/sonata-desk"

cd "$APP_DIR"
pnpm exec tsc --noEmit
pnpm exec vite build --outDir "$PUBLISH_DIR"
touch "$PUBLISH_DIR/.nojekyll"

printf 'Sonata Desk fallback built at %s\n' "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
printf 'Publish URL: https://fieldrisejapan.github.io/FieldRise/sonata-desk/\n'
