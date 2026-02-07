Stable Lords — Delta v1.4.4
===========================

What’s inside
-------------
• delta/v1.4.4.js
  - Robust DOM builder (`el`) that accepts arrays, strings, nulls (fixes appendChild errors)
  - Restores "Run Round" and "Seed Demo" to the top nav with graceful fallbacks
  - Fixes the Tournaments view so cards are clickable without DOM errors
  - Updates the version chip to "Stable Lords v1.4.4" at runtime

• tools/patch-delta-v1.4.4.command
  - One-click injector: copies delta file and inserts the script tag into index.html

How to apply
------------
1) Unzip this delta into your project root (the same folder that contains index.html).
2) Run:
   chmod +x tools/patch-delta-v1.4.4.command
   ./tools/patch-delta-v1.4.4.command .

3) Open index.html (double-click) or run your dev server:
   npm run dev

4) Visual check:
   - The chip in the top bar should read: Stable Lords v1.4.4
   - "Run Round" and "Seed Demo" buttons are present and clickable.
   - Clicking "Tournaments" shows four seasonal cards; "Open"/"Seed" toast messages appear
     (or call your engine hooks if they're wired).

Notes
-----
• This delta does not remove any existing code. It loads as a module and adds/fixes UI behavior safely.
• If future deltas arrive, you'll see the chip update (e.g., Stable Lords v1.4.5) so you can confirm visually.
