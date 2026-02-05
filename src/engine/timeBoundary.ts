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