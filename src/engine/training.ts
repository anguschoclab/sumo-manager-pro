// training.ts
// =======================================================
// Training System v1.1 (Constitution-aligned)
//
// Implements:
// - TrainingProfile types (re-exported for other subsystems)
// - Career phase model (PHASE_EFFECTS)
// - computeTrainingMultipliers (used by injuries.ts)
// - tickWeek(world): applies training progress AND style drift (no direct style setting)
//
// Canon pillars supported:
// - Style does NOT change instantly; drift accumulates via "tendency".
// - Mismatch between training bias and current style causes inefficiency (and mild risk).
// - Drift is gated by adaptability + stat support; thresholds prevent flip-flopping.
// - Deterministic per-rikishi RNG (order-independent).
// =======================================================

import seedrandom from "seedrandom";
import type {
  WorldState,
  Heya,
  Rikishi,
  Id,
  TrainingProfile,
  TrainingIntensity,
  TrainingFocus,
  StyleBias,
  RecoveryEmphasis,
  Style
} from "./types";
import { appendEvents, createDefaultEventsState, makeSimpleEvent, type EngineEvent } from "./events";

export type CareerPhase = "rookie" | "growth" | "prime" | "veteran";

/** Effects are multipliers applied in training math. */
export const PHASE_EFFECTS: Record<CareerPhase, {
  statGainMult: number;
  styleDriftMult: number;
  injuryRiskMult: number;
  injuryRecoveryMult: number;
}> = {
  rookie:  { statGainMult: 1.15, styleDriftMult: 1.10, injuryRiskMult: 1.05, injuryRecoveryMult: 1.00 },
  growth:  { statGainMult: 1.08, styleDriftMult: 1.05, injuryRiskMult: 1.02, injuryRecoveryMult: 1.00 },
  prime:   { statGainMult: 1.00, styleDriftMult: 0.90, injuryRiskMult: 1.00, injuryRecoveryMult: 1.00 },
  veteran: { statGainMult: 0.92, styleDriftMult: 0.80, injuryRiskMult: 1.04, injuryRecoveryMult: 1.05 }
};

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

function makeRng(seed: string): seedrandom.PRNG {
  return seedrandom(seed);
}

function styleSign(bias: StyleBias): number {
  return bias === "oshi" ? 1 : bias === "yotsu" ? -1 : 0;
}

function defaultProfile(): TrainingProfile {
  return { intensity: "balanced", focus: "neutral", styleBias: "neutral", recovery: "normal" };
}

export function getCareerPhase(experience: number): CareerPhase {
  // Experience is 0..100-ish in this project
  if (experience < 25) return "rookie";
  if (experience < 55) return "growth";
  if (experience < 80) return "prime";
  return "veteran";
}

export function computeTrainingMultipliers(args: {
  rikishi: Rikishi;
  heya?: Heya;
  profile: TrainingProfile;
  individualMode: "develop" | "push" | "protect" | "rebuild" | null;
}): {
  statGainMult: number;
  injuryRiskMult: number;
  injuryRecoveryMult: number;
  styleDriftMult: number;
} {
  const profile = args.profile ?? defaultProfile();
  const phase = getCareerPhase(args.rikishi.experience);
  const phaseFx = PHASE_EFFECTS[phase];

  // Intensity multipliers (canon: intensity trades risk vs growth)
  const intensityStat =
    profile.intensity === "conservative" ? 0.85 :
    profile.intensity === "balanced" ? 1.00 :
    profile.intensity === "intensive" ? 1.10 :
    1.18; // punishing

  const intensityRisk =
    profile.intensity === "conservative" ? 0.82 :
    profile.intensity === "balanced" ? 1.00 :
    profile.intensity === "intensive" ? 1.18 :
    1.32;

  // Recovery emphasis
  const recoveryRisk =
    profile.recovery === "high" ? 0.86 :
    profile.recovery === "normal" ? 1.00 :
    1.10; // low recovery raises risk

  const recoveryHeal =
    profile.recovery === "high" ? 1.15 :
    profile.recovery === "normal" ? 1.00 :
    0.90;

  // Individual focus modes (small, but meaningful)
  const modeStat =
    args.individualMode === "push" ? 1.08 :
    args.individualMode === "develop" ? 1.03 :
    args.individualMode === "protect" ? 0.92 :
    args.individualMode === "rebuild" ? 0.88 :
    1.00;

  const modeRisk =
    args.individualMode === "push" ? 1.10 :
    args.individualMode === "develop" ? 1.02 :
    args.individualMode === "protect" ? 0.86 :
    args.individualMode === "rebuild" ? 0.90 :
    1.00;

  // Facilities: training and recovery affect outcomes slightly
  const trainingFacility = args.heya?.facilities?.training;
  const recoveryFacility = args.heya?.facilities?.recovery;

  const facilityStat =
    typeof trainingFacility === "number"
      ? clamp(0.92 + clamp(trainingFacility, 0, 100) / 250, 0.92, 1.32)
      : 1.00;

  const facilityRisk =
    typeof recoveryFacility === "number"
      ? clamp(1.06 - clamp(recoveryFacility, 0, 100) / 400, 0.80, 1.06)
      : 1.00;

  // Style mismatch inefficiency (canon: bias doesn't flip style; it makes training less efficient if mismatched)
  const currentStyle = args.rikishi.style;
  const bias = profile.styleBias;

  const mismatch =
    (bias === "oshi" && currentStyle === "yotsu") ||
    (bias === "yotsu" && currentStyle === "oshi");

  const mismatchStat = mismatch ? 0.90 : 1.00;
  const mismatchRisk = mismatch ? 1.06 : 1.00;

  const statGainMult = intensityStat * modeStat * facilityStat * phaseFx.statGainMult * mismatchStat;
  const injuryRiskMult = intensityRisk * recoveryRisk * modeRisk * facilityRisk * phaseFx.injuryRiskMult * mismatchRisk;
  const injuryRecoveryMult = recoveryHeal * phaseFx.injuryRecoveryMult;

  // Drift is slower than stat gain; adaptability accelerates it
  const adapt = clamp(args.rikishi.adaptability / 100, 0, 1);
  const styleDriftMult = (0.60 + 0.80 * adapt) * phaseFx.styleDriftMult * (mismatch ? 1.12 : 1.00);

  return { statGainMult, injuryRiskMult, injuryRecoveryMult, styleDriftMult };
}

