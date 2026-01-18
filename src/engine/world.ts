// world.ts
// World Orchestrator — single entrypoint for mutating WorldState safely & consistently
// Goal: prevent duplicated “world loop” logic across UI/GameContext, worldgen, schedule, events, etc.
//
// Design principles:
// - Deterministic seeds: all generated outcomes derive from world.seed + basho/day/bout identifiers.
// - Minimal coupling: this file coordinates other systems, but does not re-implement them.
// - Safe defaults: if optional subsystems aren't present yet, we no-op rather than crash.
//
// NOTE: This module intentionally avoids UI concerns. UI should call these helpers (or autoSim.ts).

import type { WorldState, BashoName, BoutResult, Id } from "./types";
import { initializeBasho } from "./worldgen";
import { getNextBasho } from "./calendar";
import { simulateBout as simulateBoutEngine } from "./bout";

// Optional subsystems (present in your repo list) — keep imports explicit.
import * as schedule from "./schedule";
import * as events from "./events";
import * as injuries from "./injuries";
import * as rivalries from "./rivalries";
import * as economics from "./economics";
import * as scoutingStore from "./scoutingStore";
import * as historyIndex from "./historyIndex";

/** A match in the current basho schedule (shape inferred from your GameContext usage). */
export interface BashoMatch {
  day: number;
  eastRikishiId: Id;
  westRikishiId: Id;
  result?: BoutResult | null;
}

/** Minimal current basho state (shape inferred from your GameContext). */
export interface CurrentBashoState {
  year: number;
  bashoNumber: 1 | 2 | 3 | 4 | 5 | 6;
  bashoName: BashoName;
  day: number; // 1..15
  matches: BashoMatch[];
  standings: Map<Id, { wins: number; losses: number }>;
}

/** Helper: get the active basho object with a stable shape. */
function getCurrentBasho(world: WorldState): CurrentBashoState | null {
  const b = (world as any).currentBasho as CurrentBashoState | undefined;
  return b && typeof b.day === "number" && Array.isArray(b.matches) ? b : null;
}

/** Helper: compute a deterministic seed for a specific bout. */
export function getBoutSeed(world: WorldState, bashoName: BashoName, day: number, boutIndex: number) {
  return `${world.seed}-${bashoName}-d${day}-b${boutIndex}`;
}

/** Start a basho (initialize + schedule day 1). Mutates world and returns it. */
export function startBasho(world: WorldState, bashoName?: BashoName): WorldState {
  const name: BashoName =
    bashoName || (world as any).currentBashoName || (world as any).currentBasho?.bashoName;

  if (!name) return world;

  const basho = initializeBasho(world as any, name) as any;

  // Ensure minimum fields exist.
  if (!basho.standings) basho.standings = new Map();
  if (!basho.matches) basho.matches = [];
  if (!basho.day) basho.day = 1;

  (world as any).currentBasho = basho;

  // Generate day 1 schedule
  ensureDaySchedule(world, basho.day);

  // Emit an event if system exists
  safeCall(() => (events as any).emit?.(world, { type: "BASHO_STARTED", bashoName: name }));

  return world;
}

/**
 * Ensure schedule exists for a given day.
 * This intentionally delegates to schedule.ts if it exposes any known API.
 */
export function ensureDaySchedule(world: WorldState, day: number): WorldState {
  const basho = getCurrentBasho(world);
  if (!basho) return world;

  // If matches already exist for day, do nothing.
  const already = basho.matches.some((m) => m.day === day);
  if (already) return world;

  // Try schedule APIs in priority order (thin compatibility layer)
  // 1) schedule.generateDaySchedule(world, basho, day, seed)
  if (typeof (schedule as any).generateDaySchedule === "function") {
    (schedule as any).generateDaySchedule(world, basho, day, world.seed);
    return world;
  }

  // 2) schedule.buildDaySchedule(...) (common naming)
  if (typeof (schedule as any).buildDaySchedule === "function") {
    (schedule as any).buildDaySchedule(world, basho, day, world.seed);
    return world;
  }

  // 3) schedule.scheduleDay(...) (generic)
  if (typeof (schedule as any).scheduleDay === "function") {
    (schedule as any).scheduleDay(world, basho, day, world.seed);
    return world;
  }

  // As last resort, leave empty but safe.
  return world;
}

/** Advance basho day by +1 and ensure schedule exists. Mutates world. */
export function advanceBashoDay(world: WorldState): WorldState {
  const basho = getCurrentBasho(world);
  if (!basho) return world;

  const nextDay = basho.day + 1;
  basho.day = nextDay;

  // If the basho is over, caller should call endBasho()
  if (nextDay <= 15) {
    ensureDaySchedule(world, nextDay);
  }

  safeCall(() => (events as any).emit?.(world, { type: "BASHO_DAY_ADVANCED", day: nextDay }));
  return world;
}

/**
 * Simulate a bout by index among today's (unplayed) bouts, apply results to world.
 * This is a convenience wrapper for UI; you can keep your UI’s simulateBout if you prefer.
 */
export function simulateBoutForToday(world: WorldState, unplayedIndex: number): { world: WorldState; result?: BoutResult } {
  const basho = getCurrentBasho(world);
  if (!basho) return { world };

  const todays = basho.matches.filter((m) => m.day === basho.day && !m.result);
  const match = todays[unplayedIndex];
  if (!match) return { world };

  const east = world.rikishi.get(match.eastRikishiId);
  const west = world.rikishi.get(match.westRikishiId);
  if (!east || !west) return { world };

  const boutSeed = getBoutSeed(world, basho.bashoName, basho.day, unplayedIndex);
  const result = simulateBoutEngine(east as any, west as any, boutSeed);

  applyBoutResult(world, match, result, { boutSeed });
  return { world, result };
}

