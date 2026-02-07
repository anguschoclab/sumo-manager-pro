#!/bin/sh
echo "== Stable Lords — Delta v1.4.2 Patcher =="

# Ensure index.html has our delta script tag
HTML="index.html"
NEED='<script type="module" src="delta/v1.4.2.js"></script>'

if [ ! -f "$HTML" ]; then
  echo "!! index.html not found in $(pwd). Place this script in your project root."; exit 1
fi

if grep -q "delta/v1.4.2.js" "$HTML"; then
  echo "• index.html already references delta/v1.4.2.js — OK"
else
  # Insert before closing body tag
  TMP="$HTML.tmp"
  awk -v add="$NEED" '
    /<\/body>/ && !added { print "  " add; print; added=1; next }
    { print }
  ' "$HTML" > "$TMP" && mv "$TMP" "$HTML"
  echo "• Injected delta/v1.4.2.js into index.html"
fi

echo "All set. Run:  npm run dev  (or reopen index.html)"
