// world.ts
// World Orchestrator — single entrypoint for mutating WorldState safely & consistently
//
// UPDATES Phase 5:
// - Wired `npcAI.tickWeek` to `advanceInterim`

import type { WorldState, BashoName, BoutResult, Id, MatchSchedule, BashoPerformance, BanzukeEntry, CyclePhase } from "./types";
import { initializeBasho } from "./worldgen";
import { getNextBasho } from "./calendar";
import { simulateBout as simulateBoutEngine } from "./bout";

import * as schedule from "./schedule";
import * as events from "./events";
import * as injuries from "./injuries";
import * as rivalries from "./rivalries";
import * as economics from "./economics";
import * as governance from "./governance";
import * as npcAI from "./npcAI"; // IMPORT AI ENGINE
import * as scoutingStore from "./scoutingStore";
import * as historyIndex from "./historyIndex";
import * as training from "./training"; 
import { determineSpecialPrizes, updateBanzuke } from "./banzuke"; 

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
  // Can only start if we are in INTERIM phase (or first boot)
  if (world.cyclePhase === "active_basho") return world;

  const name: BashoName =
    bashoName || (world as any).currentBashoName || (world as any).currentBasho?.bashoName;

  if (!name) return world;

  const basho = initializeBasho(world as any, name) as any;

  if (!basho.standings) basho.standings = new Map();
  if (!basho.matches) basho.matches = [];
  if (!basho.day) basho.day = 1;

  (world as any).currentBasho = basho;
  world.cyclePhase = "active_basho"; // Set phase

  ensureDaySchedule(world, basho.day);
  safeCall(() => (events as any).emit?.(world, { type: "BASHO_STARTED", bashoName: name }));

  return world;
}

/** Ensure schedule exists for a given day. Delegates to schedule.ts if it exposes any known API. */
export function ensureDaySchedule(world: WorldState, day: number): WorldState {
  const basho = getCurrentBasho(world);
  if (!basho) return world;

  const already = basho.matches.some((m) => m.day === day);
  if (already) return world;

  if (typeof (schedule as any).generateDaySchedule === "function") {
    (schedule as any).generateDaySchedule(world, basho, day, world.seed);
    return world;
  }

  if (typeof (schedule as any).buildDaySchedule === "function") {
    (schedule as any).buildDaySchedule(world, basho, day, world.seed);
    return world;
  }

  if (typeof (schedule as any).scheduleDay === "function") {
    (schedule as any).scheduleDay(world, basho, day, world.seed);
    return world;
  }

  return world;
}

/** Advance basho day by +1 and ensure schedule exists. Mutates world. */
export function advanceBashoDay(world: WorldState): WorldState {
  const basho = getCurrentBasho(world);
  if (!basho) return world;

  const nextDay = basho.day + 1;
  basho.day = nextDay;

  if (nextDay <= 15) ensureDaySchedule(world, nextDay);

  safeCall(() => (events as any).emit?.(world, { type: "BASHO_DAY_ADVANCED", day: nextDay }));
  return world;
}