/** Internal tendency state (not required in serialized types; stored as extra fields). */
interface StyleTendencyState {
  /** -1..+1 where -1 is yotsu tendency, +1 is oshi tendency */
  value: number;
  /** inertia counter to prevent flip-flopping */
  lockWeeks: number;
}

/** Ensure tendency fields exist. */
function getTendency(r: Rikishi): StyleTendencyState {
  const anyR = r as any;
  if (!anyR._styleTendency) {
    const init =
      r.style === "oshi" ? 0.55 :
      r.style === "yotsu" ? -0.55 :
      0.0;
    anyR._styleTendency = { value: init, lockWeeks: 0 } satisfies StyleTendencyState;
  }
  return anyR._styleTendency as StyleTendencyState;
}

function styleSupport(r: Rikishi, target: "oshi" | "yotsu"): number {
  // 0..1 support score
  if (target === "oshi") return clamp((r.power + r.aggression) / 200, 0, 1);
  return clamp((r.technique + r.balance) / 200, 0, 1);
}

function stepStat(r: Rikishi, focus: TrainingFocus, delta: number) {
  // Minimal stat progression; keep small to avoid destabilizing balance.
  // Canon: training is gradual.
  const d = Math.max(0, delta);
  switch (focus) {
    case "power": r.power = clamp(r.power + d, 0, 100); break;
    case "speed": r.speed = clamp(r.speed + d, 0, 100); break;
    case "technique": r.technique = clamp(r.technique + d, 0, 100); break;
    case "balance": r.balance = clamp(r.balance + d, 0, 100); break;
    default: {
      // neutral distributes lightly
      const q = d / 4;
      r.power = clamp(r.power + q, 0, 100);
      r.speed = clamp(r.speed + q, 0, 100);
      r.technique = clamp(r.technique + q, 0, 100);
      r.balance = clamp(r.balance + q, 0, 100);
    }
  }
}

/**
 * Apply weekly training to a single rikishi:
 * - small stat gains
 * - style tendency drift (no direct set)
 * - style changes only if tendency exceeds threshold AND stats support it AND lock allows it
 */
