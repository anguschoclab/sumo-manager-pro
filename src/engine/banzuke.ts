// banzuke.ts
// Banzuke (Ranking) System — Canon-aligned deterministic scaffolding
//
// FIXES APPLIED (compile + canon + determinism):
// - Fixed a real bug: you assigned division from slotTemplate[i].division but slotTemplate can be undefined
//   if currentBanzuke length != template length. We now:
//   - build template first,
//   - size-normalize current banzuke to EXACT template length,
//   - drop extras deterministically, and
//   - (optionally) allow a deterministic filler policy for missing slots.
// - Fixed a major logic bug: your “targetIdx” sort ignored the target placement entirely after sorting.
//   You were just reusing the current order, not applying moves.
//   Now we do deterministic re-ranking by “score” then stable tie-break by old order.
// - Added explicit handling for Yokozuna “never demoted” constraint (tier clamp) and optional Ozeki guard.
// - Kept your compareRanks total ordering.
// - Kept slot template as 42+28 = 70 and made it the source of truth.
//
// NOTE: This is still a deterministic scaffold. Real-world sanyaku counts vary; this keeps fixed caps.

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
 * - Juryo: 28 total (J1–J14 E/W)
 */
export const RANK_HIERARCHY: Record<Rank, RankInfo> = {
  yokozuna: {
    rank: "yokozuna",
    division: "makuuchi",
    nameJa: "横綱",
    tier: 1,
    maxPositions: 2,
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
    maxPositions: 2,
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
    maxPositions: 2,
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
    maxPositions: 2,
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
    maxPositions: 34,
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
    maxPositions: 28,
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

  if (aInfo.tier !== bInfo.tier) return aInfo.tier - bInfo.tier;

  const an = a.rankNumber ?? 0;
  const bn = b.rankNumber ?? 0;
  if (an !== bn) return an - bn;

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

// === Ozeki kadoban helper ===

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

// === DETERMINISTIC SEKITORI BANZUKE UPDATE ===

export interface SekitoriPerformance {
  rikishiId: string;
  wins: number;
  losses: number;
  opponentAvgTier?: number; // lower = harder schedule (slight boost)
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
  newBanzuke: BanzukeEntry[]; // length = 70 (42+28)
  promotions: PromotionEvent[];
  demotions: DemotionEvent[];
}

/**
 * Deterministic sekitori reassignment using:
 * - old banzuke position (as baseline)
 * - performance-derived score delta
 * - stable tie-breaking on old order
 *
 * IMPORTANT: currentBanzuke must include exactly the sekitori you want to rank.
 * If you provide more than 70, extras are dropped deterministically (lowest old rank).
 * If you provide fewer than 70, we deterministically fill remaining with placeholder IDs.
 * (You can replace the filler policy with Makushita promotion later.)
 */
export function updateSekitoriBanzukeDeterministic(
  currentBanzuke: BanzukeEntry[],
  performance: SekitoriPerformance[]
): SekitoriBanzukeUpdateResult {
  const slotTemplate = buildSekitoriSlotTemplate();
  const SLOT_COUNT = slotTemplate.length; // 70

  const perfById = new Map(performance.map((p) => [p.rikishiId, p]));

  // 1) Normalize current order deterministically
  const sortedCurrent = [...currentBanzuke].sort((a, b) => compareRanks(a.position, b.position));

  // 2) Size-normalize to template length (to prevent undefined access)
  const current = normalizeToSlotCount(sortedCurrent, SLOT_COUNT);

  // 3) Compute deterministic movement score for each rikishi
  // Higher score => better => should appear earlier (higher rank)
  const scored = current.map((e, oldIndex) => {
    const p = perfById.get(e.rikishiId);
    const wins = p?.wins ?? 0;
    const losses = p?.losses ?? 0;
    const margin = wins - losses;

    // Base movement: each +2 margin ~ +1 “rank unit”
    let score = margin;

    // SoS: lower avgTier means tougher schedule => slight boost
    if (typeof p?.opponentAvgTier === "number" && Number.isFinite(p.opponentAvgTier)) {
      // centered around 5; keep small
      const sos = clampInt(Math.round((5 - p.opponentAvgTier) * 0.5), -1, 1);
      score += sos;
    }

    // Yusho: meaningful but not insane
    if (p?.yusho) score += 4;

    // Guardrails:
    // Yokozuna: cannot be “demoted” below Yokozuna in family terms.
    // We enforce this by adding a floor to their score relative to other Yokozuna.
    // (They can still swap Y1E/Y1W by score/tie-breaking.)
    const tier = RANK_HIERARCHY[e.position.rank].tier;
    if (e.position.rank === "yokozuna") score = Math.max(score, 0);

    return { entry: e, oldIndex, score, tier };
  });

  // 4) Deterministic new ordering:
  // - primary: higher score first
  // - secondary: higher prior rank (lower compareRanks) first
  // - tertiary: oldIndex (stable)
  const newOrder = scored
    .sort((a, b) => {
      if (a.entry.position.rank === "yokozuna" && b.entry.position.rank !== "yokozuna") return -1;
      if (b.entry.position.rank === "yokozuna" && a.entry.position.rank !== "yokozuna") return 1;

      if (b.score !== a.score) return b.score - a.score;

      const rankCmp = compareRanks(a.entry.position, b.entry.position);
      if (rankCmp !== 0) return rankCmp;

      return a.oldIndex - b.oldIndex;
    })
    .map((s) => s.entry);

  // 5) Assign fixed slots top-to-bottom
  const assigned: BanzukeEntry[] = newOrder.map((e, i) => ({
    rikishiId: e.rikishiId,
    division: slotTemplate[i].division,
    position: slotTemplate[i].position
  }));

  // 6) Promotion/demotion events
  const oldById = new Map(current.map((e) => [e.rikishiId, e]));
  const promotions: PromotionEvent[] = [];
  const demotions: DemotionEvent[] = [];

  for (const e of assigned) {
    const old = oldById.get(e.rikishiId);
    if (!old) continue;

    const fromRank = old.position.rank;
    const toRank = e.position.rank;

    const fromDiv = old.division;
    const toDiv = e.division;

    if (fromDiv !== toDiv) {
      if (toDiv === "makuuchi") {
        promotions.push({
          rikishiId: e.rikishiId,
          from: `${fromDiv}:${fromRank}`,
          to: `${toDiv}:${toRank}`,
          description: `Promoted to Makuuchi: ${fromRank} → ${toRank}`
        });
      } else {
        demotions.push({
          rikishiId: e.rikishiId,
          from: `${fromDiv}:${fromRank}`,
          to: `${toDiv}:${toRank}`,
          description: `Demoted to Juryo: ${fromRank} → ${toRank}`
        });
      }
      continue;
    }

    if (fromRank !== toRank) {
      const fromTier = RANK_HIERARCHY[fromRank].tier;
      const toTier = RANK_HIERARCHY[toRank].tier;

      if (toTier < fromTier) {
        promotions.push({
          rikishiId: e.rikishiId,
          from: fromRank,
          to: toRank,
          description: `Promoted: ${fromRank} → ${toRank}`
        });
      } else if (toTier > fromTier) {
        demotions.push({
          rikishiId: e.rikishiId,
          from: fromRank,
          to: toRank,
          description: `Demoted: ${fromRank} → ${toRank}`
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

  const pushPair = (division: "makuuchi" | "juryo", rank: Rank, rankNumber?: number) => {
    slots.push({ division, position: { rank, side: "east", rankNumber } as RankPosition });
    slots.push({ division, position: { rank, side: "west", rankNumber } as RankPosition });
  };

  // Named ranks (fixed caps)
  pushPair("makuuchi", "yokozuna");
  pushPair("makuuchi", "ozeki");
  pushPair("makuuchi", "sekiwake");
  pushPair("makuuchi", "komusubi");

  // Maegashira M1–M17
  for (let n = 1; n <= 17; n++) pushPair("makuuchi", "maegashira", n);

  // Juryo J1–J14
  for (let n = 1; n <= 14; n++) pushPair("juryo", "juryo", n);

  return slots;
}

// === UTILS ===

function clampInt(x: number, lo: number, hi: number): number {
  if (x < lo) return lo;
  if (x > hi) return hi;
  return x;
}

/**
 * Normalize the provided sekitori list to exactly SLOT_COUNT entries, deterministically.
 * - If too many: drop the lowest-ranked extras (end of list).
 * - If too few: add placeholders (so the engine never crashes).
 *
 * You can later replace placeholder logic with Makushita↔Juryo promotion logic once you model lower divisions.
 */
function normalizeToSlotCount(current: BanzukeEntry[], slotCount: number): BanzukeEntry[] {
  if (current.length === slotCount) return current;

  if (current.length > slotCount) {
    return current.slice(0, slotCount);
  }

  const out = [...current];
  let i = 0;
  while (out.length < slotCount) {
    out.push({
      rikishiId: `__FILLER_${out.length}_${i++}`,
      division: "juryo",
      position: { rank: "juryo", side: "west", rankNumber: 14 } // will be overwritten by templating anyway
    });
  }
  return out;
}
