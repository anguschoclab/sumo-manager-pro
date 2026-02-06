import { rngFromSeed, rngForWorld } from "./rng";
import type { WorldState, Style } from "./types";
import { SeededRNG } from "./utils/SeededRNG";

export function determineNPCStyleBias(world: WorldState, stableId: string): Style | "neutral" {
  const stable = world.heyas.get(stableId);
  if (!stable) return "neutral";

  const rng = rngForWorld(world, "npcAI", stableId);

  let oshi = 0;
  let yotsu = 0;

  for (const rId of stable.rikishiIds) {
    const rikishi = world.rikishi.get(rId);
    if (!rikishi) continue;
    if (rikishi.style === "oshi") oshi += 1;
    if (rikishi.style === "yotsu") yotsu += 1;
  }

  if (oshi === yotsu) return "neutral";
  return oshi > yotsu ? "oshi" : "yotsu";
}
