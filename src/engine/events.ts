// events.ts
// =======================================================
// Events System v1.0 — Deterministic narrative/economy/world events
// Canon goals:
// - Single, JSON-safe event stream (engine truth) that UI can digest into "news".
// - Deterministic selection + resolution (no Math.random).
// - Works for weekly + monthly boundaries, and for basho-day hooks later.
// - Supports: heya events, rikishi events, economy events, media events, rivalries hooks.
// - Lightweight now; expandable as design grows.
// =======================================================
import { SeededRNG } from "./utils/SeededRNG";
import type { Id, WorldState } from "./types";
import type { InjuryRecord } from "./injuries";

// Define missing types that events.ts needs to bridge other systems
export interface RivalryEvent {
  type: "rivalry_started" | "rivalry_escalation" | "rivalry_peak" | "rivalry_cool";
  rikishiA: string;
  rikishiB: string;
  title: string;
  summary: string;
  data: Record<string, string | number | boolean | null | undefined>;
  truthLevel?: "public" | "limited" | "private";
}

export interface MediaEvent {
  type: string;
  subjectId?: string;
  phase?: EventPhase;
  importance?: EventImportance;
  scope?: EventScope;
  heyaId?: string;
  rikishiId?: string;
  title: string;
  summary: string;
  data: Record<string, string | number | boolean | null | undefined>;
  truthLevel?: "public" | "limited" | "private";
  tags?: string[];
}

// -------------------------------
// Core Event Types
// -------------------------------

export type EventScope = "world" | "heya" | "rikishi";
export type EventPhase = "weekly" | "monthly" | "basho_day" | "basho_wrap" | "manual";
export type EventCategory =
  | "training"
  | "scouting"
  | "injury"
  | "economy"
  | "sponsor"
  | "media"
  | "rivalry"
  | "promotion"
  | "discipline"
  | "facility"
  | "milestone"
  | "misc";

export type EventImportance = "minor" | "notable" | "major" | "headline";

export interface EngineEvent {
  id: Id;

  /** Deterministic ordering */
  year: number;
  week: number;
  month?: number;
  bashoNumber?: 1 | 2 | 3 | 4 | 5 | 6;
  day?: number;

  phase: EventPhase;
  category: EventCategory;
  importance: EventImportance;

  scope: EventScope;
  heyaId?: Id;
  rikishiId?: Id;

  /** Human text payload (engine-generated; UI may rephrase) */
  title: string;
  summary: string;

  /** Machine payload for UI/system logic */
  data: Record<string, string | number | boolean | null | undefined>;

  /** Canon: truth vs knowledge separation. UI can apply Fog of War filtering elsewhere. */
  truthLevel: "public" | "limited" | "private";

  /** Optional: tie events together (digest, arc, etc.) */
  tags?: string[];
}

/** JSON-safe event log */
export interface EventsState {
  version: "1.0.0";
  log: EngineEvent[];

  /** Optional: dedupe keys for idempotent boundaries */
  dedupe: Record<string, true>;
}

export function createDefaultEventsState(): EventsState {
  return { version: "1.0.0", log: [], dedupe: {} };
}

// -------------------------------
// Helpers
// -------------------------------

export function makeEventId(seed: string, parts: string[]): Id {
  // Stable ID so re-running a boundary can be idempotent if desired
  const s = `${seed}::${parts.join("::")}`;
  // Simple stable hash (not crypto); ok for IDs
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return `evt-${(h >>> 0).toString(16)}`;
}

export function pushEvent(state: EventsState, event: EngineEvent, dedupeKey?: string): EventsState {
  if (dedupeKey) {
    if (state.dedupe[dedupeKey]) return state;
    return {
      ...state,
      log: [...state.log, event],
      dedupe: { ...state.dedupe, [dedupeKey]: true }
    };
  }
  return { ...state, log: [...state.log, event] };
}

