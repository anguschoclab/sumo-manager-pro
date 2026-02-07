Duelmasters — macOS Quickstart v1.4.0

What this is
============
A tiny, always-playable shell so you can click around *today*. It includes:
- A Dashboard with demo seed data
- Roster with champion badge and quick fighter sheets
- Run Round (mock fight) that writes a newsletter entry
- Tournaments placeholder (UI stub)
- Help sheet with key concepts

How to run (macOS)
==================
1) Double-click: Start Game.command
   - Starts a tiny local server and opens your browser.
2) Force Chrome: Start Game (Chrome).command
3) Wipe local save: Reset Save.command (or append ?reset=1 to the URL).

Pack philosophy
===============
- Boot guarantee: index.html opens and renders locally.
- Seeded demo: if saves are empty, we auto-seed a small stable.
- Safe UI: buttons have working stub flows—no dead ends.
- Feature flags: unfinished areas show "Coming soon" but never break nav.
