// Deterministic Bout Simulation Engine
// Based on Basho Design Bible - Combat & Tachiai System

import seedrandom from "seedrandom";
import type { Rikishi, Stance, Style, BoutResult, BoutLogEntry } from "./types";
import { KIMARITE_REGISTRY, type Kimarite } from "./kimarite";

interface BoutState {
  clock: number;
  fatigueEast: number;
  fatigueWest: number;
  stance: Stance;
  advantage: "east" | "west" | "none";
  tachiaiWinner: "east" | "west";
  log: BoutLogEntry[];
}

interface SimulationContext {
  rng: seedrandom.PRNG;
  eastRikishi: Rikishi;
  westRikishi: Rikishi;
  state: BoutState;
}

// Utility functions
const clamp = (value: number, min: number, max: number) => 
  Math.max(min, Math.min(max, value));

const clamp01 = (value: number) => clamp(value, 0, 1);

// Create jitter function with seeded RNG
const createJitter = (rng: seedrandom.PRNG) => (pct = 0.05) => 
  (rng() - 0.5) * pct;

// Style matchup bonuses
function getStyleMatchup(styleA: Style, styleB: Style): { east: number; west: number } {
  // Small stylistic bonuses
  if (styleA === "yotsu" && styleB === "oshi") return { east: 3, west: 0 };
  if (styleA === "oshi" && styleB === "yotsu") return { east: 3, west: 0 };
  if (styleA === "hybrid") return { east: 1, west: 0 }; // Hybrids adapt slightly
  if (styleB === "hybrid") return { east: 0, west: 1 };
  return { east: 0, west: 0 };
}

// Weight advantage calculation
function getWeightAdvantage(east: Rikishi, west: Rikishi): { east: number; west: number } {
  const diff = east.weight - west.weight;
  const advantage = clamp(diff / 20, -5, 5); // ±5 max bonus
  return {
    east: advantage > 0 ? advantage : 0,
    west: advantage < 0 ? -advantage : 0
  };
}

// === PHASE 1: TACHIAI (Initial Charge) ===
function resolveTachiai(ctx: SimulationContext): void {
  const { rng, eastRikishi, westRikishi, state } = ctx;
  const jitter = createJitter(rng);
  const styleMatchup = getStyleMatchup(eastRikishi.style, westRikishi.style);
  const weightAdv = getWeightAdvantage(eastRikishi, westRikishi);

  // Tachiai score calculation
  // Power (40%) + Speed (30%) + Balance (10%) + Aggression (15%) + Momentum (5%)
  const eastScore = 
    eastRikishi.power * 0.40 +
    eastRikishi.speed * 0.30 +
    eastRikishi.balance * 0.10 +
    eastRikishi.aggression * 0.15 +
    eastRikishi.momentum * 0.5 + // Momentum scaled down
    styleMatchup.east +
    weightAdv.east +
    jitter(5);

  const westScore = 
    westRikishi.power * 0.40 +
    westRikishi.speed * 0.30 +
    westRikishi.balance * 0.10 +
    westRikishi.aggression * 0.15 +
    westRikishi.momentum * 0.5 +
    styleMatchup.west +
    weightAdv.west +
    jitter(5);

  const winner = eastScore >= westScore ? "east" : "west";
  state.tachiaiWinner = winner;
  state.advantage = winner;

  state.log.push({
    phase: "tachiai",
    description: `${winner === "east" ? eastRikishi.shikona : westRikishi.shikona} wins the tachiai`,
    data: {
      winner,
      eastScore: Math.round(eastScore * 10) / 10,
      westScore: Math.round(westScore * 10) / 10,
      margin: Math.round(Math.abs(eastScore - westScore) * 10) / 10
    }
  });
}

