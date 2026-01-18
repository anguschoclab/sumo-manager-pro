// scouting.ts
// Fog of War & Scouting System v1.0 — Canon-aligned deterministic player-knowledge layer
// Per Scouting Documentation: separates Engine Truth from Player Knowledge
// "You never know the truth — only what the ring has allowed you to see."

import seedrandom from "seedrandom";
import type { Rikishi } from "./types";
import { describeAttribute, describeAggression, describeExperience } from "./narrativeDescriptions";

// === Confidence levels for scouted information ===
export type ConfidenceLevel = "unknown" | "low" | "medium" | "high" | "certain";

// Scouting investment levels per documentation
export type ScoutingInvestment = "none" | "light" | "standard" | "deep";

export type AttributeType = "physical" | "combat" | "style" | "hidden";

// --- Public info: what is always visible on banzuke / broadcasts ---
export interface PublicRikishiInfo {
  id: string;
  shikona: string;
  heyaId?: string;
  rank: string;
  rankNumber?: number;
  side?: "east" | "west";
  height: number;
  weight: number;

  // Style/archetype are only revealed via observation/investment if your UI wants
  style?: string;
  archetype?: string;

  currentBashoWins?: number;
  currentBashoLosses?: number;
}

// Optional cached numeric snapshot for deterministic UI fog calculations.
// This prevents runtime errors when UI calls getScoutedAttributes(scouted) without passing truth/seed.
export interface ScoutedAttributeTruthSnapshot {
  power: number;
  speed: number;
  balance: number;
  technique: number;
  aggression: number;
  experience: number;
}

// What the player knows about a rikishi (knowledge wrapper)
export interface ScoutedRikishi {
  rikishiId: string;

  // Public-facing info cache (safe to store)
  publicInfo: PublicRikishiInfo;

  // Player’s stable => full knowledge (engine can reveal truth at view time)
  isOwned: boolean;

  // Observation state
  timesObserved: number; // number of bouts watched
  lastObservedWeek: number; // world.week when last seen

  scoutingInvestment: ScoutingInvestment;

  // Computed scouting percentage (0-100)
  scoutingLevel: number;

  // ✅ NEW: always-present truth snapshot (numbers never shown directly; used to generate narratives)
  // This is still "engine truth" but stored to prevent UI from needing to pass `truth`.
  attributes: ScoutedAttributeTruthSnapshot;
}

// ============================================
// SCOUTING LEVEL + CONFIDENCE
// ============================================

export function calculateScoutingLevel(
  isOwned: boolean,
  observations: number,
  investment: ScoutingInvestment
): number {
  if (isOwned) return 100;

  // Passive observation: max 30%
  const passiveBase = Math.min(30, Math.max(0, observations) * 2);

  // Investment bonus (doc: investment drives confidence)
  const investmentBonus: Record<ScoutingInvestment, number> = {
    none: 0,
    light: 20,
    standard: 40,
    deep: 60
  };

  return clampInt(passiveBase + investmentBonus[investment], 0, 100);
}

export function getConfidenceFromLevel(level: number): ConfidenceLevel {
  if (level >= 95) return "certain";
  if (level >= 70) return "high";
  if (level >= 40) return "medium";
  if (level >= 15) return "low";
  return "unknown";
}

export function getConfidenceLevel(scouted: ScoutedRikishi, attributeType: AttributeType): ConfidenceLevel {
  if (scouted.isOwned) return "certain";

  if (attributeType === "physical") return "certain";
  if (attributeType === "hidden") return "unknown";

  if (attributeType === "style") {
    if (scouted.timesObserved >= 3) return "high";
    if (scouted.timesObserved >= 1) return "medium";
    return "low";
  }

  // combat
  return getConfidenceFromLevel(scouted.scoutingLevel);
}

// ============================================
// DETERMINISTIC UNCERTAINTY
// ============================================

/**
 * Deterministically estimate a trueValue given confidence + seed.
 * - unknown returns midpoint of range (default range 0..100)
 * - uses uniform deterministic rng (seedrandom), avoids modulo bias
 */
