import type { WorldState } from "./types";
import { SeededRNG } from "./utils/SeededRNG";

export function applyWeeklyTraining(world: WorldState, weekIndex: number) {
  const rng = new SeededRNG(world.seed + ":training:" + weekIndex);

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