<<<<<<< HEAD
// timeBoundary.ts
// =======================================================
// Time Boundary Orchestrator — explicit interim weekly tick ordering.
//
// Canon goals:
// - One authoritative ordering for interim (between-basho) simulation steps.
// - Deterministic: each subsystem derives its RNG from world.seed.
// - Produces structured "boundary events" that UI can digest later.
// =======================================================

import type { WorldState } from "./types";
import * as scouting from "./scouting";
import * as training from "./training";
import * as injuries from "./injuries";
import * as economics from "./economics";
import * as governance from "./governance";
import * as events from "./events";
import * as rivalries from "./rivalries";

export interface BoundaryTickReport {
  weekIndex: number;
  scoutingEvents: number;
  injuriesRecovered: number;
  injuriesNew: number;
  economyEvents: number;
  governanceRulings: number;
  narrativeEvents: number;
  rivalryEvents: number;
}

/**
 * tickWeek(world)
 * Explicit interim ordering (v1):
 *  1) scouting updates
 *  2) training progression
 *  3) injury recovery + injury rolls (if modeled)
 *  4) economy tick
 *  5) governance tick
 *  6) narrative events tick
 *  7) rivalry updates
 */
export function tickWeek(world: WorldState): BoundaryTickReport {
  const weekIndex = world.week ?? 0;

  // 1) Scouting
  const scoutingEvents = (scouting as any).tickWeek?.(world) ?? 0;

  // 2) Training
  (training as any).tickWeek?.(world);

  // 3) Injuries (recovery/rolls)
  const injReport = (injuries as any).tickWeek?.(world) ?? null;
  const injuriesRecovered = typeof injReport?.recoveredCount === "number" ? injReport.recoveredCount : 0;
  const injuriesNew = typeof injReport?.newCount === "number" ? injReport.newCount : 0;

  // 4) Economy
  const econEvents = (economics as any).tickWeek?.(world) ?? 0;

  // 5) Governance
  const govEvents = (governance as any).tickWeek?.(world) ?? 0;

  // 6) Narrative events
  const narrativeEvents = (events as any).tickWeek?.(world) ?? 0;

  // 7) Rivalries
  const rivalryEvents = (rivalries as any).tickWeek?.(world) ?? 0;

  return {
    weekIndex,
    scoutingEvents: Number(scoutingEvents) || 0,
    injuriesRecovered,
    injuriesNew,
    economyEvents: Number(econEvents) || 0,
    governanceRulings: Number(govEvents) || 0,
    narrativeEvents: Number(narrativeEvents) || 0,
    rivalryEvents: Number(rivalryEvents) || 0,
  };
}
=======
 /**
  * Time Boundary System
  * Handles weekly/monthly tick processing and time state management
  * Provides canonical tick ordering for all subsystems
  */
 
 import { rngForWorld } from "./rng";
 import type { WorldState } from "./types";
 
 // === TIME STATE ===
 
 export interface TimeState {
   year: number;
   month: number;
   week: number;
   dayIndexGlobal: number;
   weekIndexGlobal: number;
   phase: "basho" | "interbasho";
 }
 
 // === SCOUTING EVENTS ===
 
 export interface ScoutingEvent {
   targetId: string;
   confidenceGain: number;
 }
 
 /**
  * Apply weekly scouting progress to all active scouting targets.
  */
 export function applyWeeklyScouting(world: WorldState, weekIndex: number): ScoutingEvent[] {
   const events: ScoutingEvent[] = [];
   const rng = rngForWorld(world, "scouting", `week${weekIndex}`);
 
   for (const scout of world.scoutingTargets ?? []) {
     const gain = 0.05 + rng.next() * 0.05;
     scout.confidence = Math.min(1, scout.confidence + gain);
     events.push({ targetId: scout.targetId, confidenceGain: gain });
   }
 
   return events;
 }
 
 /**
  * Tick function called by interim pipeline.
  */
 export function tickWeek(world: WorldState, weekIndex: number): ScoutingEvent[] {
   return applyWeeklyScouting(world, weekIndex);
 }
 
 // === WEEK ADVANCEMENT ===
 
 /**
  * Advance the world by a number of weeks.
  * Canonical order: time boundary → lifecycle aging → scouting → training → injuries → economy → governance → events
  */
 export function advanceWeeks(world: WorldState, weeks: number, _timeState: TimeState): void {
   for (let i = 0; i < weeks; i++) {
     world.week += 1;
     // Note: Actual subsystem ticks are handled by processWeeklyBoundary
   }
 }
 
 /**
  * Process weekly boundary - runs all subsystem weekly ticks in canonical order.
  */
 export function processWeeklyBoundary(world: WorldState, _seed: string): void {
   // Weekly ticks are handled by advanceInterim in world.ts
   // This function serves as a hook point for autoSim
   void world;
 }
 
 /**
  * Process monthly boundary - runs subsystems that tick monthly.
  */
 export function processMonthlyBoundary(world: WorldState, _seed: string): void {
   // Monthly processing placeholder
   void world;
 }
>>>>>>> 5d0ed87c25a38491e219371f91ad67dcb9bdb4ed
