// npcAI.ts
// =======================================================
// NPC AI System v1.0 — Stable (Heya) Management AI
// Deterministic, seed-based weekly decision making
//
// WHAT THIS DOES (drop-in):
// - Chooses each NPC heya's weekly TrainingProfile (intensity/focus/styleBias/recovery)
// - Assigns per-rikishi FocusSlots (develop/push/protect/rebuild) within max slots
// - Chooses scouting investment level per heya (none/light/standard/deep) with budget awareness
// - Designed to be called from timeBoundary.advanceWeeks() BEFORE processWeeklyBoundary()
//   so trainingState is already set for the week.
//
// DETERMINISM RULE:
// - All choices use seedrandom streams derived from (world.seed, weekIndexGlobal, heyaId)
// - No Math.random()
//
// SAFE ASSUMPTIONS (optional fields):
// - Heya may store `trainingState?: { profile, focusSlots, maxFocusSlots }`
// - Heya may store `scoutingInvestment?: "none"|"light"|"standard"|"deep"`
// - Rikishi may store `fatigue?: number` (0..100) and injury flags already exist
// - Heya has funds:number in your types, but we still guard.
//
// If your UI doesn't yet display these, this file can still run with no harm.

import seedrandom from "seedrandom";
import type { WorldState, Heya, Rikishi } from "./types";
import {
  createDefaultTrainingProfile,
  type TrainingProfile,
  type TrainingIntensity,
  type TrainingFocus,
  type StyleBias,
  type RecoveryEmphasis,
  type FocusMode,
  type IndividualFocus,
  sanitizeFocusSlots,
  getMaxFocusSlots
} from "./training";

/** Scouting investment levels per scouting system */
export type ScoutingInvestment = "none" | "light" | "standard" | "deep";

/** Minimal training state shape stored on heya (kept local to avoid type coupling). */
export interface HeyaTrainingState {
  profile: TrainingProfile;
  focusSlots: IndividualFocus[];
  maxFocusSlots: number;
}

/** NPC plan output (useful for logs / debugging). */
export interface NpcWeeklyPlan {
  heyaId: string;
  profile: TrainingProfile;
  focusSlots: IndividualFocus[];
  scoutingInvestment: ScoutingInvestment;
  notes: string[];
}

/** Public entry point: apply all NPC weekly decisions onto the WorldState. */
export function runNpcWeeklyAI(world: WorldState, time: { weekIndexGlobal: number }): NpcWeeklyPlan[] {
  const plans: NpcWeeklyPlan[] = [];

  // stable iteration over heyas
  const heyaEntries = Array.from(world.heyas.entries()).sort(([a], [b]) => a.localeCompare(b));

  for (const [heyaId, heya] of heyaEntries) {
    // Skip player-owned stable (player decides)
    if ((heya as any).isPlayerOwned || world.playerHeyaId === heyaId) continue;

    const weekSeed = `${world.seed}-npcai-week-${time.weekIndexGlobal}-heya-${heyaId}`;
    const rng = seedrandom(weekSeed);

    const roster = getHeyaRoster(world, heya);
    const rosterIds = roster.map(r => r.id);

    // Decide max focus slots based on heya stature/prestige
    const prestigeTier = estimatePrestigeTier(heya);
    const maxSlots = getMaxFocusSlots(prestigeTier);

    // Decide profile
    const profile = decideTrainingProfile(heya, roster, rng);

    // Decide focus slots
    const focusSlots = decideFocusSlots(heya, roster, maxSlots, rng);

    // Decide scouting investment
    const scoutingInvestment = decideScoutingInvestment(heya, roster, rng);

    // Apply to heya
    const nextTrainingState: HeyaTrainingState = {
      profile,
      focusSlots: sanitizeFocusSlots(focusSlots, maxSlots, rosterIds),
      maxFocusSlots: maxSlots
    };

    (heya as any).trainingState = nextTrainingState;
    (heya as any).scoutingInvestment = scoutingInvestment;

    plans.push({
      heyaId,
      profile,
      focusSlots: nextTrainingState.focusSlots,
      scoutingInvestment,
      notes: buildNotes(heya, roster, profile, nextTrainingState.focusSlots, scoutingInvestment)
    });
  }

  return plans;
}

