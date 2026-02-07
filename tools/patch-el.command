#!/usr/bin/env bash
set -euo pipefail

# Stable Lords — EL helper hotfix for v1.4.3.js
# Replaces the simplistic el() with a robust version that supports strings/arrays.
# Usage: run from project root (where index.html lives), e.g.:
#   chmod +x tools/patch-el.command && ./tools/patch-el.command

HERE="$(cd "$(dirname "$0")" && pwd)"
ROOT="$(cd "$HERE/.." && pwd)"
FILE="$ROOT/delta/v1.4.3.js"

echo "== Stable Lords — EL helper hotfix =="
if [ ! -f "$FILE" ]; then
  echo "• ERROR: $FILE not found. Edit the script and set FILE= to the correct path."
  exit 1
fi

BACKUP="$FILE.bak.$(date +%Y%m%d%H%M%S)"
cp "$FILE" "$BACKUP"
echo "• Backup created: $(basename "$BACKUP")"

# Build the replacement function body safely (no regex fragility on braces).
read -r -d '' NEWFUNC <<'EOF'
function el(tag, props, ...children) {
  const node = document.createElement(tag);

  if (props) {
    for (const [k, v] of Object.entries(props)) {
      if (k === "class" || k === "className") node.className = v;
      else if (k === "style" && v && typeof v === "object") Object.assign(node.style, v);
      else if (k === "dataset" && v && typeof v === "object") Object.assign(node.dataset, v);
      else if (k.startsWith("on") && typeof v === "function") node.addEventListener(k.slice(2).toLowerCase(), v);
      else if (v != null && v !== false) node.setAttribute(k, String(v));
    }
  }

  const append = (c) => {
    if (c == null || c === false) return;
    if (Array.isArray(c)) { c.forEach(append); return; }
    if (c instanceof Node) { node.appendChild(c); return; }
    node.appendChild(document.createTextNode(String(c)));
  };

  children.forEach(append);
  return node;
}
EOF

# Use Perl to replace the first function el(...) block in a non-greedy way.
# -0777 enables multiline; [\s\S]*? matches lazily across lines.
/usr/bin/perl -0777 -pe '
  BEGIN { $/ = undef; }
  s/function\s+el\s*\([^)]*\)\s*\{[\s\S]*?\n\}/$ENV{NEWFUNC}\n/s
' NEWFUNC="$NEWFUNC" "$FILE" > "$FILE.tmp"

# Validate a minimal check: ensure the new function appears.
if ! grep -q "function el(tag, props, ...children)" "$FILE.tmp"; then
  echo "• ERROR: patch failed integrity check. Original restored."
  rm -f "$FILE.tmp"
  cp "$BACKUP" "$FILE"
  exit 2
fi

mv "$FILE.tmp" "$FILE"
echo "• OK: Patched el() in $(basename "$FILE")"
echo "• Done. You can now refresh your browser window."