export function getEstimatedValue(
  trueValue: number,
  confidence: ConfidenceLevel,
  seed: string,
  range: { min: number; max: number } = { min: 0, max: 100 }
): number {
  const min = range.min;
  const max = range.max;

  if (confidence === "certain") return clamp(trueValue, min, max);
  if (confidence === "unknown") return (min + max) / 2;

  // Error bands (percent points in 0..100 space; mapped to range)
  const maxErrorPct: Record<Exclude<ConfidenceLevel, "certain" | "unknown">, number> = {
    low: 35,    // doc: ±30–40
    medium: 20, // doc: ±15–25
    high: 9     // doc: ±5–10
  };

  const rng = seedrandom(seed);
  const sign = rng() < 0.5 ? -1 : 1;
  const magPct = rng() * maxErrorPct[confidence];

  const span = max - min;
  const error = (magPct / 100) * span * sign;

  return clamp(trueValue + error, min, max);
}

// Narrative description with confidence qualifier
export function getAttributeNarrative(
  _attribute: string,
  estimatedValue: number,
  confidence: ConfidenceLevel
): { description: string; qualifier: string } {
  if (confidence === "unknown") {
    return { description: "Unknown", qualifier: "Insufficient observation" };
  }

  const estimatedLevel = describeAttribute(estimatedValue);

  const qualifiers: Record<ConfidenceLevel, string> = {
    certain: "",
    high: "",
    medium: "appears",
    low: "may be",
    unknown: "unknown"
  };

  const q = qualifiers[confidence];
  const description = q ? `${q} ${estimatedLevel.toLowerCase()}` : estimatedLevel;

  return { description, qualifier: getConfidenceText(confidence) };
}

function getConfidenceText(confidence: ConfidenceLevel): string {
  switch (confidence) {
    case "certain":
      return "Full knowledge";
    case "high":
      return "Well-observed";
    case "medium":
      return "Moderately scouted";
    case "low":
      return "Limited observation";
    case "unknown":
      return "No reliable data";
  }
}

// ============================================
// SCOUTED VIEW CREATION + UPDATES
// ============================================

export function createPublicInfo(r: Rikishi): PublicRikishiInfo {
  return {
    id: r.id,
    shikona: r.shikona,
    heyaId: r.heyaId,
    rank: r.rank,
    rankNumber: (r as any).rankNumber,
    side: (r as any).side,
    height: r.height,
    weight: r.weight,
    currentBashoWins: (r as any).currentBashoWins,
    currentBashoLosses: (r as any).currentBashoLosses
  };
}

function buildTruthSnapshot(r: Rikishi): ScoutedAttributeTruthSnapshot {
  return {
    power: safeNum((r as any).power, 0),
    speed: safeNum((r as any).speed, 0),
    balance: safeNum((r as any).balance, 0),
    technique: safeNum((r as any).technique, 0),
    aggression: safeNum((r as any).aggression, 0),
    experience: safeNum((r as any).experience, 0)
  };
}

export function createScoutedView(
  rikishi: Rikishi,
  playerHeyaId: string | null,
  observationCount: number = 0,
  investment: ScoutingInvestment = "none",
  currentWeek: number = 0
): ScoutedRikishi {
  const isOwned = rikishi.heyaId === playerHeyaId;
  const scoutingLevel = calculateScoutingLevel(isOwned, observationCount, investment);

  return {
    rikishiId: rikishi.id,
    publicInfo: createPublicInfo(rikishi),
    isOwned,
    timesObserved: Math.max(0, observationCount),
    lastObservedWeek: currentWeek,
    scoutingInvestment: investment,
    scoutingLevel,
    // ✅ always present, prevents undefined crashes in UI
    attributes: buildTruthSnapshot(rikishi)
  };
}

/** Record an observation (watching a bout) deterministically. */
export function recordObservation(scouted: ScoutedRikishi, currentWeek: number): ScoutedRikishi {
  const timesObserved = scouted.timesObserved + 1;
  const scoutingLevel = calculateScoutingLevel(scouted.isOwned, timesObserved, scouted.scoutingInvestment);

  return {
    ...scouted,
    timesObserved,
    lastObservedWeek: currentWeek,
    scoutingLevel
  };
}

/**
 * Optional: weekly intel decay if not observed (keeps fog meaningful).
 * - does NOT affect owned wrestlers
 * - only reduces passive portion; investment remains
 */
export function applyScoutingDecay(scouted: ScoutedRikishi, currentWeek: number): ScoutedRikishi {
  if (scouted.isOwned) return scouted;

  const weeksSince = Math.max(0, currentWeek - scouted.lastObservedWeek);
  if (weeksSince <= 0) return scouted;

  // Lose 1 observation “worth” every 4 weeks unseen (tunable)
  const lost = Math.floor(weeksSince / 4);
  if (lost <= 0) return scouted;

  const timesObserved = Math.max(0, scouted.timesObserved - lost);
  const scoutingLevel = calculateScoutingLevel(false, timesObserved, scouted.scoutingInvestment);

  return { ...scouted, timesObserved, scoutingLevel };
}