/** Optional helper: call this once at world generation to initialize NPC states. */
export function initializeNpcAIState(world: WorldState): void {
  for (const heya of world.heyas.values()) {
    if ((heya as any).isPlayerOwned || world.playerHeyaId === heya.id) continue;
    if (!(heya as any).trainingState) {
      (heya as any).trainingState = {
        profile: createDefaultTrainingProfile(),
        focusSlots: [],
        maxFocusSlots: 3
      } satisfies HeyaTrainingState;
    }
    if (!(heya as any).scoutingInvestment) (heya as any).scoutingInvestment = "none";
  }
}

// =======================================================
// Decision Logic
// =======================================================

function decideTrainingProfile(heya: Heya, roster: Rikishi[], rng: seedrandom.PRNG): TrainingProfile {
  // If stable is financially stressed => safer training (protect assets)
  const runway = (heya as any).runwayBand as string | undefined;
  const funds = typeof heya.funds === "number" ? heya.funds : ((heya as any).funds || 0);

  // If many injured or very fatigued => increase recovery emphasis
  const injuryRate = roster.length > 0 ? roster.filter(r => (r as any).injured).length / roster.length : 0;
  const avgFatigue = averageFatigue(roster);

  // Stable identity: infer "style bias" from roster styles/archetypes
  const styleBias = inferHeyaStyleBias(roster, rng);

  // Focus selection: pick weakest average attribute, lightly biased by style
  const focus = inferHeyaFocus(roster, styleBias, rng);

  // Intensity: depends on prestige and risk/funds
  const intensity = inferIntensity(heya, runway, funds, injuryRate, avgFatigue, rng);

  // Recovery: depends on injury/fatigue + intensity
  const recovery = inferRecovery(intensity, injuryRate, avgFatigue, rng);

  return { intensity, focus, styleBias, recovery };
}

function decideFocusSlots(heya: Heya, roster: Rikishi[], maxSlots: number, rng: seedrandom.PRNG): IndividualFocus[] {
  if (maxSlots <= 0 || roster.length === 0) return [];

  // Priority list:
  // 1) currently injured => rebuild (if you allow training focus while injured, else it will matter after return)
  // 2) low stamina / high fatigue => protect
  // 3) high momentum / high rank => push
  // 4) youth / low experience => develop
  // Ensure deterministic ordering: score then sort by (score desc, id asc)
  const scored = roster.map(r => {
    const fatigue = getFatigue(r);
    const injured = !!(r as any).injured;
    const rankScore = rankWeight(r.rank);
    const momentum = clampInt((r as any).momentum ?? 0, -10, 10);

    let score = 0;
    let mode: FocusMode = "develop";

    if (injured) {
      score += 1000;
      mode = "rebuild";
    } else if (fatigue >= 75) {
      score += 800 + fatigue;
      mode = "protect";
    } else if (rankScore >= 3.8 && momentum >= 3) {
      score += 650 + momentum * 10 + rankScore * 20;
      mode = "push";
    } else if (r.experience < 45) {
      score += 500 + (45 - r.experience) * 6;
      mode = "develop";
    } else {
      // baseline: pick a small chance to push a contender
      score += 200 + rankScore * 10 + momentum * 5;
      mode = rng() < 0.15 ? "push" : "develop";
    }

    return { rikishiId: r.id, score, mode };
  });

  scored.sort((a, b) => (b.score - a.score) || a.rikishiId.localeCompare(b.rikishiId));

  return scored.slice(0, maxSlots).map(s => ({ rikishiId: s.rikishiId, mode: s.mode }));
}

