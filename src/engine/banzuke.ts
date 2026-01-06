// Banzuke (Ranking) System - True sumo hierarchy
// Authentic rank structure and promotion rules

import type { Rank, Division, RankPosition } from "./types";

// Full rank hierarchy with metadata
export interface RankInfo {
  rank: Rank;
  division: Division;
  nameJa: string;
  tier: number;           // Lower = higher rank (1 = yokozuna)
  maxPositions: number;   // Max wrestlers at this rank
  salary: number;         // Monthly salary in yen
  isSanyaku: boolean;     // Special ranks (sekiwake+)
  isSekitori: boolean;    // Paid ranks (juryo+)
  fightsPerBasho: number; // Number of bouts
}

export const RANK_HIERARCHY: Record<Rank, RankInfo> = {
  yokozuna: {
    rank: "yokozuna",
    division: "makuuchi",
    nameJa: "横綱",
    tier: 1,
    maxPositions: 2,      // Rarely more than 2
    salary: 3_000_000,    // ¥3M/month
    isSanyaku: true,
    isSekitori: true,
    fightsPerBasho: 15
  },
  ozeki: {
    rank: "ozeki",
    division: "makuuchi",
    nameJa: "大関",
    tier: 2,
    maxPositions: 4,
    salary: 2_500_000,
    isSanyaku: true,
    isSekitori: true,
    fightsPerBasho: 15
  },
  sekiwake: {
    rank: "sekiwake",
    division: "makuuchi",
    nameJa: "関脇",
    tier: 3,
    maxPositions: 2,      // East and West
    salary: 1_800_000,
    isSanyaku: true,
    isSekitori: true,
    fightsPerBasho: 15
  },
  komusubi: {
    rank: "komusubi",
    division: "makuuchi",
    nameJa: "小結",
    tier: 4,
    maxPositions: 2,
    salary: 1_800_000,
    isSanyaku: true,
    isSekitori: true,
    fightsPerBasho: 15
  },
  maegashira: {
    rank: "maegashira",
    division: "makuuchi",
    nameJa: "前頭",
    tier: 5,
    maxPositions: 34,     // M1-M17 East/West
    salary: 1_400_000,
    isSanyaku: false,
    isSekitori: true,
    fightsPerBasho: 15
  },
  juryo: {
    rank: "juryo",
    division: "juryo",
    nameJa: "十両",
    tier: 6,
    maxPositions: 28,     // J1-J14 East/West
    salary: 1_100_000,
    isSanyaku: false,
    isSekitori: true,
    fightsPerBasho: 15
  },
  makushita: {
    rank: "makushita",
    division: "makushita",
    nameJa: "幕下",
    tier: 7,
    maxPositions: 120,
    salary: 0,            // No salary, allowance only
    isSanyaku: false,
    isSekitori: false,
    fightsPerBasho: 7
  },
  sandanme: {
    rank: "sandanme",
    division: "sandanme",
    nameJa: "三段目",
    tier: 8,
    maxPositions: 200,
    salary: 0,
    isSanyaku: false,
    isSekitori: false,
    fightsPerBasho: 7
  },
  jonidan: {
    rank: "jonidan",
    division: "jonidan",
    nameJa: "序二段",
    tier: 9,
    maxPositions: 350,
    salary: 0,
    isSanyaku: false,
    isSekitori: false,
    fightsPerBasho: 7
  },
  jonokuchi: {
    rank: "jonokuchi",
    division: "jonokuchi",
    nameJa: "序ノ口",
    tier: 10,
    maxPositions: 100,
    salary: 0,
    isSanyaku: false,
    isSekitori: false,
    fightsPerBasho: 7
  }
};

// Compare ranks (returns negative if a is higher, positive if b is higher)
export function compareRanks(a: RankPosition, b: RankPosition): number {
  const aInfo = RANK_HIERARCHY[a.rank];
  const bInfo = RANK_HIERARCHY[b.rank];
  
  // First compare tier
  if (aInfo.tier !== bInfo.tier) {
    return aInfo.tier - bInfo.tier;
  }
  
  // Same rank, compare position number (if applicable)
  if (a.rankNumber !== undefined && b.rankNumber !== undefined) {
    if (a.rankNumber !== b.rankNumber) {
      return a.rankNumber - b.rankNumber;
    }
  }
  
  // Same position, East beats West
  return a.side === "east" ? -1 : 1;
}

// Format rank for display
export function formatRank(position: RankPosition): string {
  const info = RANK_HIERARCHY[position.rank];
  const side = position.side === "east" ? "E" : "W";
  
  if (position.rankNumber !== undefined) {
    return `${info.nameJa}${position.rankNumber}${side}`;
  }
  
  return `${info.nameJa}${side}`;
}

