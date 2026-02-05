// bout.ts
// =======================================================
// Deterministic Bout Simulation Engine (canon-friendly)
// - Emits structured BoutLogEntry[] with phases:
//   "tachiai" | "clinch" | "momentum" | "finish"
// - Uses position vocabulary: "front" | "lateral" | "rear"
// - Emits advantage: "east" | "west" | "none"
// - Integrates with pbp.ts (buildPbpFromBoutResult) and narrative.ts (generateNarrative)
//   but does NOT assume any UI framework.
//
// NOTE:
// This file is designed to be "drop-in" while minimizing assumptions about your broader engine.
// If your project already has more sophisticated combat logic, keep your core math,
// but preserve the LOG SHAPE + position vocabulary here.
//
// =======================================================

import seedrandom from "seedrandom";
import type {
  Rikishi,
  BoutResult,
  BoutLogEntry,
  BashoState,
  BashoName,
  Side,
  Stance,
  TacticalArchetype
} from "./types";

import { BASHO_CALENDAR } from "./calendar";
import { RANK_HIERARCHY } from "./banzuke";
import { KIMARITE_REGISTRY, type Kimarite } from "./kimarite";

import { buildPbpFromBoutResult, type PbpContext, type PbpLine } from "./pbp";
import { generateNarrative } from "./narrative";

/** Engine position vocabulary (IMPORTANT) */
export type Position = "front" | "lateral" | "rear";
export type Advantage = "east" | "west" | "none";

// Optional structured hints for pbp.ts (these strings are tolerated by its normalizers)
type GripEvent =
  | "migi_yotsu_established"
  | "hidari_yotsu_established"
  | "double_inside"
  | "over_under"
  | "no_grip_scramble"
  | "grip_break";

type StrikeEvent =
  | "tsuppari_barrage"
  | "nodowa_pressure"
  | "harite_slap"
  | "throat_attack"
  | "shoulder_blast";

type EdgeEvent =
  | "bales_at_tawara"
  | "steps_out_then_recovers"
  | "heel_on_straw"
  | "dancing_escape"
  | "turns_the_tables"
  | "slips_but_survives";

type MomentumShiftReason =
  | "tachiai_win"
  | "timing_counter"
  | "grip_change"
  | "footwork_angle"
  | "fatigue_turn"
  | "mistake";

interface BoutContext {
  id: string;
  day: number;
  rikishiEastId: string;
  rikishiWestId: string;
}

interface EngineState {
  tick: number;
  stance: Stance;
  position: Position;
  advantage: Advantage;
  tachiaiWinner: Side;
  fatigueEast: number;
  fatigueWest: number;
  log: BoutLogEntry[];
}

const clamp = (n: number, a: number, b: number) => Math.max(a, Math.min(b, n));
const clamp01 = (n: number) => clamp(n, 0, 1);

/** Create deterministic small noise without Math.random() */
function jitter(rng: seedrandom.PRNG, scale = 1): number {
  return (rng() - 0.5) * scale;
}

/** Safe read stat helper (keeps this file resilient to partial Rikishi shapes) */
function stat(r: any, key: string, fallback = 50): number {
  const v = r?.[key];
  return Number.isFinite(v) ? v : fallback;
}

/** Basic rank tier helper (lower tier number = higher rank) */
function tierOf(r: Rikishi): number {
  return RANK_HIERARCHY[r.rank]?.tier ?? 99;
}

function chooseSideByScore(eastScore: number, westScore: number): Side {
  return eastScore >= westScore ? "east" : "west";
}

function otherSide(side: Side): Side {
  return side === "east" ? "west" : "east";
}

/** =========================
 *  Phase 1 — Tachiai
 *  ========================= */