export function sortEventsDeterministic(events: EngineEvent[]): EngineEvent[] {
  return [...events].sort((a, b) => {
    // Primary: time
    const ta =
      (a.year * 1e9) +
      (a.month ?? 0) * 1e7 +
      (a.week ?? 0) * 1e5 +
      (a.bashoNumber ?? 0) * 1e3 +
      (a.day ?? 0);
    const tb =
      (b.year * 1e9) +
      (b.month ?? 0) * 1e7 +
      (b.week ?? 0) * 1e5 +
      (b.bashoNumber ?? 0) * 1e3 +
      (b.day ?? 0);

    if (ta !== tb) return ta - tb;

    // Secondary: importance
    const imp = (x: EventImportance) =>
      x === "headline" ? 3 : x === "major" ? 2 : x === "notable" ? 1 : 0;

    const di = imp(b.importance) - imp(a.importance);
    if (di !== 0) return di;

    // Tertiary: category + id
    const dc = a.category.localeCompare(b.category);
    if (dc !== 0) return dc;

    return a.id.localeCompare(b.id);
  });
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

// -------------------------------
// Builders (bridges from other systems)
// -------------------------------

export function eventFromInjury(args: {
  world: WorldState;
  seed: string;
  injury: InjuryRecord;
  heyaId?: Id;
}): EngineEvent {
  const { world, seed, injury, heyaId } = args;

  const importance: EventImportance =
    injury.severity === "serious" ? "headline" : injury.severity === "moderate" ? "major" : "notable";

  const id = makeEventId(seed, ["injury", injury.rikishiId, injury.id]);

  return {
    id,
    year: world.year,
    week: world.week,
    phase: "weekly",
    category: "injury",
    importance,
    scope: "rikishi",
    heyaId,
    rikishiId: injury.rikishiId,
    title: injury.title,
    summary: injury.description,
    data: {
      severity: injury.severity,
      area: injury.area,
      type: injury.type,
      expectedWeeksOut: injury.expectedWeeksOut,
      remainingWeeks: injury.remainingWeeks,
      causedBy: injury.causedBy ?? null
    },
    truthLevel: "public",
    tags: ["injury"]
  };
}

export function eventFromRivalry(args: {
  world: WorldState;
  seed: string;
  rivalryEvent: RivalryEvent;
}): EngineEvent {
  const { world, seed, rivalryEvent } = args;

  const id = makeEventId(seed, ["rivalry", rivalryEvent.type, rivalryEvent.rikishiA, rivalryEvent.rikishiB, `${world.week}`]);

  const importance: EventImportance =
    rivalryEvent.type === "rivalry_peak" ? "headline" :
    rivalryEvent.type === "rivalry_escalation" ? "major" :
    rivalryEvent.type === "rivalry_started" ? "notable" : "minor";

  return {
    id,
    year: world.year,
    week: world.week,
    phase: "weekly",
    category: "rivalry",
    importance,
    scope: "world",
    title: rivalryEvent.title,
    summary: rivalryEvent.summary,
    data: { ...rivalryEvent.data },
    truthLevel: rivalryEvent.truthLevel ?? "public",
    tags: ["rivalry"]
  };
}

export function eventFromMedia(args: {
  world: WorldState;
  seed: string;
  media: MediaEvent;
}): EngineEvent {
  const { world, seed, media } = args;

  const id = makeEventId(seed, ["media", media.type, media.subjectId ?? "world", `${world.week}`]);

  return {
    id,
    year: world.year,
    week: world.week,
    phase: media.phase ?? "weekly",
    category: "media",
    importance: media.importance ?? "minor",
    scope: media.scope ?? "world",
    heyaId: media.heyaId,
    rikishiId: media.rikishiId,
    title: media.title,
    summary: media.summary,
    data: { ...media.data },
    truthLevel: media.truthLevel ?? "public",
    tags: ["media", ...(media.tags ?? [])]
  };
}

/** Generic convenience builder */
export function makeSimpleEvent(args: {
  world: WorldState;
  seed: string;
  phase: EventPhase;
  category: EventCategory;
  importance?: EventImportance;
  scope: EventScope;
  title: string;
  summary: string;
  heyaId?: Id;
  rikishiId?: Id;
  truthLevel?: EngineEvent["truthLevel"];
  data?: EngineEvent["data"];
  tags?: string[];
  dedupeKey?: string;
}): { event: EngineEvent; dedupeKey?: string } {
  const id = makeEventId(args.seed, [
    args.category,
    args.phase,
    args.scope,
    args.heyaId ?? "none",
    args.rikishiId ?? "none",
    args.title
  ]);

  return {
    event: {
      id,
      year: args.world.year,
      week: args.world.week,
      phase: args.phase,
      category: args.category,
      importance: args.importance ?? "minor",
      scope: args.scope,
      heyaId: args.heyaId,
      rikishiId: args.rikishiId,
      title: args.title,
      summary: args.summary,
      data: args.data ?? {},
      truthLevel: args.truthLevel ?? "public",
      tags: args.tags
    },
    dedupeKey: args.dedupeKey
  };
}

// -------------------------------
// Event Generation (optional "ambient" events)
// -------------------------------

/**
 * Generate a small set of "ambient" weekly events (flavor + small economy/training notes).
 * Deterministic and safe; returns events only (caller chooses whether to persist).
 */
export function generateAmbientWeeklyEvents(args: {
  world: WorldState;
  seed: string; // weekSeed recommended
  maxEvents?: number;
}): EngineEvent[] {
  const rng = new SeededRNG(`${args.seed}-ambient`);
  const out: EngineEvent[] = [];

  const max = Math.max(0, Math.floor(args.maxEvents ?? 2));

  // Probability scales with world size a bit, but stays modest
  const heyaCount = args.world.heyas.size;
  const chance = clamp(0.15 + heyaCount / 200, 0.15, 0.35);

  if (rng.next() > chance || max === 0) return out;

  // Pick a random heya (stable deterministic by sorted ids)
  const heyaIds = Array.from(args.world.heyas.keys()).sort((a, b) => a.localeCompare(b));
  const heyaId = heyaIds.length ? heyaIds[Math.floor(rng.next() * heyaIds.length)] : undefined;

  const templates: Array<{ title: string; summary: string; category: EventCategory; importance: EventImportance }> = [
    {
      title: "Keiko draws attention",
      summary: "Rumors spread after an intense week of practice sessions.",
      category: "training",
      importance: "minor"
    },
    {
      title: "Supporters rally quietly",
      summary: "A small but steady push from supporters boosts morale around the heya.",
      category: "sponsor",
      importance: "minor"
    },
    {
      title: "A young recruit impresses",
      summary: "Whispers of a promising newcomer circulate among insiders.",
      category: "milestone",
      importance: "notable"
    },
    {
      title: "Facilities wear showing",
      summary: "Maintenance needs are starting to show—nothing urgent yet, but it’s noticed.",
      category: "facility",
      importance: "minor"
    }
  ];

  const pick = templates[Math.floor(rng.next() * templates.length)];
  const { event } = makeSimpleEvent({
    world: args.world,
    seed: args.seed,
    phase: "weekly",
    category: pick.category,
    importance: pick.importance,
    scope: heyaId ? "heya" : "world",
    heyaId,
    title: pick.title,
    summary: pick.summary,
    truthLevel: "public",
    data: { heyaId: heyaId ?? null },
    tags: ["ambient"]
  });

  out.push(event);

  return out.slice(0, max);
}

// -------------------------------
// Aggregation convenience
// -------------------------------

/**
 * Merge events into a state log with optional deterministic ordering.
 */
export function appendEvents(state: EventsState, events: EngineEvent[], sort: boolean = false): EventsState {
  let next = state;
  for (const e of events) next = pushEvent(next, e);
  return sort ? { ...next, log: sortEventsDeterministic(next.log) } : next;
}

/**
 * Filter events for UI (optionally by scope/heya/rikishi).
 */
export function queryEvents(args: {
  state: EventsState;
  limit?: number;
  scope?: EventScope;
  heyaId?: Id;
  rikishiId?: Id;
  category?: EventCategory;
}): EngineEvent[] {
  const limit = Math.max(1, Math.floor(args.limit ?? 50));
  let list = args.state.log;

  if (args.scope) list = list.filter(e => e.scope === args.scope);
  if (args.heyaId) list = list.filter(e => e.heyaId === args.heyaId);
  if (args.rikishiId) list = list.filter(e => e.rikishiId === args.rikishiId);
  if (args.category) list = list.filter(e => e.category === args.category);

  // Return newest first
  return [...list].reverse().slice(0, limit);
}