/**
 * Apply a bout result to:
 * - match.result
 * - rikishi W/L
 * - basho standings
 * - optional subsystems: injuries, rivalries, economy (kensho), scouting observation, events
 *
 * Mutates world.
 */
export function applyBoutResult(
  world: WorldState,
  match: BashoMatch,
  result: BoutResult,
  opts?: { boutSeed?: string }
): WorldState {
  const basho = getCurrentBasho(world);
  if (!basho) return world;

  // Write result onto the match object that exists in the schedule array.
  match.result = result;

  const east = world.rikishi.get(match.eastRikishiId);
  const west = world.rikishi.get(match.westRikishiId);
  if (!east || !west) return world;

  const winner = result.winner === "east" ? east : west;
  const loser = result.winner === "east" ? west : east;

  // Update public-facing records (as used by your pages)
  safeInc(winner as any, "currentBashoWins", 1);
  safeInc(winner as any, "careerWins", 1);
  safeInc(loser as any, "currentBashoLosses", 1);
  safeInc(loser as any, "careerLosses", 1);

  // Standings map
  const standings = basho.standings || new Map<Id, { wins: number; losses: number }>();
  const wRec = standings.get(winner.id) || { wins: 0, losses: 0 };
  const lRec = standings.get(loser.id) || { wins: 0, losses: 0 };
  standings.set(winner.id, { wins: wRec.wins + 1, losses: wRec.losses });
  standings.set(loser.id, { wins: lRec.wins, losses: lRec.losses + 1 });
  basho.standings = standings;

  // Optional systems
  safeCall(() => (injuries as any).onBoutResolved?.(world, { match, result, east, west }));
  safeCall(() => (rivalries as any).onBoutResolved?.(world, { match, result, east, west }));
  safeCall(() => (economics as any).onBoutResolved?.(world, { match, result, east, west }));
  safeCall(() => (events as any).onBoutResolved?.(world, { match, result, east, west }));

  // Scouting: count observation (player watched) — the store decides whether to record it.
  safeCall(() => (scoutingStore as any).onBoutResolved?.(world, { match, result, east, west }));

  return world;
}

/**
 * End the current basho:
 * - determine yusho/jun-yusho
 * - create history record
 * - advance to next basho name/year
 * - clear currentBasho
 *
 * Mutates world.
 */
export function endBasho(world: WorldState): WorldState {
  const basho = getCurrentBasho(world);
  if (!basho) return world;

  // Compute final standings.
  const table = Array.from(basho.standings.entries())
    .map(([id, rec]) => ({ id, wins: rec.wins, losses: rec.losses }))
    .sort((a, b) => b.wins - a.wins || a.losses - b.losses);

  const yusho = table[0]?.id || "";
  const runnerWins = table[1]?.wins ?? null;
  const junYusho = runnerWins == null ? [] : table.filter((t) => t.wins === runnerWins).map((t) => t.id);

  // Minimal prize record (your HistoryPage expects this shape)
  const bashoResult = {
    year: basho.year,
    bashoNumber: basho.bashoNumber,
    bashoName: basho.bashoName,
    yusho,
    junYusho,
    // Optional fields some pages expect
    prizes: {
      yushoAmount: 10_000_000,
      junYushoAmount: 2_000_000,
      specialPrizes: 2_000_000
    }
  };

  // Append to world.history (array)
  const hist = (world as any).history;
  if (Array.isArray(hist)) hist.push(bashoResult);
  else (world as any).history = [bashoResult];

  // Update history index if present
  safeCall(() => (historyIndex as any).indexBashoResult?.(world, bashoResult));
  safeCall(() => (events as any).emit?.(world, { type: "BASHO_ENDED", bashoName: basho.bashoName, yusho }));

  // Advance next basho & year
  const next = getNextBasho(basho.bashoName);
  const nextYear = next === "hatsu" ? (world as any).year + 1 : (world as any).year;

  (world as any).year = nextYear;
  (world as any).currentBashoName = next;
  (world as any).currentBasho = undefined;

  return world;
}

/**
 * Between-basho tick:
 * - apply decay, training, injuries recovery, NPC actions, etc.
 * This delegates to timeBoundary.ts if it exposes a tick.
 */
export function advanceInterim(world: WorldState, weeks: number = 1): WorldState {
  const w = Math.max(1, Math.trunc(weeks));

  for (let i = 0; i < w; i++) {
    // Common hooks across systems:
    safeCall(() => (injuries as any).tickWeek?.(world));
    safeCall(() => (rivalries as any).tickWeek?.(world));
    safeCall(() => (economics as any).tickWeek?.(world));
    safeCall(() => (events as any).tickWeek?.(world));
    safeCall(() => (scoutingStore as any).tickWeek?.(world));

    // If you have a timeBoundary master tick, let it own the order.
    safeCall(() => {
      // Lazy import to avoid circular deps if timeBoundary imports world.ts later.
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const tb = require("./timeBoundary");
      if (typeof tb.tickWeek === "function") tb.tickWeek(world);
      else if (typeof tb.advanceWeek === "function") tb.advanceWeek(world);
      else if (typeof tb.applyTimeBoundary === "function") tb.applyTimeBoundary(world);
    });
  }

  return world;
}

// =========================
// Utilities
// =========================

function safeInc(obj: any, key: string, delta: number) {
  const cur = typeof obj?.[key] === "number" && Number.isFinite(obj[key]) ? obj[key] : 0;
  obj[key] = cur + delta;
}

function safeCall(fn: () => void) {
  try {
    fn();
  } catch {
    // Intentionally swallow: world orchestrator should never hard-crash UI
    // for optional subsystems. Wire errors in dev tools if desired.
  }
}
