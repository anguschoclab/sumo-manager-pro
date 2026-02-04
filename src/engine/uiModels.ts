import { Rikishi, Heya, GameState, Rank } from "./types";

export interface RikishiUIModel {
  id: string;
  name: string;
  shikona: string;
  heya: string; // Name of the heya
  rank: Rank;
  record: string; // "8-7", "10-5" etc.
  careerRecord: string; // "145-120"
  stats: {
    strength: number;
    technique: number;
    speed: number;
    weight: number;
    stamina: number;
    mental: number;
    adaptability: number; // New field
  };
  // New Lifecycle & Narrative Fields
  age: number;
  origin: string;
  archetype: string;
  condition: number; // 0-100
  injuryStatus: {
    isInjured: boolean;
    severity: string; // "None", "Minor", "Major", "Career-Ending"
  };
  // UI Helper for rivalries
  rivalries: { opponentId: string; opponentName: string; record: string }[]; 
}

export function toRikishiUIModel(rikishi: Rikishi, state: GameState): RikishiUIModel {
  const heya = state.heyas.find(h => h.id === rikishi.heyaId);
  const currentBasho = state.currentBasho;
  
  // Format record
  const wins = rikishi.currentBashoRecord?.wins || 0;
  const losses = rikishi.currentBashoRecord?.losses || 0;
  const recordStr = `${wins}-${losses}`;

  // Format Career Record
  const cWins = rikishi.careerRecord?.wins || 0;
  const cLosses = rikishi.careerRecord?.losses || 0;
  const careerStr = `${cWins}-${cLosses}`;

  // Injury Text
  let injuryText = "None";
  if (rikishi.injuryStatus.isInjured) {
    if (rikishi.injuryStatus.severity < 30) injuryText = "Minor";
    else if (rikishi.injuryStatus.severity < 70) injuryText = "Major";
    else injuryText = "Critical";
  }

  // Extract Top Rivalries (Top 3 by total matches fought)
  const rivalries = Object.entries(rikishi.h2h || {})
    .map(([oppId, rec]) => {
      const opp = state.rikishi.find(r => r.id === oppId);
      return {
        opponentId: oppId,
        opponentName: opp ? opp.shikona : "Unknown",
        totalBouts: rec.wins + rec.losses,
        record: `${rec.wins}-${rec.losses}`,
      };
    })
    .sort((a, b) => b.totalBouts - a.totalBouts)
    .slice(0, 3)
    .map(r => ({
      opponentId: r.opponentId,
      opponentName: r.opponentName,
      record: r.record
    }));

  return {
    id: rikishi.id,
    name: rikishi.name,
    shikona: rikishi.shikona,
    heya: heya ? heya.name : "Unknown Heya",
    rank: rikishi.rank,
    record: recordStr,
    careerRecord: careerStr,
    stats: {
      strength: rikishi.stats.strength,
      technique: rikishi.stats.technique,
      speed: rikishi.stats.speed,
      weight: rikishi.stats.weight,
      stamina: rikishi.stats.stamina,
      mental: rikishi.stats.mental,
      adaptability: rikishi.stats.adaptability || 50, // Default if missing
    },
    age: (state.currentBasho?.year || 2024) - rikishi.birthYear,
    origin: rikishi.origin || "Unknown",
    archetype: rikishi.archetype || "Balanced",
    condition: rikishi.condition,
    injuryStatus: {
      isInjured: rikishi.injuryStatus.isInjured,
      severity: injuryText,
    },
    rivalries,
  };
}
