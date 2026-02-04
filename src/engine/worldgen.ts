// worldgen.ts
// Generates the initial game state.
//
// UPDATES Phase 5:
// - Generates Oyakata for every stable.
// - Initializes `world.oyakata` map.

import { v4 as uuidv4 } from "uuid";
import type { 
  WorldState, 
  Heya, 
  Rikishi, 
  BashoName, 
  Oyakata,
  FTUEState 
} from "./types";
import { MOCK_HEYAS, MOCK_RIKISHI, MOCK_OYAKATA } from "./mockData";
import { generateOyakata } from "./oyakataPersonalities";

export function initializeWorld(seed: string = "default-seed"): WorldState {
  // Create collections
  const heyas = new Map<string, Heya>();
  const rikishi = new Map<string, Rikishi>();
  const oyakata = new Map<string, Oyakata>();

  // 1. Load Mocks (or generate procedural in future)
  // Use MOCK_OYAKATA if available, or generate them
  
  MOCK_HEYAS.forEach(h => heyas.set(h.id, h));
  MOCK_RIKISHI.forEach(r => rikishi.set(r.id, r));

  // Ensure every Heya has an Oyakata
  heyas.forEach(heya => {
    // Check if mock exists
    const mockO = MOCK_OYAKATA.find(o => o.heyaId === heya.id);
    if (mockO) {
      oyakata.set(mockO.id, mockO);
      heya.oyakataId = mockO.id;
    } else {
      // Generate new
      const newId = `oyakata-${heya.id}`;
      const newO = generateOyakata(
        newId, 
        heya.id, 
        `${heya.name.split('-')[0]} Oyakata`, 
        55
      );
      oyakata.set(newId, newO);
      heya.oyakataId = newId;
    }
  });

  const ftue: FTUEState = {
    isActive: true,
    bashoCompleted: 0,
    suppressedEvents: []
  };

  return {
    seed,
    year: 2025,
    week: 1,
    cyclePhase: "active_basho", // Start in basho for immediate action
    currentBashoName: "hatsu",
    heyas,
    rikishi,
    oyakata,
    history: [],
    ftue,
    playerHeyaId: "heya-1" // Default player assignment
  };
}

export function initializeBasho(world: WorldState, bashoName: BashoName) {
  return {
    year: world.year,
    bashoNumber: 1, // simplified logic
    bashoName,
    day: 1,
    matches: [],
    standings: new Map()
  };
}
