// Clean, corrected, drop-in core types for Basho
// Goals:
// - No duplicate interface names (Heya)
// - No Map in persisted state (JSON-safe, deterministic)
// - Strong RankPosition (numbered vs unnumbered enforced)
// - Kimarite registry types integrated (KimariteId / KimariteClass / KimariteFamily)
// - Banzuke snapshot + basho performance types to support canonical slot-based builder

/** =========================
 *  Utility
 *  ========================= */

export type Id = string;
export type IdMap<T> = Record<string, T>;
/** Map-based IdMap for runtime - use Object.values() to iterate */
export type IdMapRuntime<T> = Map<string, T>;

/** =========================
 *  Combat / Style
 *  ========================= */

export type Style = "oshi" | "yotsu" | "hybrid";

export type Stance =
  | "migi-yotsu"
  | "hidari-yotsu"
  | "no-grip"
  | "belt-dominant"
  | "push-dominant";

/** Tactical Archetypes (canon) */
export type TacticalArchetype =
  | "oshi_specialist"
  | "yotsu_specialist"
  | "speedster"
  | "trickster"
  | "all_rounder"
  | "hybrid_oshi_yotsu"
  | "counter_specialist";

/** Kimarite families used for bias tables */
export type KimariteFamily =
  | "OSHI"
  | "YOTSU"
  | "THROW"
  | "TRIP"
  | "PULLDOWN"
  | "REVERSAL"
  | "SPECIAL";

// Note: KimariteClass is re-exported from kimarite.ts - import from there for the full type
// This is the subset needed for ARCHETYPE_PROFILES to avoid circular deps
type KimariteClassLite =
  | "force_out"
  | "push"
  | "thrust"
  | "throw"
  | "trip"
  | "twist"
  | "slap_pull"
  | "lift"
  | "rear"
  | "evasion"
  | "special"
  | "forfeit";

/** Archetype stat profiles */
export const ARCHETYPE_PROFILES: Record<
  TacticalArchetype,
  {
    tachiaiBonus: number;
    gripPreference: number; // -1..+1
    preferredClasses: KimariteClassLite[];
    volatility: number; // 0..1
    counterBonus: number;
    baseRisk: number; // 0..1
    familyBias: Record<KimariteFamily, number>;
  }
> = {
  oshi_specialist: {
    tachiaiBonus: 8,
    gripPreference: -0.5,
    preferredClasses: ["force_out", "push", "thrust"],
    volatility: 0.2,
    counterBonus: 0,
    baseRisk: 0.6,
    familyBias: {
      OSHI: 1.45,
      YOTSU: 0.85,
      THROW: 0.9,
      TRIP: 0.95,
      PULLDOWN: 0.8,
      REVERSAL: 0.9,
      SPECIAL: 0.75,
    },
  },
  yotsu_specialist: {
    tachiaiBonus: -3,
    gripPreference: 1,
    preferredClasses: ["throw", "lift", "twist"],
    volatility: 0.15,
    counterBonus: 5,
    baseRisk: 0.45,
    familyBias: {
      OSHI: 0.85,
      YOTSU: 1.4,
      THROW: 1.35,
      TRIP: 0.95,
      PULLDOWN: 0.8,
      REVERSAL: 1.05,
      SPECIAL: 0.8,
    },
  },
  speedster: {
    tachiaiBonus: 5,
    gripPreference: -0.3,
    preferredClasses: ["trip", "slap_pull", "evasion"],
    volatility: 0.5,
    counterBonus: 8,
    baseRisk: 0.55,
    familyBias: {
      OSHI: 0.95,
      YOTSU: 0.9,
      THROW: 0.95,
      TRIP: 1.45,
      PULLDOWN: 1.0,
      REVERSAL: 1.1,
      SPECIAL: 0.9,
    },
  },
  trickster: {
    tachiaiBonus: 0,
    gripPreference: 0,
    preferredClasses: ["slap_pull", "trip", "special"],
    volatility: 0.6,
    counterBonus: 12,
    baseRisk: 0.65,
    familyBias: {
      OSHI: 0.9,
      YOTSU: 0.85,
      THROW: 0.9,
      TRIP: 1.05,
      PULLDOWN: 1.45,
      REVERSAL: 1.25,
      SPECIAL: 1.1,
    },
  },
  all_rounder: {
    tachiaiBonus: 2,
    gripPreference: 0,
    preferredClasses: ["force_out", "throw", "push"],
    volatility: 0.25,
    counterBonus: 3,
    baseRisk: 0.5,
    familyBias: {
      OSHI: 1.0,
      YOTSU: 1.0,
      THROW: 1.0,
      TRIP: 1.0,
      PULLDOWN: 1.0,
      REVERSAL: 1.0,
      SPECIAL: 1.0,
    },
  },
  hybrid_oshi_yotsu: {
    tachiaiBonus: 3,
    gripPreference: 0.2,
    preferredClasses: ["force_out", "throw", "push", "lift"],
    volatility: 0.3,
    counterBonus: 5,
    baseRisk: 0.52,
    familyBias: {
      OSHI: 1.2,
      YOTSU: 1.2,
      THROW: 1.1,
      TRIP: 0.95,
      PULLDOWN: 0.85,
      REVERSAL: 1.05,
      SPECIAL: 0.9,
    },
  },
  counter_specialist: {
    tachiaiBonus: -2,
    gripPreference: 0.3,
    preferredClasses: ["throw", "trip"],
    volatility: 0.35,
    counterBonus: 15,
    baseRisk: 0.48,
    familyBias: {
      OSHI: 0.9,
      YOTSU: 1.0,
      THROW: 1.1,
      TRIP: 1.1,
      PULLDOWN: 0.9,
      REVERSAL: 1.5,
      SPECIAL: 1.05,
    },
  },
};

