// Core game types for Basho - Sumo Management Sim

export type Style = "oshi" | "yotsu" | "hybrid";
export type Stance = "migi-yotsu" | "hidari-yotsu" | "no-grip" | "belt-dominant" | "push-dominant";

export type Division = 
  | "makuuchi" 
  | "juryo" 
  | "makushita" 
  | "sandanme" 
  | "jonidan" 
  | "jonokuchi";

export type Rank = 
  | "yokozuna" 
  | "ozeki" 
  | "sekiwake" 
  | "komusubi" 
  | "maegashira"
  | "juryo"
  | "makushita"
  | "sandanme"
  | "jonidan"
  | "jonokuchi";

export interface Rikishi {
  id: string;
  shikona: string;
  realName?: string;
  heyaId: string;
  nationality: string;
  
  // Physical attributes
  height: number;  // cm
  weight: number;  // kg
  
  // Core stats (0-100)
  power: number;
  speed: number;
  balance: number;
  technique: number;
  aggression: number;
  experience: number;
  
  // Current form & condition
  momentum: number;      // -10 to +10, recent form modifier
  stamina: number;       // 0-100, current fatigue level
  injured: boolean;
  injuryWeeksRemaining: number;
  
  // Career
  style: Style;
  division: Division;
  rank: Rank;
  rankNumber?: number;   // e.g., Maegashira 3
  side: "east" | "west";
  
  // Stats
  careerWins: number;
  careerLosses: number;
  currentBashoWins: number;
  currentBashoLosses: number;
  
  // Traits & specializations
  favoredKimarite: string[];  // IDs of preferred finishing moves
  weakAgainstStyles: Style[];
}

export interface Heya {
  id: string;
  name: string;
  oyakataId: string;
  rikishiIds: string[];
  reputation: number;  // 0-100
  funds: number;
  facilities: {
    training: number;  // 0-100
    recovery: number;
    nutrition: number;
  };
}

export interface BoutResult {
  winner: "east" | "west";
  winnerRikishiId: string;
  loserRikishiId: string;
  kimarite: string;
  kimariteName: string;
  stance: Stance;
  tachiaiWinner: "east" | "west";
  duration: number;  // abstract ticks
  upset: boolean;
  log: BoutLogEntry[];
}

export interface BoutLogEntry {
  phase: "tachiai" | "clinch" | "momentum" | "finish";
  description: string;
  data: Record<string, number | string | boolean>;
}

export interface MatchSchedule {
  day: number;
  eastRikishiId: string;
  westRikishiId: string;
  result?: BoutResult;
}

export interface BashoState {
  year: number;
  bashoNumber: 1 | 2 | 3 | 4 | 5 | 6;  // 6 basho per year
  bashoName: string;
  day: number;  // 1-15
  matches: MatchSchedule[];
  standings: Map<string, { wins: number; losses: number }>;
}

export interface WorldState {
  seed: string;
  year: number;
  week: number;
  heyas: Map<string, Heya>;
  rikishi: Map<string, Rikishi>;
  currentBasho?: BashoState;
  history: BashoResult[];
}

export interface BashoResult {
  year: number;
  bashoNumber: number;
  yusho: string;  // winner rikishi ID
  junYusho: string[];
  ginoSho?: string;  // technique prize
  kantosho?: string; // fighting spirit
  shukunsho?: string; // outstanding performance
}
