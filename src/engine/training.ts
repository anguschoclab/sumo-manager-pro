/**
 * File Name: src/engine/training.ts
 * Status: CANONICAL / IMPLEMENTATION-GRADE
 * * Implements System B (Rikishi Development) from the Basho Constitution.
 * * Key Features:
 * - Deterministic Weekly Tick (10-step algorithm)
 * - Beya-Wide Training Profiles (Intensity, Focus, Style, Recovery)
 * - Individual Focus Slots (Develop, Push, Protect, Rebuild)
 * - Fatigue Accumulation & Injury Risk
 * - Attribute Evolution (Buffered -> Consolidated)
 */

import { 
  Rikishi, 
  WorldState, 
  Id, 
  TrainingProfile, 
  BeyaTrainingState, 
  IndividualFocus, 
  TrainingIntensity, 
  TrainingFocus, 
  RecoveryEmphasis,
  IndividualFocusType,
  RikishiStats
} from './types';
import { SeededRNG } from './utils/SeededRNG';

// ============================================================================
// CONSTANTS (From Canon v1.3 - Rikishi Development)
// ============================================================================

// 1. INTENSITY EFFECTS
const INTENSITY_MULTIPLIERS: Record<TrainingIntensity, { growth: number; fatigue: number; injuryRisk: number }> = {
  conservative: { growth: 0.85, fatigue: 0.75, injuryRisk: 0.80 },
  balanced:     { growth: 1.00, fatigue: 1.00, injuryRisk: 1.00 },
  intensive:    { growth: 1.20, fatigue: 1.25, injuryRisk: 1.15 },
  punishing:    { growth: 1.35, fatigue: 1.50, injuryRisk: 1.35 },
};

// 2. RECOVERY EMPHASIS EFFECTS
const RECOVERY_MULTIPLIERS: Record<RecoveryEmphasis, { fatigueDecay: number; injuryRecovery: number }> = {
  low:    { fatigueDecay: 0.80, injuryRecovery: 0.85 },
  normal: { fatigueDecay: 1.00, injuryRecovery: 1.00 },
  high:   { fatigueDecay: 1.25, injuryRecovery: 1.20 },
};

// 3. FOCUS BIAS MATRIX (From Canon Table 4.3)
// Maps TrainingFocus -> Multiplier for [Power, Speed, Technique, Balance]
const FOCUS_BIAS_MATRIX: Record<TrainingFocus, Record<keyof RikishiStats, number>> = {
  power:     { strength: 1.30, speed: 0.85, technique: 0.95, balance: 0.95, weight: 1.0, stamina: 1.0, mental: 1.0, adaptability: 1.0 },
  speed:     { strength: 0.85, speed: 1.30, technique: 0.95, balance: 0.95, weight: 1.0, stamina: 1.0, mental: 1.0, adaptability: 1.0 },
  technique: { strength: 0.90, speed: 0.90, technique: 1.35, balance: 1.10, weight: 1.0, stamina: 1.0, mental: 1.0, adaptability: 1.0 },
  balance:   { strength: 0.90, speed: 0.95, technique: 1.10, balance: 1.35, weight: 1.0, stamina: 1.0, mental: 1.0, adaptability: 1.0 },
  neutral:   { strength: 1.00, speed: 1.00, technique: 1.00, balance: 1.00, weight: 1.0, stamina: 1.0, mental: 1.0, adaptability: 1.0 },
};

// 4. INDIVIDUAL FOCUS MODES (From Canon Table 5.2)
const INDIVIDUAL_FOCUS_MODES: Record<IndividualFocusType, { growth: number; fatigue: number; injuryRisk: number }> = {
  develop: { growth: 1.25, fatigue: 1.10, injuryRisk: 1.05 },
  push:    { growth: 1.35, fatigue: 1.20, injuryRisk: 1.20 },
  protect: { growth: 0.85, fatigue: 0.75, injuryRisk: 0.70 },
  rebuild: { growth: 1.10, fatigue: 0.90, injuryRisk: 0.85 }, // Post-injury specific
};

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Ensures a Beya has a valid training state. 
 * Creates a default "Balanced/Neutral" state if missing.
 */
