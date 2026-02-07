#!/bin/bash
set -euo pipefail
echo "== Stable Lords — Delta Injector (v1.4.4) =="
ROOT="${1:-.}"

if [ ! -f "$ROOT/index.html" ]; then
  echo "• ERROR: Couldn't find index.html in $ROOT"
  exit 1
fi

# Ensure delta folder exists at project root
mkdir -p "$ROOT/delta"
cp -f "delta/v1.4.4.js" "$ROOT/delta/v1.4.4.js"

# Inject script tag before </body> if not already present
if ! grep -q 'delta/v1.4.4.js' "$ROOT/index.html"; then
  cp "$ROOT/index.html" "$ROOT/index.html.bak.$(date +%Y%m%d%H%M%S)"
  # Insert the script tag
  awk 'BEGIN{added=0}
       /<\/body>/ && !added {print "  <script type=\"module\" src=\"delta/v1.4.4.js\"></script>"; added=1}
       {print $0}' "$ROOT/index.html" > "$ROOT/index.html.tmp"
  mv "$ROOT/index.html.tmp" "$ROOT/index.html"
  echo "• Injected <script type=\"module\" src=\"delta/v1.4.4.js\"></script> into index.html"
else
  echo "• Script tag already present. Skipping injection."
fi

echo "• Done."