function applyWeeklyToRikishi(args: {
  world: WorldState;
  rikishi: Rikishi;
  heya?: Heya;
  profile: TrainingProfile;
  individualMode: "develop" | "push" | "protect" | "rebuild" | null;
}): EngineEvent[] {
  const { world, rikishi, profile } = args;
  const events: EngineEvent[] = [];

  const rng = makeRng(`${world.seed}::training::week${world.week}::${rikishi.id}`);

  const mults = computeTrainingMultipliers({
    rikishi,
    heya: args.heya,
    profile,
    individualMode: args.individualMode
  });

  // Stat gain baseline: ~0.2..0.6 per week depending on intensity/mode
  const baseGain = 0.22 + rng() * 0.12; // 0.22..0.34
  const gain = baseGain * mults.statGainMult;

  // Focused gains
  stepStat(rikishi, profile.focus, gain);

  // --- Style drift ---
  const tend = getTendency(rikishi);
  if (tend.lockWeeks > 0) tend.lockWeeks -= 1;

  // Drift target signal combines styleBias + training focus
  const biasSignal = styleSign(profile.styleBias); // -1..+1
  const focusSignal =
    profile.focus === "power" || profile.focus === "speed" ? 0.35 :
    profile.focus === "technique" || profile.focus === "balance" ? -0.35 :
    0.0;

  const signal = clamp(biasSignal + focusSignal, -1, 1);

  // Drift step: small, scaled by drift mult + randomness
  const noise = (rng() - 0.5) * 0.006; // -0.003..+0.003
  const step = (0.012 + rng() * 0.006) * mults.styleDriftMult; // ~0.012..0.018 scaled
  const next = clamp(tend.value + signal * step + noise, -1, 1);

  // Apply
  tend.value = next;

  // Gate style switch:
  // - must be over threshold
  // - must have enough support
  // - lockWeeks must be 0
  // - avoid switching if injured (canon: injury slows evolution)
  const threshold = 0.80; // high to avoid oscillation
  const canSwitch = tend.lockWeeks === 0 && !rikishi.injured;

  const current = rikishi.style;
  const wantOshi = tend.value >= threshold;
  const wantYotsu = tend.value <= -threshold;

  if (canSwitch && wantOshi && current !== "oshi") {
    const support = styleSupport(rikishi, "oshi");
    if (support >= 0.55) {
      const before = current;
      rikishi.style = "oshi";
      tend.lockWeeks = 10;     // inertia
      tend.value = 0.60;       // snap back into stable region

      const { event } = makeSimpleEvent({
        world,
        seed: `${world.seed}::training::styleShift`,
        phase: "weekly",
        category: "training",
        importance: "notable",
        scope: "rikishi",
        heyaId: rikishi.heyaId,
        rikishiId: rikishi.id,
        title: "A rikishi’s style begins to change",
        summary: `${rikishi.shikona} shows clear signs of shifting from ${before.toUpperCase()} toward OSHI-based sumo.`,
        truthLevel: "public",
        data: { rikishiId: rikishi.id, before, after: "oshi", tendency: tend.value },
        tags: ["style_drift"]
      });
      events.push(event);
    }
  } else if (canSwitch && wantYotsu && current !== "yotsu") {
    const support = styleSupport(rikishi, "yotsu");
    if (support >= 0.55) {
      const before = current;
      rikishi.style = "yotsu";
      tend.lockWeeks = 10;
      tend.value = -0.60;

      const { event } = makeSimpleEvent({
        world,
        seed: `${world.seed}::training::styleShift`,
        phase: "weekly",
        category: "training",
        importance: "notable",
        scope: "rikishi",
        heyaId: rikishi.heyaId,
        rikishiId: rikishi.id,
        title: "A rikishi’s style begins to change",
        summary: `${rikishi.shikona} shows clear signs of shifting from ${before.toUpperCase()} toward YOTSU-based sumo.`,
        truthLevel: "public",
        data: { rikishiId: rikishi.id, before, after: "yotsu", tendency: tend.value },
        tags: ["style_drift"]
      });
      events.push(event);
    }
  }

  // Hybrid settling: if tendency is near zero for long periods, set hybrid softly.
  // This is optional; keep conservative.
  if (canSwitch && Math.abs(tend.value) < 0.12 && current !== "hybrid" && rng() < 0.03) {
    // Only switch to hybrid if not strongly supported for single-style
    const oshiSup = styleSupport(rikishi, "oshi");
    const yotsuSup = styleSupport(rikishi, "yotsu");
    if (oshiSup < 0.65 && yotsuSup < 0.65) {
      const before = current;
      rikishi.style = "hybrid";
      tend.lockWeeks = 6;

      const { event } = makeSimpleEvent({
        world,
        seed: `${world.seed}::training::hybrid`,
        phase: "weekly",
        category: "training",
        importance: "minor",
        scope: "rikishi",
        heyaId: rikishi.heyaId,
        rikishiId: rikishi.id,
        title: "A rikishi rounds out their sumo",
        summary: `${rikishi.shikona} blends techniques, becoming more HYBRID in approach.`,
        truthLevel: "public",
        data: { rikishiId: rikishi.id, before, after: "hybrid" },
        tags: ["style_drift"]
      });
      events.push(event);
    }
  }

  return events;
}

/**
 * Weekly training tick:
 * - reads heya training profiles (defaults if missing)
 * - applies to all rikishi deterministically
 * - emits events into (world as any).eventsState
 */
export function tickWeek(world: WorldState): void {
  const emitted: EngineEvent[] = [];

  for (const r of world.rikishi.values()) {
    const heya = world.heyas.get(r.heyaId);
    const profile = heya?.trainingState?.profile ?? defaultProfile();

    // Individual mode: if heya has focus slots, use it for that rikishi
    const slots = heya?.trainingState?.focusSlots ?? [];
    const slot = slots.find(s => s.rikishiId === r.id);
    const individualMode = (slot?.mode ?? null) as any;

    emitted.push(...applyWeeklyToRikishi({
      world,
      rikishi: r,
      heya,
      profile,
      individualMode
    }));
  }

  const eventsState = ((world as any).eventsState) ?? createDefaultEventsState();
  (world as any).eventsState = appendEvents(eventsState, emitted, false);
}

// Re-export types for consumers that import from "./training"
export type { TrainingProfile, TrainingIntensity, TrainingFocus, StyleBias, RecoveryEmphasis };
