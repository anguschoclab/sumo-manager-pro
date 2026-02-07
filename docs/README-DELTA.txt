Stable Lords — Delta Patch: React/Vite JSX Fix
================================================

What this fixes
---------------
• Vite error: "Failed to parse source for import analysis… If you are using JSX,
  make sure to name the file with the .jsx or .tsx extension."
• Adds @vitejs/plugin-react and a proper `vite.config.ts`.
• Ensures `index.html` loads your entry as a module (`app.jsx`).

What's inside
-------------
1. vite.config.ts
2. tools/patch-react-vite.command (macOS-friendly script)

How to apply (macOS)
--------------------
1) Unzip this package into your project root (same folder as index.html).
2) In Terminal, `cd` into your project (the folder with index.html).
3) Make the script executable:
   chmod +x tools/patch-react-vite.command
4) Run it:
   ./tools/patch-react-vite.command
5) Start dev:
   npm run dev

Manual quick fix (if you prefer)
--------------------------------
• Rename app.js -> app.jsx
• In index.html, load it as:
  <script type="module" src="/app.jsx"></script>
• Create vite.config.ts with:

  import { defineConfig } from 'vite';
  import react from '@vitejs/plugin-react';
  export default defineConfig({ plugins: [react()] });

• Ensure dev dependency:
  npm i -D @vitejs/plugin-react

Notes
-----
• The script makes .bak backups for touched files.
• It is idempotent: it won't re-rename or duplicate config if you run it again.