/** =========================
 *  Division / Rank / Banzuke
 *  ========================= */

export type Division = "makuuchi" | "juryo" | "makushita" | "sandanme" | "jonidan" | "jonokuchi";

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

/** Enforce numbered vs unnumbered ranks at compile time */
export type NumberedRank = "maegashira" | "juryo" | "makushita" | "sandanme" | "jonidan" | "jonokuchi";
export type UnnumberedRank = "yokozuna" | "ozeki" | "sekiwake" | "komusubi";

export type Side = "east" | "west";

export type RankPosition =
  | { rank: UnnumberedRank; side: Side; rankNumber?: never }
  | { rank: NumberedRank; rankNumber: number; side: Side };

/** Canon banzuke snapshot (ordered slots + assignments) */
export interface BanzukeAssignment {
  rikishiId: Id;
  position: RankPosition;
}

export interface DivisionBanzukeSnapshot {
  division: Division;
  /** Canonical slot list (ordered): E/W alternation is represented here */
  slots: RankPosition[];
  /** Who occupies slots this basho */
  assignments: BanzukeAssignment[];
}

export interface BanzukeSnapshot {
  year: number;
  bashoNumber: 1 | 2 | 3 | 4 | 5 | 6;
  divisions: Record<Division, DivisionBanzukeSnapshot>;
}

/** Basho performance input for banzuke building (deterministic sorting) */
export interface RikishiBashoPerformance {
  rikishiId: Id;
  division: Division; // division during the basho
  priorRank: RankPosition;
  wins: number;
  losses: number;
  absences?: number;
  fusenWins?: number;
  fusenLosses?: number;
  /** Strength-of-schedule proxy; higher = harder opposition */
  sos?: number;
}

/** =========================
 *  Basho (Tournament)
 *  ========================= */

export type BashoName = "hatsu" | "haru" | "natsu" | "nagoya" | "aki" | "kyushu";
export type Season = "winter" | "spring" | "summer" | "autumn";

export interface BashoInfo {
  name: BashoName;
  nameJa: string;
  nameEn: string;
  month: number; // 1..12
  location: string;
  venue: string;
  venueJa: string;
  startDay: number;
  season: Season;
  description: string;
}

export interface BoutLogEntry {
  phase: "tachiai" | "clinch" | "momentum" | "finish";
  description: string;
  data: Record<string, number | string | boolean>;
}

/** KimariteId stays string here; you can optionally refine it in kimarite.ts via `as const` registry */
export type KimariteId = string;

export interface BoutResult {
  winner: Side;
  winnerRikishiId: Id;
  loserRikishiId: Id;
  kimarite: KimariteId;
  kimariteName: string;
  stance: Stance;
  tachiaiWinner: Side;
  duration: number;
  upset: boolean;
  log: BoutLogEntry[];
}

export interface MatchSchedule {
  day: number;
  eastRikishiId: Id;
  westRikishiId: Id;
  result?: BoutResult;
}

/** JSON-safe standings - use Map at runtime */
export type StandingsTable = Record<Id, { wins: number; losses: number }>;
export type StandingsTableRuntime = Map<Id, { wins: number; losses: number }>;

export interface BashoState {
  year: number;
  bashoNumber: 1 | 2 | 3 | 4 | 5 | 6;
  bashoName: BashoName;
  day: number; // 1..15 (sekitori)
  matches: MatchSchedule[];
  standings: StandingsTableRuntime;
}

