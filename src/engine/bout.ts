// Deterministic Bout Simulation Engine
// Based on Combat Engine V3 with Tactical Archetypes
// Per Constitution: Phased resolution with leverage class and tier multipliers
//
// FIXES APPLIED (canon + correctness):
// - Removed nondeterminism: NO Date.now() fallback seed. Seed is required OR derived deterministically.
// - Fixed major math bugs:
//   - momentum weight was 0.5 (50%) instead of 0.05 (5%).
//   - jitter was being called with "5" meaning 500% swing; standardized jitter to take FRACTION (0.05 = 5%).
//   - style matchup was incorrectly giving east bonus in both mirrored cases.
// - Integrated leverage bias deterministically (constitution: leverage class + bias):
//   - Applies as a small additive bonus in tachiai/clinch, and as a multiplier in finisher weight.
// - Removed unused imports and dead state fields (or actually used them).
// - Safety guards: empty kimarite pool fallback, clamp fatigue to >= 0, stable ordering.
// - Counter kimarite selection now respects stance/vector/grip needs similarly to primary selection.

import seedrandom from "seedrandom";
import type { Rikishi, Stance, Style, TacticalArchetype, BoutResult, BoutLogEntry } from "./types";
import { ARCHETYPE_PROFILES } from "./types";
import { KIMARITE_REGISTRY, type Kimarite, type KimariteClass } from "./kimarite";
import { computeLeverageClass, getLeverageBias, type LeverageClass } from "./leverageClass";

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

/**
 * Jitter takes a FRACTION, not a “percent number”.
 * Example: jitter(0.05) = +/-2.5% of the scalar range unit you’re adding to.
 */
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

