import type { WorldState } from "./types";
import { SeededRNG } from "./utils/SeededRNG";

export interface ScoutingEvent {
  targetId: string;
  confidenceGain: number;
}

export function applyWeeklyScouting(world: WorldState, weekIndex: number): ScoutingEvent[] {
  const events: ScoutingEvent[] = [];
  const rng = new SeededRNG(world.seed + ":scouting:" + weekIndex);

  for (const scout of world.scoutingTargets ?? []) {
    const gain = 0.05 + rng.next() * 0.05;
    scout.confidence = Math.min(1, scout.confidence + gain);
    events.push({ targetId: scout.targetId, confidenceGain: gain });
  }

  return events;
}