// Get full rank title in Japanese
export function getRankTitleJa(position: RankPosition): string {
  const info = RANK_HIERARCHY[position.rank];
  const sideJa = position.side === "east" ? "東" : "西";
  
  if (position.rankNumber !== undefined) {
    return `${sideJa}${info.nameJa}${position.rankNumber}枚目`;
  }
  
  return `${sideJa}${info.nameJa}`;
}

// Promotion thresholds
export interface PromotionRule {
  fromRank: Rank;
  toRank: Rank;
  requiredWins: number;
  notes: string;
}

export const PROMOTION_RULES: PromotionRule[] = [
  // Yokozuna promotion (special deliberation required)
  {
    fromRank: "ozeki",
    toRank: "yokozuna",
    requiredWins: 13, // Generally 2 consecutive yusho or equivalent
    notes: "Requires YDC recommendation, typically consecutive yusho"
  },
  // Ozeki promotion
  {
    fromRank: "sekiwake",
    toRank: "ozeki",
    requiredWins: 33, // ~33 wins over 3 basho at sanyaku
    notes: "Approximately 33 wins over 3 consecutive basho at sekiwake/komusubi"
  },
  // Sekiwake/Komusubi (based on performance)
  {
    fromRank: "maegashira",
    toRank: "komusubi",
    requiredWins: 10,
    notes: "Strong kachi-koshi from upper maegashira"
  },
  // Juryo to Makuuchi
  {
    fromRank: "juryo",
    toRank: "maegashira",
    requiredWins: 10,
    notes: "Strong record from upper juryo"
  },
  // Makushita to Juryo (the big promotion)
  {
    fromRank: "makushita",
    toRank: "juryo",
    requiredWins: 7, // Perfect 7-0 from top makushita
    notes: "Usually requires high rank and strong kachi-koshi"
  }
];

// Calculate if a rikishi achieved kachi-koshi (winning record)
export function isKachiKoshi(wins: number, losses: number, rank: Rank): boolean {
  const info = RANK_HIERARCHY[rank];
  const totalBouts = info.fightsPerBasho;
  
  // Sekitori need 8+ wins (15 bouts)
  // Lower ranks need 4+ wins (7 bouts)
  const required = Math.floor(totalBouts / 2) + 1;
  return wins >= required;
}

// Calculate if a rikishi achieved make-koshi (losing record)
export function isMakeKoshi(wins: number, losses: number, rank: Rank): boolean {
  const info = RANK_HIERARCHY[rank];
  const totalBouts = info.fightsPerBasho;
  const required = Math.floor(totalBouts / 2) + 1;
  return losses >= required;
}

// Estimate rank change after basho
export function estimateRankChange(
  currentRank: RankPosition,
  wins: number,
  losses: number
): number {
  const info = RANK_HIERARCHY[currentRank.rank];
  const kachiKoshi = isKachiKoshi(wins, losses, currentRank.rank);
  const makeKoshi = isMakeKoshi(wins, losses, currentRank.rank);
  
  if (info.isSekitori) {
    // Sekitori: roughly 1 rank per win/loss over 7.5
    const margin = wins - losses;
    return -Math.round(margin * 0.5); // Negative = promotion
  } else {
    // Lower divisions: simpler calculation
    if (kachiKoshi) return -Math.round((wins - 4) * 10);
    if (makeKoshi) return Math.round((losses - 4) * 10);
    return 0;
  }
}

// Special ranks and their meanings
export const SPECIAL_RANKS = {
  yokozuna: "Grand Champion - highest rank, cannot be demoted (only retirement)",
  ozeki: "Champion - second highest, kadoban system applies",
  sekiwake: "Junior Champion - third highest sanyaku rank",
  komusubi: "Junior Champion 2nd Class - gateway to ozeki promotion"
};

// Ozeki kadoban system
export interface OzekiStatus {
  isKadoban: boolean;      // On warning (had make-koshi last basho)
  consecutiveMakeKoshi: number;
}

export function getOzekiStatus(
  lastBashoWins: number,
  lastBashoLosses: number,
  previousKadoban: boolean
): OzekiStatus {
  const hadMakeKoshi = isMakeKoshi(lastBashoWins, lastBashoLosses, "ozeki");
  
  return {
    isKadoban: hadMakeKoshi && !previousKadoban,
    consecutiveMakeKoshi: hadMakeKoshi ? (previousKadoban ? 2 : 1) : 0
  };
}
