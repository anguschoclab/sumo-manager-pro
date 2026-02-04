// training.ts
// Training System - Canon-aligned, Deterministic
// Implements the "Evolution Loop" where Rikishi attributes grow/decay based on profile, age, and facilities.

import type {
  TrainingIntensity,
  TrainingFocus,
  StyleBias,
  RecoveryEmphasis,
  FocusMode,
  TrainingProfile,
  BeyaTrainingState,
  IndividualFocus,
  TrainingMultipliers,
  WorldState,
  Rikishi,
  Heya,
  Id
} from "./types";

// === CONSTANTS & EFFECTS ===

export const INTENSITY_EFFECTS: Record<TrainingIntensity, { growthMult: number; fatigueGain: number; injuryRisk: number }> = {
  conservative: { growthMult: 0.8, fatigueGain: 5, injuryRisk: 0.5 },
  balanced: { growthMult: 1.0, fatigueGain: 10, injuryRisk: 1.0 },
  intensive: { growthMult: 1.3, fatigueGain: 18, injuryRisk: 1.5 },
  punishing: { growthMult: 1.6, fatigueGain: 28, injuryRisk: 2.5 }
};

export const RECOVERY_EFFECTS: Record<RecoveryEmphasis, { fatigueReduction: number; growthPenalty: number }> = {
  low: { fatigueReduction: 5, growthPenalty: 0 },
  normal: { fatigueReduction: 15, growthPenalty: 0.1 },
  high: { fatigueReduction: 30, growthPenalty: 0.3 }
};

export const FOCUS_EFFECTS: Record<TrainingFocus, Record<"power" | "speed" | "technique" | "balance", number>> = {
  power: { power: 1.5, speed: 0.8, technique: 0.9, balance: 0.8 },
  speed: { power: 0.8, speed: 1.5, technique: 0.9, balance: 0.8 },
  technique: { power: 0.8, speed: 0.9, technique: 1.5, balance: 0.8 },
  balance: { power: 0.8, speed: 0.8, technique: 0.9, balance: 1.5 },
  neutral: { power: 1.0, speed: 1.0, technique: 1.0, balance: 1.0 }
};

export const FOCUS_MODE_EFFECTS: Record<FocusMode, { growthBonus: number; fatigueMod: number }> = {
  develop: { growthBonus: 0.3, fatigueMod: 1.1 },
  push: { growthBonus: 0.6, fatigueMod: 1.4 },
  protect: { growthBonus: -0.5, fatigueMod: 0.5 },
  rebuild: { growthBonus: 0.1, fatigueMod: 0.8 }
};

export type CareerPhase = "youth" | "development" | "prime" | "veteran" | "late";

export const PHASE_EFFECTS: Record<CareerPhase, { growthRate: number; injurySensitivity: number }> = {
  youth: { growthRate: 1.5, injurySensitivity: 0.5 }, // Age 15-19
  development: { growthRate: 1.2, injurySensitivity: 0.8 }, // Age 20-23
  prime: { growthRate: 1.0, injurySensitivity: 1.0 }, // Age 24-29
  veteran: { growthRate: 0.5, injurySensitivity: 1.5 }, // Age 30-33
  late: { growthRate: 0.2, injurySensitivity: 2.5 } // Age 34+
};

// === CORE LOGIC ===

export function getCareerPhase(age: number): CareerPhase {
  if (age < 20) return "youth";
  if (age < 24) return "development";
  if (age < 30) return "prime";
  if (age < 34) return "veteran";
  return "late";
}

/**
 * Calculates net multipliers for a specific Rikishi based on Beya profile + Individual slot
 */
export function computeTrainingMultipliers(
  rikishiId: string,
  state: BeyaTrainingState
): TrainingMultipliers {
  const { profile, focusSlots } = state;
  const individual = focusSlots.find((f) => f.rikishiId === rikishiId);

  const baseEffects = INTENSITY_EFFECTS[profile.intensity];
  const recoveryEffects = RECOVERY_EFFECTS[profile.recovery];
  const focusMultipliers = FOCUS_EFFECTS[profile.focus];

  let growthScalar = baseEffects.growthMult * (1 - recoveryEffects.growthPenalty);
  let fatigueScalar = baseEffects.fatigueGain;

  // Apply individual override
  if (individual) {
    const mode = FOCUS_MODE_EFFECTS[individual.mode];
    growthScalar *= 1 + mode.growthBonus;
    fatigueScalar *= mode.fatigueMod;
  }

  // Ensure reasonable bounds
  return {
    growthScalar: Math.max(0.1, growthScalar),
    fatigueDelta: Math.max(0, fatigueScalar - recoveryEffects.fatigueReduction),
    statMultipliers: focusMultipliers,
    styleBias: profile.styleBias
  };
}

// === ENGINE: TICK WEEK ===

/**
 * Processes one week of training for the entire world.
 * - Updates Rikishi attributes (Power, Speed, etc.)
 * - Updates Fatigue
 * - Handles simple age-based progression/regression
 */
export function tickWeek(world: WorldState): void {
  const currentYear = world.year;

  // Iterate over all Heyas
  for (const heya of world.heyas.values()) {
    // Ensure heya has training state
    if (!heya.trainingState) {
      heya.trainingState = createDefaultTrainingState();
    }

    // Process each Rikishi in the Heya
    for (const rikishiId of heya.rikishiIds) {
      const rikishi = world.rikishi.get(rikishiId);
      if (!rikishi) continue;

      applyRikishiWeeklyTraining(rikishi, heya, currentYear);
    }
  }
}

