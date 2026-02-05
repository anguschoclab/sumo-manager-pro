// rng.ts
// =======================================================
// Canonical RNG helpers for engine code.
//
// Rule:
// - Always derive streams from an explicit seed (usually world.seed),
//   and namespace them with subsystem + label.
//
// Pattern:
//   rngFromSeed(seed, "${subsystem}::${label}".split("::")[0], "${subsystem}::${label}".split("::").slice(1).join("::"))
//
// Prefer these helpers instead of ad-hoc string concatenation.
// =======================================================

import { rngFromSeed, rngForWorld } from "./rng";
import type { WorldState } from "./types";
import { SeededRNG } from "./utils/SeededRNG";

export function rngFromSeed(seed: string, subsystem: string, label: string): SeededRNG {
  return rngFromSeed(seed, "${subsystem}::${label}".split("::")[0], "${subsystem}::${label}".split("::").slice(1).join("::"));
}

export function rngForWorld(world: WorldState, subsystem: string, label: string): SeededRNG {
  return rngFromSeed(world.seed, subsystem, label);
}