// ============================================
// DISPLAY-READY ATTRIBUTES (NARRATIVE ONLY)
// ============================================

export interface ScoutedAttribute {
  value: string; // narrative-only
  confidence: ConfidenceLevel;
  narrative: string; // includes qualifier
}

export interface ScoutedAttributes {
  power: ScoutedAttribute;
  speed: ScoutedAttribute;
  balance: ScoutedAttribute;
  technique: ScoutedAttribute;
  aggression: ScoutedAttribute;
  experience: ScoutedAttribute;
}

/**
 * Build display attributes for UI.
 *
 * ✅ Backward compatible:
 * - UI can call: getScoutedAttributes(scouted)
 * - OR: getScoutedAttributes(scouted, truthRikishi, worldSeed)
 *
 * If truth/seed are omitted, we fall back to scouted.attributes and a deterministic local seed.
 */
export function getScoutedAttributes(
  scouted: ScoutedRikishi,
  truth?: Rikishi,
  seed?: string
): ScoutedAttributes {
  const isOwned = scouted.isOwned;

  // Prefer explicit truth; otherwise use cached snapshot.
  const snapshot: ScoutedAttributeTruthSnapshot | null = truth
    ? buildTruthSnapshot(truth)
    : scouted?.attributes
    ? scouted.attributes
    : null;

  // Deterministic seed fallback (still stable; better if you pass world.seed)
  const baseSeed =
    typeof seed === "string" && seed.length > 0
      ? seed
      : `scout-${scouted.rikishiId}-${scouted.lastObservedWeek}-${scouted.timesObserved}-${scouted.scoutingInvestment}`;

  // If something is badly wrong, never crash the UI.
  if (!snapshot) {
    const unknown: ScoutedAttribute = { value: "Unknown", confidence: "unknown", narrative: "No reliable data" };
    return {
      power: unknown,
      speed: unknown,
      balance: unknown,
      technique: unknown,
      aggression: unknown,
      experience: unknown
    };
  }

  const getAttr = (attr: "power" | "speed" | "balance" | "technique", value: number): ScoutedAttribute => {
    const confidence = getConfidenceLevel(scouted, "combat");

    if (isOwned || confidence === "certain") {
      const label = describeAttribute(value);
      return { value: label, confidence: "certain", narrative: label };
    }

    if (confidence === "unknown") {
      return { value: "Unknown", confidence, narrative: "Insufficient observation to assess" };
    }

    const estimated = getEstimatedValue(value, confidence, `${baseSeed}-${scouted.rikishiId}-${attr}`);
    const { description, qualifier } = getAttributeNarrative(attr, estimated, confidence);

    return { value: description, confidence, narrative: `${qualifier}: ${description}` };
  };

  const getAgg = (value: number): ScoutedAttribute => {
    const confidence = getConfidenceLevel(scouted, "combat");

    if (isOwned || confidence === "certain") {
      const label = describeAggression(value);
      return { value: label, confidence: "certain", narrative: label };
    }

    if (confidence === "unknown") {
      return { value: "Unknown", confidence, narrative: "Insufficient observation to assess" };
    }

    const estimated = getEstimatedValue(value, confidence, `${baseSeed}-${scouted.rikishiId}-aggression`);
    const q = confidence === "medium" ? "appears" : confidence === "low" ? "may be" : "";
    const label = describeAggression(estimated);
    const desc = q ? `${q} ${label.toLowerCase()}` : label;

    return { value: desc, confidence, narrative: `${getConfidenceText(confidence)}: ${desc}` };
  };

  const getExp = (value: number): ScoutedAttribute => {
    const confidence = getConfidenceLevel(scouted, "combat");

    if (isOwned || confidence === "certain") {
      const label = describeExperience(value);
      return { value: label, confidence: "certain", narrative: label };
    }

    if (confidence === "unknown") {
      return { value: "Unknown", confidence, narrative: "Insufficient observation to assess" };
    }

    // Experience might not be 0..100 depending on your design; use a sane prose range
    const estimated = getEstimatedValue(value, confidence, `${baseSeed}-${scouted.rikishiId}-experience`, { min: 0, max: 80 });
    const q = confidence === "medium" ? "appears" : confidence === "low" ? "may be" : "";
    const label = describeExperience(estimated);
    const desc = q ? `${q} ${label.toLowerCase()}` : label;

    return { value: desc, confidence, narrative: `${getConfidenceText(confidence)}: ${desc}` };
  };

  return {
    power: getAttr("power", snapshot.power),
    speed: getAttr("speed", snapshot.speed),
    balance: getAttr("balance", snapshot.balance),
    technique: getAttr("technique", snapshot.technique),
    aggression: getAgg(snapshot.aggression),
    experience: getExp(snapshot.experience)
  };
}

