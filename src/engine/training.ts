<<<<<<< HEAD
// training.ts
// =======================================================
// Training System v1.0 — deterministic weekly training + multipliers
//
// Canon goals:
// - Between basho: weekly progression affects stats, fatigue, morale, and long-term style drift.
// - Deterministic: all randomness derived from world.seed (no Math.random, no seedrandom).
// - Exposes computeTrainingMultipliers for injuries/recovery math.
// =======================================================

import type { WorldState, Rikishi, Heya, TacticalArchetype } from "./types";
import { rngForWorld } from "./rng";

export type TrainingFocus = "balanced" | "oshi" | "yotsu" | "strength" | "technique" | "speed" | "mental";
export type TrainingIntensity = "light" | "normal" | "hard";

export interface TrainingProfile {
  focus: TrainingFocus;
  intensity: TrainingIntensity;
}

export type CareerPhase = "prospect" | "prime" | "late";

export function getCareerPhase(rikishi: Pick<Rikishi, "age">): CareerPhase {
  if (rikishi.age <= 22) return "prospect";
  if (rikishi.age <= 30) return "prime";
  return "late";
}

export const PHASE_EFFECTS: Record<CareerPhase, { gainMult: number; riskMult: number; recoveryMult: number }> = {
  prospect: { gainMult: 1.10, riskMult: 0.90, recoveryMult: 1.05 },
  prime: { gainMult: 1.00, riskMult: 1.00, recoveryMult: 1.00 },
  late: { gainMult: 0.85, riskMult: 1.15, recoveryMult: 0.90 },
};

export interface TrainingMultipliers {
  statGainMult: number;
  injuryRiskMult: number;
  injuryRecoveryMult: number;
  styleDriftChance: number;
  fatigueGainMult: number;
}

/**
 * Canon multipliers used by multiple subsystems.
 * Keep property names stable: injuryRiskMult / injuryRecoveryMult are consumed by injuries.ts.
 */
export function computeTrainingMultipliers(args: {
  rikishi: Pick<Rikishi, "age">;
  heya: Pick<Heya, "facilitiesBand" | "prestigeBand" | "statureBand">;
  profile: TrainingProfile;
  individualMode: null | "focus_push";
}): TrainingMultipliers {
  const phase = getCareerPhase({ age: args.rikishi.age });
  const phaseFx = PHASE_EFFECTS[phase];

  const intensity = args.profile.intensity;
  const intensityFx =
    intensity === "light" ? { gain: 0.75, risk: 0.80, recovery: 1.10, fatigue: 0.80, drift: 0.02 } :
    intensity === "hard"  ? { gain: 1.25, risk: 1.25, recovery: 0.90, fatigue: 1.20, drift: 0.06 } :
                            { gain: 1.00, risk: 1.00, recovery: 1.00, fatigue: 1.00, drift: 0.04 };

  // Facilities help training quality and recovery; prestige helps recruitment/koenkai more than training,
  // but we give a small multiplier so top stables feel different.
  const facilitiesFx =
    args.heya.facilitiesBand === "elite" ? { gain: 1.10, recovery: 1.10 } :
    args.heya.facilitiesBand === "good" ? { gain: 1.05, recovery: 1.05 } :
    args.heya.facilitiesBand === "average" ? { gain: 1.00, recovery: 1.00 } :
    { gain: 0.95, recovery: 0.95 };

  const prestigeFx =
    args.heya.prestigeBand === "top" ? 1.03 :
    args.heya.prestigeBand === "high" ? 1.01 :
    1.00;

  const modeFx = args.individualMode === "focus_push"
    ? { gain: 1.08, risk: 1.06, drift: 0.02 }
    : { gain: 1.00, risk: 1.00, drift: 0.00 };

  return {
    statGainMult: phaseFx.gainMult * intensityFx.gain * facilitiesFx.gain * prestigeFx * modeFx.gain,
    injuryRiskMult: phaseFx.riskMult * intensityFx.risk * modeFx.risk,
    injuryRecoveryMult: phaseFx.recoveryMult * intensityFx.recovery * facilitiesFx.recovery,
    styleDriftChance: Math.min(0.15, intensityFx.drift + modeFx.drift),
    fatigueGainMult: intensityFx.fatigue,
  };
}

function applyStatGains(r: Rikishi, gain: number, focus: TrainingFocus) {
  // Minimal, non-lossy: only touch stats if present
  if (!r.stats) return;

  const bump = (key: keyof typeof r.stats, amt: number) => {
    // @ts-expect-error stats is a structured object; clamp to [0,100] when numeric
    const v = r.stats[key];
    if (typeof v === "number") {
      // @ts-expect-error
      r.stats[key] = Math.max(0, Math.min(100, v + amt));
    }
  };

  switch (focus) {
    case "strength": bump("strength", gain); break;
    case "technique": bump("technique", gain); break;
    case "speed": bump("speed", gain); break;
    case "mental": bump("mental", gain); break;
    case "oshi":
      bump("strength", gain * 0.6);
      bump("speed", gain * 0.4);
      break;
    case "yotsu":
      bump("strength", gain * 0.5);
      bump("technique", gain * 0.5);
      break;
    default:
      bump("strength", gain * 0.34);
      bump("technique", gain * 0.33);
      bump("speed", gain * 0.33);
      break;
  }
}

