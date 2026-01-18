// uiModels.ts
// =======================================================
// UI Models - Engine-safe DTOs for the frontend
// Purpose: provide JSON-safe, stable, display-ready shapes (no Map/Set, no functions)
// =======================================================
//
// Design goals:
// - Do NOT leak hidden engine truth (fatigue, injury risk, morale, etc.) unless explicitly requested.
// - Avoid tight coupling to React; these are plain TS interfaces.
// - Prefer ids + lookups over embedding large objects.
// - Include bilingual labels where useful.
// - Keep deterministic ordering fields (sort keys) for stable UI rendering.
//
// Integration notes:
// - scouting.ts can produce "scouted" narratives; uiModels define shapes to carry them.
// - uiDigest.ts can assemble these models from engine outputs.
//
// This file is safe to export publicly.

import type {
  Id,
  Side,
  Division,
  Rank,
  RankPosition,
  BashoName,
  ConfidenceLevel,
  ScoutingInvestment,
  KimariteId,
  TacticalArchetype,
  Style,
  LeverageClass
} from "./types";

/** =======================================================
 *  Shared / Utility
 *  ======================================================= */

export type UILocale = "en" | "ja" | "bilingual";

export interface UIText {
  en: string;
  ja?: string;
  /** optional combined string already formatted (e.g. "東横綱 (Yokozuna East)") */
  full?: string;
}

export interface UIIconRef {
  /** e.g. "trophy", "injury", "kensho" - UI decides how to map */
  name: string;
  /** optional semantic category */
  tone?: "positive" | "neutral" | "warning" | "danger";
}

export interface UIChip {
  id: string;
  label: string;
  tone?: "default" | "primary" | "success" | "warning" | "danger" | "muted";
  icon?: UIIconRef;
  tooltip?: string;
}

/** Render-safe: always use integers for money in yen */
export type Yen = number;

/** =======================================================
 *  World / Time
 *  ======================================================= */

export interface UITimeState {
  year: number;
  month: number; // 1..12
  week: number; // 1..4 (your model)
  phase: "prebasho" | "basho" | "postbasho" | "interbasho";
  /** optional */
  bashoName?: BashoName;
  bashoNumber?: 1 | 2 | 3 | 4 | 5 | 6;
  /** convenience */
  label?: string; // "2026 Haru • Week 2"
}

/** =======================================================
 *  Public-only Rikishi + Scout layer
 *  ======================================================= */

/** What is always OK to show (never includes hidden stats). */
export interface UIPublicRikishi {
  id: Id;
  shikona: string;
  heyaId?: Id;

  division: Division;
  rank: Rank;
  rankNumber?: number;
  side?: Side;

  heightCm: number;
  weightKg: number;

  /** Only set if known/observed (fog-of-war) */
  style?: Style;
  archetype?: TacticalArchetype;

  /** Visible record during basho, if you display it */
  currentWins?: number;
  currentLosses?: number;

  /** Optional display helpers */
  rankText?: UIText; // computed from scouting.ts formatRankBilingual or UI formatter
  heyaName?: string;
}

/** A single attribute displayed as narrative. */
export interface UIScoutedAttribute {
  value: string; // e.g. "appears powerful"
  confidence: ConfidenceLevel;
  narrative: string; // e.g. "Moderately scouted: appears powerful"
}

/** Bundle for the UI “scouting card” */
export interface UIScoutedAttributes {
  power: UIScoutedAttribute;
  speed: UIScoutedAttribute;
  balance: UIScoutedAttribute;
  technique: UIScoutedAttribute;
  aggression: UIScoutedAttribute;
  experience: UIScoutedAttribute;
}

export interface UIScoutingSummary {
  scoutingLevel: number; // 0..100
  confidence: ConfidenceLevel; // derived from level for convenience
  investment: ScoutingInvestment;
  timesObserved: number;
  lastObservedWeek?: number;
  label?: string; // "Well Scouted"
  description?: string; // "Reliable assessment with minor uncertainty"
}

/** Combined “what the player knows” object for a rikishi detail page. */
export interface UIRikishiScoutView {
  publicInfo: UIPublicRikishi;
  scouting: UIScoutingSummary;
  attributes?: UIScoutedAttributes;

  /** Optional visible chips: "Fan Favorite", "Hot Streak" etc. */
  tags?: UIChip[];
}

/** =======================================================
 *  Heya / Oyakata
 *  ======================================================= */

export type UIStatureBand = "legendary" | "powerful" | "established" | "rebuilding" | "fragile" | "new";
export type UIPrestigeBand = "elite" | "respected" | "modest" | "struggling" | "unknown";
export type UIFacilitiesBand = "world_class" | "excellent" | "adequate" | "basic" | "minimal";
export type UIKoenkaiBand = "powerful" | "strong" | "moderate" | "weak" | "none";
export type UIRunwayBand = "secure" | "comfortable" | "tight" | "critical" | "desperate";

export interface UIHeyaSummary {
  id: Id;
  name: string;
  nameJa?: string;

