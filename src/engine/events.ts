/**
 * File Name: src/engine/events.ts
 * Status: CONSOLIDATED (Canon System 6 + V1 Logic)
 * Purpose: Central Event Bus, Logger, and Narrative Generator.
 * * Merges the functional builders of V1 with the WorldState integration of Canon.
 */

import { 
  WorldState, 
  HistoryEvent, 
  HistoryEventType, 
  Id, 
  EventCategory, 
  EventPhase, 
  EventImportance 
} from './types';
import { SeededRNG } from './utils/SeededRNG';
import type { InjuryRecord } from './injuries';

// ============================================================================
// 1. PAYLOAD INTERFACES (Bridge for external systems)
// ============================================================================

export interface RivalryEventPayload {
  type: "rivalry_started" | "rivalry_escalation" | "rivalry_peak" | "rivalry_cool";
  rikishiA: string;
  rikishiB: string;
  title: string;
  summary: string;
  data: Record<string, string | number | boolean | null | undefined>;
  truthLevel?: "public" | "limited" | "private";
}

export interface MediaEventPayload {
  type: string;
  subjectId?: string;
  phase?: EventPhase;
  importance?: EventImportance;
  scope?: "world" | "heya" | "rikishi";
  heyaId?: string;
  rikishiId?: string;
  title: string;
  summary: string;
  data: Record<string, string | number | boolean | null | undefined>;
  truthLevel?: "public" | "limited" | "private";
  tags?: string[];
}

export interface LogEventParams {
  type: HistoryEventType;
  category: EventCategory;
  phase?: EventPhase;
  importance?: EventImportance;
  scope?: "world" | "heya" | "rikishi";
  entities: { primaryId: Id; secondaryIds?: Id[]; beyaId?: Id };
  title: string;
  summary: string;
  payload?: Record<string, any>;
  tags?: string[];
  truthLevel?: "public" | "limited" | "private";
  causedByEventId?: string;
}

// ============================================================================
// 2. HELPERS & DETERMINISM
// ============================================================================

/**
 * Creates a stable, idempotent ID based on seed and content parts.
 */
export function makeEventId(seed: string, parts: string[]): Id {
  const s = `${seed}::${parts.join("::")}`;
  // Simple stable hash (FNV-1a equivalent logic)
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return `evt-${(h >>> 0).toString(16)}`;
}

