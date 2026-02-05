// src/engine/utils/SeededRNG.ts
// =======================================================
// Engine-local re-export of the canonical RNG wrapper.
//
// Why this exists:
// - Some engine modules prefer importing from "./utils/SeededRNG"
// - The canonical implementation lives at "src/utils/SeededRNG.ts"
//
// Canon rule:
// - Do not use Math.random() inside engine logic.
// - Prefer SeededRNG and fork(label) for order-independent streams.
// =======================================================

export { SeededRNG } from "../../utils/SeededRNG";
