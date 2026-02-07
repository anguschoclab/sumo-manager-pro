#!/bin/bash
set -e
echo "== Stable Lords — Newsletter/Tournament Patch (v1.4.3) =="
HTML="index.html"
if [ ! -f "$HTML" ]; then
  echo "• index.html not found in current directory."
  exit 1
fi

# Only inject once
if grep -q 'delta/v1.4.3.js' "$HTML"; then
  echo "• Script tag already present — nothing to do."
  exit 0
fi

TMP="${HTML}.tmp"

awk '{
  print $0
} /<\/body>/ && !done {
  print "  <script type=\"module\" src=\"delta/v1.4.3.js\"></script>"
  done=1
}' "$HTML" > "$TMP"

mv "$TMP" "$HTML"
echo "• Injected <script type=\"module\" src=\"delta/v1.4.3.js\"></script> into index.html"
echo "• Done."