/** =========================
 *  Economics
 *  ========================= */

export interface KenshoRecord {
  bashoName: BashoName;
  day: number;
  opponentId: Id;
  kenshoCount: number;
  amount: number;
}

export interface RikishiEconomics {
  retirementFund: number;
  careerKenshoWon: number;
  kinboshiCount: number;
  totalEarnings: number;
  currentBashoEarnings: number;
  popularity: number; // 0..100
}

/** =========================
 *  Rikishi / Heya / World
 *  ========================= */

export interface Rikishi {
  id: Id;
  shikona: string;
  realName?: string;
  heyaId: Id;
  nationality: string;

  height: number;
  weight: number;

  power: number;
  speed: number;
  balance: number;
  technique: number;
  aggression: number;
  experience: number;

  momentum: number; // -10..+10
  stamina: number; // 0..100
  injured: boolean;
  injuryWeeksRemaining: number;

  style: Style;
  archetype: TacticalArchetype;

  /** Division placement */
  division: Division;
  /** Rank within the division */
  rank: Rank;
  /** Rank number for numbered ranks (maegashira 1, juryo 5, etc.) */
  rankNumber?: number;
  /** East or West side of banzuke */
  side: Side;

  careerWins: number;
  careerLosses: number;
  currentBashoWins: number;
  currentBashoLosses: number;

  favoredKimarite: KimariteId[];
  weakAgainstStyles: Style[];

  economics?: RikishiEconomics;
}

/** Narrative bands */
export type StatureBand = "legendary" | "powerful" | "established" | "rebuilding" | "fragile" | "new";
export type PrestigeBand = "elite" | "respected" | "modest" | "struggling" | "unknown";
export type FacilitiesBand = "world_class" | "excellent" | "adequate" | "basic" | "minimal";
export type KoenkaiBand = "powerful" | "strong" | "moderate" | "weak" | "none";
export type RunwayBand = "secure" | "comfortable" | "tight" | "critical" | "desperate";

/** FTUE */
export interface FTUEState {
  isActive: boolean;
  bashoCompleted: number;
  suppressedEvents: string[];
}

export type StableSelectionMode = "found_new" | "take_over" | "recommended";

/** SINGLE heya definition (no duplicates) */
export interface Heya {
  id: Id;
  name: string;
  nameJa?: string;
  oyakataId: Id;
  rikishiIds: Id[];

  statureBand: StatureBand;
  prestigeBand: PrestigeBand;
  facilitiesBand: FacilitiesBand;
  koenkaiBand: KoenkaiBand;
  runwayBand: RunwayBand;

  reputation: number; // 0..100 (hidden)
  funds: number;
  facilities: {
    training: number;
    recovery: number;
    nutrition: number;
  };

  riskIndicators: {
    financial: boolean;
    governance: boolean;
    rivalry: boolean;
  };

  descriptor?: string;
  isPlayerOwned?: boolean;
}

export interface BashoResult {
  year: number;
  bashoNumber: 1 | 2 | 3 | 4 | 5 | 6;
  bashoName: BashoName;

  /** Makuuuchi yusho by default; expand later for division-specific results if needed */
  yusho: Id;
  junYusho: Id[];

  ginoSho?: Id;
  kantosho?: Id;
  shukunsho?: Id;

  prizes: {
    yushoAmount: number;
    junYushoAmount: number;
    specialPrizes: number;
  };

  /** Pointer to the banzuke snapshot after this basho */
  nextBanzuke?: BanzukeSnapshot;
}

/** Runtime world state - uses Maps for efficient lookups */
export interface WorldState {
  seed: string;
  year: number;
  week: number;
  currentBashoName?: BashoName;

  heyas: IdMapRuntime<Heya>;
  rikishi: IdMapRuntime<Rikishi>;

  currentBasho?: BashoState;
  history: BashoResult[];

  ftue: FTUEState;
  playerHeyaId?: Id;

  /** last published banzuke (authoritative placement) */
  currentBanzuke?: BanzukeSnapshot;
}


/** =========================
 *  Save Format (planned)
 *  =========================
 * Keep this as your top-level persisted object.
 * - `version` enables migrations
 * - everything is JSON-native (no Map/Set)
 * - snapshots are deterministic & replayable
 */

export type SaveVersion = "1.0.0";

export interface SaveGame {
  version: SaveVersion;
  createdAtISO: string;
  lastSavedAtISO: string;

  /** Future-proof: store options affecting determinism */
  ruleset: {
    banzukeAlgorithm: "slot_fill_v1";
    kimariteRegistryVersion: string; // e.g. "82_official_v1"
  };

  world: WorldState;
}
