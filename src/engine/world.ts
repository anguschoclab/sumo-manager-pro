/**
 * File Name: src/engine/world.ts
 * Status: KEYSTONE ARCHITECTURE FIX
 * Notes:
 * - NOW EXPLICITLY WIRED to all subsystems (Events, Injuries, Economics, etc.).
 * - Removed "any" casting/safeCalls to ensure compilation fails if subsystems aren't ready.
 * - This is the Single Source of Truth for state mutation.
 */

import { rngForWorld } from "./rng";
import type { 
  WorldState, 
  BashoName, 
  BoutResult, 
  MatchSchedule, 
  BashoPerformance, 
  BanzukeEntry, 
  BashoState,
  RankPosition
} from "./types";
import { initializeBasho } from "./worldgen";
import { getNextBasho } from "./calendar";
import { resolveBout } from "./bout";
import { updateBanzuke, determineSpecialPrizes } from "./banzuke";
import { checkRetirement, generateRookie } from "./lifecycle";

// === SUBSYSTEM IMPORTS ===
// These must exist. If they are missing, the engine is broken.
import * as events from "./events";
import * as injuries from "./injuries";
import * as rivalries from "./rivalries";
import * as economics from "./economics";
import * as governance from "./governance";
import * as npcAI from "./npcAI";
import * as scoutingStore from "./scoutingStore";
import * as historyIndex from "./historyIndex";
import * as training from "./training";
import * as schedule from "./schedule";

// --- HELPERS ---

function getCurrentBasho(world: WorldState): BashoState | undefined {
  return world.currentBasho;
}

// --- BASHO MANAGEMENT ---

export function startBasho(world: WorldState, bashoName?: BashoName): WorldState {
  // Guard: Don't restart if active
  if (world.cyclePhase === "active_basho" && world.currentBasho) return world;

  const name: BashoName = bashoName || world.currentBashoName || "hatsu";

  // 1. Initialize State
  const basho = initializeBasho(world, name);
  world.currentBasho = basho;
  world.cyclePhase = "active_basho";

  // 2. Generate Schedule for Day 1
  ensureDaySchedule(world, 1);

  // 3. Emit Event
  events.emit(world, { 
    type: "BASHO_STARTED", 
    bashoNumber: basho.bashoNumber,
    title: `Basho Started: ${name}`,
    category: "basho",
    importance: "major"
  });

  return world;
}

export function ensureDaySchedule(world: WorldState, day: number): WorldState {
  const basho = getCurrentBasho(world);
  if (!basho) return world;

  const alreadyScheduled = basho.matches.some((m) => m.day === day);
  if (alreadyScheduled) return world;

  // Delegate to schedule engine
  schedule.generateDaySchedule(world, basho, day, world.seed);
  return world;
}

export function advanceBashoDay(world: WorldState): WorldState {
  const basho = getCurrentBasho(world);
  if (!basho) return world;

  const nextDay = basho.day + 1;
  basho.day = nextDay;
  // Legacy compat
  basho.currentDay = nextDay;

  // If within standard 15 days, ensure matches exist
  if (nextDay <= 15) {
    ensureDaySchedule(world, nextDay);
    events.emit(world, {
      type: "BASHO_DAY_ADVANCED",
      day: nextDay,
      title: `Day ${nextDay}`,
      category: "basho"
    });
  }

  return world;
}

// --- SIMULATION LOOP (BOUTS) ---

export function simulateBoutForToday(
  world: WorldState,
  unplayedIndex: number
): { world: WorldState; result?: BoutResult } {
  const basho = getCurrentBasho(world);
  if (!basho) return { world };

  // Find the specific match in today's schedule
  const todaysMatches = basho.matches.filter((m) => m.day === basho.day && !m.result);
  const match = todaysMatches[unplayedIndex];

  if (!match) return { world };

  const east = world.rikishi.get(match.eastRikishiId);
  const west = world.rikishi.get(match.westRikishiId);
  if (!east || !west) return { world };

  // 1. Resolve the physical contest
  const boutContext = {
    id: `d${basho.day}-b${unplayedIndex}`,
    day: basho.day,
    rikishiEastId: east.id,
    rikishiWestId: west.id,
    division: east.division
  };

  const result = resolveBout(boutContext, east, west, basho);

  // 2. Apply consequences (Stats, History, Events)
  applyBoutResult(world, match, result);

  return { world, result };
}

