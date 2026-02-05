// rng.ts
// =======================================================
// Canonical RNG helpers for engine code.
//
// Rule:
// - Always derive streams from an explicit seed (usually world.seed),
//   and namespace them with subsystem + label.
//
// Pattern:
//   new SeededRNG(`${seed}::${subsystem}::${label}`)
//
// Prefer these helpers instead of ad-hoc string concatenation.
// =======================================================

import type { WorldState } from "./types";
import { SeededRNG } from "./utils/SeededRNG";

export function rngFromSeed(seed: string, subsystem: string, label: string): SeededRNG {
  return new SeededRNG(`${seed}::${subsystem}::${label}`);
}

export function rngForWorld(world: WorldState, subsystem: string, label: string): SeededRNG {
  return rngFromSeed(world.seed, subsystem, label);
}
