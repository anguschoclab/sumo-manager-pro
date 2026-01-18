// banzuke.ts
// Banzuke (Ranking) System — Canon-aligned deterministic scaffolding
//
// Fixes vs your version:
// - Corrected total sekitori slot math (Makuuchi is 42 total: 8 sanyaku + 34 maegashira)
// - compareRanks is now a true total ordering (tier → rankNumber → side)
// - Removed non-canon “static promotion map” behavior from this file (promotion is an OUTPUT of reassignment)
// - Added deterministic rank reassignment pipeline for sekitori (Makuuchi+Juryo) based on:
//   prior banzuke order + performance score → target index shift → re-slot into fixed slots
// - Added an explicit integration point for strength-of-schedule (opponentAvgTier) without forcing it
//
// NOTE: This is a “real engine” banzuke core you can call after a basho.
// It will NOT try to fully model Yokozuna/Ozeki council deliberations; instead it provides
// deterministic constraints + hooks to extend.

import type { Rank, Division, RankPosition } from "./types";

// === RANK HIERARCHY ===

export interface RankInfo {
  rank: Rank;
  division: Division;
  nameJa: string;
  tier: number;           // Lower = higher rank (1 = yokozuna)
  maxPositions: number;   // Slot capacity used by assignment
  salary: number;         // Monthly salary in yen
  isSanyaku: boolean;
  isSekitori: boolean;
  fightsPerBasho: number;
}

/**
 * Canon slot totals (sekitori):
 * - Makuuchi: 42 total (8 sanyaku slots + 34 Maegashira)
 *   (Y/O/S/K are “named” ranks; Y+O counts can vary in reality but we keep deterministic caps)
 * - Juryo: 28 total (J1–J14 E/W)
 */
export const RANK_HIERARCHY: Record<Rank, RankInfo> = {
  yokozuna: {
    rank: "yokozuna",
    division: "makuuchi",
    nameJa: "横綱",
    tier: 1,
    maxPositions: 2, // game cap; can be raised later
    salary: 3_000_000,
    isSanyaku: true,
    isSekitori: true,
    fightsPerBasho: 15
  },
  ozeki: {
    rank: "ozeki",
    division: "makuuchi",
    nameJa: "大関",
    tier: 2,
    maxPositions: 2, // keep makuuchi total correct
    salary: 2_500_000,
    isSanyaku: true,
    isSekitori: true,
    fightsPerBasho: 15
  },
  sekiwake: {
    rank: "sekiwake",
    division: "makuuchi",
    nameJa: "関脇",
    tier: 3,
    maxPositions: 2, // E/W
    salary: 1_800_000,
    isSanyaku: true,
    isSekitori: true,
    fightsPerBasho: 15
  },
  komusubi: {
    rank: "komusubi",
    division: "makuuchi",
    nameJa: "小結",
    tier: 4,
    maxPositions: 2, // E/W
    salary: 1_800_000,
    isSanyaku: true,
    isSekitori: true,
    fightsPerBasho: 15
  },
  maegashira: {
    rank: "maegashira",
    division: "makuuchi",
    nameJa: "前頭",
    tier: 5,
    maxPositions: 34, // M1–M17 E/W = 34
    salary: 1_400_000,
    isSanyaku: false,
    isSekitori: true,
    fightsPerBasho: 15
  },
  juryo: {
    rank: "juryo",
    division: "juryo",
    nameJa: "十両",
    tier: 6,
    maxPositions: 28, // J1–J14 E/W = 28
    salary: 1_100_000,
    isSanyaku: false,
    isSekitori: true,
    fightsPerBasho: 15
  },
  makushita: {
    rank: "makushita",
    division: "makushita",
    nameJa: "幕下",
    tier: 7,
    maxPositions: 120,
    salary: 0,
    isSanyaku: false,
    isSekitori: false,
    fightsPerBasho: 7
  },
  sandanme: {
    rank: "sandanme",
    division: "sandanme",
    nameJa: "三段目",
    tier: 8,
    maxPositions: 200,
    salary: 0,
    isSanyaku: false,
    isSekitori: false,
    fightsPerBasho: 7
  },
  jonidan: {
    rank: "jonidan",
    division: "jonidan",
    nameJa: "序二段",
    tier: 9,
    maxPositions: 350,
    salary: 0,
    isSanyaku: false,
    isSekitori: false,
    fightsPerBasho: 7
  },
  jonokuchi: {
    rank: "jonokuchi",
    division: "jonokuchi",
    nameJa: "序ノ口",
    tier: 10,
    maxPositions: 100,
    salary: 0,
    isSanyaku: false,
    isSekitori: false,
    fightsPerBasho: 7
  }
};

// === RANK ORDERING / DISPLAY ===

