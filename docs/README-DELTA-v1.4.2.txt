Stable Lords — Delta v1.4.2
=================================
This is a safe, additive update that does NOT require touching your app.jsx.
It adds:
  • A floating “Meta” button (bottom-left) — Arena Meta Snapshot modal.
  • A floating “Help” button — OE vs AL primer + class quick notes.
  • Seasonal flavor strings available on window.SL_FLAVOR for tournaments/newsletters.
  • Friendly toast on load.

Install (drop-in)
-----------------
1) Unzip this folder into your project root (same folder as index.html).
2) Overwrite when prompted (index.html gets a tiny version bump + script include).
3) Optional: run tools/patch-react-vite.command if you prefer to patch your existing index.html instead of overwriting.
4) Start:  npm run dev  (or open index.html directly if you’re using the quickstart)

Troubleshooting
---------------
• If you use a custom index.html, run the patcher:
    chmod +x tools/patch-react-vite.command
    ./tools/patch-react-vite.command

• The delta scripts are self-contained and won’t break your app if your save is empty.
  You’ll see demo counts only if your save already has some roster/history.