function resolveTachiai(rng: seedrandom.PRNG, east: Rikishi, west: Rikishi, st: EngineState) {
  // Make tachiai primarily about explosion + timing + aggression
  const eastScore =
    stat(east, "power") * 0.35 +
    stat(east, "speed") * 0.35 +
    stat(east, "aggression") * 0.20 +
    stat(east, "balance") * 0.10 +
    jitter(rng, 6);

  const westScore =
    stat(west, "power") * 0.35 +
    stat(west, "speed") * 0.35 +
    stat(west, "aggression") * 0.20 +
    stat(west, "balance") * 0.10 +
    jitter(rng, 6);

  const winner = chooseSideByScore(eastScore, westScore);
  const margin = Math.abs(eastScore - westScore);

  st.tachiaiWinner = winner;
  st.advantage = winner;
  st.position = "front";

  st.log.push({
    phase: "tachiai",
    description: `${winner === "east" ? east.shikona : west.shikona} wins the tachiai`,
    data: {
      winner,
      margin: Math.round(margin * 10) / 10,
      eastScore: Math.round(eastScore * 10) / 10,
      westScore: Math.round(westScore * 10) / 10,
      position: st.position,
      advantage: st.advantage
    }
  } as any);
}

/** =========================
 *  Phase 2 — Clinch / stance establishment
 *  ========================= */

function resolveClinch(rng: seedrandom.PRNG, east: Rikishi, west: Rikishi, st: EngineState) {
  const leader: Side = st.advantage === "none" ? st.tachiaiWinner : (st.advantage as Side);
  const leaderR = leader === "east" ? east : west;
  const trailerR = leader === "east" ? west : east;

  const beltSkill =
    stat(leaderR, "technique") * 0.40 +
    stat(leaderR, "strength") * 0.25 +
    stat(leaderR, "balance") * 0.20 +
    stat(leaderR, "experience") * 0.15 +
    jitter(rng, 5);

  const pushSkill =
    stat(leaderR, "power") * 0.45 +
    stat(leaderR, "aggression") * 0.25 +
    stat(leaderR, "speed") * 0.15 +
    stat(leaderR, "balance") * 0.15 +
    jitter(rng, 5);

  // Opponent resistance
  const resist =
    stat(trailerR, "balance") * 0.35 +
    stat(trailerR, "technique") * 0.30 +
    stat(trailerR, "power") * 0.20 +
    stat(trailerR, "experience") * 0.15 +
    jitter(rng, 4);

  // Determine whether this becomes belt or push dominated, else no-grip scramble.
  const beltEdge = beltSkill - resist;
  const pushEdge = pushSkill - resist;

  let stance: Stance = "no-grip";
  let gripEvent: GripEvent = "no_grip_scramble";
  let strikeEvent: StrikeEvent | undefined = undefined;
  let adv: Advantage = st.advantage;

  // Soft probabilistic decisions
  const beltP = clamp01(0.48 + beltEdge / 120);
  const pushP = clamp01(0.45 + pushEdge / 120);
  const roll = rng();

  if (roll < beltP && beltP >= pushP) {
    // Belt path
    const yotsuRoll = rng();
    if (yotsuRoll < 0.45) {
      stance = "migi-yotsu";
      gripEvent = "migi_yotsu_established";
    } else if (yotsuRoll < 0.9) {
      stance = "hidari-yotsu";
      gripEvent = "hidari_yotsu_established";
    } else {
      stance = "belt-dominant";
      gripEvent = rng() < 0.5 ? "double_inside" : "over_under";
    }

    // Sometimes it equalizes despite a grip
    if (rng() < 0.20) adv = "none";
  } else if (roll < beltP + pushP) {
    // Push path
    stance = "push-dominant";
    gripEvent = "no_grip_scramble";
    const strikeRoll = rng();
    strikeEvent =
      strikeRoll < 0.25
        ? "tsuppari_barrage"
        : strikeRoll < 0.45
        ? "nodowa_pressure"
        : strikeRoll < 0.62
        ? "harite_slap"
        : strikeRoll < 0.78
        ? "shoulder_blast"
        : "throat_attack";

    // Push exchanges more likely to swing back to even
    if (rng() < 0.28) adv = "none";
  } else {
    // No grip scramble
    stance = "no-grip";
    gripEvent = "no_grip_scramble";
    adv = "none";
  }

  st.stance = stance;
  st.advantage = adv;

  st.log.push({
    phase: "clinch",
    description:
      stance === "push-dominant"
        ? "They settle into oshi pressure"
        : stance === "no-grip"
        ? "No grip — scramble for position"
        : "Belt contact established",
    data: {
      stance,
      advantage: st.advantage,
      position: st.position,
      gripEvent,
      strikeEvent
    }
  } as any);
}