export function sortEventsDeterministic(events: HistoryEvent[]): HistoryEvent[] {
  return [...events].sort((a, b) => {
    // 1. Time
    const ta = (a.tick.year * 1e9) + (a.tick.week * 1e5) + (a.tick.day || 0);
    const tb = (b.tick.year * 1e9) + (b.tick.week * 1e5) + (b.tick.day || 0);
    if (ta !== tb) return ta - tb;

    // 2. Importance (Higher first)
    const impScore = (i: EventImportance) => i === "headline" ? 3 : i === "major" ? 2 : i === "notable" ? 1 : 0;
    const di = impScore(b.importance) - impScore(a.importance);
    if (di !== 0) return di;

    // 3. Category
    const dc = a.category.localeCompare(b.category);
    if (dc !== 0) return dc;

    // 4. Stable ID
    return a.id.localeCompare(b.id);
  });
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

// ============================================================================
// 3. CENTRAL LOGGER (The "Push" Mechanism)
// ============================================================================

/**
 * Appends a strictly-typed event to the World's immutable history log.
 */
export function logHistoryEvent(world: WorldState, params: LogEventParams): HistoryEvent {
  if (!world.historyLog) world.historyLog = [];

  const seedBase = world.seed || "legacy";
  // Ensure unique ID even if multiple events happen in same tick/context
  const uniqueTick = `${world.year}-${world.week}-${world.historyLog.length}`;
  const eventId = makeEventId(seedBase, [uniqueTick, params.type, params.entities.primaryId]);

  const event: HistoryEvent = {
    id: eventId,
    tick: {
      year: world.calendar.year,
      month: world.calendar.month,
      week: world.calendar.currentWeek,
      day: world.calendar.currentDay,
      bashoId: world.activeBasho?.id
    },
    phase: params.phase || "weekly",
    type: params.type,
    category: params.category,
    scope: params.scope || "world",
    importance: params.importance || "minor",
    entities: {
      primaryId: params.entities.primaryId,
      secondaryIds: params.entities.secondaryIds || [],
      beyaId: params.entities.beyaId
    },
    title: params.title,
    summary: params.summary,
    payload: params.payload || {},
    tags: params.tags || [],
    truthLevel: params.truthLevel || "public",
    causedByEventId: params.causedByEventId
  };

  world.historyLog.push(event);
  return event;
}

// ============================================================================
// 4. DOMAIN HELPERS (Convenience Factories)
// ============================================================================

export const HistoryLogger = {
  
  logRankChange: (world: WorldState, rikishiId: Id, oldRank: string, newRank: string) => {
    logHistoryEvent(world, {
      type: "RANK_CHANGE",
      category: "promotion",
      importance: "major",
      scope: "rikishi",
      entities: { primaryId: rikishiId },
      title: "Rank Update",
      summary: `${oldRank} -> ${newRank}`,
      payload: { oldRank, newRank }
    });
  },

  logInjury: (world: WorldState, rikishiId: Id, injury: InjuryRecord) => {
    const importance = injury.severity === "serious" ? "headline" : injury.severity === "moderate" ? "major" : "notable";
    
    logHistoryEvent(world, {
      type: "INJURY",
      category: "injury",
      importance,
      scope: "rikishi",
      entities: { primaryId: rikishiId },
      title: injury.title,
      summary: injury.description,
      payload: {
        severity: injury.severity,
        area: injury.area,
        type: injury.type,
        expectedWeeksOut: injury.expectedWeeksOut,
        remainingWeeks: injury.remainingWeeks,
        causedBy: injury.causedBy ?? null
      },
      tags: ["injury"]
    });
  },

  logRivalry: (world: WorldState, rivalry: RivalryEventPayload) => {
    const importance = 
      rivalry.type === "rivalry_peak" ? "headline" : 
      rivalry.type === "rivalry_escalation" ? "major" : 
      rivalry.type === "rivalry_started" ? "notable" : "minor";

    logHistoryEvent(world, {
      type: "RIVALRY_UPDATE",
      category: "rivalry",
      importance,
      scope: "world",
      entities: { primaryId: rivalry.rikishiA, secondaryIds: [rivalry.rikishiB] },
      title: rivalry.title,
      summary: rivalry.summary,
      payload: rivalry.data,
      truthLevel: rivalry.truthLevel,
      tags: ["rivalry"]
    });
  },

  logMedia: (world: WorldState, media: MediaEventPayload) => {
    logHistoryEvent(world, {
      type: "MEDIA_STORY",
      category: "media",
      phase: media.phase,
      importance: media.importance,
      scope: media.scope,
      entities: { 
        primaryId: media.subjectId || "world", 
        beyaId: media.heyaId,
        secondaryIds: media.rikishiId ? [media.rikishiId] : []
      },
      title: media.title,
      summary: media.summary,
      payload: media.data,
      truthLevel: media.truthLevel,
      tags: ["media", ...(media.tags || [])]
    });
  },

  logBoutResult: (world: WorldState, winnerId: Id, loserId: Id, kimarite: string) => {
    logHistoryEvent(world, {
      type: "BOUT_RESULT",
      category: "match",
      importance: "routine",
      scope: "rikishi",
      phase: "basho_day",
      entities: { primaryId: winnerId, secondaryIds: [loserId] },
      title: "Match Result",
      summary: `Defeated opponent via ${kimarite}`,
      payload: { winnerId, loserId, kimarite }
    });
  },
  
  // Generic "One-off" event builder
  logSimple: (world: WorldState, params: LogEventParams) => {
    return logHistoryEvent(world, params);
  },

  // Legacy adapters
  emit: (world: WorldState, payload: any) => {
    // console.log("[Event] Legacy Emit:", payload);
  },
  
  onBoutResolved: (world: WorldState, args: any) => {
    HistoryLogger.logBoutResult(world, args.match.winnerRikishiId, args.match.loserRikishiId, args.result.kimariteName);
  },

  tickWeek: (world: WorldState) => {
    generateAmbientWeeklyEvents(world);
  }
};

// Re-export methods for legacy compatibility
export const emit = HistoryLogger.emit;
export const onBoutResolved = HistoryLogger.onBoutResolved;
export const tickWeek = HistoryLogger.tickWeek;

// ============================================================================
// 5. AMBIENT EVENT GENERATOR (Flavor)
// ============================================================================

export function generateAmbientWeeklyEvents(world: WorldState): void {
  const seed = `${world.seed}-${world.year}-${world.week}-ambient`;
  const rng = new SeededRNG(seed);
  
  // Scale probability with world size
  const heyaCount = world.heyasArray ? world.heyasArray.length : 1;
  const chance = clamp(0.15 + (heyaCount / 200), 0.15, 0.35);

  if (rng.nextFloat() > chance) return;

  // Pick random heya
  const heyaIds = Object.keys(world.heyas || {});
  if (heyaIds.length === 0) return;
  const heyaId = heyaIds[Math.floor(rng.nextFloat() * heyaIds.length)];

  // Flavor templates
  const templates: Array<{ title: string; summary: string; category: EventCategory; importance: EventImportance }> = [
    { 
      title: "Intense Keiko", 
      summary: "The sounds of intense training echoed early this morning.", 
      category: "training", 
      importance: "minor" 
    },
    { 
      title: "Local Donation", 
      summary: "A local business donated high-quality rice to the stable.", 
      category: "sponsor", 
      importance: "minor" 
    },
    { 
      title: "Equipment Repair", 
      summary: "The dohyo needed minor repairs after a rough session.", 
      category: "facility", 
      importance: "minor" 
    },
    { 
      title: "Scout Sighting", 
      summary: "A promising young student was seen visiting the stable.", 
      category: "scouting",
      importance: "notable"
    }
  ];

  const pick = templates[Math.floor(rng.nextFloat() * templates.length)];

  logHistoryEvent(world, {
    type: "GENERIC_NOTE",
    category: pick.category,
    importance: pick.importance,
    scope: "heya",
    entities: { primaryId: heyaId, beyaId: heyaId },
    title: pick.title,
    summary: pick.summary,
    tags: ["ambient", "flavor"]
  });
}

// ============================================================================
// 6. QUERY HELPERS (UI)
// ============================================================================

export function queryEvents(
  world: WorldState, 
  filters: { 
    limit?: number; 
    category?: EventCategory; 
    entityId?: Id;
    minImportance?: EventImportance;
    scope?: "world" | "heya" | "rikishi";
  }
): HistoryEvent[] {
  let events = world.historyLog || [];
  
  if (filters.category) {
    events = events.filter(e => e.category === filters.category);
  }
  
  if (filters.entityId) {
    events = events.filter(e => 
      e.entities.primaryId === filters.entityId || 
      e.entities.secondaryIds?.includes(filters.entityId!) ||
      e.entities.beyaId === filters.entityId
    );
  }

  if (filters.scope) {
    events = events.filter(e => e.scope === filters.scope);
  }

  // Sort deterministic before slicing
  const sorted = sortEventsDeterministic(events).reverse(); // Newest first
  return sorted.slice(0, filters.limit || 50);
}