  statureBand: UIStatureBand;
  prestigeBand: UIPrestigeBand;
  facilitiesBand: UIFacilitiesBand;
  koenkaiBand: UIKoenkaiBand;
  runwayBand: UIRunwayBand;

  /** Visible numbers (avoid hidden rep if you want it fogged) */
  fundsYen?: Yen;

  rosterCount: number;

  descriptor?: string;
  isPlayerOwned?: boolean;

  /** Optional computed chips (e.g. "Financial Risk") */
  tags?: UIChip[];
}

export interface UIOyakataPersonalityView {
  oyakataId: Id;
  heyaId: Id;
  name?: string;

  /** Personality + “voice” */
  personalityArchetype: string; // from oyakataPersonalities.ts
  traits: string[];
  stylePreference?: Style;
  riskTolerance?: number; // 0..100, if you want to show it (optional)

  bio?: string;
}

/** =======================================================
 *  Basho UI models
 *  ======================================================= */

export interface UIBashoHeader {
  year: number;
  bashoNumber: 1 | 2 | 3 | 4 | 5 | 6;
  bashoName: BashoName;

  location?: string;
  venue?: string;

  day: number; // current day
  totalDays: number; // 15 for sekitori, 7 for lower, etc.

  title: string; // "Haru Basho"
  subtitle?: string; // "Osaka • Day 5"
}

export interface UIBoutRow {
  id: string; // deterministic: `${year}-${bashoNumber}-d${day}-${eastId}-${westId}`
  day: number;

  eastId: Id;
  westId: Id;

  /** Names for quick list rendering (UI can also join via lookup) */
  eastName?: string;
  westName?: string;

  /** Optional rank info for each side */
  eastRankText?: string;
  westRankText?: string;

  /** Result */
  completed: boolean;
  winner?: Side;
  kimarite?: KimariteId;
  kimariteName?: string;
  durationSec?: number;
  upset?: boolean;

  /** Lightweight narrative (PBP system can build this) */
  headline?: string;
  summary?: string;

  /** UI tags */
  tags?: UIChip[];
}

export interface UIDivisionStandingsRow {
  rikishiId: Id;
  shikona?: string;

  wins: number;
  losses: number;

  /** sortKey is useful for stable UI ordering */
  sortKey: string;

  /** optional */
  rankText?: string;
  streak?: number; // e.g. +3, -2
  tags?: UIChip[];
}

export interface UIDivisionStandings {
  division: Division;
  title: string; // "Makuuchi"
  rows: UIDivisionStandingsRow[];
}

export interface UIBashoView {
  header: UIBashoHeader;

  /** The schedule list for the currently viewed day (or a whole basho) */
  bouts: UIBoutRow[];

  /** Standings per division */
  standings: UIDivisionStandings[];

  /** Optional “news” strip produced by media.ts */
  media?: UIMediaDigest;

  /** Optional “events” strip produced by events.ts */
  events?: UIEventDigest;

  /** Optional “rivalries” widget */
  rivalries?: UIRivalryDigest;
}

/** =======================================================
 *  Mechanics explanation panels (optional)
 *  ======================================================= */

export interface UILeveragePanel {
  leverageClass: LeverageClass;
  description: string;
  chips?: UIChip[];
}

/** =======================================================
 *  Rivalries / Media / Events digests (engine outputs)
 *  ======================================================= */

export interface UIRivalryDigestItem {
  rivalryId: string;
  aId: Id;
  bId: Id;
  aName?: string;
  bName?: string;

  intensity: number; // 0..100
  heatLabel?: string; // "Smoldering", "Blood Feud"
  reason?: string;

  tags?: UIChip[];
}

export interface UIRivalryDigest {
  items: UIRivalryDigestItem[];
}

export interface UIMediaStory {
  id: string;
  title: string;
  body: string;
  tone: "positive" | "neutral" | "negative";
  relatedRikishiIds?: Id[];
  relatedHeyaIds?: Id[];
  tags?: UIChip[];
}

export interface UIMediaDigest {
  stories: UIMediaStory[];
}

export interface UIEventCard {
  id: string;
  title: string;
  body: string;
  tone: "positive" | "neutral" | "warning" | "danger";
  when: "weekly" | "monthly" | "basho_day" | "instant";
  relatedRikishiIds?: Id[];
  relatedHeyaIds?: Id[];
  tags?: UIChip[];
}

export interface UIEventDigest {
  events: UIEventCard[];
}

/** =======================================================
 *  UI Digest root (one payload for the app)
 *  ======================================================= */

export interface UIDigestPayload {
  time: UITimeState;

  /** key lookups */
  heyas: Record<Id, UIHeyaSummary>;
  rikishi: Record<Id, UIRikishiScoutView>;

  /** Optional active basho UI */
  basho?: UIBashoView;

  /** Optional top-level “toasts” */
  notifications?: UIEventCard[];

  /** Deterministic ordering support */
  ordering?: {
    heyaIds: Id[];
    rikishiIds: Id[];
  };

  /** Useful for debugging (hide in prod UI) */
  debug?: {
    seed?: string;
    worldYear?: number;
  };
}
