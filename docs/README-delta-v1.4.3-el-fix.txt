Stable Lords — Delta v1.4.3 (EL helper hotfix)
====================================================

What this fixes
- Clickable tournaments page/modal was throwing:
  "Failed to execute 'appendChild' on 'Node': parameter 1 is not of type 'Node'."
- Cause: the DOM helper `el()` tried to append strings/arrays directly via appendChild.

What this delta does
- Patches `delta/v1.4.3.js` in-place to replace `function el(...)` with a robust version
  that flattens arrays and converts strings to TextNodes.

How to apply (macOS):
1) Unzip this archive into your project folder (the one that has `index.html`).
   You should then have: ./tools/patch-el.command
2) In Terminal:
   cd /path/to/your/project
   chmod +x tools/patch-el.command
   ./tools/patch-el.command
3) Restart Vite (or just refresh the page if running).

Safety:
- The script makes a timestamped backup: delta/v1.4.3.js.bak.YYYYMMDDHHMMSS
- If anything fails, no changes are written.

Notes:
- If your project stores `v1.4.3.js` in a different folder, edit FILE= in the script.
- This delta does *not* change index.html. It only patches the existing file.

Enjoy!