/** =========================
 *  Phase 3 — Momentum ticks
 *  ========================= */

function resolveMomentumTick(rng: seedrandom.PRNG, east: Rikishi, west: Rikishi, st: EngineState) {
  st.tick += 1;

  // Fatigue rises; leader drains less, trailer drains more.
  const eastLeader = st.advantage === "east";
  const westLeader = st.advantage === "west";

  const baseDrain = 0.6 + rng() * 0.7;

  st.fatigueEast += baseDrain * (eastLeader ? 0.9 : westLeader ? 1.15 : 1.0);
  st.fatigueWest += baseDrain * (westLeader ? 0.9 : eastLeader ? 1.15 : 1.0);

  // If both are gassed, higher chance of mistake -> swing
  const fatiguePressure = clamp01((st.fatigueEast + st.fatigueWest) / 80);

  // Decide event type
  const eventRoll = rng();

  // 1) Footwork angle / lateral motion
  if (eventRoll < 0.18) {
    if (st.position === "front") st.position = "lateral";
    else if (st.position === "lateral" && rng() < 0.25) st.position = "rear";

    const reason: MomentumShiftReason = "footwork_angle";

    // The faster rikishi more likely to take angle
    const eastSpeed = stat(east, "speed");
    const westSpeed = stat(west, "speed");
    const angledSide: Side = eastSpeed + jitter(rng, 4) >= westSpeed ? "east" : "west";

    // Taking the rear is meaningful advantage
    if (st.position === "rear") st.advantage = angledSide;

    st.log.push({
      phase: "momentum",
      description: st.position === "rear" ? "Rear position danger!" : "Angle and footwork",
      data: {
        tick: st.tick,
        position: st.position,
        reason,
        advantage: st.advantage
      }
    } as any);

    return;
  }

  // 2) Edge dance / tawara moments
  if (eventRoll < 0.30) {
    // Only happens if someone is leading
    const adv = st.advantage !== "none" ? st.advantage : st.tachiaiWinner;
    const edgeEvent: EdgeEvent = rng() < 0.5 ? "bales_at_tawara" : "heel_on_straw";

    st.log.push({
      phase: "momentum",
      description: "Tawara pressure at the edge!",
      data: {
        tick: st.tick,
        position: st.position,
        reason: "tachiai_win",
        edgeEvent,
        advantage: adv
      }
    } as any);

    return;
  }

  // 3) Recovery / timing counter
  if (eventRoll < 0.42) {
    const currentAdv: Advantage = st.advantage;
    if (currentAdv !== "none") {
      const disadvantaged: Side = otherSide(currentAdv as Side);

      // Counter chance: technique + balance + experience, plus fatigue pressure
      const disR = disadvantaged === "east" ? east : west;
      const counterChance = clamp01(
        0.10 +
          stat(disR, "technique") / 220 +
          stat(disR, "balance") / 260 +
          stat(disR, "experience") / 350 +
          fatiguePressure * 0.20
      );

      if (rng() < counterChance) {
        st.advantage = "none";
        st.log.push({
          phase: "momentum",
          description: "A recovery and counter!",
          data: {
            tick: st.tick,
            position: st.position,
            reason: "timing_counter",
            edgeEvent: "turns_the_tables",
            recovery: true,
            advantage: st.advantage
          }
        } as any);
        return;
      }
    }
  }

  // 4) Fatigue swing (leader changes)
  if (eventRoll < 0.52) {
    const eastDrive = stat(east, "power") + stat(east, "balance") - st.fatigueEast * 1.2 + jitter(rng, 8);
    const westDrive = stat(west, "power") + stat(west, "balance") - st.fatigueWest * 1.2 + jitter(rng, 8);

    // If one side clearly surges, set advantage
    if (Math.abs(eastDrive - westDrive) > 10) {
      st.advantage = eastDrive > westDrive ? "east" : "west";
      st.log.push({
        phase: "momentum",
        description: "Fatigue shows—momentum swings!",
        data: {
          tick: st.tick,
          position: st.position,
          reason: "fatigue_turn",
          advantage: st.advantage
        }
      } as any);
      return;
    }
  }

  // Default steady pressure tick
  st.log.push({
    phase: "momentum",
    description: "Steady struggle",
    data: {
      tick: st.tick,
      position: st.position,
      reason: st.advantage === "none" ? ("mistake" as MomentumShiftReason) : ("tachiai_win" as MomentumShiftReason),
      advantage: st.advantage,
      fatigueEast: Math.round(st.fatigueEast * 10) / 10,
      fatigueWest: Math.round(st.fatigueWest * 10) / 10
    }
  } as any);
}

