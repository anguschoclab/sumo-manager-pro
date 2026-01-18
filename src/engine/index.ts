// index.ts
// =======================================================
// Basho Engine – Public API Exports
// Canonical, deterministic export surface
// =======================================================
//
// FIXES APPLIED:
// - Stable, dependency-safe export ordering (types first, then leaf utilities, then systems).
// - Avoids circular import amplification by exporting higher-level modules later.
// - Keeps dev-only exports last.
// - Adds historyIndex export alongside almanac/saveload.
//
// IMPORTANT:
// - Internal engine modules should NOT import from index.ts (barrel). Import from leaf modules.
// - Keep exports roughly in dependency order: types -> pure tables -> low-level systems -> world/sim -> UI/dev.

export * from "./types";

// ---------- Fundamental Mechanics (low-level, minimal deps) ----------
export * from "./kimarite";
export * from "./leverageClass";
export * from "./bout";

// ---------- World Structure & Time (foundational systems) ----------
export * from "./calendar";
export * from "./banzuke";
export * from "./economics";
export * from "./training";
export * from "./timeBoundary";

// ---------- Knowledge / Narrative / Flavor ----------
export * from "./shikona";
export * from "./scouting";
export * from "./pbp";
export * from "./media";

// ---------- Persistence & History ----------
export * from "./saveload";
export * from "./almanac";
export * from "./historyIndex";

// ---------- Matchmaking / Scheduling / Simulation Orchestration ----------
export * from "./matchmaking";
export * from "./schedule";
export * from "./worldgen";
export * from "./autoSim";

// ---------- NPC / Meta Systems ----------
export * from "./oyakataPersonalities";
export * from "./npcAI";
export * from "./rivalries";
export * from "./injuries";
export * from "./events";

// ---------- UI-facing Builders ----------
export * from "./uiDigest";

// ---------- Development / Testing (last) ----------
export * from "./mockData";
