import { rngFromSeed, rngForWorld } from "./rng";
import type { WorldState } from "./types";
import { SeededRNG } from "./utils/SeededRNG";

export function applyWeeklyTraining(world: WorldState, weekIndex: number) {
  const rng = rngForWorld(world, "training::${weekIndex}".split("::")[0], "training::${weekIndex}".split("::").slice(1).join("::"));

  for (const id in world.rikishi) {
    const r = world.rikishi[id];
    if (!r) continue;

    if (r.trainingFocus === "oshi" && r.style !== "oshi" && rng.next() < 0.05) {
      r.style = "oshi";
    }
    if (r.trainingFocus === "yotsu" && r.style !== "yotsu" && rng.next() < 0.05) {
      r.style = "yotsu";
    }
  }
}