/** =========================
 *  Phase 4 — Finish
 *  ========================= */

function pickFinishKimarite(rng: seedrandom.PRNG, st: EngineState, east: Rikishi, west: Rikishi): Kimarite {
  // Filter registry by stance/position where possible (safe fallbacks)
  const pool = KIMARITE_REGISTRY.filter((k) => {
    if (k.category === "forfeit") return false;

    // optional fields in your kimarite definitions — guard them
    const reqStances: Stance[] = Array.isArray((k as any).requiredStances) ? (k as any).requiredStances : [];
    if (reqStances.length > 0 && !reqStances.includes(st.stance)) return false;

    const vector = (k as any).vector as "front" | "lateral" | "rear" | undefined;
    if (vector && vector !== st.position) return false;

    return true;
  });

  const fallback = KIMARITE_REGISTRY.find((k) => k.id === "yorikiri") ?? KIMARITE_REGISTRY[0];

  const usable = pool.length > 0 ? pool : [fallback].filter(Boolean);

  // Weighted pick (deterministic)
  const weighted = usable.map((k) => {
    const base = Number.isFinite((k as any).baseWeight) ? (k as any).baseWeight : 1;
    const rarity = (k as any).rarity as "common" | "uncommon" | "rare" | "legendary" | undefined;

    const rarityMult =
      rarity === "legendary" ? 0.05 : rarity === "rare" ? 0.2 : rarity === "uncommon" ? 0.55 : 1.0;

    // style affinity if present
    const leaderSide: Side = st.advantage !== "none" ? (st.advantage as Side) : st.tachiaiWinner;
    const leader = leaderSide === "east" ? east : west;

    const style = (leader as any).style as "oshi" | "yotsu" | "hybrid" | undefined;
    const affinity = (k as any).styleAffinity?.[style ?? "hybrid"] ?? 0;

    let w = base * rarityMult + affinity * 0.4;

    // rear finishes more likely when rear position
    if (st.position === "rear") w *= 1.7;
    if (st.stance === "push-dominant") w *= 1.2;

    // small deterministic noise
    w *= 1 + jitter(rng, 0.05);

    return { k, w: Math.max(0.0001, w) };
  });

  const total = weighted.reduce((s, it) => s + it.w, 0);
  let roll = rng() * total;

  for (const it of weighted) {
    roll -= it.w;
    if (roll <= 0) return it.k;
  }
  return weighted[weighted.length - 1]?.k ?? fallback;
}

function resolveFinish(rng: seedrandom.PRNG, east: Rikishi, west: Rikishi, st: EngineState): { winner: Side; kimarite: Kimarite } {
  // Winner probability based on current advantage + fatigue + balance/technique
  const adv = st.advantage !== "none" ? st.advantage : st.tachiaiWinner;

  const eastWinBase =
    0.5 +
    (adv === "east" ? 0.18 : adv === "west" ? -0.18 : 0) +
    (stat(east, "balance") - stat(west, "balance")) / 400 +
    (stat(east, "technique") - stat(west, "technique")) / 450 +
    (st.fatigueWest - st.fatigueEast) / 120 +
    jitter(rng, 0.06);

  const eastWinP = clamp01(eastWinBase);
  const winner: Side = rng() < eastWinP ? "east" : "west";

  const kimarite = pickFinishKimarite(rng, st, east, west);

  st.log.push({
    phase: "finish",
    description: `${winner === "east" ? east.shikona : west.shikona} wins by ${kimarite.name}`,
    data: {
      winner,
      kimarite: kimarite.id,
      kimariteName: kimarite.name,
      position: st.position,
      advantage: adv
    }
  } as any);

  return { winner, kimarite };
}

