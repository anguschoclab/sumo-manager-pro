import { rngFromSeed, rngForWorld } from "./rng";
import type { WorldState, FightingStyle } from "./types";
import { SeededRNG } from "./utils/SeededRNG";

export function determineNPCStyleBias(world: WorldState, stableId: string): FightingStyle | "neutral" {
  const stable = world.heya[stableId];
  if (!stable) return "neutral";

  const rng = rngForWorld(world, "npcAI::${stableId}".split("::")[0], "npcAI::${stableId}".split("::").slice(1).join("::"));

  let oshi = 0;
  let yotsu = 0;

  for (const r of stable.rikishiIds) {
    const rikishi = world.rikishi[r];
    if (!rikishi) continue;
    if (rikishi.style === "oshi") oshi += 1;
    if (rikishi.style === "yotsu") yotsu += 1;
  }

  if (oshi === yotsu) return "neutral";
  return oshi > yotsu ? "oshi" : "yotsu";
}