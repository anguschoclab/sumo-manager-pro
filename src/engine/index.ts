// index.ts
// =======================================================
// Basho Engine – Public API Exports
// Canonical, deterministic export surface
// =======================================================
//
// FIXES APPLIED:
// - Stable, dependency-safe export ordering (types first, then pure constants, then systems).
// - Avoids accidental circular import amplification by exporting higher-level modules later.
// - Keeps dev-only exports last.
//
// NOTE:
// If any module imports from `index.ts`, prefer importing from the leaf module instead.
// `index.ts` should be an outward-facing barrel, not an internal dependency hub.

// ---------- Core Types (always first) ----------
export * from "./types";

// ---------- Fundamental Mechanics (low-level, no world deps) ----------
export * from "./kimarite";
export * from "./leverageClass";
export * from "./bout";

// ---------- World Structure & Time ----------
export * from "./calendar";
export * from "./banzuke";
export * from "./economics";

// ---------- Narrative / Flavor ----------
export * from "./shikona";
export * from "./sponsors";

// ---------- Persistence & History ----------
export * from "./saveload";
export * from "./almanac";

// ---------- Simulation Orchestration ----------
export * from "./matchmaking";
export * from "./schedule";
export * from "./timeBoundary";
export * from "./training";
export * from "./scouting";
export * from "./worldgen";
export * from "./autoSim";

// ---------- NPC / Systems ----------
export * from "./npcAI";
export * from "./oyakataPersonalities";
export * from "./rivalries";
export * from "./injuries";
export * from "./events";
export * from "./media";
export * from "./pbp";
export * from "./uiDigest";

// ---------- Development / Testing (last) ----------
export * from "./mockData";
