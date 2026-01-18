// schedule.ts
// =======================================================
// Schedule Builder v1.1 — Deterministic daily torikumi generation for ALL divisions
//
// Uses matchmaking.ts candidate scoring + greedy maximum matching (good-enough, deterministic).
//
// Division bout counts (default):
// - makuuchi, juryo: 15 days, daily bouts during basho
// - makushita, sandanme, jonidan, jonokuchi: 7 days (or 7 bouts) baseline
//
// This module does NOT simulate bouts; it only produces MatchSchedule entries.
// =======================================================

import seedrandom from "seedrandom";
import type { BashoState, Division, MatchSchedule, Rikishi, WorldState } from "./types";
import { buildCandidatePairs, DEFAULT_MATCHMAKING_RULES, type MatchPairing, type MatchmakingRules } from "./matchmaking";

export interface DivisionScheduleConfig {
  division: Division;
  /** number of bouts on a given day (usually roster/2) */
  boutsPerDay?: number;
  /** optional cap on roster used (e.g., if you later model kyujo differently) */
  maxActiveRikishi?: number;
}

export interface ScheduleRules {
  matchmaking?: Partial<MatchmakingRules>;
  /**
   * If true, allow creating a match even when repeat-opponent avoidance blocks full card.
   * (Still respects same-heya hard rule.)
   */
  allowForcedRepeats?: boolean;
}

export const DEFAULT_DIVISION_DAYS: Record<Division, number> = {
  makuuchi: 15,
  juryo: 15,
  makushita: 7,
  sandanme: 7,
  jonidan: 7,
  jonokuchi: 7
};

function stableSort<T>(arr: T[], keyFn: (x: T) => string): T[] {
  return [...arr].sort((a, b) => keyFn(a).localeCompare(keyFn(b)));
}

function activeDivisionRoster(world: WorldState, division: Division): Rikishi[] {
  return stableSort(
    Array.from(world.rikishi.values()).filter(r => r.division === division && !(r as any).injured),
    r => r.id
  );
}

function previousOpponentsSet(basho: BashoState): Map<string, Set<string>> {
  const map = new Map<string, Set<string>>();
  for (const m of basho.matches) {
    const e = m.eastRikishiId;
    const w = m.westRikishiId;
    if (!map.has(e)) map.set(e, new Set());
    if (!map.has(w)) map.set(w, new Set());
    map.get(e)!.add(w);
    map.get(w)!.add(e);
  }
  return map;
}

function greedySelectPairs(candidates: MatchPairing[], requiredPairs: number): MatchPairing[] {
  const selected: MatchPairing[] = [];
  const used = new Set<string>();

  for (const c of candidates) {
    if (selected.length >= requiredPairs) break;
    if (used.has(c.eastId) || used.has(c.westId)) continue;
    selected.push(c);
    used.add(c.eastId);
    used.add(c.westId);
  }

  return selected;
}

/**
 * Builds matchups for a single division/day and appends to basho.matches.
 */
