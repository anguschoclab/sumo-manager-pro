// bout.ts
// Deterministic Bout Simulation Engine
// Based on Combat Engine V3 with Tactical Archetypes
// Per Constitution: Phased resolution with leverage class and tier multipliers
//
// FIXES APPLIED (compile + canon alignment):
// - Uses the *new* leverage API correctly:
//   - NO getLeverageBias(eastClass, westClass) (that was a type/semantics mismatch).
//   - Tachiai/clinch use small additive leverage deltas derived from stability/mobility.
//   - Finisher uses leverage *multiplier per kimarite family* via getLeverageMultiplierForKimarite(...).
// - Kimarite source unified: uses KIMARITE_REGISTRY (alias KIMARITE_ALL exported locally for compatibility).
// - Removed invalid category "result" checks (not in your KimariteCategory union).
// - Keeps determinism: seed required; jitter is fraction; no Math.random.
// - Keeps your stance/vector/grip constraints and safety fallbacks.

import seedrandom from "seedrandom";
import type { Rikishi, Stance, Style, TacticalArchetype, BoutResult, BoutLogEntry } from "./types";
import { ARCHETYPE_PROFILES } from "./types";
import { KIMARITE_REGISTRY, type Kimarite, type KimariteClass } from "./kimarite";
import {
  computeLeverageClass,
  getStabilityBonus,
  getMobilityBonus,
  getLeverageMultiplierForKimarite,
  type LeverageClass
} from "./leverageClass";

// Compatibility alias if other files still refer to KIMARITE_ALL
const KIMARITE_ALL = KIMARITE_REGISTRY;

interface BoutState {
  clock: number;
  fatigueEast: number;
  fatigueWest: number;
  stance: Stance;
  advantage: "east" | "west" | "none";
  tachiaiWinner: "east" | "west";
  position: "frontal" | "lateral" | "rear";
  eastLeverageClass: LeverageClass;
  westLeverageClass: LeverageClass;
  log: BoutLogEntry[];
}

interface SimulationContext {
  rng: seedrandom.PRNG;
  eastRikishi: Rikishi;
  westRikishi: Rikishi;
  state: BoutState;
}

// === Utility ===
const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));
const clamp01 = (value: number) => clamp(value, 0, 1);

const createJitter = (rng: seedrandom.PRNG) => (fraction = 0.05) => (rng() - 0.5) * fraction;

function safeNumber(x: number, fallback = 0): number {
  return Number.isFinite(x) ? x : fallback;
}

// Archetype matchup bonuses
function getArchetypeMatchup(
  archA: TacticalArchetype,
  archB: TacticalArchetype
): { east: number; west: number } {
  const matchups: Record<TacticalArchetype, TacticalArchetype[]> = {
    oshi_specialist: ["yotsu_specialist"],
    yotsu_specialist: ["speedster", "trickster"],
    speedster: ["oshi_specialist"],
    trickster: ["oshi_specialist"],
    all_rounder: [],
    hybrid_oshi_yotsu: ["speedster"],
    counter_specialist: ["oshi_specialist", "trickster"]
  };

  const eastAdvantage = matchups[archA]?.includes(archB) ? 5 : 0;
  const westAdvantage = matchups[archB]?.includes(archA) ? 5 : 0;
  return { east: eastAdvantage, west: westAdvantage };
}

// Style matchup bonuses (symmetric)
function getStyleMatchup(styleA: Style, styleB: Style): { east: number; west: number } {
  if (styleA === "yotsu" && styleB === "oshi") return { east: 3, west: 0 };
  if (styleA === "oshi" && styleB === "yotsu") return { east: 0, west: 3 };
  if (styleA === "hybrid" && styleB !== "hybrid") return { east: 1, west: 0 };
  if (styleB === "hybrid" && styleA !== "hybrid") return { east: 0, west: 1 };
  return { east: 0, west: 0 };
}

// Weight advantage calculation
function getWeightAdvantage(east: Rikishi, west: Rikishi): { east: number; west: number } {
  const diff = safeNumber(east.weight, 0) - safeNumber(west.weight, 0);
  const advantage = clamp(diff / 20, -5, 5);
  return {
    east: advantage > 0 ? advantage : 0,
    west: advantage < 0 ? -advantage : 0
  };
}

/**
 * Leverage advantage as *small additive score-space deltas* derived from:
 * - stability (helps at tachiai + holding ground)
 * - mobility  (helps creating angles / breaking stalemates)
 *
 * This avoids the earlier type mismatch where leverage bias was treated as "class vs class".
 */
