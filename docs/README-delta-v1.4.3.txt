Stable Lords — Delta v1.4.3
================================

What you get
------------
• Newsletter modal (“Stable Lords Ledger”) with recap + champion line + arena meta.
• Seasonal Tournament modal (Seed → Run Round → Champion).
• Seasonal flavor lines (Spring/Summer/Fall/Winter) exposed on window.SL_FLAVOR.
• Safe: no changes to your app code; pure DOM modals and localStorage.

Install
-------
1) Unzip into your project root (same folder as index.html).
2) Either:
   • Open index.html in a text editor and add:
       <script type="module" src="delta/v1.4.3.js"></script>
     before </body>
   • Or run the patcher:
       chmod +x tools/patch-newsletter-tourney.command
       ./tools/patch-newsletter-tourney.command

Use
---
• Click “Tournaments” in the top nav to open the modal.
• “Seed” will select 8–16 entrants (by wins + fame + popularity).
• “Run Round” advances the bracket; when a champion is crowned, a newsletter is published.
• Click “Newsletter” in the top nav to view/export the latest issue.

Notes
-----
• Reads your roster from localStorage key: sl.save (falls back to a demo roster).
• Tournament data is stored in: sl.tournament.current
• Newsletter latest issue is stored in: sl.newsletter.latest

Version: 2025-10-26T12:15:47.943026 / 2025-10-26 / v1.4.3