/** =========================
 *  Public API
 *  ========================= */

export function resolveBout(bout: BoutContext, east: Rikishi, west: Rikishi, basho: BashoState): BoutResult {
  // Deterministic seed: basho + day + rikishi ids
  const bashoId = (basho as any).id ?? "basho";
  const year = (basho as any).year ?? 0;
  const bashoName = ((basho as any).bashoName ?? (basho as any).name) as BashoName | undefined;

  const seed = `${bashoId}-${year}-${bout.day}-${east.id}-${west.id}`;
  const rng = seedrandom(seed);

  const st: EngineState = {
    tick: 0,
    stance: "no-grip",
    position: "front",
    advantage: "none",
    tachiaiWinner: "east",
    fatigueEast: 0,
    fatigueWest: 0,
    log: []
  };

  // Phases
  resolveTachiai(rng, east, west, st);
  resolveClinch(rng, east, west, st);

  // Momentum ticks: a few beats, tuned by volatility if present
  const eastVol = stat(east as any, "volatility", 0.4);
  const westVol = stat(west as any, "volatility", 0.4);
  const ticks = 2 + Math.floor(rng() * 2) + (eastVol + westVol > 1.0 ? 1 : 0);

  for (let i = 0; i < ticks; i++) resolveMomentumTick(rng, east, west, st);

  const { winner, kimarite } = resolveFinish(rng, east, west, st);

  // Upset heuristic (rank tier gap)
  const eastTier = tierOf(east);
  const westTier = tierOf(west);
  const upset =
    (winner === "east" && eastTier > westTier + 1) || (winner === "west" && westTier > eastTier + 1);

  const result: BoutResult = {
    boutId: bout.id,
    winner,
    winnerRikishiId: winner === "east" ? east.id : west.id,
    loserRikishiId: winner === "east" ? west.id : east.id,
    kimarite: kimarite.id,
    kimariteName: kimarite.name,
    stance: st.stance,
    tachiaiWinner: st.tachiaiWinner,
    duration: st.tick,
    upset,
    log: st.log
  } as any;

  // ==== PBP integration (structured -> strings)
  const pbpCtx: PbpContext = {
    seed: `${seed}-pbp`,
    day: bout.day,
    bashoName,
    east: { id: east.id, shikona: east.shikona, style: (east as any).style, archetype: (east as any).archetype },
    west: { id: west.id, shikona: west.shikona, style: (west as any).style, archetype: (west as any).archetype },
    // optional vibes
    kenshoCount: undefined,
    isKinboshiBout: false,
    isYushoRaceKeyBout: false
  };

  const pbpLines: PbpLine[] = buildPbpFromBoutResult(result, pbpCtx);

  // ==== Narrative integration (12-step canon; only if we know bashoName)
  const narrative = bashoName ? generateNarrative(east, west, result, bashoName, bout.day) : [];

  // Attach extras for UI convenience (non-breaking)
  (result as any).pbpLines = pbpLines;
  (result as any).pbp = pbpLines.map((l) => l.text);
  (result as any).narrative = narrative;

  return result;
}

/** Convenience helper for tests/sim screens */
export function simulateBout(east: Rikishi, west: Rikishi, seed: string): BoutResult {
  const rng = seedrandom(seed);
  const bashoName: BashoName = "hatsu" as any;

  const fakeBasho: BashoState = {
    id: "sim",
    year: 2024,
    day: 1,
    bashoName,
    bashoNumber: 1
  } as any;

  const bout: BoutContext = { id: `sim-${seed}`, day: 1, rikishiEastId: east.id, rikishiWestId: west.id };

  // To keep deterministic but also ensure different sims, we can salt the ids:
  const saltedEast = { ...east, id: `${east.id}-sim-${Math.floor(rng() * 1e6)}` } as Rikishi;
  const saltedWest = { ...west, id: `${west.id}-sim-${Math.floor(rng() * 1e6)}` } as Rikishi;

  return resolveBout(bout, saltedEast, saltedWest, fakeBasho);
}