function getLeverageScoreDeltas(eastClass: LeverageClass, westClass: LeverageClass): { east: number; west: number } {
  const stE = safeNumber(getStabilityBonus(eastClass), 0);
  const stW = safeNumber(getStabilityBonus(westClass), 0);
  const mbE = safeNumber(getMobilityBonus(eastClass), 0);
  const mbW = safeNumber(getMobilityBonus(westClass), 0);

  // Keep modest. These are “soft” nudges; kimarite-family multipliers do the heavy lifting later.
  const stabilityDelta = clamp((stE - stW) * 0.08, -2.0, 2.0);
  const mobilityDelta = clamp((mbE - mbW) * 0.05, -1.5, 1.5);

  const east = stabilityDelta + mobilityDelta;
  return { east, west: -east };
}

// === PHASE 1: TACHIAI ===
function resolveTachiai(ctx: SimulationContext): void {
  const { rng, eastRikishi, westRikishi, state } = ctx;
  const jitter = createJitter(rng);

  const eastProfile = ARCHETYPE_PROFILES[eastRikishi.archetype];
  const westProfile = ARCHETYPE_PROFILES[westRikishi.archetype];

  const styleMatchup = getStyleMatchup(eastRikishi.style, westRikishi.style);
  const archetypeMatchup = getArchetypeMatchup(eastRikishi.archetype, westRikishi.archetype);
  const weightAdv = getWeightAdvantage(eastRikishi, westRikishi);
  const leverage = getLeverageScoreDeltas(state.eastLeverageClass, state.westLeverageClass);

  const eastScore =
    eastRikishi.power * 0.4 +
    eastRikishi.speed * 0.3 +
    eastRikishi.balance * 0.1 +
    eastRikishi.aggression * 0.15 +
    eastRikishi.momentum * 0.05 +
    eastProfile.tachiaiBonus +
    styleMatchup.east +
    archetypeMatchup.east +
    weightAdv.east +
    leverage.east +
    jitter(0.8);

  const westScore =
    westRikishi.power * 0.4 +
    westRikishi.speed * 0.3 +
    westRikishi.balance * 0.1 +
    westRikishi.aggression * 0.15 +
    westRikishi.momentum * 0.05 +
    westProfile.tachiaiBonus +
    styleMatchup.west +
    archetypeMatchup.west +
    weightAdv.west +
    leverage.west +
    jitter(0.8);

  const winner = eastScore >= westScore ? "east" : "west";
  state.tachiaiWinner = winner;
  state.advantage = winner;
  state.position = "frontal";

  state.log.push({
    phase: "tachiai",
    description: `${winner === "east" ? eastRikishi.shikona : westRikishi.shikona} wins the tachiai`,
    data: {
      winner,
      eastScore: Math.round(eastScore * 10) / 10,
      westScore: Math.round(westScore * 10) / 10,
      margin: Math.round(Math.abs(eastScore - westScore) * 10) / 10,
      eastLeverageClass: state.eastLeverageClass,
      westLeverageClass: state.westLeverageClass
    }
  });
}

// === PHASE 2: CLINCH / GRIP BATTLE ===
function resolveClinch(ctx: SimulationContext): void {
  const { rng, eastRikishi, westRikishi, state } = ctx;
  const jitter = createJitter(rng);

  const advantaged = state.tachiaiWinner === "east" ? eastRikishi : westRikishi;
  const opponent = state.tachiaiWinner === "east" ? westRikishi : eastRikishi;

  const advProfile = ARCHETYPE_PROFILES[advantaged.archetype];
  const oppProfile = ARCHETYPE_PROFILES[opponent.archetype];

  const leverage = getLeverageScoreDeltas(state.eastLeverageClass, state.westLeverageClass);
  const advLeverage = state.tachiaiWinner === "east" ? leverage.east : leverage.west;

  const gripBias =
    advProfile.gripPreference * 15 +
    (advantaged.style === "yotsu" ? 15 : 0) -
    (opponent.style === "oshi" ? 8 : 0) -
    oppProfile.gripPreference * 10 +
    (advantaged.experience - opponent.experience) * 0.1 +
    (advantaged.technique - opponent.technique) * 0.15 +
    advLeverage * 0.8;

  const pBelt = clamp01(0.5 + gripBias / 100 + jitter(0.03));

  let stance: Stance;
  let stanceDescription: string;

  if (pBelt > 0.65) {
    stance = "belt-dominant";
    stanceDescription = "establishes dominant belt grip";
  } else if (pBelt < 0.3) {
    stance = "push-dominant";
    stanceDescription = "keeps distance, pushing battle";
  } else if (pBelt < 0.4) {
    stance = "no-grip";
    stanceDescription = "both wrestlers struggle for position";
    state.advantage = "none";
  } else {
    stance = rng() < 0.5 ? "migi-yotsu" : "hidari-yotsu";
    stanceDescription = `settles into ${stance === "migi-yotsu" ? "right-hand inside" : "left-hand inside"} grip`;
    if (rng() < 0.4) state.advantage = "none";
  }

  state.stance = stance;

  state.log.push({
    phase: "clinch",
    description: stanceDescription,
    data: {
      stance,
      advantage: state.advantage,
      gripProbability: Math.round(pBelt * 100)
    }
  });
}

