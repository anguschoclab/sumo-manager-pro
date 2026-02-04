// mockData.ts
// Provides mock data for initialization if world generation is skipped or partial.
//
// UPDATES:
// - Added `birthYear` to all mock rikishi to prevent crashing the new Training system.

import type { Heya, Rikishi } from "./types";

export const MOCK_HEYAS: Heya[] = [
  {
    id: "heya-1",
    name: "Kuro-beya",
    nameJa: "黒部屋",
    oyakataId: "npc-oyakata-1",
    rikishiIds: ["r-1", "r-2", "r-3"],
    statureBand: "established",
    prestigeBand: "respected",
    facilitiesBand: "adequate",
    koenkaiBand: "moderate",
    runwayBand: "comfortable",
    reputation: 65,
    funds: 12_000_000,
    facilities: {
      training: 50,
      recovery: 40,
      nutrition: 50
    },
    riskIndicators: {
      financial: false,
      governance: false,
      rivalry: true
    },
    trainingState: {
        profile: {
            intensity: "balanced",
            focus: "neutral",
            styleBias: "neutral",
            recovery: "normal"
        },
        focusSlots: [],
        maxFocusSlots: 3
    },
    isPlayerOwned: true
  },
  {
    id: "heya-2",
    name: "Shiro-beya",
    nameJa: "白部屋",
    oyakataId: "npc-oyakata-2",
    rikishiIds: ["r-4", "r-5"],
    statureBand: "powerful",
    prestigeBand: "elite",
    facilitiesBand: "world_class",
    koenkaiBand: "powerful",
    runwayBand: "secure",
    reputation: 90,
    funds: 50_000_000,
    facilities: {
      training: 90,
      recovery: 85,
      nutrition: 90
    },
    riskIndicators: {
      financial: false,
      governance: false,
      rivalry: false
    }
  }
];

export const MOCK_RIKISHI: Rikishi[] = [
  {
    id: "r-1",
    shikona: "Takamaru",
    heyaId: "heya-1",
    nationality: "Japan",
    birthYear: 2002, // 24 years old (Prime)
    height: 185,
    weight: 150,
    power: 70,
    speed: 60,
    balance: 65,
    technique: 55,
    aggression: 60,
    experience: 40,
    momentum: 50,
    stamina: 70,
    fatigue: 0,
    injured: false,
    injuryWeeksRemaining: 0,
    style: "oshi",
    archetype: "oshi_specialist",
    division: "makuuchi",
    rank: "maegashira",
    rankNumber: 3,
    side: "east",
    careerWins: 120,
    careerLosses: 90,
    currentBashoWins: 0,
    currentBashoLosses: 0,
    favoredKimarite: ["oshidashi", "tsukidashi"],
    weakAgainstStyles: ["yotsu"]
  },
  {
    id: "r-2",
    shikona: "Wakahana",
    heyaId: "heya-1",
    nationality: "Japan",
    birthYear: 2005, // 21 years old (Development)
    height: 178,
    weight: 130,
    power: 55,
    speed: 75,
    balance: 70,
    technique: 65,
    aggression: 40,
    experience: 20,
    momentum: 50,
    stamina: 60,
    fatigue: 0,
    injured: false,
    injuryWeeksRemaining: 0,
    style: "yotsu",
    archetype: "speedster",
    division: "juryo",
    rank: "juryo",
    rankNumber: 5,
    side: "west",
    careerWins: 45,
    careerLosses: 30,
    currentBashoWins: 0,
    currentBashoLosses: 0,
    favoredKimarite: ["shitatenage"],
    weakAgainstStyles: ["oshi"]
  },
  {
    id: "r-3",
    shikona: "Kotofuji",
    heyaId: "heya-1",
    nationality: "Japan",
    birthYear: 1996, // 30 years old (Veteran)
    height: 190,
    weight: 165,
    power: 80,
    speed: 40,
    balance: 50,
    technique: 75,
    aggression: 50,
    experience: 85,
    momentum: 50,
    stamina: 50,
    fatigue: 10,
    injured: false,
    injuryWeeksRemaining: 0,
    style: "hybrid",
    archetype: "all_rounder",
    division: "makushita",
    rank: "makushita",
    rankNumber: 1,
    side: "east",
    careerWins: 300,
    careerLosses: 280,
    currentBashoWins: 0,
    currentBashoLosses: 0,
    favoredKimarite: ["yorikiri"],
    weakAgainstStyles: []
  },
  {
    id: "r-4",
    shikona: "Hakuho-II",
    heyaId: "heya-2",
    nationality: "Mongolia",
    birthYear: 2000, // 26 years old (Prime)
    height: 192,
    weight: 158,
    power: 95,
    speed: 85,
    balance: 90,
    technique: 95,
    aggression: 80,
    experience: 90,
    momentum: 80,
    stamina: 90,
    fatigue: 0,
    injured: false,
    injuryWeeksRemaining: 0,
    style: "yotsu",
    archetype: "yotsu_specialist",
    division: "makuuchi",
    rank: "yokozuna",
    side: "east",
    careerWins: 600,
    careerLosses: 50,
    currentBashoWins: 0,
    currentBashoLosses: 0,
    favoredKimarite: ["yorikiri", "uwatenage"],
    weakAgainstStyles: []
  },
  {
    id: "r-5",
    shikona: "Daieisho-II",
    heyaId: "heya-2",
    nationality: "Japan",
    birthYear: 2001, // 25 years old (Prime)
    height: 182,
    weight: 162,
    power: 90,
    speed: 70,
    balance: 60,
    technique: 60,
    aggression: 95,
    experience: 70,
    momentum: 70,
    stamina: 80,
    fatigue: 0,
    injured: false,
    injuryWeeksRemaining: 0,
    style: "oshi",
    archetype: "oshi_specialist",
    division: "makuuchi",
    rank: "ozeki",
    side: "west",
    careerWins: 400,
    careerLosses: 150,
    currentBashoWins: 0,
    currentBashoLosses: 0,
    favoredKimarite: ["oshidashi", "tsukidashi"],
    weakAgainstStyles: ["yotsu"]
  }
];
