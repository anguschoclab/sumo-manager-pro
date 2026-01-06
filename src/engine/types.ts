// Core game types for Basho - Sumo Management Sim

export type Style = "oshi" | "yotsu" | "hybrid";
export type Stance = "migi-yotsu" | "hidari-yotsu" | "no-grip" | "belt-dominant" | "push-dominant";

// Tactical Archetypes - define fighting approach and kimarite preferences
export type TacticalArchetype = 
  | "oshi_specialist"   // Pusher/Thruster - high power, aggression, strong tachiai
  | "yotsu_specialist"  // Belt Fighter - seeks grip, throws, methodical
  | "speedster"         // Explosive/Evasive - lateral movement, trips, volatile
  | "trickster"         // Chaos Merchant - henka, slap/pulls, surprise moves
  | "all_rounder";      // Balanced - adapts to opponent, small synergy bonus

// Archetype stat profiles for simulation
export const ARCHETYPE_PROFILES: Record<TacticalArchetype, {
  tachiaiBonus: number;      // Bonus to initial charge
  gripPreference: number;    // -1 = avoid grip, 0 = neutral, +1 = seek grip
  preferredClasses: string[]; // Kimarite classes this archetype excels at
  volatility: number;        // 0-1, higher = more variable outcomes
  counterBonus: number;      // Bonus to counter-attack probability
}> = {
  oshi_specialist: {
    tachiaiBonus: 8,
    gripPreference: -0.5,
    preferredClasses: ["force_out", "push", "thrust"],
    volatility: 0.2,
    counterBonus: 0
  },
  yotsu_specialist: {
    tachiaiBonus: -3,
    gripPreference: 1,
    preferredClasses: ["throw", "lift", "twist"],
    volatility: 0.15,
    counterBonus: 5
  },
  speedster: {
    tachiaiBonus: 5,
    gripPreference: -0.3,
    preferredClasses: ["trip", "slap_pull", "evasion"],
    volatility: 0.5,
    counterBonus: 8
  },
  trickster: {
    tachiaiBonus: 0,
    gripPreference: 0,
    preferredClasses: ["slap_pull", "trip", "special"],
    volatility: 0.6,
    counterBonus: 12
  },
  all_rounder: {
    tachiaiBonus: 2,
    gripPreference: 0,
    preferredClasses: ["force_out", "throw", "push"],
    volatility: 0.25,
    counterBonus: 3
  }
};

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
  archetype: TacticalArchetype;  // Fighting approach
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