// === PHASE 3: MOMENTUM / FATIGUE TICKS ===
function resolveMomentum(ctx: SimulationContext): void {
  const { rng, eastRikishi, westRikishi, state } = ctx;
  const jitter = createJitter(rng);

  const eastProfile = ARCHETYPE_PROFILES[eastRikishi.archetype];
  const westProfile = ARCHETYPE_PROFILES[westRikishi.archetype];

  const powerDiff = Math.abs(eastRikishi.power - westRikishi.power);
  const baseDrain = 1 + powerDiff * 0.01;

  const avgExperience = (eastRikishi.experience + westRikishi.experience) / 2;
  const drainMod = clamp01(0.02 + (100 - avgExperience) * 0.0008);

  const eastDrainMod = state.advantage === "west" ? 1.3 : 1.0;
  const westDrainMod = state.advantage === "east" ? 1.3 : 1.0;

  state.fatigueEast = Math.max(0, state.fatigueEast + baseDrain * drainMod * eastDrainMod + jitter(0.5));
  state.fatigueWest = Math.max(0, state.fatigueWest + baseDrain * drainMod * westDrainMod + jitter(0.5));
  state.clock += 1;

  // Position changes
  if (rng() < 0.15) {
    const speedierSide = eastRikishi.speed > westRikishi.speed ? "east" : "west";
    const speedierProfile = speedierSide === "east" ? eastProfile : westProfile;

    if (rng() < speedierProfile.volatility * 0.5) {
      if (state.position === "frontal") {
        state.position = "lateral";
        state.log.push({
          phase: "momentum",
          description: `${speedierSide === "east" ? eastRikishi.shikona : westRikishi.shikona} moves to the side`,
          data: {
            position: state.position,
            tick: state.clock,
            recovery: false,
            fatigueEast: state.fatigueEast,
            fatigueWest: state.fatigueWest
          }
        });
        return;
      } else if (state.position === "lateral" && rng() < 0.3) {
        state.position = "rear";
        state.advantage = speedierSide;
        state.log.push({
          phase: "momentum",
          description: `${speedierSide === "east" ? eastRikishi.shikona : westRikishi.shikona} gets behind!`,
          data: {
            position: state.position,
            tick: state.clock,
            recovery: false,
            fatigueEast: state.fatigueEast,
            fatigueWest: state.fatigueWest
          }
        });
        return;
      }
    }
  }

  // Advantage recovery
  if (state.advantage !== "none" && rng() < 0.12) {
    const disadvantagedSide = state.advantage === "east" ? "west" : "east";
    const disadvantaged = disadvantagedSide === "east" ? eastRikishi : westRikishi;
    const disProfile = ARCHETYPE_PROFILES[disadvantaged.archetype];

    const recovery =
      disadvantaged.balance * 0.01 +
      disadvantaged.experience * 0.005 +
      disProfile.counterBonus * 0.01;

    if (rng() < recovery * 0.35) {
      state.advantage = "none";
      state.log.push({
        phase: "momentum",
        description: `${disadvantaged.shikona} recovers position`,
        data: {
          fatigueEast: Math.round(state.fatigueEast * 100) / 100,
          fatigueWest: Math.round(state.fatigueWest * 100) / 100,
          tick: state.clock,
          recovery: true
        }
      });
      return;
    }
  }

  state.log.push({
    phase: "momentum",
    description: `Struggle continues`,
    data: {
      fatigueEast: Math.round(state.fatigueEast * 100) / 100,
      fatigueWest: Math.round(state.fatigueWest * 100) / 100,
      tick: state.clock,
      recovery: false
    }
  });
}