/**
 * Applies a single week of training results to a Rikishi.
 * Mutates the rikishi object directly.
 */
function applyRikishiWeeklyTraining(rikishi: Rikishi, heya: Heya, currentYear: number): void {
  // 1. Determine Context
  const age = currentYear - (rikishi.birthYear || currentYear - 20); // Fallback if birthYear missing
  const phase = getCareerPhase(age);
  const phaseStats = PHASE_EFFECTS[phase];

  // 2. Get Multipliers
  const multipliers = computeTrainingMultipliers(rikishi.id, heya.trainingState!);

  // 3. Calculate Fatigue
  const fatigueChange = multipliers.fatigueDelta * phaseStats.injurySensitivity;
  // Apply fatigue (0-100 clamp)
  rikishi.fatigue = Math.max(0, Math.min(100, (rikishi.fatigue || 0) + fatigueChange));

  // If injured, training is halted or severely reduced (simple check)
  if (rikishi.injured) {
    // Recovery week instead of training
    rikishi.fatigue = Math.max(0, rikishi.fatigue - 5);
    return;
  }

  // 4. Calculate Stat Gains
  // Base gain per week is small (e.g. 0.05 to 0.2 points), scaled by multipliers
  const BASE_GAIN = 0.1;

  // Diminishing returns for high stats (soft cap around 80-100)
  const diminishingReturn = (currentVal: number) => Math.max(0.1, 1 - currentVal / 120);

  const applyStatChange = (stat: "power" | "speed" | "technique" | "balance") => {
    const current = rikishi[stat];
    const focusMult = multipliers.statMultipliers[stat];
    
    // Growth formula: Base * Intensity * Focus * Phase * DiminishingReturn
    const delta = BASE_GAIN 
                  * multipliers.growthScalar 
                  * focusMult 
                  * phaseStats.growthRate 
                  * diminishingReturn(current);

    // Apply change
    rikishi[stat] = Math.min(100, current + delta);
  };

  applyStatChange("power");
  applyStatChange("speed");
  applyStatChange("technique");
  applyStatChange("balance");

  // 5. Experience Trickle
  // Experience grows purely by time + bouts. Small weekly trickle.
  rikishi.experience = Math.min(100, rikishi.experience + 0.05);

  // 6. Style Bias (Slow drift)
  // TODO: Implement style drift based on multipliers.styleBias
  // For now, we leave style static to avoid rapid oscillation.
}

// === UTILITIES ===

export function createDefaultTrainingProfile(): TrainingProfile {
  return {
    intensity: "balanced",
    focus: "neutral",
    styleBias: "neutral",
    recovery: "normal"
  };
}

export function createDefaultTrainingState(): BeyaTrainingState {
  return {
    profile: createDefaultTrainingProfile(),
    focusSlots: [],
    maxFocusSlots: 3 // Default capacity
  };
}

export function getMaxFocusSlots(_heya: Heya): number {
  return 3; // Placeholder for facility-based logic
}

export function sanitizeFocusSlots(state: BeyaTrainingState): void {
  if (state.focusSlots.length > state.maxFocusSlots) {
    state.focusSlots = state.focusSlots.slice(0, state.maxFocusSlots);
  }
}

export function setFocusSlot(state: BeyaTrainingState, rikishiId: string, mode: FocusMode): void {
  const existing = state.focusSlots.find((f) => f.rikishiId === rikishiId);
  if (existing) {
    existing.mode = mode;
  } else if (state.focusSlots.length < state.maxFocusSlots) {
    state.focusSlots.push({ rikishiId, mode });
  }
}

export function clearFocusSlot(state: BeyaTrainingState, rikishiId: string): void {
  state.focusSlots = state.focusSlots.filter((f) => f.rikishiId !== rikishiId);
}

export function getIndividualFocusMode(state: BeyaTrainingState, rikishiId: string): FocusMode | undefined {
  return state.focusSlots.find((f) => f.rikishiId === rikishiId)?.mode;
}

// === LABELS ===

export function getIntensityLabel(i: TrainingIntensity): string {
  const map: Record<TrainingIntensity, string> = {
    conservative: "Conservative",
    balanced: "Balanced",
    intensive: "Intensive",
    punishing: "Punishing"
  };
  return map[i];
}

export function getFocusLabel(f: TrainingFocus): string {
  if (f === "neutral") return "Balanced Development";
  return f.charAt(0).toUpperCase() + f.slice(1);
}

export function getStyleBiasLabel(s: StyleBias): string {
  if (s === "neutral") return "No Bias";
  return s === "oshi" ? "Pushing (Oshi)" : "Grappling (Yotsu)";
}

export function getRecoveryLabel(r: RecoveryEmphasis): string {
  const map: Record<RecoveryEmphasis, string> = {
    low: "Minimal Rest",
    normal: "Standard Rotation",
    high: "Priority Recovery"
  };
  return map[r];
}

export function getFocusModeLabel(m: FocusMode): string {
  const map: Record<FocusMode, string> = {
    develop: "Develop Core",
    push: "Push Limits",
    protect: "Protect Health",
    rebuild: "Rehabilitate"
  };
  return map[m];
}
