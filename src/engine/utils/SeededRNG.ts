 /**
  * SeededRNG - Deterministic random number generator using seedrandom.
  * Provides a consistent interface for generating random values from a seed.
  */
 
 import seedrandom from "seedrandom";
 
 export class SeededRNG {
   private rng: seedrandom.PRNG;
 
   constructor(seed: string) {
     this.rng = seedrandom(seed);
   }
 
   /**
    * Get the next random float between 0 (inclusive) and 1 (exclusive).
    */
   next(): number {
     return this.rng();
   }
 
   /**
    * Alias for next() - returns a float between 0 and 1.
    */
   nextFloat(): number {
     return this.rng();
   }
 
   /**
    * Get a random integer between min (inclusive) and max (inclusive).
    */
   int(min: number, max: number): number {
     return Math.floor(this.rng() * (max - min + 1)) + min;
   }
 
   /**
    * Get a random boolean with optional probability (default 0.5).
    */
   bool(probability: number = 0.5): boolean {
     return this.rng() < probability;
   }
 
   /**
    * Pick a random element from an array.
    */
   pick<T>(arr: readonly T[]): T {
     return arr[this.int(0, arr.length - 1)];
   }
 
   /**
    * Shuffle an array in place using Fisher-Yates algorithm.
    */
   shuffle<T>(arr: T[]): T[] {
     for (let i = arr.length - 1; i > 0; i--) {
       const j = this.int(0, i);
       [arr[i], arr[j]] = [arr[j], arr[i]];
     }
     return arr;
   }
 }
 
 /**
  * Factory function for creating SeededRNG instances.
  * Can be used where createSeededRNG was expected.
  */
 export function createSeededRNG(seed: string): SeededRNG {
   return new SeededRNG(seed);
 }