// Style matchup bonuses (fixed symmetry bug)
function getStyleMatchup(styleA: Style, styleB: Style): { east: number; west: number } {
  // You can tune these later; this is deterministic + symmetric.
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

// Leverage advantage from classes (small deterministic additive bonus)
function getLeverageAdvantage(eastClass: LeverageClass, westClass: LeverageClass): { east: number; west: number } {
  const eastBias = safeNumber(getLeverageBias(eastClass, westClass), 0);
  const westBias = safeNumber(getLeverageBias(westClass, eastClass), 0);
  // Keep this modest; it already affects multiple phases.
  return { east: eastBias * 2.0, west: westBias * 2.0 };
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
  const leverageAdv = getLeverageAdvantage(state.eastLeverageClass, state.westLeverageClass);

  // Tachiai score: Power (40%) + Speed (30%) + Balance (10%) + Aggression (15%) + Momentum (5%)
  // FIX: momentum coefficient is 0.05, not 0.5.
  // Jitter now uses a fraction; add a small jitter in absolute "score space".
  const eastScore =
    eastRikishi.power * 0.40 +
    eastRikishi.speed * 0.30 +
    eastRikishi.balance * 0.10 +
    eastRikishi.aggression * 0.15 +
    eastRikishi.momentum * 0.05 +
    eastProfile.tachiaiBonus +
    styleMatchup.east +
    archetypeMatchup.east +
    weightAdv.east +
    leverageAdv.east +
    jitter(0.8); // small absolute jitter

  const westScore =
    westRikishi.power * 0.40 +
    westRikishi.speed * 0.30 +
    westRikishi.balance * 0.10 +
    westRikishi.aggression * 0.15 +
    westRikishi.momentum * 0.05 +
    westProfile.tachiaiBonus +
    styleMatchup.west +
    archetypeMatchup.west +
    weightAdv.west +
    leverageAdv.west +
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

  const leverageAdv = getLeverageAdvantage(state.eastLeverageClass, state.westLeverageClass);
  const advLeverage = state.tachiaiWinner === "east" ? leverageAdv.east : leverageAdv.west;

  // Grip establishment probability based on archetype preferences + leverage + technique/experience
  const gripBias =
    advProfile.gripPreference * 15 +
    (advantaged.style === "yotsu" ? 15 : 0) -
    (opponent.style === "oshi" ? 8 : 0) -
    oppProfile.gripPreference * 10 +
    (advantaged.experience - opponent.experience) * 0.1 +
    (advantaged.technique - opponent.technique) * 0.15 +
    advLeverage * 0.6;

  const pBelt = clamp01(0.5 + gripBias / 100 + jitter(0.03));

  let stance: Stance;
  let stanceDescription: string;

  if (pBelt > 0.65) {
    stance = "belt-dominant";
    stanceDescription = "establishes dominant belt grip";
  } else if (pBelt < 0.30) {
    stance = "push-dominant";
    stanceDescription = "keeps distance, pushing battle";
  } else if (pBelt < 0.40) {
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

  // Position changes based on volatility + speed
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

  // Advantage shifts / recovery
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

  const leverageAdv = getLeverageAdvantage(state.eastLeverageClass, state.westLeverageClass);
  const leaderLeverage = lead === "east" ? leverageAdv.east : leverageAdv.west;

  // Filter kimarite by stance, position, and grip
  const validKimarite = KIMARITE_REGISTRY.filter((k) => {
    if (k.category === "forfeit") return false;
    if (k.baseWeight <= 0) return false;

    if (k.requiredStances.length > 0 && !k.requiredStances.includes(state.stance)) return false;

    // Vector/position check (keep your semantics)
    if (k.vector === "rear" && state.position !== "rear") return false;
    if (k.vector === "lateral" && state.position === "rear") return false;

    // Grip check
    if (k.gripNeed === "belt" && (state.stance === "no-grip" || state.stance === "push-dominant")) return false;

    return true;
  });

  // Hard fallback: choose any non-forfeit kimarite if filters are too strict
  const pool = validKimarite.length > 0 ? validKimarite : KIMARITE_REGISTRY.filter((k) => k.category !== "forfeit");

  // Tier multipliers per Constitution Section 3.2
  const TIER_MULTIPLIERS: Record<Kimarite["rarity"], number> = {
    common: 1.0,
    uncommon: 0.55,
    rare: 0.2,
    legendary: 0.05
  };

  // Weight kimarite by multiple factors
  const weightedPool: { kimarite: Kimarite; weight: number }[] = pool.map((k) => {
    let weight = k.baseWeight;

    // Tier multiplier FIRST
    weight *= TIER_MULTIPLIERS[k.rarity];

    // Style affinity
    weight += k.styleAffinity[leader.style] * 0.6;

    // Archetype synergy
    const archetypeBonus = k.archetypeBonus[leader.archetype] ?? 0;
    weight += archetypeBonus * 0.8;

    // Preferred class bonus
    if (leaderProfile.preferredClasses.includes(k.kimariteClass)) weight *= 1.4;

    // Favored kimarite bonus
    if (leader.favoredKimarite.includes(k.id)) weight *= 2.0;

    // Stance-specific bonuses
    if (state.stance === "push-dominant") {
      if (k.kimariteClass === "force_out" || k.kimariteClass === "push" || k.kimariteClass === "thrust") weight *= 1.4;
      if (k.kimariteClass === "slap_pull") weight *= 1.2;
    }

    if (state.stance === "belt-dominant" || state.stance.includes("yotsu")) {
      if (k.kimariteClass === "throw" || k.kimariteClass === "lift" || k.kimariteClass === "twist") weight *= 1.5;
    }

    // Position bonuses
    if (state.position === "rear" && k.kimariteClass === "rear") weight *= 2.5;
    if (state.position === "lateral" && (k.kimariteClass === "trip" || k.kimariteClass === "evasion")) weight *= 1.3;

    // Leverage bias as a gentle multiplier (leader leverage helps close out)
    weight *= 1 + clamp(leaderLeverage * 0.06, -0.08, 0.12);

    // Micro jitter to avoid identical outcomes in identical states (still deterministic)
    weight *= 1 + jitter(0.03);

    // Never allow non-positive weights in selection
    return { kimarite: k, weight: Math.max(0.0001, weight) };
  });

  // Weighted random selection (deterministic)
  const totalWeight = weightedPool.reduce((sum, item) => sum + item.weight, 0);
  let roll = rng() * totalWeight;
  let selectedKimarite = weightedPool[0]?.kimarite ?? pool[0];

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

// Counter kimarite selection (now respects similar constraints)
function selectCounterKimarite(
  ctx: SimulationContext,
  counterAttacker: Rikishi,
  stance: Stance,
  position: "frontal" | "lateral" | "rear"
): Kimarite | null {
  const profile = ARCHETYPE_PROFILES[counterAttacker.archetype];
  void profile; // (kept for future: preferred counter patterns)

  const counterClasses: KimariteClass[] = ["throw", "trip", "slap_pull", "twist", "evasion"];

  const candidates = KIMARITE_REGISTRY.filter((k) => {
    if (k.category === "forfeit") return false;
    if (k.baseWeight <= 0) return false;
    if (!counterClasses.includes(k.kimariteClass)) return false;
    if (k.requiredStances.length > 0 && !k.requiredStances.includes(stance)) return false;

    if (k.vector === "rear" && position !== "rear") return false;
    if (k.vector === "lateral" && position === "rear") return false;

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
  // Canon: seed must be provided by caller (world seed + day + bout index).
  // This function is purely deterministic given seed + rikishi state.
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

  // Phases
  resolveTachiai(ctx);
  resolveClinch(ctx);

  // Variable momentum ticks based on archetype volatility (deterministic)
  const avgVolatility =
    (ARCHETYPE_PROFILES[eastRikishi.archetype].volatility + ARCHETYPE_PROFILES[westRikishi.archetype].volatility) / 2;

  const baseTicks = avgVolatility > 0.4 ? 2 : 3;
  const momentumTicks = baseTicks + Math.floor(rng() * 3);

  for (let i = 0; i < momentumTicks; i++) resolveMomentum(ctx);

  const { winner, kimarite } = resolveFinisher(ctx);

  // Determine if upset (use your rank strings, deterministic)
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
    (winner === "east" && eastRank > westRank + 2) || (winner === "west" && westRank > eastRank + 2);

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

// Quick simulation without full log
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
