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

// Rank position with side
export interface RankPosition {
  rank: Rank;
  rankNumber?: number;  // e.g., Maegashira 3
  side: "east" | "west";
}

// === BASHO (TOURNAMENT) SYSTEM ===

// The six official basho names
export type BashoName = "hatsu" | "haru" | "natsu" | "nagoya" | "aki" | "kyushu";

// Season for narrative flavor
export type Season = "winter" | "spring" | "summer" | "autumn";

// Full basho information
export interface BashoInfo {
  name: BashoName;
  nameJa: string;        // Japanese name
  nameEn: string;        // English name
  month: number;         // 1-12
  location: string;      // City
  venue: string;         // Arena name
  venueJa: string;       // Japanese venue name
  startDay: number;      // Approximate start day
  season: Season;
  description: string;   // Flavor text
}

// === ECONOMICS SYSTEM ===

// Individual kensho win record
export interface KenshoRecord {
  bashoName: string;
  day: number;
  opponentId: string;
  kenshoCount: number;
  amount: number;
}

// Rikishi economics/finances
export interface RikishiEconomics {
  retirementFund: number;      // Accumulated retirement savings
  careerKenshoWon: number;     // Total kensho banners won
  kinboshiCount: number;       // Gold stars (maegashira beat yokozuna)
  totalEarnings: number;       // Career total earnings
  currentBashoEarnings: number; // This basho's earnings
  popularity: number;          // 0-100, affects kensho attraction
}

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
  
  // Economics (optional, added when needed)
  economics?: RikishiEconomics;
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
  bashoName: BashoName;
  day: number;  // 1-15
  matches: MatchSchedule[];
  standings: Map<string, { wins: number; losses: number }>;
}

// === STABLE STATURE & FTUE ===

// Stable stature bands (implicit difficulty)
export type StatureBand = 
  | "legendary"    // Title contender - Very Easy
  | "powerful"     // Strong contender - Easy  
  | "established"  // Stable competitor - Normal
  | "rebuilding"   // Declining - Hard
  | "fragile"      // At risk - Very Hard
  | "new";         // No buffer - Extreme

// Prestige bands for narrative display
export type PrestigeBand = "elite" | "respected" | "modest" | "struggling" | "unknown";

// Facilities bands
export type FacilitiesBand = "world_class" | "excellent" | "adequate" | "basic" | "minimal";

// Koenkai (supporter group) strength
export type KoenkaiBand = "powerful" | "strong" | "moderate" | "weak" | "none";

// Financial runway bands  
export type RunwayBand = "secure" | "comfortable" | "tight" | "critical" | "desperate";

// FTUE state tracking
export interface FTUEState {
  isActive: boolean;
  bashoCompleted: number;
  suppressedEvents: string[];  // Events delayed until FTUE ends
}

// Stable selection mode
export type StableSelectionMode = "found_new" | "take_over" | "recommended";

// Enhanced Heya with canon-compliant properties
export interface Heya {
  id: string;
  name: string;
  nameJa?: string;
  oyakataId: string;
  rikishiIds: string[];
  
  // Narrative bands (never raw numbers to player)
  statureBand: StatureBand;
  prestigeBand: PrestigeBand;
  facilitiesBand: FacilitiesBand;
  koenkaiBand: KoenkaiBand;
  runwayBand: RunwayBand;
  
  // Internal values (hidden from player)
  reputation: number;  // 0-100
  funds: number;
  facilities: {
    training: number;  // 0-100
    recovery: number;
    nutrition: number;
  };
  
  // Risk indicators for stable selection
  riskIndicators: {
    financial: boolean;
    governance: boolean;
    rivalry: boolean;
  };
  
  // Descriptors for UI
  descriptor?: string;  // One-line flavor text
  isPlayerOwned?: boolean;
}

export interface WorldState {
  seed: string;
  year: number;
  week: number;
  currentBashoName?: BashoName;
  heyas: Map<string, Heya>;
  rikishi: Map<string, Rikishi>;
  currentBasho?: BashoState;
  history: BashoResult[];
  
  // FTUE tracking
  ftue: FTUEState;
  
  // Player's stable
  playerHeyaId?: string;
}

export interface BashoResult {
  year: number;
  bashoNumber: number;
  bashoName: BashoName;
  yusho: string;  // winner rikishi ID
  junYusho: string[];
  ginoSho?: string;  // technique prize
  kantosho?: string; // fighting spirit
  shukunsho?: string; // outstanding performance
  // Prize money awarded
  prizes: {
    yushoAmount: number;
    junYushoAmount: number;
    specialPrizes: number;
  };
}