// === PHASE 4: FINISHER (KIMARITE SELECTION) ===
function resolveFinisher(ctx: SimulationContext): { winner: "east" | "west"; kimarite: Kimarite } {
  const { rng, eastRikishi, westRikishi, state } = ctx;
  const jitter = createJitter(rng);

  const lead = state.advantage !== "none" ? state.advantage : state.tachiaiWinner;
  const leader = lead === "east" ? eastRikishi : westRikishi;
  const follower = lead === "east" ? westRikishi : eastRikishi;

  const leaderProfile = ARCHETYPE_PROFILES[leader.archetype];
  const followerProfile = ARCHETYPE_PROFILES[follower.archetype];

  const leaderLeverageClass = lead === "east" ? state.eastLeverageClass : state.westLeverageClass;

  // Filter kimarite by stance, position, and grip
  const validKimarite = KIMARITE_ALL.filter((k) => {
    if (k.category === "forfeit") return false;
    if (k.baseWeight <= 0) return false;

    if (k.requiredStances.length > 0 && !k.requiredStances.includes(state.stance)) return false;

    // Vector/position rules:
    if (k.vector === "rear" && state.position !== "rear") return false;
    if (k.vector === "lateral" && state.position !== "lateral") return false;

    // Grip check
    if (k.gripNeed === "belt" && (state.stance === "no-grip" || state.stance === "push-dominant")) return false;

    return true;
  });

  // Hard fallback: any real kimarite (still excludes forfeit)
  const fallbackPool = KIMARITE_ALL.filter((k) => k.category !== "forfeit" && k.baseWeight > 0);
  const pool = validKimarite.length > 0 ? validKimarite : fallbackPool;

  // Absolute last-resort fallback
  const absoluteFallback =
    fallbackPool.find((k) =>
      state.stance === "belt-dominant" || String(state.stance).includes("yotsu") ? k.id === "yorikiri" : k.id === "oshidashi"
    ) ?? fallbackPool[0];

  const TIER_MULTIPLIERS: Record<Kimarite["rarity"], number> = {
    common: 1.0,
    uncommon: 0.55,
    rare: 0.2,
    legendary: 0.05
  };

  const weightedPool = pool.map((k) => {
    let weight = k.baseWeight;

    // Tier multiplier first
    weight *= TIER_MULTIPLIERS[k.rarity];

    // Style affinity
    weight += k.styleAffinity[leader.style] * 0.6;

    // Archetype synergy
    const archetypeBonus = k.archetypeBonus[leader.archetype] ?? 0;
    weight += archetypeBonus * 0.8;

    // Preferred class
    if (leaderProfile.preferredClasses.includes(k.kimariteClass)) weight *= 1.4;

    // Favored moves
    if (leader.favoredKimarite.includes(k.id)) weight *= 2.0;

    // Stance bonuses
    if (state.stance === "push-dominant") {
      if (k.kimariteClass === "force_out" || k.kimariteClass === "push" || k.kimariteClass === "thrust") weight *= 1.4;
      if (k.kimariteClass === "slap_pull") weight *= 1.2;
    }
    if (state.stance === "belt-dominant" || String(state.stance).includes("yotsu")) {
      if (k.kimariteClass === "throw" || k.kimariteClass === "lift" || k.kimariteClass === "twist") weight *= 1.5;
    }

    // Position bonuses
    if (state.position === "rear" && k.kimariteClass === "rear") weight *= 2.5;

    // ✅ Leverage multiplier per kimarite family (constitution 8.2 hook)
    weight *= getLeverageMultiplierForKimarite(leaderLeverageClass, k);

    // Micro jitter (still deterministic)
    weight *= 1 + jitter(0.03);

    return { kimarite: k, weight: Math.max(0.0001, weight) };
  });

  const totalWeight = weightedPool.reduce((sum, item) => sum + item.weight, 0);
  let roll = rng() * totalWeight;

  let selectedKimarite = weightedPool[0]?.kimarite ?? absoluteFallback;
  for (const item of weightedPool) {
    roll -= item.weight;
    if (roll <= 0) {
      selectedKimarite = item.kimarite;
      break;
    }
  }

  // Counter-attack chance
  const counterChance = clamp01(
    (follower.balance - leader.balance) * 0.006 +
      (follower.experience - leader.experience) * 0.003 +
      (follower.technique - leader.technique) * 0.004 +
      followerProfile.counterBonus * 0.008 +
      followerProfile.volatility * 0.05 +
      jitter(0.02)
  );

  const isCounter = rng() < counterChance * 0.15;
  const finalWinner = isCounter ? (lead === "east" ? "west" : "east") : lead;

  if (isCounter) {
    const counterKimarite = selectCounterKimarite(ctx, follower, state.stance, state.position);
    if (counterKimarite) selectedKimarite = counterKimarite;
  }

  state.log.push({
    phase: "finish",
    description: isCounter
      ? `${follower.shikona} counters with ${selectedKimarite.name}!`
      : `${leader.shikona} wins by ${selectedKimarite.name}`,
    data: {
      winner: finalWinner,
      kimarite: selectedKimarite.id,
      kimariteName: selectedKimarite.name,
      kimariteNameJa: selectedKimarite.nameJa ?? "",
      isCounter,
      counterChance: Math.round(counterChance * 100)
    }
  });

  return { winner: finalWinner, kimarite: selectedKimarite };
}