export function applyBoutResult(
  world: WorldState,
  match: MatchSchedule,
  result: BoutResult
): WorldState {
  const basho = getCurrentBasho(world);
  if (!basho) return world;

  // Update Match Record
  match.result = result;

  const east = world.rikishi.get(match.eastRikishiId);
  const west = world.rikishi.get(match.westRikishiId);
  if (!east || !west) return world;

  const winner = result.winner === "east" ? east : west;
  const loser = result.winner === "east" ? west : east;

  // Update Basho Standings
  const standings = basho.standings;
  const wRec = standings.get(winner.id) || { wins: 0, losses: 0 };
  const lRec = standings.get(loser.id) || { wins: 0, losses: 0 };
  
  standings.set(winner.id, { wins: wRec.wins + 1, losses: wRec.losses });
  standings.set(loser.id, { wins: lRec.wins, losses: lRec.losses + 1 });

  // Update Career Stats
  winner.currentBashoWins = (winner.currentBashoWins || 0) + 1;
  winner.careerWins++;
  loser.currentBashoLosses = (loser.currentBashoLosses || 0) + 1;
  loser.careerLosses++;

  // --- EXECUTE SUBSYSTEM HOOKS ---
  // This is where the simulation comes alive
  
  // 1. Injuries
  injuries.onBoutResolved(world, { match, result, east, west });
  
  // 2. Rivalries (Did a rivalry heat up?)
  rivalries.onBoutResolved(world, { match, result, east, west });
  
  // 3. Economy (Kensho money, popularity bumps)
  economics.onBoutResolved(world, { match, result, east, west });
  
  // 4. Narrative Events (Log significant upsets, etc.)
  events.onBoutResolved(world, { match, result, east, west });
  
  // 5. Scouting (Did a prospect watch?)
  scoutingStore.onBoutResolved(world, { match, result, east, west });

  return world;
}

// --- BASHO CONCLUSION & LIFECYCLE ---

export function endBasho(world: WorldState): WorldState {
  const basho = getCurrentBasho(world);
  if (!basho) return world;

  // 1. Determine Winner
  const table = Array.from(basho.standings.entries())
    .map(([id, rec]) => ({ id, wins: rec.wins, losses: rec.losses }))
    .sort((a, b) => b.wins - a.wins || a.losses - b.losses);

  if (table.length === 0) return world;

  const bestWins = table[0].wins;
  const topCandidates = table.filter(t => t.wins === bestWins).map(t => t.id);
  
  // TODO: Implement actual playoff bout logic here
  // For now, tie-break by ID/random (simplified)
  const yusho = topCandidates[0]; 

  const runnerWins = bestWins - 1;
  const junYusho = table
    .filter(t => (t.wins === bestWins && t.id !== yusho) || t.wins === runnerWins)
    .map(t => t.id);

  // 2. Determine Special Prizes
  const awards = determineSpecialPrizes(
    basho.matches, 
    world.rikishi, // Passed map directly
    yusho
  );

  // 3. Create History Record
  const bashoResult = {
    year: basho.year,
    bashoNumber: basho.bashoNumber,
    bashoName: basho.bashoName,
    yusho,
    junYusho,
    ginoSho: awards.ginoSho,
    kantosho: awards.kantosho,
    shukunsho: awards.shukunsho,
    playoffMatches: undefined, // Add if we implemented playoffs
    prizes: {
      yushoAmount: 10_000_000,
      junYushoAmount: 2_000_000,
      specialPrizes: 2_000_000
    }
  };

  world.history.push(bashoResult);
  
  // Update History Index (for UI lookups)
  historyIndex.rebuildHistoryIndexIntoWorld(world);

  // 4. Lifecycle & Retirements
  const retiredRikishiIds: string[] = [];
  for (const [id, r] of world.rikishi) {
    const reason = checkRetirement(r, world.year);
    if (reason) {
        retiredRikishiIds.push(id);
        
        events.emit(world, {
          type: "RETIREMENT",
          rikishiId: id,
          title: "Rikishi Retired",
          summary: `${r.shikona} has retired: ${reason}`,
          category: "milestone",
          importance: "notable"
        });
        
        // Mark as retired but keep record for a moment or move to archive?
        // Current engine deletes from active map
        r.isRetired = true;
        // removing from map happens usually in maintenance phase, but let's do it cleanly
        // world.rikishi.delete(id); // Keeping in map with flag is safer for history lookups
    }
  }

  // 5. Replenish Roster (New Recruits)
  const heyaIds = Array.from(world.heyas.keys());
  for (let i = 0; i < retiredRikishiIds.length; i++) {
      const rookie = generateRookie(world.year, "jonokuchi");
      if (heyaIds.length > 0) {
          const rng = rngForWorld(world, "rookie", rookie.id);
          const randomHeyaId = heyaIds[rng.int(0, heyaIds.length - 1)];
          rookie.heyaId = randomHeyaId;
          const heya = world.heyas.get(randomHeyaId);
          if (heya) heya.rikishiIds.push(rookie.id);
      }
      world.rikishi.set(rookie.id, rookie);
  }

  // 6. Signal End
  events.emit(world, { 
    type: "BASHO_ENDED", 
    bashoName: basho.bashoName, 
    title: `Basho Concluded`,
    summary: `Yusho winner: ${yusho}`,
    category: "basho",
    importance: "headline"
  });

  world.cyclePhase = "post_basho";
  return world;
}

