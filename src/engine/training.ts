// Training System - Beya-wide and individual training management
// Based on Training_System.md specification

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

export const INTENSITY_EFFECTS: Record<TrainingIntensity, {
  growthMult: number;
  fatigueGain: number;
  injuryRisk: number;
  description: string;
}> = {
  conservative: {
    growthMult: 0.85,
    fatigueGain: 0.75,
    injuryRisk: 0.80,
    description: "Safe, steady progress. Lower growth but preserves wrestlers."
  },
  balanced: {
    growthMult: 1.00,
    fatigueGain: 1.00,
    injuryRisk: 1.00,
    description: "Standard training regimen with balanced outcomes."
  },
  intensive: {
    growthMult: 1.20,
    fatigueGain: 1.25,
    injuryRisk: 1.15,
    description: "Pushing harder for faster gains. Increased wear."
  },
  punishing: {
    growthMult: 1.35,
    fatigueGain: 1.50,
    injuryRisk: 1.35,
    description: "Maximum intensity. High risk, high reward."
  }
};

// === RECOVERY EFFECTS ===

export const RECOVERY_EFFECTS: Record<RecoveryEmphasis, {
  fatigueDecay: number;
  injuryRecovery: number;
  description: string;
}> = {
  low: {
    fatigueDecay: 0.80,
    injuryRecovery: 0.85,
    description: "Minimal rest periods. Fatigue accumulates."
  },
  normal: {
    fatigueDecay: 1.00,
    injuryRecovery: 1.00,
    description: "Standard recovery protocols."
  },
  high: {
    fatigueDecay: 1.25,
    injuryRecovery: 1.20,
    description: "Emphasis on rest and rehabilitation."
  }
};

// === FOCUS BIAS EFFECTS ===

export const FOCUS_EFFECTS: Record<TrainingFocus, {
  power: number;
  speed: number;
  technique: number;
  balance: number;
  description: string;
}> = {
  power: {
    power: 1.30,
    speed: 0.85,
    technique: 0.95,
    balance: 0.95,
    description: "Heavy lifting and strength training."
  },
  speed: {
    power: 0.85,
    speed: 1.30,
    technique: 0.95,
    balance: 0.95,
    description: "Agility drills and footwork."
  },
  technique: {
    power: 0.90,
    speed: 0.90,
    technique: 1.35,
    balance: 1.10,
    description: "Form refinement and kimarite practice."
  },
  balance: {
    power: 0.90,
    speed: 0.95,
    technique: 1.10,
    balance: 1.35,
    description: "Stability exercises and defensive posture."
  },
  neutral: {
    power: 1.00,
    speed: 1.00,
    technique: 1.00,
    balance: 1.00,
    description: "Well-rounded approach to all attributes."
  }
};

// === INDIVIDUAL FOCUS MODES ===

export const FOCUS_MODE_EFFECTS: Record<FocusMode, {
  growthMod: number;
  fatigueMod: number;
  injuryRiskMod: number;
  description: string;
}> = {
  develop: {
    growthMod: 1.25,
    fatigueMod: 1.10,
    injuryRiskMod: 1.05,
    description: "Accelerated development program."
  },
  push: {
    growthMod: 1.35,
    fatigueMod: 1.20,
    injuryRiskMod: 1.20,
    description: "Win-now pressure, maximize short-term gains."
  },
  protect: {
    growthMod: 0.85,
    fatigueMod: 0.75,
    injuryRiskMod: 0.70,
    description: "Preservation mode for longevity."
  },
  rebuild: {
    growthMod: 1.10,
    fatigueMod: 0.90,
    injuryRiskMod: 0.85,
    description: "Post-injury rehabilitation focus."
  }
};

// === CAREER PHASE SENSITIVITY ===

export type CareerPhase = "youth" | "development" | "prime" | "veteran" | "late";

export const PHASE_EFFECTS: Record<CareerPhase, {
  growthMod: number;
  injurySensitivity: number;
  description: string;
}> = {
  youth: {
    growthMod: 1.30,
    injurySensitivity: 0.70,
    description: "Rapid growth, resilient body."
  },
  development: {
    growthMod: 1.20,
    injurySensitivity: 0.85,
    description: "Still growing, building foundation."
  },
  prime: {
    growthMod: 1.00,
    injurySensitivity: 1.00,
    description: "Peak performance years."
  },
  veteran: {
    growthMod: 0.70,
    injurySensitivity: 1.30,
    description: "Experience compensates, body slowing."
  },
  late: {
    growthMod: 0.40,
    injurySensitivity: 1.60,
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

// === TRAINING DESCRIPTIONS ===

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
