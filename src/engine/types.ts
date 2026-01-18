// types.ts
// Clean, corrected, drop-in core types for Basho
//
// GOALS (drop-in + matches the modules you’ve been building):
// - Single source of truth for shared types across engine modules
// - Runtime WorldState uses Maps; SaveGame uses JSON-safe SerializedWorldState
// - No duplicate interface names (Heya)
// - RankPosition enforces numbered vs unnumbered at compile time
// - Kimarite types centralized here (avoid circular imports with kimarite.ts)
// - Training types included here (training.ts should import these types to avoid drift)
// - Adds optional hidden fatigue + spendable cash (timeBoundary support)
// - KoenkaiBandType and RunwayBand aligned to sponsors/timeBoundary
//
// IMPORTANT:
// - Engine/internal modules should import from leaf modules, not index.ts.
// - kimarite.ts can refine KimariteId via `as const`, but this file keeps it string-safe.

export type Id = string;
export type IdMap<T> = Record<Id, T>;
/** Runtime maps (NOT JSON-safe) */
export type IdMapRuntime<T> = Map<Id, T>;

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

/** KimariteId stays string here; kimarite.ts can refine via `as const` registry */
export type KimariteId = string;

/**
 * KimariteClass:
 * Keep this in types.ts so kimarite.ts + bout engine share it without circular imports.
 */
export type KimariteClass =
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

/** Archetype stat profiles (shared lookup) */
export const ARCHETYPE_PROFILES: Record<
  TacticalArchetype,
  {
    tachiaiBonus: number;
    gripPreference: number; // -1..+1
    preferredClasses: KimariteClass[];
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
      SPECIAL: 0.75
    }
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
      SPECIAL: 0.8
    }
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
      SPECIAL: 0.9
    }
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
      SPECIAL: 1.1
    }
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
      SPECIAL: 1.0
    }
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
      SPECIAL: 0.9
    }
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
      SPECIAL: 1.05
    }
  }
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

export type NumberedRank = "maegashira" | "juryo" | "makushita" | "sandanme" | "jonidan" | "jonokuchi";
export type UnnumberedRank = "yokozuna" | "ozeki" | "sekiwake" | "komusubi";

export type Side = "east" | "west";

/** Enforce numbered vs unnumbered ranks at compile time */
export type RankPosition =
  | { rank: UnnumberedRank; side: Side; rankNumber?: never }
  | { rank: NumberedRank; rankNumber: number; side: Side };

export function isNumberedRank(rank: Rank): rank is NumberedRank {
  return (
    rank === "maegashira" ||
    rank === "juryo" ||
    rank === "makushita" ||
    rank === "sandanme" ||
    rank === "jonidan" ||
    rank === "jonokuchi"
  );
}

export function toRankPosition(args: { rank: Rank; side: Side; rankNumber?: number }): RankPosition {
  const { rank, side, rankNumber } = args;
  if (isNumberedRank(rank)) {
    if (!rankNumber || rankNumber < 1) throw new Error(`Rank ${rank} requires rankNumber >= 1`);
    return { rank, side, rankNumber };
  }
  return { rank: rank as UnnumberedRank, side };
}

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
  division: Division;
  priorRank: RankPosition;
  wins: number;
  losses: number;
  absences?: number;
  fusenWins?: number;
  fusenLosses?: number;
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
  /** Optional bag of facts for UI/narrative (never required) */
  data?: Record<string, number | string | boolean | null | undefined>;
}

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

/** JSON-safe standings */
export type StandingsTable = Record<Id, { wins: number; losses: number }>;
/** Runtime standings */
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
  /** Spendable cash on hand (recommended; used by timeBoundary) */
  cash: number;

  retirementFund: number;
  careerKenshoWon: number;
  kinboshiCount: number;

  /** Lifetime earnings record (not spendable by default) */
  totalEarnings: number;

  /** Per-basho earnings accumulator */
  currentBashoEarnings: number;

  popularity: number; // 0..100
}

/** =========================
 *  Narrative bands (stable)
 *  ========================= */