export function ensureHeyaTrainingState(world: WorldState, beyaId: Id): BeyaTrainingState {
  if (!world.trainingState) {
    world.trainingState = {};
  }

  if (!world.trainingState[beyaId]) {
    world.trainingState[beyaId] = {
      beyaId,
      activeProfile: {
        intensity: 'balanced',
        focus: 'neutral',
        styleBias: 'neutral',
        recovery: 'normal'
      },
      focusSlots: []
    };
  }
  return world.trainingState[beyaId];
}

/**
 * Retrieves the individual focus slot for a rikishi, if assigned.
 */
export function getIndividualFocus(rikishiId: Id, beyaState: BeyaTrainingState): IndividualFocus | undefined {
  return beyaState.focusSlots.find(slot => slot.rikishiId === rikishiId);
}

/**
 * Calculates the fatigue change for the week.
 * Formula: BaseGain * Intensity * FocusMode * StaffModifiers - (Recovery * Facilities)
 */
function calculateFatigueDelta(
  profile: TrainingProfile, 
  focus: IndividualFocus | undefined,
  currentFatigue: number
): number {
  const intensityMult = INTENSITY_MULTIPLIERS[profile.intensity].fatigue;
  const focusMult = focus ? INDIVIDUAL_FOCUS_MODES[focus.focusType].fatigue : 1.0;
  const recoveryMult = RECOVERY_MULTIPLIERS[profile.recovery].fatigueDecay;
  
  // Base fatigue gain per week of active training (constant)
  const BASE_FATIGUE_GAIN = 10;
  // Natural recovery per week (constant)
  const BASE_RECOVERY = 8;

  const gain = BASE_FATIGUE_GAIN * intensityMult * focusMult;
  const decay = BASE_RECOVERY * recoveryMult;

  return Math.floor(gain - decay);
}

/**
 * Calculates the growth vector for the week.
 * Returns decimal increments for attributes.
 */
function calculateGrowthVector(
  profile: TrainingProfile,
  focus: IndividualFocus | undefined,
  rikishi: Rikishi
): Record<keyof RikishiStats, number> {
  const intensityMult = INTENSITY_MULTIPLIERS[profile.intensity].growth;
  const focusModeMult = focus ? INDIVIDUAL_FOCUS_MODES[focus.focusType].growth : 1.0;
  const bias = FOCUS_BIAS_MATRIX[profile.focus];

  // Base growth rate (could depend on Age/Potential in full implementation)
  const BASE_GROWTH = 0.5; 

  const growth: Record<keyof RikishiStats, number> = {
    strength: 0,
    speed: 0,
    technique: 0,
    balance: 0,
    weight: 0,
    stamina: 0,
    mental: 0,
    adaptability: 0
  };

  // Apply multipliers
  const totalMult = intensityMult * focusModeMult * BASE_GROWTH;

  growth.strength = totalMult * bias.strength;
  growth.speed = totalMult * bias.speed;
  growth.technique = totalMult * bias.technique;
  growth.balance = totalMult * bias.balance;
  // Secondary stats grow slower
  growth.stamina = totalMult * 0.5; 
  growth.mental = totalMult * 0.2; 
  growth.adaptability = totalMult * 0.2;

  return growth;
}

/**
 * Deterministic injury check based on fatigue and intensity.
 */
function checkInjury(
  rng: SeededRNG,
  fatigue: number,
  profile: TrainingProfile,
  focus: IndividualFocus | undefined
): boolean {
  const intensityRisk = INTENSITY_MULTIPLIERS[profile.intensity].injuryRisk;
  const focusRisk = focus ? INDIVIDUAL_FOCUS_MODES[focus.focusType].injuryRisk : 1.0;
  
  // Base risk starts low, climbs exponentially with fatigue > 50
  const baseRisk = 0.005; // 0.5% base chance per week
  const fatigueFactor = fatigue > 50 ? Math.pow((fatigue - 50) / 20, 2) : 0;
  
  const totalRisk = (baseRisk + (fatigueFactor * 0.01)) * intensityRisk * focusRisk;
  
  return rng.nextFloat() < totalRisk;
}