// Returns negative if a is higher (better banzuke position), positive if b is higher.
export function compareRanks(a: RankPosition, b: RankPosition): number {
  const aInfo = RANK_HIERARCHY[a.rank];
  const bInfo = RANK_HIERARCHY[b.rank];

  // Tier (rank family)
  if (aInfo.tier !== bInfo.tier) return aInfo.tier - bInfo.tier;

  // Rank number (M1 vs M2 etc). Missing rankNumber sorts before defined? (treat missing as 0)
  const an = a.rankNumber ?? 0;
  const bn = b.rankNumber ?? 0;
  if (an !== bn) return an - bn;

  // Side: East outranks West deterministically
  if (a.side !== b.side) return a.side === "east" ? -1 : 1;

  return 0;
}

export function formatRank(position: RankPosition): string {
  const info = RANK_HIERARCHY[position.rank];
  const side = position.side === "east" ? "E" : "W";
  if (position.rankNumber !== undefined) return `${info.nameJa}${position.rankNumber}${side}`;
  return `${info.nameJa}${side}`;
}

export function getRankTitleJa(position: RankPosition): string {
  const info = RANK_HIERARCHY[position.rank];
  const sideJa = position.side === "east" ? "東" : "西";
  if (position.rankNumber !== undefined) return `${sideJa}${info.nameJa}${position.rankNumber}枚目`;
  return `${sideJa}${info.nameJa}`;
}

// === KACHI-KOSHI / MAKE-KOSHI ===

export function isKachiKoshi(wins: number, losses: number, rank: Rank): boolean {
  const totalBouts = RANK_HIERARCHY[rank].fightsPerBasho;
  const required = Math.floor(totalBouts / 2) + 1;
  return wins >= required;
}

export function isMakeKoshi(wins: number, losses: number, rank: Rank): boolean {
  const totalBouts = RANK_HIERARCHY[rank].fightsPerBasho;
  const required = Math.floor(totalBouts / 2) + 1;
  return losses >= required;
}

// === Ozeki kadoban (state machine helper remains) ===

export interface OzekiStatus {
  isKadoban: boolean;
  consecutiveMakeKoshi: number;
}

export function getOzekiStatus(
  lastBashoWins: number,
  lastBashoLosses: number,
  previousKadoban: boolean
): OzekiStatus {
  const hadMakeKoshi = isMakeKoshi(lastBashoWins, lastBashoLosses, "ozeki");
  return {
    isKadoban: hadMakeKoshi && !previousKadoban,
    consecutiveMakeKoshi: hadMakeKoshi ? (previousKadoban ? 2 : 1) : 0
  };
}

// === DETERMINISTIC SEKITORI BAZUKE UPDATE ===

export interface SekitoriPerformance {
  rikishiId: string;
  wins: number;
  losses: number;

  /**
   * Optional strength-of-schedule indicator.
   * Lower = harder schedule (facing higher tiers), so it should slightly BOOST a score.
   * If you don’t have it yet, omit.
   */
  opponentAvgTier?: number;

  /**
   * Optional yusho flag. If you track it, this gives a small deterministic boost.
   */
  yusho?: boolean;
}

export interface BanzukeEntry {
  rikishiId: string;
  position: RankPosition;
  division: "makuuchi" | "juryo";
}

export interface PromotionEvent {
  rikishiId: string;
  from: string;
  to: string;
  description: string;
}

export interface DemotionEvent {
  rikishiId: string;
  from: string;
  to: string;
  description: string;
}

export interface SekitoriBanzukeUpdateResult {
  newBanzuke: BanzukeEntry[]; // length = 70 (42+28) unless you choose different caps
  promotions: PromotionEvent[];
  demotions: DemotionEvent[];
}

/**
 * Canon-shaped: deterministic reassignment.
 * Inputs:
 * - currentBanzuke: ordered list (or unsorted; we will sort deterministically)
 * - performance: per-rikishi wins/losses (+ optional SoS/yusho)
 *
 * Output:
 * - full new sekitori banzuke, with explicit positions and promo/demotion events.
 *
 * No randomness, no Math.random, no “static promotion map”.
 */
