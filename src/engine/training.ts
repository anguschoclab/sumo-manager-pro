// training.ts
// Training System - Beya-wide and individual training management
// Based on Training_System.md specification
//
// DROP-IN (canon + engine integration):
// - Deterministic rules + helpers only (NO RNG, NO WorldState mutation).
// - Single source of truth: computeTrainingMultipliers() for timeBoundary.
// - Supports heya-wide profile + per-rikishi focus slots (FocusMode).
// - Includes styleBias nudges (gentle, future-proof).
// - Includes recovery multipliers for both fatigue and injury recovery speed.
// - Validation/sanitization helpers for focus slots (no dupes, max slots).
//
// NOTE ON TYPES / CIRCULAR DEPS:
// This file only imports Rikishi/Heya types. If you later choose to store
// `trainingState` on Heya in types.ts, do it as a "lite" shape there to
// avoid circular imports (recommended).

import type { Rikishi, Heya } from "./types";

// === TRAINING PROFILE TYPES ===

export type TrainingIntensity = "conservative" | "balanced" | "intensive" | "punishing";
export type TrainingFocus = "power" | "speed" | "technique" | "balance" | "neutral";
export type StyleBias = "oshi" | "yotsu" | "neutral";
export type RecoveryEmphasis = "low" | "normal" | "high";

export interface TrainingProfile {
  intensity: TrainingIntensity;
  focus: TrainingFocus;
  styleBias: StyleBias;
  recovery: RecoveryEmphasis;
}

export type FocusMode = "develop" | "push" | "protect" | "rebuild";

export interface IndividualFocus {
  rikishiId: string;
  mode: FocusMode;
}

export interface BeyaTrainingState {
  profile: TrainingProfile;
  focusSlots: IndividualFocus[];
  maxFocusSlots: number;
}

// === INTENSITY EFFECTS ===

export const INTENSITY_EFFECTS: Record<
  TrainingIntensity,
  { growthMult: number; fatigueGain: number; injuryRisk: number; description: string }
> = {
  conservative: {
    growthMult: 0.85,
    fatigueGain: 0.75,
    injuryRisk: 0.8,
    description: "Safe, steady progress. Lower growth but preserves wrestlers."
  },
  balanced: {
    growthMult: 1.0,
    fatigueGain: 1.0,
    injuryRisk: 1.0,
    description: "Standard training regimen with balanced outcomes."
  },
  intensive: {
    growthMult: 1.2,
    fatigueGain: 1.25,
    injuryRisk: 1.15,
    description: "Pushing harder for faster gains. Increased wear."
  },
  punishing: {
    growthMult: 1.35,
    fatigueGain: 1.5,
    injuryRisk: 1.35,
    description: "Maximum intensity. High risk, high reward."
  }
};

// === RECOVERY EFFECTS ===

export const RECOVERY_EFFECTS: Record<
  RecoveryEmphasis,
  { fatigueDecay: number; injuryRecovery: number; description: string }
> = {
  low: {
    fatigueDecay: 0.8,
    injuryRecovery: 0.85,
    description: "Minimal rest periods. Fatigue accumulates."
  },
  normal: {
    fatigueDecay: 1.0,
    injuryRecovery: 1.0,
    description: "Standard recovery protocols."
  },
  high: {
    fatigueDecay: 1.25,
    injuryRecovery: 1.2,
    description: "Emphasis on rest and rehabilitation."
  }
};

// === FOCUS BIAS EFFECTS ===

export const FOCUS_EFFECTS: Record<
  TrainingFocus,
  { power: number; speed: number; technique: number; balance: number; description: string }
> = {
  power: {
    power: 1.3,
    speed: 0.85,
    technique: 0.95,
    balance: 0.95,
    description: "Heavy lifting and strength training."
  },
  speed: {
    power: 0.85,
    speed: 1.3,
    technique: 0.95,
    balance: 0.95,
    description: "Agility drills and footwork."
  },
  technique: {
    power: 0.9,
    speed: 0.9,
    technique: 1.35,
    balance: 1.1,
    description: "Form refinement and kimarite practice."
  },
  balance: {
    power: 0.9,
    speed: 0.95,
    technique: 1.1,
    balance: 1.35,
    description: "Stability exercises and defensive posture."
  },
  neutral: {
    power: 1.0,
    speed: 1.0,
    technique: 1.0,
    balance: 1.0,
    description: "Well-rounded approach to all attributes."
  }
};

// === INDIVIDUAL FOCUS MODES ===

export const FOCUS_MODE_EFFECTS: Record<
  FocusMode,
  { growthMod: number; fatigueMod: number; injuryRiskMod: number; description: string }
