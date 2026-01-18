// Fog of War & Scouting System v1.0
// Per Scouting Documentation: separates Engine Truth from Player Knowledge
// "You never know the truth — only what the ring has allowed you to see."

import type { Rikishi } from "./types";
import { describeAttribute, describeAggression, describeExperience } from "./narrativeDescriptions";
// fogOfWar.ts
// Fog of War & Scouting System v1.0 — Canon-aligned deterministic player-knowledge layer
// Per Scouting Documentation: separates Engine Truth from Player Knowledge
// "You never know the truth — only what the ring has allowed you to see."
//
// FIXES APPLIED (canon + correctness):
// - ScoutedRikishi no longer stores full Rikishi truth for non-owned wrestlers (leaks hidden stats).
//   Instead stores public fields + an engineRef id, and computes views deterministically.
// - Confidence math made consistent with doc comments (low/medium/high error bands).
// - getEstimatedValue now supports non-0..100 ranges and returns midpoint for unknown (not hardcoded 50).
// - Deterministic variance uses seeded PRNG (seedrandom) instead of hash-modulo bias.
// - AttributeType confidence now uses per-attribute rules:
//   physical: certain, style: observable, combat: scoutingLevel, hidden: never.
// - Added helpers to record observations + apply weekly decay (optional, deterministic).
// - Bilingual name tables updated to include 7 archetypes (matches your canon elsewhere).
// - formatRankBilingual output normalized (no extra spaces), handles rankNumber=0 safely.
// - Removed unused imports and tightened types.

import seedrandom from "seedrandom";
import type { Rikishi } from "./types";
import { describeAttribute, describeAggression, describeExperience } from "./narrativeDescriptions";

// === Confidence levels for scouted information ===
export type ConfidenceLevel = "unknown" | "low" | "medium" | "high" | "certain";

// Scouting investment levels per documentation
export type ScoutingInvestment = "none" | "light" | "standard" | "deep";

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

  // Style is eventually observable (not guaranteed at first)
  style?: string;
  archetype?: string;

  // “Surface” record is visible during basho (if you show it)
  currentBashoWins?: number;
  currentBashoLosses?: number;
}

// What the player knows about a rikishi (knowledge wrapper)
export interface ScoutedRikishi {
  rikishiId: string;

  // Public-facing info cache (safe to store)
  publicInfo: PublicRikishiInfo;

  // Player’s stable => full knowledge (engine can reveal full data at view time)
  isOwned: boolean;

  // Observation state
  timesObserved: number; // number of bouts watched
  lastObservedWeek: number; // world.week when last seen

  scoutingInvestment: ScoutingInvestment;

  // Computed scouting percentage (0-100)
  scoutingLevel: number;
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

export type AttributeType = "physical" | "combat" | "style" | "hidden";

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
 * - uses uniform deterministic rng, not modulo hashing (avoids bias)
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
  const maxErrorPct: Record<Exclude<ConfidenceLevel, "certain">, number> = {
    unknown: 40,
    low: 35, // doc: ±30–40
    medium: 20, // doc: ±15–25
    high: 9 // doc: ±5–10
  };

