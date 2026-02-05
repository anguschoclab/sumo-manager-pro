// npcAI.ts
// =======================================================
// NPC Oyakata AI v1.0 (Constitution-aligned)
// - Deterministic weekly stable policy updates for non-player heyas.
// - Produces stable training policy (intensity/focus/styleBias/recovery).
// - Avoids "perfect information" beyond stable-owned roster + oyakata traits.
// - Includes inertia (won't flip style bias every week).
//
// Key canon goals supported:
// - Manager identity matters (archetype + traits).
// - Stable identity matters (roster style makeup, facilities, prestige).
// - Decisions are explainable (optional aiLog + events).
// =======================================================

import seedrandom from "seedrandom";
import type { WorldState, Heya, Oyakata, StyleBias, TrainingIntensity, TrainingFocus, RecoveryEmphasis, TrainingProfile, Rikishi, Style, Id } from "./types";
import { appendEvents, createDefaultEventsState, makeSimpleEvent, type EngineEvent } from "./events";

type RNG = seedrandom.PRNG;

/** Lightweight deterministic RNG (order-independent when used per-entity). */
function makeRng(seed: string): RNG {
  return seedrandom(seed);
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function styleSign(bias: StyleBias): number {
  return bias === "oshi" ? 1 : bias === "yotsu" ? -1 : 0;
}

function normalizeStyle(style: Style): "oshi" | "yotsu" | "hybrid" {
  return style;
}

function heyaRoster(world: WorldState, heya: Heya): Rikishi[] {
  const out: Rikishi[] = [];
  for (const id of heya.rikishiIds) {
    const r = world.rikishi.get(id);
    if (r) out.push(r);
  }
  return out;
}

/**
 * Roster identity score: -1..+1 where:
 * -1 is yotsu-heavy, +1 is oshi-heavy, 0 is mixed.
 * Weighted by rank prominence so top rikishi define the public identity.
 */
function computeRosterStyleIdentity(roster: Rikishi[]): number {
  if (roster.length === 0) return 0;

  const rankWeight = (r: Rikishi): number => {
    // Small, deterministic weights: san'yaku/top division matter more, but avoid huge swings.
    const divBoost = r.division === "makuuchi" ? 1.25 : r.division === "juryo" ? 1.1 : 1.0;
    const rankBoost =
      r.rank === "yokozuna" ? 1.6 :
      r.rank === "ozeki" ? 1.45 :
      r.rank === "sekiwake" ? 1.35 :
      r.rank === "komusubi" ? 1.25 :
      1.0;
    return divBoost * rankBoost;
  };

  let num = 0;
  let den = 0;

  for (const r of roster) {
    const w = rankWeight(r);
    den += w;
    const s = normalizeStyle(r.style);
    const v = s === "oshi" ? 1 : s === "yotsu" ? -1 : 0;
    num += v * w;
  }

  return den > 0 ? clamp(num / den, -1, 1) : 0;
}

/**
 * Trait/archetype prior preference for style bias: -1..+1.
 * Traditionalist/tradition => yotsu tilt; Tyrant/Gambler/risk => oshi tilt.
 */
function computeManagerStylePrior(oyakata: Oyakata): number {
  const t = oyakata.traits;

  // Traits are 0..100
  const tradition = clamp(t.tradition / 100, 0, 1);
  const risk = clamp(t.risk / 100, 0, 1);
  const ambition = clamp(t.ambition / 100, 0, 1);

  let archetypeBias = 0;
  switch (oyakata.archetype) {
    case "traditionalist":
      archetypeBias = -0.55;
      break;
    case "scientist":
      archetypeBias = 0.0; // tends to neutral
      break;
    case "gambler":
      archetypeBias = 0.35;
      break;
    case "nurturer":
      archetypeBias = -0.10;
      break;
    case "tyrant":
      archetypeBias = 0.45;
      break;
    case "strategist":
      archetypeBias = 0.10; // slightly favors adaptability; handled later
      break;
  }

  // Combine: tradition pushes yotsu, risk pushes oshi; ambition adds mild oshi tilt (faster results)
  const traitBias = (risk * 0.35 + ambition * 0.12) - (tradition * 0.38);

  return clamp(archetypeBias + traitBias, -1, 1);
}

function chooseBiasFromScore(score: number, inertiaNeutralBand: number): StyleBias {
  if (score > inertiaNeutralBand) return "oshi";
  if (score < -inertiaNeutralBand) return "yotsu";
  return "neutral";
}

/**
 * Decide training intensity based on ambition/risk/compassion + facilities.
 * Canon: reckless stables run hot, compassionate stables emphasize sustainability.
 */
function decideIntensity(oyakata: Oyakata, heya: Heya): TrainingIntensity {
  const t = oyakata.traits;
  const ambition = clamp(t.ambition / 100, 0, 1);
  const risk = clamp(t.risk / 100, 0, 1);
  const compassion = clamp(t.compassion / 100, 0, 1);

  const recovery = clamp((heya.facilities?.recovery ?? 50) / 100, 0, 1);

  // Score 0..1: higher -> more intense
  const drive = clamp(0.55 * ambition + 0.35 * risk - 0.40 * compassion - 0.15 * recovery, 0, 1);

  if (drive > 0.82) return "punishing";
  if (drive > 0.62) return "intensive";
  if (drive > 0.38) return "balanced";
  return "conservative";
}

/**
 * Decide focus: should match bias but also shore up weakness.
 */
function decideFocus(args: { bias: StyleBias; roster: Rikishi[]; rng: RNG }): TrainingFocus {
  const { bias, roster, rng } = args;

  if (roster.length === 0) return "neutral";

  // Average stats to detect weakness
  const avg = roster.reduce(
    (acc, r) => {
      acc.power += r.power;
      acc.speed += r.speed;
      acc.technique += r.technique;
      acc.balance += r.balance;
      return acc;
    },
    { power: 0, speed: 0, technique: 0, balance: 0 }
  );

  avg.power /= roster.length;
  avg.speed /= roster.length;
  avg.technique /= roster.length;
  avg.balance /= roster.length;

  // Weakness pick among bias-relevant pair
  if (bias === "oshi") {
    // oshi tends to be power/speed; pick lower
    return avg.power < avg.speed ? "power" : "speed";
  }
  if (bias === "yotsu") {
    // yotsu tends to be technique/balance; pick lower
    return avg.technique < avg.balance ? "technique" : "balance";
  }

  // Neutral: probabilistic but deterministic; favor lowest stat of four
  const stats: Array<[TrainingFocus, number]> = [
    ["power", avg.power],
    ["speed", avg.speed],
    ["technique", avg.technique],
    ["balance", avg.balance]
  ];
  stats.sort((a, b) => a[1] - b[1]);

  // 70% pick worst, 30% pick second-worst
  const roll = rng();
  return roll < 0.7 ? stats[0][0] : stats[1][0];
}

function decideRecovery(oyakata: Oyakata, heya: Heya): RecoveryEmphasis {
  const compassion = clamp(oyakata.traits.compassion / 100, 0, 1);
  const risk = clamp(oyakata.traits.risk / 100, 0, 1);
  const recFacility = clamp((heya.facilities?.recovery ?? 50) / 100, 0, 1);

  const score = clamp(0.55 * compassion + 0.25 * recFacility - 0.25 * risk, 0, 1);
  if (score > 0.72) return "high";
  if (score > 0.40) return "normal";
  return "low";
}

function defaultTrainingProfile(): TrainingProfile {
  return { intensity: "balanced", focus: "neutral", styleBias: "neutral", recovery: "normal" };
}

/**
 * Canon-aligned bias selection:
 * - Uses roster identity + manager prior.
 * - Strategist archetype is more "adaptive" (weights roster more).
 * - Includes inertia so bias won't ping-pong.
 */
export function determineNpcTrainingProfile(world: WorldState, heyaId: Id): {
  profile: TrainingProfile;
  rationale: string[];
} {
  const heya = world.heyas.get(heyaId);
  if (!heya) return { profile: defaultTrainingProfile(), rationale: ["missing heya -> default profile"] };

  const oyakata = world.oyakata.get(heya.oyakataId);
  if (!oyakata) return { profile: defaultTrainingProfile(), rationale: ["missing oyakata -> default profile"] };

  const roster = heyaRoster(world, heya);
  const rosterId = computeRosterStyleIdentity(roster); // -1..+1
  const prior = computeManagerStylePrior(oyakata); // -1..+1

  const rng = makeRng(`${world.seed}::npcAI::${world.week}::${heyaId}`);

  // Strategist leans into roster/read-based adaptation; Scientist leans neutral
  const archetypeRosterWeight =
    oyakata.archetype === "strategist" ? 0.68 :
    oyakata.archetype === "scientist" ? 0.42 :
    0.55;

  const combined = clamp(lerp(prior, rosterId, archetypeRosterWeight), -1, 1);

  // Inertia: if last bias exists, make it harder to flip unless evidence is strong
  const existingBias: StyleBias =
    heya.trainingState?.profile?.styleBias ?? "neutral";

  const inertiaBand = existingBias === "neutral" ? 0.20 : 0.35;

  let bias = chooseBiasFromScore(combined, inertiaBand);

  // Small, deterministic "personality wobble" to avoid identical stables behaving identically,
  // but only inside neutral band so it doesn't override strong signals.
  const wobble = (rng() - 0.5) * 0.10; // -0.05..+0.05
  bias = chooseBiasFromScore(clamp(combined + wobble, -1, 1), inertiaBand);

  const intensity = decideIntensity(oyakata, heya);
  const focus = decideFocus({ bias, roster, rng });
  const recovery = decideRecovery(oyakata, heya);

  const rationale: string[] = [
    `rosterIdentity=${rosterId.toFixed(2)} (oshi:+ yotsu:-)`,
    `managerPrior=${prior.toFixed(2)} (oshi:+ yotsu:-)`,
    `combined=${combined.toFixed(2)} inertiaBand=${inertiaBand.toFixed(2)}`,
    `bias=${bias} intensity=${intensity} focus=${focus} recovery=${recovery}`
  ];

  return { profile: { intensity, focus, styleBias: bias, recovery }, rationale };
}

/**
 * Weekly tick: update NPC heyas' training policies.
 * Player-owned heya is left to UI/Player control.
 */
export function tickWeek(world: WorldState): void {
  const playerHeyaId = world.playerHeyaId;

  const emitted: EngineEvent[] = [];
  const seed = `${world.seed}::npcAI::week${world.week}`;

  for (const heya of world.heyas.values()) {
    if (heya.isPlayerOwned || (playerHeyaId && heya.id === playerHeyaId)) continue;

    const before = heya.trainingState?.profile ?? defaultTrainingProfile();
    const { profile: after, rationale } = determineNpcTrainingProfile(world, heya.id);

    // Apply
    heya.trainingState = heya.trainingState ?? { profile: after, focusSlots: [], maxFocusSlots: 2 };
    heya.trainingState.profile = after;

    // Optional audit log
    const aiLog = (world as any).aiLog ?? [];
    (world as any).aiLog = aiLog;
    aiLog.push({
      kind: "npc_training_policy",
      week: world.week,
      year: world.year,
      heyaId: heya.id,
      oyakataId: heya.oyakataId,
      before,
      after,
      rationale
    });

    // Emit event only on notable changes to avoid spam
    const changedBias = before.styleBias !== after.styleBias;
    const changedIntensity = before.intensity !== after.intensity;

    if (changedBias || changedIntensity) {
      const title = changedBias
        ? `A stable shifts its training identity`
        : `A stable adjusts training intensity`;

      const summary = changedBias
        ? `${heya.name} begins leaning ${after.styleBias === "neutral" ? "balanced" : after.styleBias.toUpperCase()} in its training emphasis.`
        : `${heya.name} moves to ${after.intensity.toUpperCase()} training weeks.`;

      const { event } = makeSimpleEvent({
        world,
        seed,
        phase: "weekly",
        category: "training",
        importance: changedBias ? "notable" : "minor",
        scope: "heya",
        heyaId: heya.id,
        title,
        summary,
        truthLevel: "public",
        data: { heyaId: heya.id, before, after },
        tags: ["npc_ai"]
      });

      emitted.push(event);
    }
  }

  // Attach to world events state (optional)
  const eventsState = ((world as any).eventsState) ?? createDefaultEventsState();
  (world as any).eventsState = appendEvents(eventsState, emitted, false);
}
