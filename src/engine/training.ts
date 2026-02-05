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