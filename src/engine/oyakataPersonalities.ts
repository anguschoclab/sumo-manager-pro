// oyakataPersonalities.ts
// =======================================================
// Oyakata Personality System v1.0
// Deterministic personality + management "taste" for each stablemaster.
//
// PURPOSE
// - Gives NPC stables consistent long-term behavior (training/scouting/risk appetite).
// - Used by npcAI.ts to bias weekly decisions (intensity, recovery, focus slots, scouting).
// - Also useful for narrative/UI (press quotes, reputation events, scandals).
//
// DESIGN
// - Each heya gets ONE oyakata profile (stable identity).
// - Profiles are deterministic from (world.seed + heyaId) unless explicitly authored.
// - Traits are numeric 0..100 and can be mapped to "tags" for UI.
//
// SAVE NOTE
// - You can store the generated profiles in SaveGame to make future balancing changes non-breaking.
// - Or regenerate every load (still deterministic) if you keep trait formulas stable.

import seedrandom from "seedrandom";
import type { Heya, WorldState } from "./types";

export type OyakataArchetype =
  | "traditionalist"
  | "innovator"
  | "taskmaster"
  | "mentor"
  | "politician"
  | "scoutmaster"
  | "survivalist";

export type GovernanceRiskStyle = "strict" | "pragmatic" | "loose";

/** Core numeric trait model (0..100). */
export interface OyakataTraits {
  // Training philosophy
  discipline: number;      // strictness, routines
  intensityBias: number;   // preference for higher intensity training
  recoveryBias: number;    // preference for high recovery emphasis
  techniqueBias: number;   // preference for technical focus (vs power)
  youthBias: number;       // preference to develop prospects vs ride veterans

  // Competitive temperament
  riskTolerance: number;   // tolerance for injury/variance
  shortTermism: number;    // win-now vs long horizon
  adaptability: number;    // willingness to change plan week-to-week

  // Org + scouting
  scoutingBias: number;    // investment appetite in scouting
  favoritism: number;      // focuses resources on a few stars
  professionalism: number; // governance/discipline reduces scandal risk

  // Narrative flavor
  charisma: number;        // PR impact, sponsor appeal
  tradition: number;       // attachment to old ways
}

export interface OyakataPersonality {
  id: string;          // oyakataId (usually heya.oyakataId)
  heyaId: string;
  archetype: OyakataArchetype;
  governanceStyle: GovernanceRiskStyle;

  traits: OyakataTraits;

  // UI / narrative helpers
  motto: { en: string; ja?: string };
  summary: string;
  tags: string[]; // short labels for tooltips
}

/** Generate (or fetch) the personality for a given heya. */
export function getOrCreateOyakataPersonality(world: WorldState, heya: Heya): OyakataPersonality {
  // If you decide to persist it later:
  // if ((heya as any).oyakataPersonality) return (heya as any).oyakataPersonality;

  const seed = `${world.seed}-oyakata-${heya.id}`;
  const rng = seedrandom(seed);

  const base = baseTraitsFromHeya(heya, rng);

  const archetype = pickArchetype(heya, base, rng);
  const traits = applyArchetypeShaping(base, archetype, rng);
  const governanceStyle = pickGovernanceStyle(traits, heya, rng);

  const motto = makeMotto(archetype, rng);
  const tags = makeTags(traits, archetype);
  const summary = makeSummary(heya, archetype, traits, governanceStyle);

  const p: OyakataPersonality = {
    id: heya.oyakataId,
    heyaId: heya.id,
    archetype,
    governanceStyle,
    traits,
    motto,
    summary,
    tags
  };

  // Optionally cache on heya for runtime
  (heya as any).oyakataPersonality = p;

  return p;
}

/** Bulk initialize all NPC oyakata personalities (optional, for world-gen). */
export function initializeAllOyakataPersonalities(world: WorldState): void {
  for (const heya of world.heyas.values()) {
    getOrCreateOyakataPersonality(world, heya);
  }
}

// =======================================================
// Trait Generation
// =======================================================

