/**
 * File Name: src/engine/mockData.ts
 * Notes:
 * - Backfilled mock data with 'origin', 'archetype', 'h2h', 'adaptability' fields.
 * - Prevents runtime errors when testing UI components with static data.
 * - Aligns with new Type definitions.
 */

import { Rikishi, Heya, Oyakata } from "./types";

export const MOCK_RIKISHI: Rikishi[] = [
  {
    id: "r1",
    name: "Hakuho (Mock)",
    shikona: "Hakuho",
    heyaId: "h1",
    rank: "Yokozuna",
    division: "Makuuchi",
    rankNumber: 1,
    side: "east",
    stats: {
      strength: 95, technique: 98, speed: 85, weight: 155, stamina: 90, mental: 99, adaptability: 95
    },
    birthYear: 1985,
    origin: "Mongolia",
    archetype: "Yotsu-zumo",
    experience: 99,
    careerRecord: { wins: 1187, losses: 247, yusho: 45 },
    currentBashoRecord: { wins: 15, losses: 0 },
    history: [],
    h2h: {},
    injuryStatus: { isInjured: false, severity: 0, location: "", weeksToHeal: 0 },
    condition: 100,
    motivation: 100,
    personalityTraits: ["Legend", "Intimidating"]
  },
  {
    id: "r2",
    name: "Takakeisho (Mock)",
    shikona: "Takakeisho",
    heyaId: "h2",
    rank: "Ozeki",
    division: "Makuuchi",
    rankNumber: 1,
    side: "west",
    stats: {
      strength: 92, technique: 70, speed: 88, weight: 165, stamina: 60, mental: 85, adaptability: 60
    },
    birthYear: 1996,
    origin: "Hyogo",
    archetype: "Oshi-zumo",
    experience: 70,
    careerRecord: { wins: 300, losses: 150, yusho: 2 },
    currentBashoRecord: { wins: 11, losses: 4 },
    history: [],
    h2h: {},
    injuryStatus: { isInjured: true, severity: 20, location: "Neck", weeksToHeal: 2 },
    condition: 75,
    motivation: 90,
    personalityTraits: ["Pusher"]
  }
];

export const MOCK_HEYAS: Heya[] = [
  {
    id: "h1",
    name: "Miyagino",
    oyakataId: "o1",
    location: "Tokyo",
    funds: 5000000,
    reputation: 90,
    rikishiIds: ["r1"]
  },
  {
    id: "h2",
    name: "Tokiwayama",
    oyakataId: "o2",
    location: "Tokyo",
    funds: 3000000,
    reputation: 75,
    rikishiIds: ["r2"]
  }
];

export const MOCK_OYAKATA: Oyakata[] = [
  {
    id: "o1",
    name: "Miyagino Oyakata",
    heyaId: "h1",
    stats: { scouting: 80, training: 90, politics: 70 },
    personality: "Strategic"
  }
];
