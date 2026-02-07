Duelmasters — Sprint 5A (Tournament Depth & Lore) — DELTA

Target base: v1.2.0
New version after apply: v1.2.5

What's inside (additive):
• Hall of Fights page (persistent archive of Fight of the Week / Fight of the Tournament)
• Style Meter (10 weeks + per-tournament) — W/L/K% by style
• Newsletter recap & commentary polish hooks (crowd reactions, announcer blurbs, most popular style)
• Guard: no stablemate matchups in regular rounds
• Narrative toasts for fame/popularity (e.g., "The crowd roars — fame rises!")

How to apply:
1) Unzip over your project root (allow new files). This delta avoids overwriting common files.
2) Wire routes:
   - Import and add the HallOfFights route to your router: path "/hall-of-fights".
   - Import StyleMeterPanel and mount under your Tournament Recap tab (optional button "Style Meter").
3) Hook saves:
   - Call LoreArchive.signalFight(fightSummary) right after a fight result is committed.
   - Call StyleMeter.recordFight(outcome) per fight, and StyleMeter.flushWeek() after Run Round (if you batch per week).
4) Ensure toasts provider is mounted once in AppRoot: <ToastsProvider />.
5) Rebuild: npm run dev (or build).

Files added:
- src/lore/HallOfFights.tsx
- src/lore/LoreArchive.ts
- src/lore/AnnouncerAI.ts
- src/metrics/StyleMeter.ts
- src/ui/toast/Toasts.tsx
- src/ui/flair/FlairChips.tsx
- src/guards/matchmaking.ts
- src/types/lore.d.ts
- public/icons/trophy.svg, public/icons/flair-bolt.svg

Apply time: 2025-10-11T16:15:26.135873Z