// --- OFF-SEASON (INTERIM) ---

export function publishBanzukeUpdate(world: WorldState): WorldState {
  if (world.cyclePhase !== "post_basho") return world;

  const lastBasho = getCurrentBasho(world);
  if (!lastBasho) return world;

  // 1. Prepare Banzuke Input
  const currentBanzukeList: BanzukeEntry[] = [];
  for (const r of world.rikishi.values()) {
    if (r.isRetired) continue;
    currentBanzukeList.push({
      rikishiId: r.id,
      division: r.division,
      position: { rank: r.rank, rankNumber: r.rankNumber, side: r.side }
    });
  }

  // 2. Prepare Performance Input
  const performanceList: BashoPerformance[] = [];
  const history = world.history[world.history.length - 1];

  for (const [id, stats] of lastBasho.standings.entries()) {
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

  // 3. Calculate New Ranks
  const result = updateBanzuke(currentBanzukeList, performanceList, {}); 

  // 4. Apply Updates
  for (const newEntry of result.newBanzuke) {
    const rikishi = world.rikishi.get(newEntry.rikishiId);
    if (rikishi) {
      events.emit(world, {
        type: "RANK_UPDATE",
        rikishiId: rikishi.id,
        title: "Rank Changed",
        summary: `${rikishi.rank} -> ${newEntry.position.rank}`,
        category: "promotion",
        importance: "minor",
        truthLevel: "public"
      });

      rikishi.division = newEntry.division;
      rikishi.rank = newEntry.position.rank;
      rikishi.rankNumber = newEntry.position.rankNumber;
      rikishi.side = newEntry.position.side;
      
      // Reset seasonal stats
      rikishi.currentBashoWins = 0;
      rikishi.currentBashoLosses = 0;
    }
  }

  // 5. Advance Calendar
  const next = getNextBasho(lastBasho.bashoName);
  const nextYear = next === "hatsu" ? world.year + 1 : world.year;

  world.year = nextYear;
  world.currentBashoName = next;
  world.currentBasho = undefined;
  world.cyclePhase = "interim";

  events.emit(world, {
    type: "NEW_CYCLE",
    year: nextYear,
    title: `New Banzuke Released`,
    summary: `Preparation begins for ${next}`,
    category: "milestone",
    importance: "major"
  });

  return world;
}

/**
 * The heartbeat of the simulation during the off-season.
 * This is what GameContext was ignoring!
 */
export function advanceInterim(world: WorldState, weeks: number = 1): WorldState {
  // if (world.cyclePhase !== "interim") return world; // Allow calling even if technically incorrect phase for debugging

  const w = Math.max(1, Math.trunc(weeks));

  for (let i = 0; i < w; i++) {
    world.week += 1; 
    
    // === SYSTEM TICKS ===
    // Order matters for causality

    // 1. NPC logic (Heya moves, hiring, strategy)
    npcAI.tickWeek(world);

    // 2. Training (Gains calculated here)
    training.tickWeek(world);

    // 3. Economy (Salaries, expenses, sponsors)
    economics.tickWeek(world);

    // 4. Injuries (Healing / Worsening)
    injuries.tickWeek(world);

    // 5. Governance (Scandals, rulings)
    governance.tickWeek(world);

    // 6. Rivalries (Decay / Evolution)
    rivalries.tickWeek(world);

    // 7. Scouting (New recruits appear)
    scoutingStore.tickWeek(world);

    // 8. Flavor Events (Ambient news)
    events.tickWeek(world);
  }

  return world;
}