export function scheduleDivisionDay(args: {
  world: WorldState;
  basho: BashoState;
  division: Division;
  day: number;
  seed: string;
  rules?: ScheduleRules;
  config?: DivisionScheduleConfig;
}): MatchSchedule[] {
  const { world, basho, division, day } = args;
  const rules = args.rules ?? {};
  const rng = seedrandom(`${args.seed}-sched-${division}-day${day}`);

  const roster = activeDivisionRoster(world, division);
  const maxActive = args.config?.maxActiveRikishi;
  const pool = typeof maxActive === "number" ? roster.slice(0, Math.max(0, maxActive)) : roster;

  const boutsPerDay = args.config?.boutsPerDay ?? Math.floor(pool.length / 2);
  if (boutsPerDay <= 0 || pool.length < 2) return [];

  const mmRules: Partial<MatchmakingRules> = {
    ...DEFAULT_MATCHMAKING_RULES,
    ...(rules.matchmaking ?? {})
  };

  const candidates = buildCandidatePairs(basho, pool, {
    seed: `${args.seed}-cand-${division}-day${day}`,
    rules: mmRules,
    division
  });

  // First pass: strict (no repeats)
  let selected = greedySelectPairs(candidates, boutsPerDay);

  // If we couldn't fill the card, optionally allow forced repeats (same-heya still disallowed)
  if (selected.length < boutsPerDay && (rules.allowForcedRepeats ?? true)) {
    const looseRules: Partial<MatchmakingRules> = {
      ...mmRules,
      avoidRepeatOpponents: false,
      allowRepeatsWhenForced: true
    };
    const looserCandidates = buildCandidatePairs(basho, pool, {
      seed: `${args.seed}-cand2-${division}-day${day}`,
      rules: looseRules,
      division
    });

    // Add additional pairs not overlapping
    const alreadyUsed = new Set<string>();
    for (const p of selected) {
      alreadyUsed.add(p.eastId);
      alreadyUsed.add(p.westId);
    }

    const extra: MatchPairing[] = [];
    for (const c of looserCandidates) {
      if (selected.length + extra.length >= boutsPerDay) break;
      if (alreadyUsed.has(c.eastId) || alreadyUsed.has(c.westId)) continue;
      extra.push(c);
      alreadyUsed.add(c.eastId);
      alreadyUsed.add(c.westId);
    }
    selected = [...selected, ...extra];
  }

  // Deterministic shuffle of final list so it doesn't always appear sorted by score
  const shuffled = [...selected];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  const scheduled: MatchSchedule[] = [];
  for (const p of shuffled) {
    scheduled.push({
      day,
      eastRikishiId: p.eastId,
      westRikishiId: p.westId
    });
  }

  // Append to basho state (mutates basho.matches as engine expects)
  basho.matches.push(...scheduled);

  // Update opponent map (not strictly needed because basho.matches holds truth)
  void previousOpponentsSet(basho);

  return scheduled;
}

/**
 * Builds schedules for all divisions for a given day.
 * (Useful if your UI shows one combined card; you can still filter by division.)
 */
export function scheduleAllDivisionsDay(args: {
  world: WorldState;
  basho: BashoState;
  day: number;
  seed: string;
  rules?: ScheduleRules;
  /** Override divisions list, otherwise uses all divisions present in types */
  divisions?: Division[];
}): MatchSchedule[] {
  const divisions: Division[] =
    args.divisions ??
    (["jonokuchi", "jonidan", "sandanme", "makushita", "juryo", "makuuchi"] as Division[]);

  const out: MatchSchedule[] = [];
  for (const div of divisions) {
    out.push(
      ...scheduleDivisionDay({
        world: args.world,
        basho: args.basho,
        division: div,
        day: args.day,
        seed: args.seed,
        rules: args.rules
      })
    );
  }
  return out;
}

/**
 * Optional helper: generate the full basho schedule up to the max day across divisions.
 * - makuuchi/juryo: 15
 * - others: 7
 */
export function generateFullBashoSchedule(args: {
  world: WorldState;
  basho: BashoState;
  seed: string;
  rules?: ScheduleRules;
  divisions?: Division[];
}): void {
  const divisions: Division[] =
    args.divisions ??
    (["jonokuchi", "jonidan", "sandanme", "makushita", "juryo", "makuuchi"] as Division[]);

  // Determine max days to generate (15 if any sekitori divisions included)
  let maxDays = 0;
  for (const d of divisions) maxDays = Math.max(maxDays, DEFAULT_DIVISION_DAYS[d]);

  for (let day = 1; day <= maxDays; day++) {
    for (const div of divisions) {
      const divDays = DEFAULT_DIVISION_DAYS[div];
      if (day > divDays) continue;
      scheduleDivisionDay({
        world: args.world,
        basho: args.basho,
        division: div,
        day,
        seed: args.seed,
        rules: args.rules
      });
    }
  }
}
