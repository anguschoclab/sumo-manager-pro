// utils/SeededRNG.ts
// =======================================================
// Canonical deterministic RNG wrapper
//
// Purpose:
// - Single, blessed RNG abstraction for the entire engine
// - Wraps `seedrandom` but exposes a stable, typed interface
// - Supports:
//   • next() -> number (0..1)
//   • int(min, max)
//   • bool(p)
//   • fork(label) -> SeededRNG (order-independent streams)
//
// Canon goals:
// - Determinism & replayability
// - Order independence via forking
// - No direct Math.random() usage anywhere in engine
// =======================================================

import seedrandom from "seedrandom";

export class SeededRNG {
  private rng: seedrandom.PRNG;
  private readonly seed: string;

  constructor(seed: string) {
    this.seed = seed;
    this.rng = seedrandom(seed);
  }

  /** Raw float in [0, 1). */
  next(): number {
    return this.rng();
  }

  /** Integer in [min, max] inclusive. */
  int(min: number, max: number): number {
    if (max < min) [min, max] = [max, min];
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  /** True with probability p (0..1). */
  bool(p = 0.5): boolean {
    return this.next() < p;
  }

  /** Pick an element from an array. */
  pick<T>(arr: readonly T[]): T {
    if (arr.length === 0) {
      throw new Error("SeededRNG.pick called with empty array");
    }
    return arr[this.int(0, arr.length - 1)];
  }

  /** Fork a new RNG stream deterministically. */
  fork(label: string | number): SeededRNG {
    return new SeededRNG(`${this.seed}::${label}`);
  }

  /** Expose seed for debugging/auditing. */
  getSeed(): string {
    return this.seed;
  }
}
