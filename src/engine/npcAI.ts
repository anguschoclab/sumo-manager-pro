// npcAI.ts
// The "Brain" of the NPC stables.
// Determines training schedules, managing risks, and interpreting the meta.
// Aligned with NPC Manager AI System v1.1.

import type { WorldState, Heya, Oyakata, TrainingProfile } from "./types";
import { createDefaultTrainingState } from "./training";

// === CORE LOGIC ===

/**
 * Runs weekly decision cycles for all NPC stables.
 * Adjusts training profiles based on Oyakata personality and roster state.
 */
export function tickWeek(world: WorldState): void {
  for (const heya of world.heyas.values()) {
    // Skip player heya
    if (heya.isPlayerOwned) continue;

    const oyakata = world.oyakata.get(heya.oyakataId);
    if (!oyakata) continue;

    processAICycle(heya, oyakata, world);
  }
}

function processAICycle(heya: Heya, oyakata: Oyakata, world: WorldState) {
  // Ensure training state exists
  if (!heya.trainingState) {
    heya.trainingState = createDefaultTrainingState();
  }

  // 1. Analyze Roster Health
  let injuredCount = 0;
  let totalFatigue = 0;
  const rosterSize = heya.rikishiIds.length;

  for (const rid of heya.rikishiIds) {
    const r = world.rikishi.get(rid);
    if (r) {
      if (r.injured) injuredCount++;
      totalFatigue += (r.fatigue || 0);
    }
  }
  const avgFatigue = rosterSize > 0 ? totalFatigue / rosterSize : 0;

  // 2. Decide Training Strategy
  const newProfile = decideTrainingProfile(oyakata, avgFatigue, injuredCount);
  heya.trainingState.profile = newProfile;

  // 3. Manage Funds (Simple check)
  // If funds low, maybe fire staff or stop spending? 
  // (Stubbed for now, economy engine handles burn)
}

function decideTrainingProfile(
  oyakata: Oyakata, 
  avgFatigue: number, 
  injuredCount: number
): TrainingProfile {
  const t = oyakata.traits;
  
  // DEFAULT: Balanced / Neutral / Neutral / Normal
  let intensity: TrainingProfile["intensity"] = "balanced";
  let recovery: TrainingProfile["recovery"] = "normal";
  let focus: TrainingProfile["focus"] = "neutral";
  
  // INTENSITY LOGIC
  // High Compassion or Patience lowers intensity if fatigue is present
  if (t.compassion > 70 && avgFatigue > 30) {
    intensity = "conservative";
  }
  // High Ambition/Risk ignores fatigue
  else if (t.risk > 70 && t.ambition > 60) {
    intensity = "intensive";
    // The "Tyrant" mode
    if (t.compassion < 20) intensity = "punishing";
  }
  // High Fatigue forces recovery unless reckless
  else if (avgFatigue > 60 && t.risk < 80) {
    intensity = "conservative";
    recovery = "high";
  }

  // RECOVERY LOGIC
  // Science types prioritize recovery
  if (oyakata.archetype === "scientist") {
    recovery = "high"; // Scientists believe in rest
  }
  // Traditionalists might view rest as weakness
  if (oyakata.archetype === "traditionalist" && t.tradition > 80) {
    recovery = "low"; 
  }

  // FOCUS LOGIC
  // Traditionalists favor Technique or Balance
  if (t.tradition > 70) {
    focus = "technique";
  }
  // Tyrants/Gamblers want Power
  if (t.ambition > 80) {
    focus = "power";
  }
  // Scientists want Speed or Balance
  if (oyakata.archetype === "scientist") {
    focus = "balance";
  }

  // INJURY EMERGENCY
  if (injuredCount > 1 && t.compassion > 30) {
    intensity = "conservative";
    recovery = "high";
  }

  return {
    intensity,
    focus,
    styleBias: "neutral", // TODO: Implement style bias AI
    recovery
  };
}