/**
 * Canon weekly training tick (Between Basho).
 * - deterministic per week + rikishi
 * - stat gains + (optional) style drift
 */
export function tickWeek(world: WorldState): void {
  const weekIndex = world.week ?? 0;

  // Iterate Maps safely
  const rikishiList = Array.from(world.rikishi.values());
  for (const r of rikishiList) {
    const heya = world.heyas.get(r.heyaId);
    if (!heya) continue;

    const profile: TrainingProfile = {
      focus: (r.trainingFocus as TrainingFocus) ?? "balanced",
      intensity: (r.trainingIntensity as TrainingIntensity) ?? "normal",
    };

    const mults = computeTrainingMultipliers({
      rikishi: { age: r.age ?? 25 },
      heya: {
        facilitiesBand: heya.facilitiesBand,
        prestigeBand: heya.prestigeBand,
        statureBand: heya.statureBand,
      },
      profile,
      individualMode: null,
    });

    const rng = rngForWorld(world, "training", `week${weekIndex}::${r.id}`);

    // Stat gains (small weekly delta)
    const baseGain = 0.6; // tuned later
    const gain = baseGain * mults.statGainMult * (0.8 + rng.next() * 0.4);
    applyStatGains(r, gain, profile.focus);

    // Style drift: rare, deterministic
    if (profile.focus === "oshi" || profile.focus === "yotsu") {
      if ((r.style as any) !== profile.focus && rng.next() < mults.styleDriftChance) {
        r.style = profile.focus as any;
      }
    }

    // Fatigue: if modeled, add weekly fatigue
    if (typeof (r as any).fatigue === "number") {
      (r as any).fatigue = Math.max(0, Math.min(100, (r as any).fatigue + 4 * mults.fatigueGainMult));
    }
  }
}
=======
 import { rngForWorld } from "./rng";
 import type { WorldState, Rikishi } from "./types";
 import type { TrainingProfile } from "./types";
 
 // Re-export TrainingProfile for injuries.ts compatibility
 export type { TrainingProfile } from "./types";
 
 // === CAREER PHASE ===
 
 export type CareerPhase = "rising" | "peak" | "veteran" | "declining";
 
 export const PHASE_EFFECTS: Record<CareerPhase, { injuryRisk: number; recoveryBonus: number; statGrowth: number }> = {
   rising: { injuryRisk: 0.8, recoveryBonus: 1.2, statGrowth: 1.3 },
   peak: { injuryRisk: 1.0, recoveryBonus: 1.0, statGrowth: 1.0 },
   veteran: { injuryRisk: 1.2, recoveryBonus: 0.9, statGrowth: 0.7 },
   declining: { injuryRisk: 1.5, recoveryBonus: 0.7, statGrowth: 0.4 },
 };
 
 export function getCareerPhase(rikishi: Rikishi, currentYear: number): CareerPhase {
   const age = currentYear - rikishi.birthYear;
   const exp = rikishi.experience || 0;
   
   if (age < 22 || exp < 20) return "rising";
   if (age < 30 && exp < 70) return "peak";
   if (age < 35) return "veteran";
   return "declining";
 }
 
 export interface TrainingMultipliers {
   injuryRisk: number;
   recoverySpeed: number;
   statGrowth: number;
 }
 
 export function computeTrainingMultipliers(profile: TrainingProfile, rikishi: Rikishi, currentYear: number): TrainingMultipliers {
   const phase = getCareerPhase(rikishi, currentYear);
   const phaseEffects = PHASE_EFFECTS[phase];
   
   let injuryRisk = phaseEffects.injuryRisk;
   let recoverySpeed = phaseEffects.recoveryBonus;
   let statGrowth = phaseEffects.statGrowth;
   
   // Intensity modifiers
   switch (profile.intensity) {
     case "punishing":
       injuryRisk *= 1.5;
       statGrowth *= 1.2;
       break;
     case "intensive":
       injuryRisk *= 1.2;
       statGrowth *= 1.1;
       break;
     case "conservative":
       injuryRisk *= 0.7;
       statGrowth *= 0.8;
       break;
   }
   
   // Recovery modifiers
   switch (profile.recovery) {
     case "high":
       recoverySpeed *= 1.3;
       injuryRisk *= 0.9;
       break;
     case "low":
       recoverySpeed *= 0.8;
       break;
   }
   
   return { injuryRisk, recoverySpeed, statGrowth };
 }
 
 /**
  * Apply weekly training effects to all rikishi.
  * Called during interim phase tick pipeline.
  */
 export function applyWeeklyTraining(world: WorldState, weekIndex: number): void {
   const rng = rngForWorld(world, "training", `week${weekIndex}`);
 
   for (const [_id, r] of world.rikishi) {
     if (!r) continue;
 
     // Style evolution based on training focus
     if (r.trainingFocus === "oshi" && r.style !== "oshi" && rng.next() < 0.05) {
       (r as Rikishi).style = "oshi";
     }
     if (r.trainingFocus === "yotsu" && r.style !== "yotsu" && rng.next() < 0.05) {
       (r as Rikishi).style = "yotsu";
     }
   }
 }
 
 /**
  * Tick function called by interim pipeline.
  */
 export function tickWeek(world: WorldState, weekIndex: number): void {
   applyWeeklyTraining(world, weekIndex);
 }
>>>>>>> 5d0ed87c25a38491e219371f91ad67dcb9bdb4ed
