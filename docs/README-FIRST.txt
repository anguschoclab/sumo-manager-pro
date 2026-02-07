
Duelmasters Scaffold (Engine Drop-in) — v0.6.1

What this is:
• A ready-to-run React + Vite + TypeScript project with Tailwind and Radix.
• The UI is already wired to an engine "slot" so you can paste your full engine later.
• Double-click to run (mac: run-mac.command, Windows: run-win.bat).

How to run the dev server:
1) Unzip.
2) macOS: double-click run-mac.command
   Windows: double-click run-win.bat
3) If a browser doesn't open automatically, go to http://localhost:5173

How to drop in your full engine:
1) Open src/engine/full/index.ts
2) Scroll to the marker:  // ==== PASTE YOUR FULL ENGINE BELOW ====
3) Paste your engine code there.
4) Make sure you export (at minimum):
   - enum FightingStyle
   - type WarriorMeta, MinutePlan, MinuteEvent, FightOutcome
   - function defaultPlanForWarrior(w: WarriorMeta): MinutePlan
   - function simulateFight(planA: MinutePlan, planD: MinutePlan): FightOutcome
5) Save the file. The UI will use your full engine automatically.
   (By default, index.ts re-exports from full/index.ts, which currently proxies to the stub.)

Building a production zip of the site:
• macOS/WSL/Linux: run `bash pack-01.sh` at the project root. It creates duelmasters-build.zip.

Need help? You can zip your engine file and share it; I’ll bake it into a ready-to-run bundle for you.