function baseTraitsFromHeya(heya: Heya, rng: seedrandom.PRNG): OyakataTraits {
  const stature = (heya as any).statureBand as string | undefined;
  const prestige = (heya as any).prestigeBand as string | undefined;
  const rep = typeof (heya as any).reputation === "number" ? (heya as any).reputation : 50;

  // Start around midrange, then nudge by stable context
  let discipline = 50 + (rng() - 0.5) * 20;
  let intensityBias = 50 + (rng() - 0.5) * 25;
  let recoveryBias = 50 + (rng() - 0.5) * 25;
  let techniqueBias = 50 + (rng() - 0.5) * 25;
  let youthBias = 50 + (rng() - 0.5) * 20;

  let riskTolerance = 50 + (rng() - 0.5) * 30;
  let shortTermism = 50 + (rng() - 0.5) * 30;
  let adaptability = 50 + (rng() - 0.5) * 30;

  let scoutingBias = 50 + (rng() - 0.5) * 30;
  let favoritism = 45 + (rng() - 0.5) * 30;
  let professionalism = 55 + (rng() - 0.5) * 25;

  let charisma = 45 + (rng() - 0.5) * 30;
  let tradition = 50 + (rng() - 0.5) * 30;

  // Contextual nudges
  if (stature === "legendary") {
    tradition += 12;
    discipline += 8;
    professionalism += 8;
    charisma += 10;
    scoutingBias += 6;
  } else if (stature === "powerful") {
    intensityBias += 8;
    scoutingBias += 6;
    shortTermism += 4;
  } else if (stature === "fragile" || stature === "rebuilding") {
    recoveryBias += 8;
    riskTolerance -= 10;
    scoutingBias -= 6;
    youthBias += 8;
    adaptability += 8;
  }

  if (prestige === "elite") {
    shortTermism += 8; // expectation to win
    intensityBias += 6;
  } else if (prestige === "unknown" || prestige === "struggling") {
    youthBias += 6;
    recoveryBias += 6;
    shortTermism -= 8;
  }

  // Reputation influences politics + discipline a bit
  if (rep >= 75) {
    charisma += 6;
    discipline += 4;
  } else if (rep <= 30) {
    adaptability += 6;
    professionalism -= 4;
  }

  return clampTraits({
    discipline,
    intensityBias,
    recoveryBias,
    techniqueBias,
    youthBias,
    riskTolerance,
    shortTermism,
    adaptability,
    scoutingBias,
    favoritism,
    professionalism,
    charisma,
    tradition
  });
}

function pickArchetype(heya: Heya, base: OyakataTraits, rng: seedrandom.PRNG): OyakataArchetype {
  // Weighted selection based on trait "gravity"
  const weights: Array<{ a: OyakataArchetype; w: number }> = [
    { a: "traditionalist", w: 1 + base.tradition / 60 + base.discipline / 80 },
    { a: "innovator", w: 1 + base.adaptability / 60 + (100 - base.tradition) / 90 },
    { a: "taskmaster", w: 1 + base.intensityBias / 55 + base.discipline / 70 },
    { a: "mentor", w: 1 + base.youthBias / 55 + base.recoveryBias / 70 },
    { a: "politician", w: 1 + base.charisma / 55 + (heya as any).prestigeBand === "elite" ? 0.6 : 0 },
    { a: "scoutmaster", w: 1 + base.scoutingBias / 55 + base.adaptability / 80 },
    { a: "survivalist", w: 1 + (100 - base.riskTolerance) / 60 + base.adaptability / 70 }
  ];

  return weightedChoice(weights, rng);
}

function applyArchetypeShaping(base: OyakataTraits, archetype: OyakataArchetype, rng: seedrandom.PRNG): OyakataTraits {
  const t = { ...base };

  const bump = (k: keyof OyakataTraits, delta: number) => {
    t[k] = clamp01to100(t[k] + delta);
  };

  switch (archetype) {
    case "traditionalist":
      bump("tradition", 18);
      bump("discipline", 10);
      bump("adaptability", -10);
      bump("techniqueBias", 6);
      bump("professionalism", 6);
      break;

    case "innovator":
      bump("adaptability", 16);
      bump("tradition", -12);
      bump("techniqueBias", 8);
      bump("scoutingBias", 8);
      bump("discipline", -4);
      break;

    case "taskmaster":
      bump("intensityBias", 18);
      bump("discipline", 14);
      bump("recoveryBias", -8);
      bump("riskTolerance", 10);
      bump("shortTermism", 10);
      break;

    case "mentor":
      bump("recoveryBias", 16);
      bump("youthBias", 14);
      bump("shortTermism", -10);
      bump("favoritism", -8);
      bump("discipline", 6);
      break;

    case "politician":
      bump("charisma", 18);
      bump("professionalism", 10);
      bump("discipline", -6);
      bump("favoritism", 6);
      bump("scoutingBias", 4);
      break;

    case "scoutmaster":
      bump("scoutingBias", 18);
      bump("adaptability", 10);
      bump("techniqueBias", 6);
      bump("shortTermism", 4);
      break;

    case "survivalist":
      bump("riskTolerance", -14);
      bump("recoveryBias", 12);
      bump("adaptability", 12);
      bump("youthBias", 8);
      bump("intensityBias", -8);
      break;
  }

  // small personality jitter to avoid clones
  for (const k of Object.keys(t) as Array<keyof OyakataTraits>) {
    t[k] = clamp01to100(t[k] + (rng() - 0.5) * 6);
  }

  return clampTraits(t);
}