> = {
  develop: {
    growthMod: 1.25,
    fatigueMod: 1.1,
    injuryRiskMod: 1.05,
    description: "Accelerated development program."
  },
  push: {
    growthMod: 1.35,
    fatigueMod: 1.2,
    injuryRiskMod: 1.2,
    description: "Win-now pressure, maximize short-term gains."
  },
  protect: {
    growthMod: 0.85,
    fatigueMod: 0.75,
    injuryRiskMod: 0.7,
    description: "Preservation mode for longevity."
  },
  rebuild: {
    growthMod: 1.1,
    fatigueMod: 0.9,
    injuryRiskMod: 0.85,
    description: "Post-injury rehabilitation focus."
  }
};

// === CAREER PHASE SENSITIVITY ===

export type CareerPhase = "youth" | "development" | "prime" | "veteran" | "late";

export const PHASE_EFFECTS: Record<
  CareerPhase,
  { growthMod: number; injurySensitivity: number; description: string }
> = {
  youth: {
    growthMod: 1.3,
    injurySensitivity: 0.7,
    description: "Rapid growth, resilient body."
  },
  development: {
    growthMod: 1.2,
    injurySensitivity: 0.85,
    description: "Still growing, building foundation."
  },
  prime: {
    growthMod: 1.0,
    injurySensitivity: 1.0,
    description: "Peak performance years."
  },
  veteran: {
    growthMod: 0.7,
    injurySensitivity: 1.3,
    description: "Experience compensates, body slowing."
  },
  late: {
    growthMod: 0.4,
    injurySensitivity: 1.6,
    description: "Fighting time, high injury risk."
  }
};

// === HELPER FUNCTIONS ===

export function getCareerPhase(experience: number): CareerPhase {
  if (experience < 20) return "youth";
  if (experience < 40) return "development";
  if (experience < 70) return "prime";
  if (experience < 85) return "veteran";
  return "late";
}

/**
 * Note: prestigeTier is a numeric proxy you can derive from PrestigeBand
 * if you want (elite=4, respected=3, modest=2, struggling=1, unknown=0).
 */
export function getMaxFocusSlots(prestigeTier: number): number {
  let slots = 3;
  if (prestigeTier >= 2) slots++;
  if (prestigeTier >= 4) slots++;
  return Math.min(slots, 5);
}

export function createDefaultTrainingProfile(): TrainingProfile {
  return {
    intensity: "balanced",
    focus: "neutral",
    styleBias: "neutral",
    recovery: "normal"
  };
}

export function createDefaultTrainingState(maxSlots: number = 3): BeyaTrainingState {
  return {
    profile: createDefaultTrainingProfile(),
    focusSlots: [],
    maxFocusSlots: maxSlots
  };
}

/**
 * Normalize/validate focusSlots:
 * - removes duplicates (keeps first)
 * - clamps to maxFocusSlots
 * - optional: removes rikishiIds not in roster
 */
export function sanitizeFocusSlots(
  focusSlots: IndividualFocus[],
  maxFocusSlots: number,
  rosterIds?: readonly string[]
): IndividualFocus[] {
  const seen = new Set<string>();
  const roster = rosterIds ? new Set(rosterIds) : null;

  const out: IndividualFocus[] = [];
  for (const slot of focusSlots) {
    if (!slot || !slot.rikishiId) continue;
    if (seen.has(slot.rikishiId)) continue;
    if (roster && !roster.has(slot.rikishiId)) continue;

    seen.add(slot.rikishiId);
    out.push({ rikishiId: slot.rikishiId, mode: slot.mode });
    if (out.length >= maxFocusSlots) break;
  }
  return out;
}

export function setFocusSlot(
  state: BeyaTrainingState,
  rikishiId: string,
  mode: FocusMode,
  rosterIds?: readonly string[]
): BeyaTrainingState {
  const next: BeyaTrainingState = { ...state, focusSlots: [...state.focusSlots] };

  const idx = next.focusSlots.findIndex(s => s.rikishiId === rikishiId);
  if (idx >= 0) next.focusSlots[idx] = { rikishiId, mode };
  else next.focusSlots.push({ rikishiId, mode });

  next.focusSlots = sanitizeFocusSlots(next.focusSlots, next.maxFocusSlots, rosterIds);
  return next;
}

export function clearFocusSlot(state: BeyaTrainingState, rikishiId: string): BeyaTrainingState {
  return {
    ...state,
    focusSlots: state.focusSlots.filter(s => s.rikishiId !== rikishiId)
  };
}

export function getIndividualFocusMode(
  state: BeyaTrainingState | undefined,
  rikishiId: string
): FocusMode | null {
  if (!state) return null;
  const found = state.focusSlots.find(s => s.rikishiId === rikishiId);
  return found ? found.mode : null;
}

// === TRAINING MULTIPLIERS (used by time boundary) ===