// ============================================
// UI HELPERS
// ============================================

export function describeScoutingLevel(level: number): { label: string; description: string; color: string } {
  if (level >= 95) return { label: "Complete", description: "Full knowledge of this wrestler", color: "text-primary" };
  if (level >= 70) return { label: "Well Scouted", description: "Reliable assessment with minor uncertainty", color: "text-success" };
  if (level >= 40) return { label: "Moderate Intel", description: "General picture but gaps remain", color: "text-warning" };
  if (level >= 15) return { label: "Limited", description: "Basic observations only", color: "text-orange-500" };
  return { label: "Unknown", description: "Insufficient data", color: "text-muted-foreground" };
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function clampInt(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, Math.trunc(value)));
}

function safeNum(v: any, fallback: number): number {
  return typeof v === "number" && Number.isFinite(v) ? v : fallback;
}

// ============================================
// BILINGUAL TERMINOLOGY (canon)
// ============================================

export const RANK_NAMES: Record<string, { ja: string; en: string }> = {
  yokozuna: { ja: "横綱", en: "Yokozuna" },
  ozeki: { ja: "大関", en: "Ozeki" },
  sekiwake: { ja: "関脇", en: "Sekiwake" },
  komusubi: { ja: "小結", en: "Komusubi" },
  maegashira: { ja: "前頭", en: "Maegashira" },
  juryo: { ja: "十両", en: "Juryo" },
  makushita: { ja: "幕下", en: "Makushita" },
  sandanme: { ja: "三段目", en: "Sandanme" },
  jonidan: { ja: "序二段", en: "Jonidan" },
  jonokuchi: { ja: "序ノ口", en: "Jonokuchi" }
};

export const SIDE_NAMES: Record<"east" | "west", { ja: string; en: string }> = {
  east: { ja: "東", en: "East" },
  west: { ja: "西", en: "West" }
};

export const ARCHETYPE_NAMES: Record<string, { label: string; labelJa: string; description: string }> = {
  oshi_specialist: { label: "Oshi Specialist", labelJa: "押し相撲", description: "Overwhelms with forward pressure" },
  yotsu_specialist: { label: "Yotsu Specialist", labelJa: "四つ相撲", description: "Excels when grips are secured" },
  speedster: { label: "Speedster", labelJa: "速攻型", description: "Lightning quick, relies on timing" },
  trickster: { label: "Trickster", labelJa: "技師", description: "Deep bag of tricks and surprise moves" },
  all_rounder: { label: "All-Rounder", labelJa: "万能型", description: "Versatile and adaptable" },
  hybrid_oshi_yotsu: { label: "Hybrid", labelJa: "押し四つ両刀", description: "Switches between oshi and yotsu fluidly" },
  counter_specialist: { label: "Counter Specialist", labelJa: "返し技", description: "Invites attacks and reverses them" }
};

export const STYLE_NAMES: Record<string, { label: string; labelJa: string; description: string }> = {
  oshi: { label: "Oshi", labelJa: "押し", description: "Prefers pushing and thrusting" },
  yotsu: { label: "Yotsu", labelJa: "四つ", description: "Seeks the belt, uses grips to control" },
  hybrid: { label: "Hybrid", labelJa: "万能", description: "Comfortable both pushing and on the belt" }
};

export function formatRankBilingual(
  rank: string,
  rankNumber?: number,
  side?: "east" | "west"
): { ja: string; en: string; full: string } {
  const rankInfo = RANK_NAMES[rank] || { ja: rank, en: rank };
  const sideInfo = side ? SIDE_NAMES[side] : null;

  const hasNum = typeof rankNumber === "number" && Number.isFinite(rankNumber) && rankNumber > 0;

  let jaCore = hasNum ? `${rankInfo.ja}${rankNumber}` : rankInfo.ja;
  let enCore = hasNum ? `${rankInfo.en} ${rankNumber}` : rankInfo.en;

  if (sideInfo) {
    jaCore = `${sideInfo.ja}${jaCore}`;
    enCore = `${enCore} ${sideInfo.en}`;
  }

  return { ja: jaCore, en: enCore, full: `${jaCore} (${enCore})` };
}
