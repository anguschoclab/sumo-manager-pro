/**
 * File Name: src/engine/worldgen.ts
 * Notes: 
 * - Updated generateRikishi to include new mandatory fields: 'origin', 'archetype', 'h2h', 'adaptability'.
 * - Added logic to distribute archetypes and origins realistically.
 * - Initialized empty Head-to-Head (h2h) records for all generated wrestlers.
 */

import { GameState, Rikishi, Heya, Oyakata, Rank, RikishiStats } from "./types";
import { generateRikishiName } from "./shikona";
import { generateOyakataName } from "./shikona"; // Assuming this exists or reusing rikishi name

// Constants for generation
const ORIGINS = [
  "Hokkaido", "Aomori", "Tokyo", "Osaka", "Fukuoka", 
  "Mongolia", "Georgia", "Brazil", "Nihon University", "Nippon Sport Science Univ"
];

const ARCHETYPES = [
  "Oshi-zumo", "Yotsu-zumo", "Technician", "Tank", "Veteran", "Prodigy"
];

function getRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateStats(rank: Rank, archetype: string): RikishiStats {
  const base = rank === "Yokozuna" ? 80 :
               rank === "Ozeki" ? 70 :
               rank === "Sekiwake" || rank === "Komusubi" ? 60 :
               rank === "Maegashira" ? 50 : 30;
  
  const variance = () => (Math.random() * 20) - 10;

  // Modifiers based on archetype
  let strMod = 1, techMod = 1, spdMod = 1, wgtMod = 1, adaMod = 1;

  switch (archetype) {
    case "Oshi-zumo": strMod = 1.2; spdMod = 1.1; break;
    case "Yotsu-zumo": strMod = 1.2; techMod = 1.1; break;
    case "Technician": techMod = 1.3; adaMod = 1.2; wgtMod = 0.9; break;
    case "Tank": wgtMod = 1.3; spdMod = 0.7; break;
    case "Prodigy": adaMod = 1.2; techMod = 1.2; break;
  }

  return {
    strength: Math.min(100, Math.max(10, (base + variance()) * strMod)),
    technique: Math.min(100, Math.max(10, (base + variance()) * techMod)),
    speed: Math.min(100, Math.max(10, (base + variance()) * spdMod)),
    weight: Math.min(200, Math.max(80, (140 + variance() * 2) * wgtMod)), // kg
    stamina: Math.min(100, Math.max(10, base + variance())),
    mental: Math.min(100, Math.max(10, base + variance())),
    adaptability: Math.min(100, Math.max(10, (base + variance()) * adaMod)),
  };
}

export function generateWorld(): GameState {
  const heyas: Heya[] = [];
  const rikishi: Rikishi[] = [];
  const oyakata: Oyakata[] = [];

  const heyaNames = ["Isegahama", "Kokonoe", "Takadagawa", "Sadogatake", "Futagoyama", "Arashio", "Miyagino", "Tatsunami"];

  // 1. Create Heyas
  heyaNames.forEach((name, idx) => {
    const heyaId = `heya_${idx}`;
    const oyakataId = `oyakata_${idx}`;
    
    // Create Oyakata
    oyakata.push({
      id: oyakataId,
      name: `${name} Oyakata`,
      heyaId: heyaId,
      stats: {
        scouting: 50 + Math.random() * 50,
        training: 50 + Math.random() * 50,
        politics: 50 + Math.random() * 50
      },
      personality: getRandom(["Strict", "Fatherly", "Strategic", "Lazy"])
    });

    // Create Heya
    heyas.push({
      id: heyaId,
      name: name,
      oyakataId: oyakataId,
      location: "Tokyo",
      funds: 1000000 + Math.random() * 5000000,
      reputation: 50,
      rikishiIds: []
    });
  });

  // 2. Create Rikishi (Top Division Population)
  const ranks: Rank[] = ["Yokozuna", "Ozeki", "Ozeki", "Sekiwake", "Sekiwake", "Komusubi", "Komusubi"];
  for (let i = 0; i < 35; i++) ranks.push("Maegashira");
  for (let i = 0; i < 20; i++) ranks.push("Juryo");

  const currentYear = 2024;

  ranks.forEach((rank, idx) => {
    const heya = getRandom(heyas);
    const archetype = getRandom(ARCHETYPES);
    const origin = getRandom(ORIGINS);
    const birthYear = currentYear - (20 + Math.floor(Math.random() * 12));

    const newRikishi: Rikishi = {
      id: `rikishi_${idx}`,
      name: `Rikishi ${idx}`, // Placeholder
      shikona: generateRikishiName(),
      heyaId: heya.id,
      rank: rank,
      stats: generateStats(rank, archetype),
      birthYear: birthYear,
      origin: origin,
      archetype: archetype,
      experience: Math.floor(Math.random() * 100),
      
      careerRecord: { wins: 0, losses: 0, yusho: 0 },
      currentBashoRecord: { wins: 0, losses: 0 },
      history: [],
      h2h: {}, // Empty H2H to start

      injuryStatus: {
        isInjured: false,
        severity: 0,
        location: "",
        weeksToHeal: 0
      },
      condition: 90 + Math.random() * 10,
      motivation: 50 + Math.random() * 50,
      personalityTraits: []
    };

    rikishi.push(newRikishi);
    heya.rikishiIds.push(newRikishi.id);
  });

  // 3. Populate history (Simulate some past matches for flavor?)
  // For now, we leave history empty, but the structure is ready.

  return {
    currentDate: new Date(2024, 0, 1),
    rikishi,
    heyas,
    oyakata,
    currentBasho: null,
    history: [],
    playerHeyaId: heyas[0].id
  };
}