function pickGovernanceStyle(traits: OyakataTraits, heya: Heya, rng: seedrandom.PRNG): GovernanceRiskStyle {
  // Higher professionalism + discipline => strict
  const strictScore = traits.professionalism * 0.6 + traits.discipline * 0.4;
  const looseScore = (100 - traits.professionalism) * 0.7 + (100 - traits.discipline) * 0.3;

  // fragile stables skew pragmatic: need flexibility
  const stature = (heya as any).statureBand as string | undefined;
  const pragmaticBias = stature === "fragile" || stature === "rebuilding" ? 8 : 0;

  const roll = rng() * 100;

  if (strictScore + 10 > looseScore && roll < strictScore + pragmaticBias) return "strict";
  if (looseScore > strictScore && roll < looseScore - pragmaticBias) return "loose";
  return "pragmatic";
}

// =======================================================
// UI Helpers
// =======================================================

export function traitLabel(value: number): "low" | "mid" | "high" {
  if (value >= 67) return "high";
  if (value <= 33) return "low";
  return "mid";
}

export function archetypeLabel(a: OyakataArchetype): { en: string; ja: string } {
  const map: Record<OyakataArchetype, { en: string; ja: string }> = {
    traditionalist: { en: "Traditionalist", ja: "伝統主義" },
    innovator: { en: "Innovator", ja: "革新派" },
    taskmaster: { en: "Taskmaster", ja: "鬼監督" },
    mentor: { en: "Mentor", ja: "育成家" },
    politician: { en: "Politician", ja: "調整役" },
    scoutmaster: { en: "Scoutmaster", ja: "スカウト巧者" },
    survivalist: { en: "Survivalist", ja: "生存重視" }
  };
  return map[a];
}

function makeMotto(archetype: OyakataArchetype, rng: seedrandom.PRNG): { en: string; ja?: string } {
  const mottos: Record<OyakataArchetype, string[]> = {
    traditionalist: [
      "Discipline makes champions.",
      "Respect the old ways.",
      "Ritual before glory."
    ],
    innovator: [
      "Adapt or be left behind.",
      "Study. Refine. Win.",
      "New solutions for old battles."
    ],
    taskmaster: [
      "Pain is tuition.",
      "No shortcuts.",
      "Outwork everyone."
    ],
    mentor: [
      "Build the man, then the wrestler.",
      "Patience becomes power.",
      "Grow today, win tomorrow."
    ],
    politician: [
      "Influence is strength.",
      "A stable is a kingdom.",
      "Allies win titles."
    ],
    scoutmaster: [
      "Know the opponent.",
      "Information is leverage.",
      "See the ring clearly."
    ],
    survivalist: [
      "First, endure.",
      "Live to fight another basho.",
      "Protect the stable."
    ]
  };

  const pool = mottos[archetype];
  return { en: pool[Math.floor(rng() * pool.length)] };
}

function makeTags(traits: OyakataTraits, archetype: OyakataArchetype): string[] {
  const tags: string[] = [archetype];

  if (traits.intensityBias >= 70) tags.push("hard-training");
  if (traits.recoveryBias >= 70) tags.push("recovery-first");
  if (traits.scoutingBias >= 70) tags.push("intel-driven");
  if (traits.tradition >= 70) tags.push("traditional");
  if (traits.adaptability >= 70) tags.push("adaptive");
  if (traits.professionalism <= 30) tags.push("loose-governance");
  if (traits.favoritism >= 70) tags.push("star-focused");
  if (traits.youthBias >= 70) tags.push("prospect-builder");

  return tags.slice(0, 7);
}

function makeSummary(
  heya: Heya,
  archetype: OyakataArchetype,
  t: OyakataTraits,
  gov: GovernanceRiskStyle
): string {
  const name = heya.name;
  const a = archetypeLabel(archetype).en;
  const bits: string[] = [`${name}'s oyakata is a ${a}.`];

  if (t.intensityBias >= 70) bits.push("He favors grueling keiko.");
  if (t.recoveryBias >= 70) bits.push("He prioritizes recovery and longevity.");
  if (t.scoutingBias >= 70) bits.push("He invests heavily in scouting.");
  if (t.tradition >= 70) bits.push("He leans on tradition and stable culture.");
  if (t.adaptability >= 70) bits.push("He adjusts plans quickly when results falter.");
  if (t.shortTermism >= 70) bits.push("He pushes for immediate results.");
  if (t.youthBias >= 70) bits.push("He’s known for developing young talent.");

  bits.push(`Governance style: ${gov}.`);
  return bits.join(" ");
}

// =======================================================
// Math + RNG helpers
// =======================================================

function weightedChoice<T extends { w: number }>(items: Array<T & { a: any }>, rng: seedrandom.PRNG): any {
  const total = items.reduce((s, x) => s + x.w, 0);
  let roll = rng() * total;
  for (const it of items) {
    roll -= it.w;
    if (roll <= 0) return it.a;
  }
  return items[items.length - 1].a;
}

function clamp01to100(n: number): number {
  if (!Number.isFinite(n)) return 50;
  return Math.max(0, Math.min(100, n));
}

function clampTraits(t: OyakataTraits): OyakataTraits {
  const out = { ...t };
  for (const k of Object.keys(out) as Array<keyof OyakataTraits>) {
    out[k] = clamp01to100(out[k]);
  }
  return out;
}