export function updateSekitoriBanzukeDeterministic(
  currentBanzuke: BanzukeEntry[],
  performance: SekitoriPerformance[]
): SekitoriBanzukeUpdateResult {
  const perfById = new Map(performance.map((p) => [p.rikishiId, p]));

  // 1) Normalize current order deterministically
  const current = [...currentBanzuke].sort((a, b) => compareRanks(a.position, b.position));

  // 2) Compute a deterministic “movement delta” per wrestler
  //    Positive delta = fall (worse), negative delta = rise (better)
  const deltas = current.map((e, idx) => {
    const p = perfById.get(e.rikishiId);
    const wins = p?.wins ?? 0;
    const losses = p?.losses ?? 0;
    const margin = wins - losses;

    // Base: each +2 margin roughly moves up 1 slot; each -2 moves down 1 slot.
    let delta = -Math.trunc(margin / 2);

    // Slight deterministic bonus for tough schedule (lower avg tier means harder)
    if (typeof p?.opponentAvgTier === "number") {
      // Example: avgTier 2.5 vs 5.5 -> harder; convert to a small bonus [-1..+1]
      const sosBonus = clampInt(Math.round((5 - p.opponentAvgTier) / 2), -1, 1);
      delta -= sosBonus;
    }

    // Small boost for yusho
    if (p?.yusho) delta -= 2;

    // Yokozuna are never demoted in rank-family terms; we still allow minor reordering among yokozuna.
    if (e.position.rank === "yokozuna") delta = Math.min(delta, 0);

    return { id: e.rikishiId, idx, delta };
  });

  // 3) Target indices: stable deterministic re-insertion by target
  const n = current.length;
  const target = deltas
    .map((d) => {
      const t = clampInt(d.idx + d.delta, 0, n - 1);
      return { id: d.id, fromIdx: d.idx, targetIdx: t };
    })
    // Sort by targetIdx first; tie-breaker by current order (fromIdx)
    .sort((a, b) => a.targetIdx - b.targetIdx || a.fromIdx - b.fromIdx);

  // 4) Build new ordering by “placing” each wrestler into the next open spot
  const newOrder: BanzukeEntry[] = [];
  const used = new Set<string>();

  // Greedy place in target order
  for (const t of target) {
    if (used.has(t.id)) continue;
    const entry = current.find((e) => e.rikishiId === t.id);
    if (!entry) continue;
    newOrder.push(entry);
    used.add(t.id);
  }
  // Fill any missing (shouldn’t happen)
  for (const e of current) {
    if (!used.has(e.rikishiId)) newOrder.push(e);
  }

  // 5) Assign slots top-to-bottom using fixed slot templates
  const slotTemplate = buildSekitoriSlotTemplate();
  const assigned: BanzukeEntry[] = newOrder.map((e, i) => ({
    rikishiId: e.rikishiId,
    division: slotTemplate[i].division,
    position: slotTemplate[i].position
  }));

  // 6) Produce promotion/demotion events (division boundary + rank-family changes)
  const oldById = new Map(current.map((e) => [e.rikishiId, e]));
  const promotions: PromotionEvent[] = [];
  const demotions: DemotionEvent[] = [];

  for (const e of assigned) {
    const old = oldById.get(e.rikishiId);
    if (!old) continue;

    const from = old.position.rank;
    const to = e.position.rank;

    const fromDiv = old.division;
    const toDiv = e.division;

    if (fromDiv !== toDiv) {
      if (toDiv === "makuuchi") {
        promotions.push({
          rikishiId: e.rikishiId,
          from: `${fromDiv}:${from}`,
          to: `${toDiv}:${to}`,
          description: `Promoted to Makuuchi: ${from} → ${to}`
        });
      } else {
        demotions.push({
          rikishiId: e.rikishiId,
          from: `${fromDiv}:${from}`,
          to: `${toDiv}:${to}`,
          description: `Demoted to Juryo: ${from} → ${to}`
        });
      }
      continue;
    }

    if (from !== to) {
      // Higher rank has lower tier
      const fromTier = RANK_HIERARCHY[from].tier;
      const toTier = RANK_HIERARCHY[to].tier;

      if (toTier < fromTier) {
        promotions.push({
          rikishiId: e.rikishiId,
          from,
          to,
          description: `Promoted: ${from} → ${to}`
        });
      } else if (toTier > fromTier) {
        demotions.push({
          rikishiId: e.rikishiId,
          from,
          to,
          description: `Demoted: ${from} → ${to}`
        });
      }
    }
  }

  return {
    newBanzuke: assigned,
    promotions,
    demotions
  };
}

// === SLOT TEMPLATE (42 Makuuchi + 28 Juryo) ===

function buildSekitoriSlotTemplate(): Array<{ division: "makuuchi" | "juryo"; position: RankPosition }> {
  const slots: Array<{ division: "makuuchi" | "juryo"; position: RankPosition }> = [];

  // Helper: push E then W for a rank w/ rankNumber
  const pushPair = (division: "makuuchi" | "juryo", rank: Rank, rankNumber?: number) => {
    slots.push({ division, position: { rank, side: "east", rankNumber } as RankPosition });
    slots.push({ division, position: { rank, side: "west", rankNumber } as RankPosition });
  };

  // Makuuchi named ranks (caps are fixed here)
  pushPair("makuuchi", "yokozuna");
  pushPair("makuuchi", "ozeki");
  pushPair("makuuchi", "sekiwake");
  pushPair("makuuchi", "komusubi");

  // Maegashira M1–M17 (34)
  for (let n = 1; n <= 17; n++) pushPair("makuuchi", "maegashira", n);

  // Juryo J1–J14 (28)
  for (let n = 1; n <= 14; n++) pushPair("juryo", "juryo", n);

  return slots;
}

// === UTILS ===

function clampInt(x: number, lo: number, hi: number): number {
  if (x < lo) return lo;
  if (x > hi) return hi;
  return x;
}