// Counter kimarite selection (respects similar constraints)
function selectCounterKimarite(
  ctx: SimulationContext,
  counterAttacker: Rikishi,
  stance: Stance,
  position: "frontal" | "lateral" | "rear"
): Kimarite | null {
  const counterClasses: KimariteClass[] = ["throw", "trip", "slap_pull", "twist", "evasion"];

  const candidates = KIMARITE_ALL.filter((k) => {
    if (k.category === "forfeit") return false;
    if (k.baseWeight <= 0) return false;
    if (!counterClasses.includes(k.kimariteClass)) return false;
    if (k.requiredStances.length > 0 && !k.requiredStances.includes(stance)) return false;

    if (k.vector === "rear" && position !== "rear") return false;
    if (k.vector === "lateral" && position !== "lateral") return false;

    if (k.gripNeed === "belt" && (stance === "no-grip" || stance === "push-dominant")) return false;

    return true;
  });

  if (candidates.length === 0) return null;

  const weighted = candidates.map((k) => ({
    kimarite: k,
    weight: Math.max(
      0.0001,
      k.baseWeight * 0.6 +
        (k.archetypeBonus[counterAttacker.archetype] ?? 0) * 0.8 +
        k.styleAffinity[counterAttacker.style] * 0.3
    )
  }));

  const total = weighted.reduce((s, w) => s + w.weight, 0);
  let roll = ctx.rng() * total;

  for (const item of weighted) {
    roll -= item.weight;
    if (roll <= 0) return item.kimarite;
  }

  return weighted[0]?.kimarite ?? candidates[0];
}

// === MAIN BOUT SIMULATION ===
export function simulateBout(eastRikishi: Rikishi, westRikishi: Rikishi, seed: string): BoutResult {
  const rng = seedrandom(seed);

  const state: BoutState = {
    clock: 0,
    fatigueEast: 0,
    fatigueWest: 0,
    stance: "no-grip",
    advantage: "none",
    tachiaiWinner: "east",
    position: "frontal",
    eastLeverageClass: computeLeverageClass(eastRikishi.height, eastRikishi.weight),
    westLeverageClass: computeLeverageClass(westRikishi.height, westRikishi.weight),
    log: []
  };

  const ctx: SimulationContext = { rng, eastRikishi, westRikishi, state };

  resolveTachiai(ctx);
  resolveClinch(ctx);

  const avgVolatility =
    (ARCHETYPE_PROFILES[eastRikishi.archetype].volatility + ARCHETYPE_PROFILES[westRikishi.archetype].volatility) / 2;

  const baseTicks = avgVolatility > 0.4 ? 2 : 3;
  const momentumTicks = baseTicks + Math.floor(rng() * 3);

  for (let i = 0; i < momentumTicks; i++) resolveMomentum(ctx);

  const { winner, kimarite } = resolveFinisher(ctx);

  const rankOrder: Record<string, number> = {
    yokozuna: 1,
    ozeki: 2,
    sekiwake: 3,
    komusubi: 4,
    maegashira: 5,
    juryo: 6,
    makushita: 7,
    sandanme: 8,
    jonidan: 9,
    jonokuchi: 10
  };

  const eastRank = rankOrder[eastRikishi.rank] ?? 10;
  const westRank = rankOrder[westRikishi.rank] ?? 10;

  const upset =
    (winner === "east" && eastRank > westRank + 2) ||
    (winner === "west" && westRank > eastRank + 2);

  return {
    winner,
    winnerRikishiId: winner === "east" ? eastRikishi.id : westRikishi.id,
    loserRikishiId: winner === "east" ? westRikishi.id : eastRikishi.id,
    kimarite: kimarite.id,
    kimariteName: kimarite.name,
    stance: state.stance,
    tachiaiWinner: state.tachiaiWinner,
    duration: state.clock,
    upset,
    log: state.log
  };
}

export function quickSimulateBout(
  eastRikishi: Rikishi,
  westRikishi: Rikishi,
  seed: string
): Pick<BoutResult, "winner" | "kimarite" | "kimariteName" | "upset"> {
  const result = simulateBout(eastRikishi, westRikishi, seed);
  return {
    winner: result.winner,
    kimarite: result.kimarite,
    kimariteName: result.kimariteName,
    upset: result.upset
  };
}
