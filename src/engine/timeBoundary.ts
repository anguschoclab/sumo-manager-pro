// timeBoundary.ts
// =======================================================
// Time Boundary v1.0 — Weekly boundary hooks (Constitution-aligned)
//
// Implements:
// - Scouting "observability" tick during interim weeks.
// - Banded knowledge (ConfidenceLevel) derived from numeric confidence.
// - Investment levels (none/light/standard/deep) influence gain/decay.
// - Deterministic per-target RNG (order-independent).
// - Emits scouting events into world events log.
//
// Note: WorldState types do not currently include scouting fields.
// This module stores its state in (world as any).scoutingState safely.
// =======================================================

import seedrandom from "seedrandom";
// TODO: consider migrating to SeededRNG for forkable streams
import type { WorldState, Id, ConfidenceLevel, ScoutingInvestment } from "./types";
import { appendEvents, createDefaultEventsState, makeSimpleEvent, type EngineEvent } from "./events";

type RNG = seedrandom.PRNG;

function makeRng(seed: string): RNG {
  return seedrandom(seed);
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

function levelFromConfidence(conf: number): ConfidenceLevel {
  if (conf <= 0) return "unknown";
  if (conf < 0.25) return "low";
  if (conf < 0.55) return "medium";
  if (conf < 0.85) return "high";
  return "certain";
}

export interface ScoutingTarget {
  targetId: Id;
  investment: ScoutingInvestment;
  /** 0..1 */
  confidence: number;
  /** cached band */
  level: ConfidenceLevel;
  lastWeekTouched: number;
  notes?: string[];
}

export interface ScoutingState {
  version: "1.0.0";
  targets: Record<Id, ScoutingTarget>;
}

function ensureScoutingState(world: WorldState): ScoutingState {
  const anyW = world as any;
  if (!anyW.scoutingState) {
    anyW.scoutingState = { version: "1.0.0", targets: {} } satisfies ScoutingState;
  }
  return anyW.scoutingState as ScoutingState;
}

export function setScoutingInvestment(world: WorldState, targetId: Id, investment: ScoutingInvestment): void {
  const state = ensureScoutingState(world);
  const existing = state.targets[targetId];

  const conf = existing?.confidence ?? 0;
  const level = existing?.level ?? levelFromConfidence(conf);

  state.targets[targetId] = {
    targetId,
    investment,
    confidence: conf,
    level,
    lastWeekTouched: world.week
  };
}

/**
 * Weekly scouting progression:
 * - Gains are diminishing returns: higher confidence => smaller gains
 * - Investment affects both gain and decay
 */
function tickTarget(args: { world: WorldState; t: ScoutingTarget }): { t: ScoutingTarget; delta: number; bandBefore: ConfidenceLevel; bandAfter: ConfidenceLevel; } {
  const { world } = args;
  const t = { ...args.t };

  const rng = makeRng(`${world.seed}::scouting::week${world.week}::${t.targetId}`);

  const beforeLevel = t.level;

  const inv = t.investment;

  // Decay and gain settings
  const baseGain =
    inv === "deep" ? 0.090 :
    inv === "standard" ? 0.060 :
    inv === "light" ? 0.035 :
    0.0;

  const baseDecay =
    inv === "none" ? 0.085 :
    inv === "light" ? 0.030 :
    inv === "standard" ? 0.012 :
    0.0; // deep maintains

  // Diminishing returns: (1 - confidence)^0.75
  const diminishing = Math.pow(clamp(1 - t.confidence, 0, 1), 0.75);

  // Small noise (deterministic)
  const noise = (rng() - 0.5) * 0.012; // -0.006..+0.006

  const gain = baseGain * diminishing + Math.max(0, noise);
  const decay = baseDecay * (0.6 + 0.4 * rng());

  const next = clamp(t.confidence + gain - decay, 0, 1);

  t.confidence = next;
  t.level = levelFromConfidence(next);
  t.lastWeekTouched = world.week;

  return { t, delta: next - (args.t.confidence ?? 0), bandBefore: beforeLevel, bandAfter: t.level };
}

export function tickWeek(world: WorldState): void {
  const state = ensureScoutingState(world);
  const emitted: EngineEvent[] = [];

  for (const id of Object.keys(state.targets)) {
    const t0 = state.targets[id];
    const { t, delta, bandBefore, bandAfter } = tickTarget({ world, t: t0 });
    state.targets[id] = t;

    // Emit event if band changes upward, or if deep/standard yields a notable gain
    const improved = bandAfter !== bandBefore && (
      (bandBefore === "unknown" && bandAfter !== "unknown") ||
      (bandBefore === "low" && (bandAfter === "medium" || bandAfter === "high" || bandAfter === "certain")) ||
      (bandBefore === "medium" && (bandAfter === "high" || bandAfter === "certain")) ||
      (bandBefore === "high" && bandAfter === "certain")
    );

    const notableGain = Math.abs(delta) >= 0.06 && (t.investment === "standard" || t.investment === "deep");

    if (improved || notableGain) {
      const title = improved ? "Scouting report improves" : "Scouting notes accumulate";
      const summary = improved
        ? `Your scouts now feel ${bandAfter.toUpperCase()} confidence about a target.`
        : `Additional scouting notes improve your read on a prospect.`;

      const { event } = makeSimpleEvent({
        world,
        seed: `${world.seed}::scouting::week${world.week}`,
        phase: "weekly",
        category: "scouting",
        importance: improved ? "notable" : "minor",
        scope: "world",
        title,
        summary,
        truthLevel: "player",
        data: {
          targetId: t.targetId,
          investment: t.investment,
          confidence: t.confidence,
          bandBefore,
          bandAfter,
          delta
        },
        tags: ["scouting"]
      });

      emitted.push(event);
    }
  }

  const eventsState = ((world as any).eventsState) ?? createDefaultEventsState();
  (world as any).eventsState = appendEvents(eventsState, emitted, false);
}