  const rng = seedrandom(seed);
  const sign = rng() < 0.5 ? -1 : 1;
  const magPct = rng() * maxErrorPct[confidence as Exclude<ConfidenceLevel, "certain">];

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
    // If your Rikishi has these fields; otherwise they’ll be undefined:
    rankNumber: (r as any).rankNumber,
    side: (r as any).side,
    height: r.height,
    weight: r.weight,
    // do NOT set style/archetype as “known” until observed/invested
    currentBashoWins: (r as any).currentBashoWins,
    currentBashoLosses: (r as any).currentBashoLosses
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
    scoutingLevel
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
// DISPLAY-READY ATTRIBUTES (NO NUMBERS)
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
 * Important: pass the engine-truth Rikishi if you have it in memory.
 * - If !isOwned, we still accept it but only reveal fuzzed narratives.
 */
export function getScoutedAttributes(
  scouted: ScoutedRikishi,
  truth: Rikishi,
  seed: string
): ScoutedAttributes {
  const isOwned = scouted.isOwned;

  const getAttr = (
    attr: "power" | "speed" | "balance" | "technique",
    value: number
  ): ScoutedAttribute => {
    const confidence = getConfidenceLevel(scouted, "combat");

    if (isOwned || confidence === "certain") {
      const label = describeAttribute(value);
      return { value: label, confidence: "certain", narrative: label };
    }

    if (confidence === "unknown") {
      return { value: "Unknown", confidence, narrative: "Insufficient observation to assess" };
    }

    const estimated = getEstimatedValue(value, confidence, `${seed}-${scouted.rikishiId}-${attr}`, { min: 0, max: 100 });
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

    const estimated = getEstimatedValue(value, confidence, `${seed}-${scouted.rikishiId}-aggression`, { min: 0, max: 100 });
    const q = confidence === "medium" ? "appears" : confidence === "low" ? "may be" : "";
    const label = describeAggression(estimated);
    const desc = q ? `${q} ${label.toLowerCase()}` : label;

    return { value: desc, confidence, narrative: `${getConfidenceText(confidence)}: ${desc}` };
  };

  const getExp = (value: number): ScoutedAttribute => {
    // Experience is “combat-visible” over time; treat as combat for now
    const confidence = getConfidenceLevel(scouted, "combat");

    if (isOwned || confidence === "certain") {
      const label = describeExperience(value);
      return { value: label, confidence: "certain", narrative: label };
    }

    if (confidence === "unknown") {
      return { value: "Unknown", confidence, narrative: "Insufficient observation to assess" };
    }

    // Experience may exceed 100; use a reasonable range for prose mapping.
    const estimated = getEstimatedValue(value, confidence, `${seed}-${scouted.rikishiId}-experience`, { min: 0, max: 80 });
    const label = describeExperience(estimated);
    const q = confidence === "medium" ? "appears" : confidence === "low" ? "may be" : "";
    const desc = q ? `${q} ${label.toLowerCase()}` : label;

    return { value: desc, confidence, narrative: `${getConfidenceText(confidence)}: ${desc}` };
  };

  return {
    power: getAttr("power", truth.power),
    speed: getAttr("speed", truth.speed),
    balance: getAttr("balance", truth.balance),
    technique: getAttr("technique", truth.technique),
    aggression: getAgg(truth.aggression),
    experience: getExp(truth.experience)
  };
}

// ============================================
// UI HELPERS
// ============================================

export function describeScoutingLevel(level: number): {
  label: string;
  description: string;
  color: string;
} {
  if (level >= 95)
    return { label: "Complete", description: "Full knowledge of this wrestler", color: "text-primary" };
  if (level >= 70)
    return { label: "Well Scouted", description: "Reliable assessment with minor uncertainty", color: "text-success" };
  if (level >= 40)
    return { label: "Moderate Intel", description: "General picture but gaps remain", color: "text-warning" };
  if (level >= 15)
    return { label: "Limited", description: "Basic observations only", color: "text-orange-500" };
  return { label: "Unknown", description: "Insufficient data", color: "text-muted-foreground" };
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function clampInt(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, Math.trunc(value)));
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

// 7 archetypes (matches your engine + constitution)
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
// Confidence levels for scouted information
export type ConfidenceLevel = "unknown" | "low" | "medium" | "high" | "certain";

// Scouting investment levels per documentation
export type ScoutingInvestment = "none" | "light" | "standard" | "deep";

// What the player knows about a rikishi
export interface ScoutedRikishi {
  rikishi: Rikishi;
  isOwned: boolean;           // Player's stable = full knowledge
  timesObserved: number;      // Number of bouts watched (passive observation)
  lastObserved: number;       // Week number when last seen
  scoutingInvestment: ScoutingInvestment;
  // Computed scouting percentage (0-100)
  scoutingLevel: number;
}

// Calculate scouting level (0-100) based on investment and observations
export function calculateScoutingLevel(
  isOwned: boolean,
  observations: number,
  investment: ScoutingInvestment
): number {
  // Own stable wrestlers = 100% scouted
  if (isOwned) return 100;
  
  // Base from passive observation (max 30%)
  const passiveBase = Math.min(30, observations * 2);
  
  // Bonus from investment level
  const investmentBonus: Record<ScoutingInvestment, number> = {
    none: 0,
    light: 20,      // ±30-40% confidence → 20% boost
    standard: 40,   // ±15-25% confidence → 40% boost  
    deep: 60        // ±5-10% confidence → 60% boost
  };
  
  const total = passiveBase + investmentBonus[investment];
  return Math.min(100, Math.max(0, total));
}

// Get confidence level from scouting percentage
export function getConfidenceFromLevel(scoutingLevel: number): ConfidenceLevel {
  if (scoutingLevel >= 95) return "certain";
  if (scoutingLevel >= 70) return "high";
  if (scoutingLevel >= 40) return "medium";
  if (scoutingLevel >= 15) return "low";
  return "unknown";
}

// Confidence for different attribute types
export function getConfidenceLevel(
  scouted: ScoutedRikishi,
  attributeType: "physical" | "combat" | "style" | "hidden"
): ConfidenceLevel {
  // Player's own rikishi = full knowledge (certain)
  if (scouted.isOwned) return "certain";
  
  // Physical attributes (height/weight) are always public
  if (attributeType === "physical") return "certain";
  
  // Style is observable after a few bouts
  if (attributeType === "style") {
    if (scouted.timesObserved >= 3) return "high";
    if (scouted.timesObserved >= 1) return "medium";
    return "low";
  }
  
  // Hidden attributes (fatigue, injury risk, morale) are NEVER visible
  if (attributeType === "hidden") return "unknown";
  
  // Combat attributes use overall scouting level
  return getConfidenceFromLevel(scouted.scoutingLevel);
}

// Apply uncertainty to displayed value (deterministic based on seed)
export function getEstimatedValue(
  trueValue: number,
  confidence: ConfidenceLevel,
  seed: string
): number {
  if (confidence === "certain") return trueValue;
  if (confidence === "unknown") return 50; // Neutral when unknown
  
  // Error ranges per documentation
  const maxError: Record<ConfidenceLevel, number> = {
    unknown: 40,
    low: 30,     // ±30-40% per doc
    medium: 20,  // ±15-25% per doc
    high: 8,     // ±5-10% per doc
    certain: 0
  };
  
  // Deterministic "randomness" based on seed
  const hash = simpleHash(seed);
  const error = (hash % (maxError[confidence] * 2)) - maxError[confidence];
  
  return Math.max(0, Math.min(100, trueValue + error));
}

// Get narrative description with confidence qualifier
export function getAttributeNarrative(
  attribute: string,
  value: number,
  confidence: ConfidenceLevel
): { description: string; qualifier: string } {
  const estimatedLevel = describeAttribute(value);
  
  // Per doc: use language like "appears strong"
  const qualifiers: Record<ConfidenceLevel, string> = {
    certain: "",
    high: "",
    medium: "appears",
    low: "may be",
    unknown: "unknown"
  };
  
  if (confidence === "unknown") {
    return { description: "Unknown", qualifier: "Insufficient observation" };
  }
  
  const qualifier = qualifiers[confidence];
  const description = qualifier 
    ? `${qualifier} ${estimatedLevel.toLowerCase()}`
    : estimatedLevel;
  
  return { description, qualifier: getConfidenceText(confidence) };
}

function getConfidenceText(confidence: ConfidenceLevel): string {
  switch (confidence) {
    case "certain": return "Full knowledge";
    case "high": return "Well-observed";
    case "medium": return "Moderately scouted";
    case "low": return "Limited observation";
    case "unknown": return "No reliable data";
  }
}

// Create scouted view of a rikishi for display
export function createScoutedView(
  rikishi: Rikishi,
  playerHeyaId: string | null,
  observationCount: number = 0,
  investment: ScoutingInvestment = "none"
): ScoutedRikishi {
  const isOwned = rikishi.heyaId === playerHeyaId;
  const scoutingLevel = calculateScoutingLevel(isOwned, observationCount, investment);
  
  return {
    rikishi,
    isOwned,
    timesObserved: observationCount,
    lastObserved: 0,
    scoutingInvestment: investment,
    scoutingLevel
  };
}

// Get display-ready attributes for a rikishi
export interface ScoutedAttribute {
  value: string;
  confidence: ConfidenceLevel;
  narrative: string;
}

export interface ScoutedAttributes {
  power: ScoutedAttribute;
  speed: ScoutedAttribute;
  balance: ScoutedAttribute;
  technique: ScoutedAttribute;
  aggression: ScoutedAttribute;
  experience: ScoutedAttribute;
}

export function getScoutedAttributes(
  scouted: ScoutedRikishi,
  seed: string = "default"
): ScoutedAttributes {
  const { rikishi, isOwned } = scouted;
  
  const getAttr = (attr: string, value: number, descFn: (v: number) => string): ScoutedAttribute => {
    const confidence = getConfidenceLevel(scouted, "combat");
    
    if (isOwned || confidence === "certain") {
      return {
        value: descFn(value),
        confidence: "certain" as ConfidenceLevel,
        narrative: descFn(value)
      };
    }
    
    if (confidence === "unknown") {
      return {
        value: "Unknown",
        confidence,
        narrative: "Insufficient observation to assess"
      };
    }
    
    const estimated = getEstimatedValue(value, confidence, `${seed}-${rikishi.id}-${attr}`);
    const { description } = getAttributeNarrative(attr, estimated, confidence);
    
    return {
      value: description,
      confidence,
      narrative: `${getConfidenceText(confidence)}: ${description}`
    };
  };
  
  return {
    power: getAttr("power", rikishi.power, describeAttribute),
    speed: getAttr("speed", rikishi.speed, describeAttribute),
    balance: getAttr("balance", rikishi.balance, describeAttribute),
    technique: getAttr("technique", rikishi.technique, describeAttribute),
    aggression: getAttr("aggression", rikishi.aggression, describeAggression),
    experience: getAttr("experience", rikishi.experience, describeExperience)
  };
}

// Simple hash function for deterministic "randomness"
function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}