function decideScoutingInvestment(heya: Heya, roster: Rikishi[], rng: seedrandom.PRNG): ScoutingInvestment {
  // Budget-aware: don't spend if desperate.
  const runway = (heya as any).runwayBand as string | undefined;
  const funds = typeof heya.funds === "number" ? heya.funds : ((heya as any).funds || 0);

  // Strong stables invest more; fragile stables conserve.
  const stature = (heya as any).statureBand as string | undefined;
  const prestigeBand = (heya as any).prestigeBand as string | undefined;

  // If roster has high-ranked sekitori, scouting matters more
  const hasTop = roster.some(r => r.rank === "yokozuna" || r.rank === "ozeki" || r.rank === "sekiwake" || r.rank === "komusubi");

  // Base preference
  let base: ScoutingInvestment = "none";

  if (runway === "desperate" || runway === "critical" || funds < 12_000_000) {
    base = rng() < 0.2 ? "light" : "none";
  } else if (stature === "legendary" || prestigeBand === "elite") {
    base = hasTop ? (rng() < 0.6 ? "deep" : "standard") : (rng() < 0.5 ? "standard" : "light");
  } else if (stature === "powerful" || prestigeBand === "respected") {
    base = hasTop ? (rng() < 0.35 ? "deep" : "standard") : (rng() < 0.6 ? "standard" : "light");
  } else if (stature === "fragile" || prestigeBand === "struggling") {
    base = rng() < 0.65 ? "none" : "light";
  } else {
    base = rng() < 0.55 ? "light" : "standard";
  }

  // Slight random wobble for variety (deterministic)
  const wobble = rng();
  if (base === "standard" && wobble < 0.08) return "deep";
  if (base === "light" && wobble < 0.08) return "standard";
  if (base === "none" && wobble < 0.06) return "light";
  if (base === "deep" && wobble < 0.10) return "standard";

  return base;
}

// =======================================================
// Heuristics
// =======================================================

function inferHeyaStyleBias(roster: Rikishi[], rng: seedrandom.PRNG): StyleBias {
  if (roster.length === 0) return "neutral";

  let oshi = 0;
  let yotsu = 0;

  for (const r of roster) {
    if (r.style === "oshi") oshi += 1.25;
    else if (r.style === "yotsu") yotsu += 1.25;
    else {
      // hybrid splits
      oshi += 0.6;
      yotsu += 0.6;
    }

    // archetype nudges
    if (r.archetype === "oshi_specialist") oshi += 1.0;
    if (r.archetype === "yotsu_specialist") yotsu += 1.0;
    if (r.archetype === "hybrid_oshi_yotsu") {
      oshi += 0.5;
      yotsu += 0.5;
    }
  }

  // If close, neutral; else dominant
  const diff = oshi - yotsu;
  if (Math.abs(diff) < roster.length * 0.35) return "neutral";
  return diff > 0 ? "oshi" : "yotsu";
}

function inferHeyaFocus(roster: Rikishi[], styleBias: StyleBias, rng: seedrandom.PRNG): TrainingFocus {
  if (roster.length === 0) return "neutral";

  const avg = {
    power: mean(roster.map(r => r.power)),
    speed: mean(roster.map(r => r.speed)),
    technique: mean(roster.map(r => r.technique)),
    balance: mean(roster.map(r => r.balance))
  };

  // Find lowest
  const entries: Array<[TrainingFocus, number]> = [
    ["power", avg.power],
    ["speed", avg.speed],
    ["technique", avg.technique],
    ["balance", avg.balance]
  ];

  // small style bias toward technique for yotsu stables, power/speed for oshi stables
  if (styleBias === "yotsu") {
    entries.push(["technique", avg.technique - 2.0]);
    entries.push(["balance", avg.balance - 1.0]);
  } else if (styleBias === "oshi") {
    entries.push(["power", avg.power - 2.0]);
    entries.push(["speed", avg.speed - 1.0]);
  }

  entries.sort((a, b) => a[1] - b[1] || a[0].localeCompare(b[0]));
  const pick = entries[0][0];

  // Occasionally keep neutral for stability
  if (rng() < 0.12) return "neutral";
  return pick;
}

function inferIntensity(
  heya: Heya,
  runway: string | undefined,
  funds: number,
  injuryRate: number,
  avgFatigue: number,
  rng: seedrandom.PRNG
): TrainingIntensity {
  const stature = (heya as any).statureBand as string | undefined;
  const prestige = (heya as any).prestigeBand as string | undefined;

  // Hard safety constraints
  if (injuryRate >= 0.18 || avgFatigue >= 70) return rng() < 0.65 ? "conservative" : "balanced";
  if (runway === "desperate" || funds < 10_000_000) return "conservative";
  if (runway === "critical") return rng() < 0.7 ? "conservative" : "balanced";

  // Elite/powerful stables push more
  if (stature === "legendary" || prestige === "elite") {
    const roll = rng();
    if (roll < 0.08) return "punishing";
    if (roll < 0.55) return "intensive";
    return "balanced";
  }

  if (stature === "powerful" || prestige === "respected") {
    const roll = rng();
    if (roll < 0.05) return "punishing";
    if (roll < 0.40) return "intensive";
    return "balanced";
  }

  // Fragile stables avoid risk
  if (stature === "fragile" || prestige === "struggling") {
    return rng() < 0.75 ? "conservative" : "balanced";
  }

  // Default
  const roll = rng();
  if (roll < 0.18) return "conservative";
  if (roll < 0.78) return "balanced";
  return "intensive";
}