// === PHASE 2: CLINCH / GRIP BATTLE ===
function resolveClinch(ctx: SimulationContext): void {
  const { rng, eastRikishi, westRikishi, state } = ctx;
  const jitter = createJitter(rng);
  
  const advantaged = state.tachiaiWinner === "east" ? eastRikishi : westRikishi;
  const opponent = state.tachiaiWinner === "east" ? westRikishi : eastRikishi;

  // Grip establishment probability
  const gripBias = 
    (advantaged.style === "yotsu" ? 15 : 0) - 
    (opponent.style === "oshi" ? 8 : 0) +
    (advantaged.experience - opponent.experience) * 0.1 +
    (advantaged.technique - opponent.technique) * 0.1;

  const pBelt = clamp01(0.5 + gripBias / 100 + jitter(0.03));

  // Determine stance based on probabilities
  let stance: Stance;
  let stanceDescription: string;
  
  if (pBelt > 0.6) {
    stance = "belt-dominant";
    stanceDescription = "establishes dominant belt grip";
  } else if (pBelt < 0.35) {
    stance = "push-dominant";
    stanceDescription = "keeps distance, pushing battle";
  } else {
    // Even grip - yotsu battle
    stance = rng() < 0.5 ? "migi-yotsu" : "hidari-yotsu";
    stanceDescription = `settles into ${stance === "migi-yotsu" ? "right-hand inside" : "left-hand inside"} grip`;
    // Advantage may be neutralized in even grips
    state.advantage = "none";
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

  // Power differential affects fatigue
  const powerDiff = Math.abs(eastRikishi.power - westRikishi.power);
  const baseDrain = 1 + powerDiff * 0.01;
  
  // Experience reduces fatigue
  const avgExperience = (eastRikishi.experience + westRikishi.experience) / 2;
  const drainMod = clamp01(0.02 + (100 - avgExperience) * 0.0008);

  // Disadvantaged wrestler fatigues faster
  const eastDrainMod = state.advantage === "west" ? 1.3 : 1.0;
  const westDrainMod = state.advantage === "east" ? 1.3 : 1.0;

  state.fatigueEast += baseDrain * drainMod * eastDrainMod + jitter(0.5);
  state.fatigueWest += baseDrain * drainMod * westDrainMod + jitter(0.5);
  state.clock += 1;

  // Check for advantage shifts (rare)
  if (state.advantage !== "none" && rng() < 0.1) {
    const disadvantaged = state.advantage === "east" ? westRikishi : eastRikishi;
    const recovery = disadvantaged.balance * 0.01 + disadvantaged.experience * 0.005;
    if (rng() < recovery * 0.3) {
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

  // Determine likely winner
  const lead = state.advantage !== "none" ? state.advantage : state.tachiaiWinner;
  const leader = lead === "east" ? eastRikishi : westRikishi;
  const follower = lead === "east" ? westRikishi : eastRikishi;

  // Build weighted kimarite pool based on stance and style
  const validKimarite = KIMARITE_REGISTRY.filter(k => 
    k.category !== "forfeit" && 
    k.baseWeight > 0 &&
    (k.requiredStances.length === 0 || k.requiredStances.includes(state.stance))
  );

  // Weight by style affinity + base weight + favored bonus
  const weightedPool: { kimarite: Kimarite; weight: number }[] = validKimarite.map(k => {
    let weight = k.baseWeight;
    weight += k.styleAffinity[leader.style] * 0.5;
    
    // Bonus for favored moves
    if (leader.favoredKimarite.includes(k.id)) {
      weight *= 1.8;
    }
    
    // Stance-specific bonuses
    if (state.stance === "push-dominant" && k.category === "push") {
      weight *= 1.5;
    }
    if ((state.stance === "belt-dominant" || state.stance.includes("yotsu")) && k.category === "throw") {
      weight *= 1.4;
    }

    return { kimarite: k, weight };
  });

  // Weighted random selection
  const totalWeight = weightedPool.reduce((sum, item) => sum + item.weight, 0);
  let roll = rng() * totalWeight;
  let selectedKimarite = weightedPool[0].kimarite;
  
  for (const item of weightedPool) {
    roll -= item.weight;
    if (roll <= 0) {
      selectedKimarite = item.kimarite;
      break;
    }
  }

  // Counter-attack chance: superior balance can flip outcomes
  const counterChance = clamp01(
    (follower.balance - leader.balance) * 0.008 + 
    (follower.experience - leader.experience) * 0.003 +
    jitter(0.02)
  );
  
  const isCounter = rng() < counterChance * 0.12;
  const finalWinner = isCounter ? (lead === "east" ? "west" : "east") : lead;

  state.log.push({
    phase: "finish",
    description: isCounter 
      ? `${follower.shikona} counters with ${selectedKimarite.name}!`
      : `${leader.shikona} wins by ${selectedKimarite.name}`,
    data: {
      winner: finalWinner,
      kimarite: selectedKimarite.id,
      kimariteName: selectedKimarite.name,
      isCounter,
      counterChance: Math.round(counterChance * 100)
    }
  });

  return { winner: finalWinner, kimarite: selectedKimarite };
}

// === MAIN BOUT SIMULATION ===
export function simulateBout(
  eastRikishi: Rikishi, 
  westRikishi: Rikishi, 
  seed?: string
): BoutResult {
  // Create seeded RNG
  const boutSeed = seed || `bout-${eastRikishi.id}-${westRikishi.id}-${Date.now()}`;
  const rng = seedrandom(boutSeed);

  // Initialize state
  const state: BoutState = {
    clock: 0,
    fatigueEast: 0,
    fatigueWest: 0,
    stance: "no-grip",
    advantage: "none",
    tachiaiWinner: "east",
    log: []
  };

  const ctx: SimulationContext = {
    rng,
    eastRikishi,
    westRikishi,
    state
  };

  // Run simulation phases
  resolveTachiai(ctx);
  resolveClinch(ctx);

  // Variable number of momentum ticks (2-5)
  const momentumTicks = 2 + Math.floor(rng() * 4);
  for (let i = 0; i < momentumTicks; i++) {
    resolveMomentum(ctx);
  }

  const { winner, kimarite } = resolveFinisher(ctx);

  // Determine if upset
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
  
  const eastRank = rankOrder[eastRikishi.rank] || 10;
  const westRank = rankOrder[westRikishi.rank] || 10;
  const upset = (winner === "east" && eastRank > westRank + 2) || 
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

// Quick simulation without full log
export function quickSimulateBout(
  eastRikishi: Rikishi,
  westRikishi: Rikishi,
  seed?: string
): Pick<BoutResult, "winner" | "kimarite" | "kimariteName" | "upset"> {
  const result = simulateBout(eastRikishi, westRikishi, seed);
  return {
    winner: result.winner,
    kimarite: result.kimarite,
    kimariteName: result.kimariteName,
    upset: result.upset
  };
}