// ============================================================================
// MAIN EXPORT
// ============================================================================

/**
 * Applies the Weekly Training Tick (System B).
 * * Order of Operations (Canon A3.1):
 * 1. Read Beya Profile & Focus
 * 2. Compute Growth & Fatigue Deltas
 * 3. Update Fatigue
 * 4. Deterministic Injury Check
 * 5. Apply Growth (Buffered & Synced)
 */
export function applyWeeklyTraining(world: WorldState): WorldState {
  const rng = new SeededRNG(world.id + world.calendar.currentWeek);

  // Iterate over all active rikishi
  world.rikishi.forEach(rikishi => {
    // skip retired or absent if needed (basic check)
    if (rikishi.isRetired) return;

    const beyaState = ensureHeyaTrainingState(world, rikishi.heyaId);
    const focus = getIndividualFocus(rikishi.id, beyaState);
    const profile = beyaState.activeProfile;

    // 1. Calculate Fatigue Delta
    const fatigueDelta = calculateFatigueDelta(profile, focus, rikishi.fatigue || 0);
    
    // 2. Apply Fatigue (Clamped 0-100)
    rikishi.fatigue = Math.max(0, Math.min(100, (rikishi.fatigue || 0) + fatigueDelta));

    // 3. Injury Check
    if (!rikishi.injured) {
      if (checkInjury(rng, rikishi.fatigue, profile, focus)) {
        // Create Injury (Simple V1 Implementation - full system needs Injury Types)
        rikishi.injured = true;
        rikishi.injuryWeeksRemaining = 2;
        rikishi.injuryStatus = {
          type: "Training Injury",
          severity: "Minor",
          weeksRemaining: 2,
          location: "Leg"
        };
        // Log event? (handled in history engine via events.ts if imported)
      }
    } else {
      // Injury Recovery Logic
      const recMult = RECOVERY_MULTIPLIERS[profile.recovery].injuryRecovery;
      // Simple decrement logic for V1
      if (rikishi.injuryWeeksRemaining > 0) {
        // Chance to heal faster based on recovery emphasis
        const healAmount = rng.nextFloat() < (0.5 * recMult) ? 2 : 1;
        rikishi.injuryWeeksRemaining = Math.max(0, rikishi.injuryWeeksRemaining - healAmount);
        
        if (rikishi.injuryWeeksRemaining === 0) {
          rikishi.injured = false;
          rikishi.injuryStatus = undefined;
        }
      }
    }

    // 4. Calculate Growth
    // Only healthy rikishi grow efficiently
    if (!rikishi.injured) {
      const growth = calculateGrowthVector(profile, focus, rikishi);

      // 5. Apply Growth (Internal Attributes + Sync Stats)
      
      // Update Internal Attributes
      rikishi.power = Math.min(100, rikishi.power + growth.strength);
      rikishi.speed = Math.min(100, rikishi.speed + growth.speed);
      rikishi.technique = Math.min(100, rikishi.technique + growth.technique);
      rikishi.balance = Math.min(100, rikishi.balance + growth.balance);
      rikishi.stamina = Math.min(100, rikishi.stamina + growth.stamina);
      // Other internals
      rikishi.adaptability = Math.min(100, rikishi.adaptability + growth.adaptability);
      rikishi.experience = Math.min(100, rikishi.experience + (growth.mental * 0.5));

      // Sync to Public UI Stats (Flooring for cleaner numbers)
      rikishi.stats.strength = Math.floor(rikishi.power);
      rikishi.stats.speed = Math.floor(rikishi.speed);
      rikishi.stats.technique = Math.floor(rikishi.technique);
      rikishi.stats.balance = Math.floor(rikishi.balance);
      rikishi.stats.stamina = Math.floor(rikishi.stamina);
      rikishi.stats.adaptability = Math.floor(rikishi.adaptability);
      rikishi.stats.mental = Math.floor(rikishi.experience); // Simplified mapping
    }
  });

  return world;
}
