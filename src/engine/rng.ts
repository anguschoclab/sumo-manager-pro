 // rng.ts
 // =======================================================
 // Canonical RNG helpers for engine code.
 //
 // Rule:
 // - Always derive streams from an explicit seed (usually world.seed),
 //   and namespace them with subsystem + label.
 //
 // Pattern:
 //   rngFromSeed(seed, "subsystem", "label")
 //
 // Prefer these helpers instead of ad-hoc string concatenation.
 // =======================================================
 
 import type { WorldState } from "./types";
 import { SeededRNG } from "./utils/SeededRNG";
 
 /**
  * Create a seeded RNG stream from a base seed, subsystem, and label.
  * Combines into a unique stream key: `${seed}::${subsystem}::${label}`
  */
 export function rngFromSeed(seed: string, subsystem: string, label: string): SeededRNG {
   const streamKey = `${seed}::${subsystem}::${label}`;
   return new SeededRNG(streamKey);
 }
 
 /**
  * Convenience helper to create RNG from a WorldState.
  */
 export function rngForWorld(world: WorldState, subsystem: string, label: string): SeededRNG {
   return rngFromSeed(world.seed, subsystem, label);
 }