function inferRecovery(
  intensity: TrainingIntensity,
  injuryRate: number,
  avgFatigue: number,
  rng: seedrandom.PRNG
): RecoveryEmphasis {
  // If hurting, recover more.
  if (injuryRate >= 0.12 || avgFatigue >= 65) return "high";

  if (intensity === "punishing") {
    return rng() < 0.65 ? "normal" : "high";
  }
  if (intensity === "intensive") {
    const roll = rng();
    if (roll < 0.18) return "low";
    if (roll < 0.80) return "normal";
    return "high";
  }
  if (intensity === "conservative") {
    return rng() < 0.25 ? "normal" : "high";
  }
  // balanced
  {
    const roll = rng();
    if (roll < 0.12) return "low";
    if (roll < 0.78) return "normal";
    return "high";
  }
}

// =======================================================
// Utilities
// =======================================================

function getHeyaRoster(world: WorldState, heya: Heya): Rikishi[] {
  const rosterIds = [...heya.rikishiIds].sort((a, b) => a.localeCompare(b));
  const out: Rikishi[] = [];
  for (const id of rosterIds) {
    const r = world.rikishi.get(id);
    if (r) out.push(r);
  }
  return out;
}

function averageFatigue(roster: Rikishi[]): number {
  if (roster.length === 0) return 0;
  return mean(roster.map(getFatigue));
}

function getFatigue(r: Rikishi): number {
  const anyR = r as any;
  const f = typeof anyR.fatigue === "number" ? anyR.fatigue : 0;
  return clampInt(f, 0, 100);
}

function mean(xs: number[]): number {
  if (xs.length === 0) return 0;
  return xs.reduce((a, b) => a + b, 0) / xs.length;
}

function clampInt(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, Math.trunc(n)));
}

/** Rough rank weight used for "contender" heuristics. */
function rankWeight(rank: string): number {
  switch (rank) {
    case "yokozuna":
      return 5.0;
    case "ozeki":
      return 4.5;
    case "sekiwake":
      return 4.0;
    case "komusubi":
      return 3.8;
    case "maegashira":
      return 3.0;
    case "juryo":
      return 2.5;
    case "makushita":
      return 2.0;
    case "sandanme":
      return 1.5;
    case "jonidan":
      return 1.0;
    case "jonokuchi":
      return 0.5;
    default:
      return 2.5;
  }
}

/** Estimate a simple prestige tier (0..5) from heya bands / reputation. */
function estimatePrestigeTier(heya: Heya): number {
  const rep = typeof (heya as any).reputation === "number" ? (heya as any).reputation : 50;
  const stature = (heya as any).statureBand as string | undefined;
  const prestige = (heya as any).prestigeBand as string | undefined;

  let tier = 2;

  if (stature === "legendary") tier += 2;
  else if (stature === "powerful") tier += 1;
  else if (stature === "fragile") tier -= 1;

  if (prestige === "elite") tier += 2;
  else if (prestige === "respected") tier += 1;
  else if (prestige === "struggling") tier -= 1;
  else if (prestige === "unknown") tier -= 1;

  // rep nudges
  if (rep >= 80) tier += 1;
  if (rep <= 25) tier -= 1;

  return clampInt(tier, 0, 5);
}

function buildNotes(
  heya: Heya,
  roster: Rikishi[],
  profile: TrainingProfile,
  focusSlots: IndividualFocus[],
  scouting: ScoutingInvestment
): string[] {
  const notes: string[] = [];

  const injured = roster.filter(r => (r as any).injured).length;
  const avgFatigue = averageFatigue(roster);

  notes.push(`profile=${profile.intensity}/${profile.focus}/${profile.styleBias}/${profile.recovery}`);
  notes.push(`focusSlots=${focusSlots.length}`);
  notes.push(`scouting=${scouting}`);

  if (injured > 0) notes.push(`injuries=${injured}`);
  if (avgFatigue >= 65) notes.push(`fatigue_high=${Math.round(avgFatigue)}`);

  const runway = (heya as any).runwayBand as string | undefined;
  if (runway) notes.push(`runway=${runway}`);

  return notes;
}
