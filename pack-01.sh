#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")" && pwd)"
OUT="${1:-duelmasters-build.zip}"
[ -d "$ROOT/node_modules" ] || (cd "$ROOT" && npm i)
(cd "$ROOT" && npm run build)
(cd "$ROOT/dist" && zip -r "../$OUT" .)
echo "Done: $ROOT/$OUT"