export interface TrainingMultipliers {
  growthMult: number; // multiplies chance/gains
  fatigueMult: number; // multiplies fatigue added
  injuryRiskMult: number; // multiplies injury chance

  // Per-attribute multipliers after focus + style bias
  attr: { power: number; speed: number; technique: number; balance: number };

  // Recovery multipliers used by time boundary
  fatigueRecoveryMult: number;
  injuryRecoveryMult: number;
}

/**
 * Compute the combined multipliers for one rikishi for one weekly tick.
 * Canonical single source of truth so other modules don’t reimplement it differently.
 */
export function computeTrainingMultipliers(args: {
  rikishi: Rikishi;
  heya?: Heya;
  profile: TrainingProfile;
  individualMode?: FocusMode | null;
}): TrainingMultipliers {
  const { rikishi, profile } = args;
  const individualMode = args.individualMode ?? null;

  const intensity = INTENSITY_EFFECTS[profile.intensity];
  const recovery = RECOVERY_EFFECTS[profile.recovery];
  const focus = FOCUS_EFFECTS[profile.focus];

  const phase = getCareerPhase(rikishi.experience);
  const phaseFx = PHASE_EFFECTS[phase];

  const modeFx = individualMode ? FOCUS_MODE_EFFECTS[individualMode] : null;

  // Style bias: gentle nudges (kept small; bout engine dominates identity)
  const styleBias = profile.styleBias;
  const styleTech = styleBias === "yotsu" ? 1.06 : styleBias === "oshi" ? 0.97 : 1.0;
  const stylePower = styleBias === "oshi" ? 1.05 : 1.0;
  const styleSpeed = styleBias === "oshi" ? 1.02 : 1.0;
  const styleBalance = styleBias === "yotsu" ? 1.03 : 1.0;

  const baseGrowth = intensity.growthMult * phaseFx.growthMod;
  const growthMult = baseGrowth * (modeFx ? modeFx.growthMod : 1.0);

  const fatigueMult = intensity.fatigueGain * (modeFx ? modeFx.fatigueMod : 1.0);

  const injuryRiskMult =
    intensity.injuryRisk * phaseFx.injurySensitivity * (modeFx ? modeFx.injuryRiskMod : 1.0);

  const attr = {
    power: focus.power * stylePower,
    speed: focus.speed * styleSpeed,
    technique: focus.technique * styleTech,
    balance: focus.balance * styleBalance
  };

  return {
    growthMult,
    fatigueMult,
    injuryRiskMult,
    attr,
    fatigueRecoveryMult: recovery.fatigueDecay,
    injuryRecoveryMult: recovery.injuryRecovery
  };
}

// === TRAINING DESCRIPTIONS (labels only) ===

export function getIntensityLabel(intensity: TrainingIntensity): { ja: string; en: string } {
  const labels: Record<TrainingIntensity, { ja: string; en: string }> = {
    conservative: { ja: "穏健", en: "Conservative" },
    balanced: { ja: "均衡", en: "Balanced" },
    intensive: { ja: "激烈", en: "Intensive" },
    punishing: { ja: "過酷", en: "Punishing" }
  };
  return labels[intensity];
}

export function getFocusLabel(focus: TrainingFocus): { ja: string; en: string } {
  const labels: Record<TrainingFocus, { ja: string; en: string }> = {
    power: { ja: "力", en: "Power" },
    speed: { ja: "速", en: "Speed" },
    technique: { ja: "技", en: "Technique" },
    balance: { ja: "均", en: "Balance" },
    neutral: { ja: "中立", en: "Neutral" }
  };
  return labels[focus];
}

export function getStyleBiasLabel(bias: StyleBias): { ja: string; en: string } {
  const labels: Record<StyleBias, { ja: string; en: string }> = {
    oshi: { ja: "押し", en: "Pushing" },
    yotsu: { ja: "四つ", en: "Belt" },
    neutral: { ja: "中立", en: "Neutral" }
  };
  return labels[bias];
}

export function getRecoveryLabel(recovery: RecoveryEmphasis): { ja: string; en: string } {
  const labels: Record<RecoveryEmphasis, { ja: string; en: string }> = {
    low: { ja: "低", en: "Low" },
    normal: { ja: "普通", en: "Normal" },
    high: { ja: "高", en: "High" }
  };
  return labels[recovery];
}

export function getFocusModeLabel(mode: FocusMode): { ja: string; en: string } {
  const labels: Record<FocusMode, { ja: string; en: string }> = {
    develop: { ja: "育成", en: "Develop" },
    push: { ja: "強化", en: "Push" },
    protect: { ja: "保護", en: "Protect" },
    rebuild: { ja: "再建", en: "Rebuild" }
  };
  return labels[mode];
}