export type StatureBand = "legendary" | "powerful" | "established" | "rebuilding" | "fragile" | "new";
export type PrestigeBand = "elite" | "respected" | "modest" | "struggling" | "unknown";
export type FacilitiesBand = "world_class" | "excellent" | "adequate" | "basic" | "minimal";

/** sponsors.ts + timeBoundary.ts aligned union */
export type KoenkaiBandType = "none" | "weak" | "moderate" | "strong" | "powerful";

export type RunwayBand = "secure" | "comfortable" | "tight" | "critical" | "desperate";

/** FTUE */
export interface FTUEState {
  isActive: boolean;
  bashoCompleted: number;
  suppressedEvents: string[];
}

export type StableSelectionMode = "found_new" | "take_over" | "recommended";

/** =========================
 *  Training (shared types)
 *  ========================= */

export type TrainingIntensity = "conservative" | "balanced" | "intensive" | "punishing";
export type TrainingFocus = "power" | "speed" | "technique" | "balance" | "neutral";
export type StyleBias = "oshi" | "yotsu" | "neutral";
export type RecoveryEmphasis = "low" | "normal" | "high";
export type FocusMode = "develop" | "push" | "protect" | "rebuild";

export interface TrainingProfile {
  intensity: TrainingIntensity;
  focus: TrainingFocus;
  styleBias: StyleBias;
  recovery: RecoveryEmphasis;
}

export interface IndividualFocus {
  rikishiId: Id;
  mode: FocusMode;
}

export interface BeyaTrainingState {
  profile: TrainingProfile;
  focusSlots: IndividualFocus[];
  maxFocusSlots: number;
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

  height: number; // cm
  weight: number; // kg

  power: number; // 0..100
  speed: number; // 0..100
  balance: number; // 0..100
  technique: number; // 0..100
  aggression: number; // 0..100
  experience: number; // 0..100 (scaled; not necessarily basho count)

  momentum: number; // -10..+10

  /**
   * Stamina is “in-the-moment readiness/endurance”.
   * Long-term weekly wear is `fatigue` (hidden, optional).
   */
  stamina: number; // 0..100

  /** Hidden long-term wear (0..100). Used by timeBoundary/injuries. */
  fatigue?: number;

  injured: boolean;
  injuryWeeksRemaining: number;

  style: Style;
  archetype: TacticalArchetype;

  division: Division;
  rank: Rank;
  rankNumber?: number;
  side: Side;

  careerWins: number;
  careerLosses: number;
  currentBashoWins: number;
  currentBashoLosses: number;

  favoredKimarite: KimariteId[];
  weakAgainstStyles: Style[];

  economics?: RikishiEconomics;
}

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
  koenkaiBand: KoenkaiBandType;
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

  /** Optional systems */
  trainingState?: BeyaTrainingState;

  descriptor?: string;
  isPlayerOwned?: boolean;
}

export interface BashoResult {
  year: number;
  bashoNumber: 1 | 2 | 3 | 4 | 5 | 6;
  bashoName: BashoName;

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
 *  JSON-SAFE SERIALIZED TYPES
 *  ========================= */

export interface SerializedBashoState {
  year: number;
  bashoNumber: 1 | 2 | 3 | 4 | 5 | 6;
  bashoName: BashoName;
  day: number;
  matches: MatchSchedule[];
  standings: StandingsTable; // JSON safe
}

export interface SerializedWorldState {
  seed: string;
  year: number;
  week: number;
  currentBashoName?: BashoName;

  heyas: IdMap<Heya>;
  rikishi: IdMap<Rikishi>;

  currentBasho?: SerializedBashoState;
  history: BashoResult[];

  ftue: FTUEState;
  playerHeyaId?: Id;

  currentBanzuke?: BanzukeSnapshot;
}

/** =========================
 *  Save Format (persisted)
 *  ========================= */

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

  /** JSON-safe world */
  world: SerializedWorldState;

  saveSlotName?: string;
  playTimeMinutes?: number;
}