// Get scouting level description for UI
export function describeScoutingLevel(level: number): { 
  label: string; 
  description: string;
  color: string;
} {
  if (level >= 95) return { 
    label: "Complete", 
    description: "Full knowledge of this wrestler",
    color: "text-primary"
  };
  if (level >= 70) return { 
    label: "Well Scouted", 
    description: "Reliable assessment with minor uncertainty",
    color: "text-success"
  };
  if (level >= 40) return { 
    label: "Moderate Intel", 
    description: "General picture but gaps remain",
    color: "text-warning"
  };
  if (level >= 15) return { 
    label: "Limited", 
    description: "Basic observations only",
    color: "text-orange-500"
  };
  return { 
    label: "Unknown", 
    description: "Insufficient data",
    color: "text-muted-foreground"
  };
}

// ============================================
// BILINGUAL NAMES - Using proper sumo terminology
// ============================================

// English uses actual sumo rank names, not translations
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

export const SIDE_NAMES = {
  east: { ja: "東", en: "East" },
  west: { ja: "西", en: "West" }
};

export const ARCHETYPE_NAMES: Record<string, { label: string; labelJa: string; description: string }> = {
  oshi_specialist: { label: "Oshi Specialist", labelJa: "押し相撲", description: "Overwhelms with forward pressure" },
  yotsu_specialist: { label: "Yotsu Specialist", labelJa: "四つ相撲", description: "Excels when grips are secured" },
  speedster: { label: "Speedster", labelJa: "速攻型", description: "Lightning quick, relies on timing" },
  trickster: { label: "Trickster", labelJa: "技師", description: "Deep bag of tricks and surprise moves" },
  all_rounder: { label: "All-Rounder", labelJa: "万能型", description: "Versatile and adaptable" }
};

export const STYLE_NAMES: Record<string, { label: string; labelJa: string; description: string }> = {
  oshi: { label: "Oshi", labelJa: "押し", description: "Prefers pushing and thrusting" },
  yotsu: { label: "Yotsu", labelJa: "四つ", description: "Seeks the belt, uses grips to control" },
  hybrid: { label: "Hybrid", labelJa: "万能", description: "Comfortable both pushing and on the belt" }
};

// Format rank with both Japanese and English
export function formatRankBilingual(rank: string, rankNumber?: number, side?: "east" | "west"): { 
  ja: string; 
  en: string; 
  full: string;
} {
  const rankInfo = RANK_NAMES[rank] || { ja: rank, en: rank };
  const sideInfo = side ? SIDE_NAMES[side] : null;
  
  let ja = rankInfo.ja;
  let en = rankInfo.en;
  
  if (rankNumber) {
    ja += ` ${rankNumber}`;
    en += ` ${rankNumber}`;
  }
  
  if (sideInfo) {
    ja = `${sideInfo.ja}${ja}`;
    en = `${en} ${sideInfo.en}`;
  }
  
  return {
    ja,
    en,
    full: `${ja} (${en})`
  };
}
