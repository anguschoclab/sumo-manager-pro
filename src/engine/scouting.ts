// Fog of War & Scouting System
// Per Observability Contract: separates Engine Truth from Player Knowledge
// Players see estimated values with confidence bands, never exact stats

import type { Rikishi } from "./types";
import { describeAttribute, describeAggression, describeExperience } from "./narrativeDescriptions";

// Confidence levels for scouted information
export type ConfidenceLevel = "unknown" | "low" | "medium" | "high" | "certain";

// What the player knows about a rikishi
export interface ScoutedRikishi {
  rikishi: Rikishi;
  isOwned: boolean;           // Player's stable = full knowledge
  timesObserved: number;      // Number of bouts watched
  lastObserved: number;       // Week number when last seen
  scoutingInvestment: "none" | "light" | "standard" | "deep";
}

// Confidence for different attribute types
export function getConfidenceLevel(
  scouted: ScoutedRikishi,
  attributeType: "physical" | "combat" | "style" | "hidden"
): ConfidenceLevel {
  // Player's own rikishi = full knowledge
  if (scouted.isOwned) return "certain";
  
  // Physical attributes (height/weight) are always public
  if (attributeType === "physical") return "certain";
  
  // Style is public after observation
  if (attributeType === "style" && scouted.timesObserved > 0) return "high";
  
  // Hidden attributes (fatigue, injury risk) are never revealed
  if (attributeType === "hidden") return "unknown";
  
  // Combat attributes depend on scouting investment and observations
  const baseConfidence = getBaseConfidence(scouted);
  return baseConfidence;
}

function getBaseConfidence(scouted: ScoutedRikishi): ConfidenceLevel {
  const observations = scouted.timesObserved;
  const investment = scouted.scoutingInvestment;
  
  // Deep scouting = high confidence
  if (investment === "deep") return observations >= 3 ? "high" : "medium";
  if (investment === "standard") return observations >= 5 ? "medium" : "low";
  if (investment === "light") return observations >= 10 ? "low" : "unknown";
  
  // No investment = public info only
  return observations >= 15 ? "low" : "unknown";
}

// Apply uncertainty to displayed value
export function getEstimatedValue(
  trueValue: number,
  confidence: ConfidenceLevel,
  seed: string
): number {
  if (confidence === "certain") return trueValue;
  if (confidence === "unknown") return 50; // Show neutral when unknown
  
  // Add noise based on confidence
  const maxError: Record<ConfidenceLevel, number> = {
    unknown: 40,
    low: 25,
    medium: 15,
    high: 5,
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
  
  const qualifiers: Record<ConfidenceLevel, string> = {
    certain: "",
    high: "",
    medium: "appears to be",
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
    case "certain": return "";
    case "high": return "Well-observed";
    case "medium": return "Moderately observed";
    case "low": return "Limited observation";
    case "unknown": return "No reliable data";
  }
}

// Create scouted view of a rikishi for display
export function createScoutedView(
  rikishi: Rikishi,
  playerHeyaId: string | null,
  observationCount: number = 0,
  investment: "none" | "light" | "standard" | "deep" = "none"
): ScoutedRikishi {
  return {
    rikishi,
    isOwned: rikishi.heyaId === playerHeyaId,
    timesObserved: observationCount,
    lastObserved: 0,
    scoutingInvestment: investment
  };
}

// Get display-ready attributes for a rikishi
export interface ScoutedAttributes {
  power: { value: string; confidence: ConfidenceLevel; narrative: string };
  speed: { value: string; confidence: ConfidenceLevel; narrative: string };
  balance: { value: string; confidence: ConfidenceLevel; narrative: string };
  technique: { value: string; confidence: ConfidenceLevel; narrative: string };
  aggression: { value: string; confidence: ConfidenceLevel; narrative: string };
  experience: { value: string; confidence: ConfidenceLevel; narrative: string };
}

export function getScoutedAttributes(
  scouted: ScoutedRikishi,
  seed: string = "default"
): ScoutedAttributes {
  const { rikishi, isOwned } = scouted;
  
  const getAttr = (attr: string, value: number, descFn: (v: number) => string) => {
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

// English translations for Japanese terms
export const RANK_NAMES: Record<string, { ja: string; en: string }> = {
  yokozuna: { ja: "横綱", en: "Grand Champion" },
  ozeki: { ja: "大関", en: "Champion" },
  sekiwake: { ja: "関脇", en: "Junior Champion" },
  komusubi: { ja: "小結", en: "Junior Champion 2nd" },
  maegashira: { ja: "前頭", en: "Top Division" },
  juryo: { ja: "十両", en: "Second Division" },
  makushita: { ja: "幕下", en: "Third Division" },
  sandanme: { ja: "三段目", en: "Fourth Division" },
  jonidan: { ja: "序二段", en: "Fifth Division" },
  jonokuchi: { ja: "序ノ口", en: "Entry Division" }
};

export const SIDE_NAMES = {
  east: { ja: "東", en: "East" },
  west: { ja: "西", en: "West" }
};

export const ARCHETYPE_NAMES: Record<string, { label: string; description: string }> = {
  oshi_specialist: { label: "Pusher-Thruster", description: "Overwhelms with forward pressure" },
  yotsu_specialist: { label: "Belt Fighter", description: "Excels when grips are secured" },
  speedster: { label: "Speedster", description: "Lightning quick, relies on timing" },
  trickster: { label: "Technician", description: "Deep bag of tricks and surprise moves" },
  all_rounder: { label: "All-Rounder", description: "Versatile and adaptable" }
};

export const STYLE_NAMES: Record<string, { label: string; description: string }> = {
  oshi: { label: "Oshi (Pusher)", description: "Prefers pushing and thrusting" },
  yotsu: { label: "Yotsu (Belt)", description: "Seeks the belt, uses grips to control" },
  hybrid: { label: "Hybrid", description: "Comfortable both pushing and on the belt" }
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