/** Simulate a bout by index among today's (unplayed) bouts and apply results. */
export function simulateBoutForToday(
  world: WorldState,
  unplayedIndex: number
): { world: WorldState; result?: BoutResult } {
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

/** Apply a bout result to match, rikishi W/L, standings, and optional subsystems. */
export function applyBoutResult(
  world: WorldState,
  match: BashoMatch,
  result: BoutResult,
  _opts?: { boutSeed?: string }
): WorldState {
  const basho = getCurrentBasho(world);
  if (!basho) return world;

  match.result = result;

  const east = world.rikishi.get(match.eastRikishiId);
  const west = world.rikishi.get(match.westRikishiId);
  if (!east || !west) return world;

  const winner = result.winner === "east" ? east : west;
  const loser = result.winner === "east" ? west : east;

  safeInc(winner as any, "currentBashoWins", 1);
  safeInc(winner as any, "careerWins", 1);
  safeInc(loser as any, "currentBashoLosses", 1);
  safeInc(loser as any, "careerLosses", 1);

  const standings = basho.standings || new Map<Id, { wins: number; losses: number }>();
  const wRec = standings.get(winner.id) || { wins: 0, losses: 0 };
  const lRec = standings.get(loser.id) || { wins: 0, losses: 0 };
  standings.set(winner.id, { wins: wRec.wins + 1, losses: wRec.losses });
  standings.set(loser.id, { wins: lRec.wins, losses: lRec.losses + 1 });
  basho.standings = standings;

  safeCall(() => (injuries as any).onBoutResolved?.(world, { match, result, east, west }));
  safeCall(() => (rivalries as any).onBoutResolved?.(world, { match, result, east, west }));
  safeCall(() => (economics as any).onBoutResolved?.(world, { match, result, east, west }));
  safeCall(() => (events as any).onBoutResolved?.(world, { match, result, east, west }));
  safeCall(() => (scoutingStore as any).onBoutResolved?.(world, { match, result, east, west }));

  return world;
}

/** End the current basho; append a history record and advance to next basho. */
export function endBasho(world: WorldState): WorldState {
  const basho = getCurrentBasho(world);
  if (!basho) return world;

  const table = Array.from(basho.standings.entries())
    .map(([id, rec]) => ({ id, wins: rec.wins, losses: rec.losses }))
    .sort((a, b) => b.wins - a.wins || a.losses - b.losses);

  if (table.length === 0) return world;

  const bestWins = table[0].wins;
  const topCandidates = table.filter(t => t.wins === bestWins).map(t => t.id);
  
  // === PLAYOFF RESOLUTION ===
  let yusho = topCandidates[0];
  let playoffMatches: MatchSchedule[] = [];
  
  if (topCandidates.length > 1) {
    let roundCandidates = [...topCandidates].sort((a, b) => a.localeCompare(b)); 
    let boutIdx = 100;
    while (roundCandidates.length > 1) {
      const winners: Id[] = [];
      for (let i = 0; i < roundCandidates.length; i += 2) {
        if (i + 1 >= roundCandidates.length) {
          winners.push(roundCandidates[i]);
          continue;
        }
        
        const eastId = roundCandidates[i];
        const westId = roundCandidates[i + 1];
        const seed = getBoutSeed(world, basho.bashoName, 16, boutIdx++);
        
        const east = world.rikishi.get(eastId);
        const west = world.rikishi.get(westId);
        
        if (east && west) {
          const res = simulateBoutEngine(east as any, west as any, seed);
          winners.push(res.winner === "east" ? eastId : westId);
          
          playoffMatches.push({
             day: 16,
             eastRikishiId: eastId,
             westRikishiId: westId,
             result: res
          });
        } else {
            winners.push(eastId);
        }
      }
      roundCandidates = winners;
    }
    yusho = roundCandidates[0];
  }

  // === JUN-YUSHO ===
  const runnerWins = bestWins - 1;
  const junYusho = table
    .filter(t => (t.wins === bestWins && t.id !== yusho) || t.wins === runnerWins)
    .map(t => t.id);

  // === SPECIAL PRIZES ===
  const awards = determineSpecialPrizes(
    basho.matches, 
    world.rikishi as Map<string, any>,
    yusho
  );

  const bashoResult = {
    year: basho.year,
    bashoNumber: basho.bashoNumber,
    bashoName: basho.bashoName,
    yusho,
    junYusho,
    ginoSho: awards.ginoSho,
    kantosho: awards.kantosho,
    shukunsho: awards.shukunsho,
    playoffMatches: playoffMatches.length > 0 ? playoffMatches : undefined,
    prizes: {
      yushoAmount: 10_000_000,
      junYushoAmount: 2_000_000,
      specialPrizes: 2_000_000
    }
  };

  const hist = (world as any).history;
  if (Array.isArray(hist)) hist.push(bashoResult);
  else (world as any).history = [bashoResult];

  safeCall(() => (historyIndex as any).indexBashoResult?.(world, bashoResult));
  safeCall(() => (events as any).emit?.(world, { type: "BASHO_ENDED", bashoName: basho.bashoName, yusho }));

  // DO NOT ADVANCE TIME YET
  world.cyclePhase = "post_basho";

  return world;
}

/** Publishes Banzuke & Transitions phase */
export function publishBanzukeUpdate(world: WorldState): WorldState {
  if (world.cyclePhase !== "post_basho") return world;

  const lastBasho = getCurrentBasho(world);
  if (!lastBasho) return world;

  // 1. Prepare Inputs for Banzuke Engine
  const currentBanzukeList: BanzukeEntry[] = [];
  
  for (const r of world.rikishi.values()) {
    currentBanzukeList.push({
      rikishiId: r.id,
      division: r.division,
      position: { rank: r.rank, rankNumber: r.rankNumber, side: r.side }
    });
  }

  const performanceList: BashoPerformance[] = [];
  for (const [id, stats] of lastBasho.standings.entries()) {
    const history = world.history[world.history.length - 1];
    const isYusho = history.yusho === id;
    const isJunYusho = history.junYusho.includes(id);

    let prizePoints = 0;
    if (history.ginoSho === id) prizePoints += 1;
    if (history.shukunsho === id) prizePoints += 1;
    if (history.kantosho === id) prizePoints += 1;

    performanceList.push({
      rikishiId: id,
      wins: stats.wins,
      losses: stats.losses,
      absences: 0, 
      yusho: isYusho,
      junYusho: isJunYusho,
      specialPrizes: prizePoints
    });
  }

  // 2. Run Engine
  const result = updateBanzuke(currentBanzukeList, performanceList, {}); 

  // 3. Apply Results
  for (const newEntry of result.newBanzuke) {
    const rikishi = world.rikishi.get(newEntry.rikishiId);
    if (rikishi) {
      rikishi.division = newEntry.division;
      rikishi.rank = newEntry.position.rank;
      rikishi.rankNumber = newEntry.position.rankNumber;
      rikishi.side = newEntry.position.side;
      
      rikishi.currentBashoWins = 0;
      rikishi.currentBashoLosses = 0;
    }
  }

  // 4. Transition
  const next = getNextBasho(lastBasho.bashoName);
  const nextYear = next === "hatsu" ? world.year + 1 : world.year;

  world.year = nextYear;
  world.currentBashoName = next;
  (world as any).currentBasho = undefined;
  world.cyclePhase = "interim";

  return world;
}

/** Between-basho tick. Delegates to timeBoundary.ts if present. */
export function advanceInterim(world: WorldState, weeks: number = 1): WorldState {
  if (world.cyclePhase !== "interim") return world;

  const w = Math.max(1, Math.trunc(weeks));

  for (let i = 0; i < w; i++) {
    world.week += 1; 

    // === EXECUTE SUBSYSTEM TICKS ===
    
    // 1. NPC AI (Decide first) - NEW
    safeCall(() => (npcAI as any).tickWeek?.(world));

    // 2. Training (Execute based on AI/Player decisions)
    safeCall(() => (training as any).tickWeek?.(world));

    // 3. Economics
    safeCall(() => (economics as any).tickWeek?.(world));

    // 4. Injuries
    safeCall(() => (injuries as any).tickWeek?.(world));
    
    // 5. Governance
    safeCall(() => (governance as any).tickWeek?.(world));

    // 6. Rivalries
    safeCall(() => (rivalries as any).tickWeek?.(world));

    // 7. Events
    safeCall(() => (events as any).tickWeek?.(world));

    // 8. Scouting
    safeCall(() => (scoutingStore as any).tickWeek?.(world));

    safeCall(() => {
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
    // Intentionally swallow: world orchestrator should never hard-crash UI for optional subsystems.
  }
}
