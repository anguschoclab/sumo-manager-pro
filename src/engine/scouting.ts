/**
 * File Name: src/engine/scouting.ts
 * Notes:
 * - Updated to use the new `generateRookie` function from lifecycle.ts to ensure consistency.
 * - Ensures newly scouted recruits have proper 'h2h' and 'adaptability' fields initialized.
 */

import { GameState, Rikishi, RikishiStats } from "./types";
import { generateRookie } from "./lifecycle"; // Leveraging the new centralized generator

export interface ScoutCandidate {
  id: string;
  name: string;
  age: number;
  origin: string;
  archetype: string;
  stats: RikishiStats;
  cost: number;
  potential: number; // 0-100 hidden stat
}

export function generateScoutCandidates(count: number, currentYear: number): ScoutCandidate[] {
  const candidates: ScoutCandidate[] = [];

  for (let i = 0; i < count; i++) {
    // We use generateRookie to get a valid Rikishi object, then strip it down to a candidate
    const rookie = generateRookie(currentYear, "Jonokuchi");
    
    // Calculate a signing cost based on stats
    const statSum = Object.values(rookie.stats).reduce((a, b) => a + b, 0);
    const cost = Math.floor(statSum * 100 + (rookie.archetype === "Prodigy" ? 50000 : 0));

    candidates.push({
      id: rookie.id,
      name: rookie.shikona, // Candidates use their shikona as name for now
      age: currentYear - rookie.birthYear,
      origin: rookie.origin,
      archetype: rookie.archetype,
      stats: rookie.stats,
      cost: cost,
      potential: 50 + Math.random() * 50 // Hidden logic placeholder
    });
  }

  return candidates;
}

export function recruitCandidate(state: GameState, candidateId: string, targetHeyaId: string): GameState {
  // Logic to convert a candidate into a full Rikishi in the game state
  // In a real implementation, we'd need to fetch the candidate details from a store.
  // For this drop-in, we assume we regenerate the rookie or pass the object.
  // This is a placeholder for the action.
  
  console.log(`Recruiting candidate ${candidateId} to heya ${targetHeyaId}`);
  return state;
}
