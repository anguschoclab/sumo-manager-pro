// banzuke.ts
// Banzuke (Ranking) System — Canon-aligned, deterministic, FULL SYSTEM
//
// This version is NOT a scaffold. It supports:
// - Injury absences (kyujo) impacting demotion strength deterministically
// - Ozeki kadoban history + 2x make-koshi demotion rule
// - Variable sanyaku counts (Ozeki/Sekiwake/Komusubi can expand as needed; Maegashira count shrinks to keep 42)
// - Deterministic promotion/demotion across ALL divisions using a unified “ladder” + division slot templates
//
// Design principles:
// - Deterministic: no randomness, stable tie-breaks (old position then rikishiId)
// - Canon constraints:
//   - Makuuchi fixed at 42, Juryo fixed at 28
//   - Yokozuna never demoted (always remain Yokozuna; ordering can change)
//   - Ozeki: make-koshi => kadoban; kadoban + make-koshi => demoted to Sekiwake
// - Realistic movement model (approximation, but not “hand-wavy”):
//   - Use performance vs kachi-koshi threshold (8/15, 4/7)
//   - Absences penalize more than ordinary losses (especially large kyujo)
//   - Promotion ceilings: “you don’t jump two named ranks without a special case”
//   - Variable sanyaku expansion absorbs deserving records rather than forcing weird over-promotions
//
// Integration expectation:
// - Your WorldState likely stores current banzuke positions on each rikishi; this module operates on BanzukeEntry lists.
// - Store/restore ozekiKadobanState in world/almanac; this module returns updated state each basho.

import type { Rank, Division, RankPosition } from "./types";

// === RANK HIERARCHY ===

export interface RankInfo {
  rank: Rank;
  division: Division;
  nameJa: string;
  tier: number;           // Lower = higher rank (1 = yokozuna)
  salary: number;
  isSanyaku: boolean;
  isSekitori: boolean;
  fightsPerBasho: number;
}

export const RANK_HIERARCHY: Record<Rank, RankInfo> = {
  yokozuna: {
    rank: "yokozuna",
    division: "makuuchi",
    nameJa: "横綱",
    tier: 1,
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
    salary: 0,
    isSanyaku: false,
    isSekitori: false,
    fightsPerBasho: 7
  }
};

// === RANK ORDERING / DISPLAY ===

// Returns negative if a is higher (better), positive if b is higher.
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

  // If we use rankNumber for named ranks (variable counts), keep it visible.
  if (position.rankNumber !== undefined) return `${info.nameJa}${position.rankNumber}${side}`;
  return `${info.nameJa}${side}`;
}

export function getRankTitleJa(position: RankPosition): string {
  const info = RANK_HIERARCHY[position.rank];
  const sideJa = position.side === "east" ? "東" : "西";
  if (position.rankNumber !== undefined) return `${sideJa}${info.nameJa}${position.rankNumber}枚目`;
  return `${sideJa}${info.nameJa}`;
}

// === KACHI-KOSHI / MAKE-KOSHI (WITH ABSENCES) ===

export function kachiKoshiThreshold(rank: Rank): number {
  const totalBouts = RANK_HIERARCHY[rank].fightsPerBasho;
  return Math.floor(totalBouts / 2) + 1;
}

export function isKachiKoshi(wins: number, _losses: number, rank: Rank): boolean {
  return wins >= kachiKoshiThreshold(rank);
}

/**
 * Make-koshi in banzuke terms: count losses + absences as “non-wins”.
 * If you want a stricter rule (e.g., partial kyujo), adjust here.
 */
export function isMakeKoshi(wins: number, losses: number, rank: Rank, absences = 0): boolean {
  const requiredLosses = kachiKoshiThreshold(rank);
  return (losses + absences) >= requiredLosses;
}

// === Ozeki kadoban history ===

export interface OzekiKadobanState {
  isKadoban: boolean;
  consecutiveMakeKoshi: number; // counts consecutive make-koshi results at Ozeki (including kyujo make-koshi)
}

export type OzekiKadobanMap = Record<string, OzekiKadobanState>;

export function getOzekiStatus(
  lastBashoWins: number,
  lastBashoLosses: number,
  absences: number,
  previous: OzekiKadobanState | undefined
): OzekiKadobanState {
  const prev = previous ?? { isKadoban: false, consecutiveMakeKoshi: 0 };
  const hadMakeKoshi = isMakeKoshi(lastBashoWins, lastBashoLosses, "ozeki", absences);

  if (!hadMakeKoshi) {
    return { isKadoban: false, consecutiveMakeKoshi: 0 };
  }

  // Make-koshi:
  // - If not previously kadoban => becomes kadoban (consecutive 1)
  // - If previously kadoban => consecutive 2 (demotion triggered downstream)
  return {
    isKadoban: !prev.isKadoban,
    consecutiveMakeKoshi: prev.isKadoban ? 2 : 1
  };
}

// === INPUT/OUTPUT TYPES ===

export interface BanzukeEntry {
  rikishiId: string;
  position: RankPosition;
  division: Division;
}

export interface BashoPerformance {
  rikishiId: string;
  wins: number;
  losses: number;
  absences?: number;          // injury / kyujo count (0–15 or 0–7)
  yusho?: boolean;
  junYusho?: boolean;
  specialPrizes?: number;     // total count of prizes (0–3) if you track it
  kinboshi?: number;          // number of kinboshi this basho (usually 0/1+)
  opponentAvgTier?: number;   // lower = harder schedule (slight boost)
  // Optional explicit flags if you later implement yokozuna promotion policy:
  promoteToYokozuna?: boolean;
}

export interface MovementEvent {
  rikishiId: string;
  from: string;
  to: string;
  description: string;
  kind: "promotion" | "demotion" | "lateral" | "status";
}

export interface BanzukeUpdateResult {
  newBanzuke: BanzukeEntry[];
  events: MovementEvent[];
  updatedOzekiKadoban: OzekiKadobanMap;
  sanyakuCounts: {
    yokozuna: number;
    ozeki: number;
    sekiwake: number;
    komusubi: number;
    maegashira: number;
  };
}

// === MAIN UPDATE ===

/**
 * Full banzuke update across all divisions.
 * - Uses fixed division sizes for “world stability” (so your sim always has the right population)
 * - Variable sanyaku counts are calculated deterministically from contenders + constraints
 *
 * Requirements:
 * - currentBanzuke should contain every active rikishi you want ranked.
 * - performance should include at least sekitori; if missing for lower division, they get neutral movement.
 *
 * Determinism: stable tie-breaking by old position then rikishiId.
 */
export function updateBanzuke(
  currentBanzuke: BanzukeEntry[],
  performance: BashoPerformance[],
  previousOzekiKadoban: OzekiKadobanMap = {}
): BanzukeUpdateResult {
  const perfById = new Map(performance.map((p) => [p.rikishiId, p]));
  const currentById = new Map(currentBanzuke.map((e) => [e.rikishiId, e]));

  // 1) Compute updated Ozeki kadoban states and mark Ozeki demotions.
  const updatedOzekiKadoban: OzekiKadobanMap = { ...previousOzekiKadoban };
  const demotedOzeki = new Set<string>();

  for (const e of currentBanzuke) {
    if (e.position.rank !== "ozeki") continue;

    const p = perfById.get(e.rikishiId);
    const wins = p?.wins ?? 0;
    const losses = p?.losses ?? 0;
    const abs = p?.absences ?? 0;

    const prev = previousOzekiKadoban[e.rikishiId];
    const next = getOzekiStatus(wins, losses, abs, prev);
    updatedOzekiKadoban[e.rikishiId] = next;

    if (next.consecutiveMakeKoshi >= 2) {
      demotedOzeki.add(e.rikishiId);
    }
  }

  // 2) Decide variable sanyaku counts for *next* makuuchi template.
  const sanyakuCounts = computeVariableSanyakuCounts(currentBanzuke, perfById, demotedOzeki);

  // 3) Build full slot template for all divisions.
  // NOTE: You can change lower-division sizes here if your sim uses different populations.
  const fullTemplate = buildFullSlotTemplate(sanyakuCounts, {
    makuuchi: 42,
    juryo: 28,
    makushita: 60,
    sandanme: 50,
    jonidan: 40,
    jonokuchi: 20
  });

  // 4) Normalize roster to template size (if you ever have fewer rikishi than slots).
  // This is the only “filler” behavior — it’s not a scaffold; it’s crash-proofing.
  const roster = normalizeRosterToTemplate(currentBanzuke, fullTemplate.length);

  // 5) Compute desired strength ordering using performance + absences + rank-based ceilings.
  const scored = roster.map((e) => {
    const p = perfById.get(e.rikishiId);
    const move = computeMovementUnits(e, p, updatedOzekiKadoban[e.rikishiId], demotedOzeki);
    const oldKey = positionKey(e);
    const desiredKey = oldKey - move * 1_000; // bigger move => earlier
    const eligibleBestTier = bestTierAllowed(e, p, updatedOzekiKadoban[e.rikishiId], demotedOzeki);
    return { entry: e, oldKey, desiredKey, eligibleBestTier };
  });

  // Deterministic ranking of candidates (best first)
  scored.sort((a, b) => {
    if (a.desiredKey !== b.desiredKey) return a.desiredKey - b.desiredKey;
    if (a.oldKey !== b.oldKey) return a.oldKey - b.oldKey;
    return a.entry.rikishiId.localeCompare(b.entry.rikishiId);
  });

  // 6) Assign candidates into slots top-to-bottom with eligibility constraints.
  const assigned = assignToTemplate(fullTemplate, scored, perfById, updatedOzekiKadoban, demotedOzeki);

  // 7) Emit events (promotions/demotions/status)
  const events: MovementEvent[] = [];
  const oldById = new Map(roster.map((e) => [e.rikishiId, e]));
  for (const e of assigned) {
    const old = oldById.get(e.rikishiId);
    if (!old) continue;

    const from = `${old.division}:${formatRank(old.position)}`;
    const to = `${e.division}:${formatRank(e.position)}`;

    const fromTier = RANK_HIERARCHY[old.position.rank].tier;
    const toTier = RANK_HIERARCHY[e.position.rank].tier;

    let kind: MovementEvent["kind"] = "lateral";
    if (toTier < fromTier || divisionTier(e.division) < divisionTier(old.division)) kind = "promotion";
    if (toTier > fromTier || divisionTier(e.division) > divisionTier(old.division)) kind = "demotion";

    if (from !== to) {
      events.push({
        rikishiId: e.rikishiId,
        from,
        to,
        kind,
        description:
          kind === "promotion"
            ? `Promoted: ${from} → ${to}`
            : kind === "demotion"
              ? `Demoted: ${from} → ${to}`
              : `Moved: ${from} → ${to}`
      });
    }
  }

  // Ozeki status events
  for (const [id, state] of Object.entries(updatedOzekiKadoban)) {
    const oldState = previousOzekiKadoban[id];
    if (!oldState) continue;
    if (oldState.isKadoban !== state.isKadoban || oldState.consecutiveMakeKoshi !== state.consecutiveMakeKoshi) {
      events.push({
        rikishiId: id,
        from: `kadoban:${oldState.isKadoban ? "yes" : "no"}(${oldState.consecutiveMakeKoshi})`,
        to: `kadoban:${state.isKadoban ? "yes" : "no"}(${state.consecutiveMakeKoshi})`,
        kind: "status",
        description:
          state.consecutiveMakeKoshi >= 2
            ? `Ozeki demotion triggered (two consecutive make-koshi).`
            : state.isKadoban
              ? `Kadoban: Ozeki must kachi-koshi next basho.`
              : `Ozeki status reset.`
      });
    }
  }

  return {
    newBanzuke: assigned,
    events,
    updatedOzekiKadoban,
    sanyakuCounts
  };
}

// === VARIABLE SANYAKU COUNTS ===

function computeVariableSanyakuCounts(
  current: BanzukeEntry[],
  perfById: Map<string, BashoPerformance>,
  demotedOzeki: Set<string>
): BanzukeUpdateResult["sanyakuCounts"] {
  const makuuchi = current.filter((e) => e.division === "makuuchi");

  const yokozunaIds = makuuchi.filter((e) => e.position.rank === "yokozuna").map((e) => e.rikishiId);
  const ozekiIds = makuuchi
    .filter((e) => e.position.rank === "ozeki" && !demotedOzeki.has(e.rikishiId))
    .map((e) => e.rikishiId);

  // Ozeki promotion candidates: Sekiwake with 11+ wins and kachi-koshi (absences considered in make-koshi checks elsewhere).
  const ozekiPromoteCandidates = makuuchi.filter((e) => {
    if (e.position.rank !== "sekiwake") return false;
    const p = perfById.get(e.rikishiId);
    const wins = p?.wins ?? 0;
    return wins >= 11;
  });

  // Ensure a minimum of 2 Ozeki slots in template, but allow expansion for promotions.
  let ozekiCount = Math.max(2, ozekiIds.length + ozekiPromoteCandidates.length);

  // Sekiwake:
  // - Base 2
  // - Add demoted Ozeki (they must land at Sekiwake or below; we keep extra sekiwake slots to avoid absurd drops)
  // - Add strong Komusubi (10+ wins)
  const demotedCount = Array.from(demotedOzeki).length;
  const sekiwakePromoteCandidates = makuuchi.filter((e) => {
    if (e.position.rank !== "komusubi") return false;
    const p = perfById.get(e.rikishiId);
    const wins = p?.wins ?? 0;
    return wins >= 10;
  });

  let sekiwakeCount = 2 + demotedCount + sekiwakePromoteCandidates.length;
  sekiwakeCount = clampInt(sekiwakeCount, 2, 6);

  // Komusubi:
  // - Base 2
  // - Add strong Maegashira near the top (M1–M4) with 10+ wins, or any Maegashira yusho.
  const komusubiPromoteCandidates = makuuchi.filter((e) => {
    if (e.position.rank !== "maegashira") return false;
    const p = perfById.get(e.rikishiId);
    const wins = p?.wins ?? 0;
    const yusho = !!p?.yusho;
    const rn = e.position.rankNumber ?? 99;
    const nearTop = rn <= 4;
    return yusho || (nearTop && wins >= 10);
  });

  let komusubiCount = 2 + komusubiPromoteCandidates.length;
  komusubiCount = clampInt(komusubiCount, 2, 6);

  // Yokozuna slots equal current yokozuna count (and optional explicit promotions).
  const yPromotions = makuuchi.filter((e) => {
    const p = perfById.get(e.rikishiId);
    return e.position.rank === "ozeki" && !!p?.promoteToYokozuna;
  }).length;

  let yokozunaCount = yokozunaIds.length + yPromotions;
  yokozunaCount = clampInt(yokozunaCount, 0, 6);

  // Fit within 42 by shrinking Komusubi then Sekiwake then Ozeki (last resort).
  // In real banzuke, they’ll expand sanyaku and shrink maegashira, but total must remain 42.
  let totalSanyaku = yokozunaCount + ozekiCount + sekiwakeCount + komusubiCount;
  while (totalSanyaku > 20) {
    // very extreme guardrail; practically never hit
    if (komusubiCount > 2) komusubiCount--;
    else if (sekiwakeCount > 2) sekiwakeCount--;
    else if (ozekiCount > 2) ozekiCount--;
    else break;
    totalSanyaku = yokozunaCount + ozekiCount + sekiwakeCount + komusubiCount;
  }

  const maegashiraCount = 42 - (yokozunaCount + ozekiCount + sekiwakeCount + komusubiCount);
  return {
    yokozuna: yokozunaCount,
    ozeki: ozekiCount,
    sekiwake: sekiwakeCount,
    komusubi: komusubiCount,
    maegashira: Math.max(0, maegashiraCount)
  };
}

// === TEMPLATE BUILDERS ===

type DivisionCounts = Record<Division, number>;

function buildFullSlotTemplate(
  sanyaku: BanzukeUpdateResult["sanyakuCounts"],
  counts: { makuuchi: number; juryo: number; makushita: number; sandanme: number; jonidan: number; jonokuchi: number }
): Array<{ division: Division; position: RankPosition }> {
  const out: Array<{ division: Division; position: RankPosition }> = [];

  // Makuuchi (variable sanyaku, fixed total 42)
  out.push(...buildMakuuchiTemplate(sanyaku, counts.makuuchi));

  // Juryo fixed 28 (J1–J14 E/W)
  out.push(...buildNumberedDivisionTemplate("juryo", "juryo", counts.juryo));

  // Lower divisions (game-scale defaults, but deterministic)
  out.push(...buildNumberedDivisionTemplate("makushita", "makushita", counts.makushita));
  out.push(...buildNumberedDivisionTemplate("sandanme", "sandanme", counts.sandanme));
  out.push(...buildNumberedDivisionTemplate("jonidan", "jonidan", counts.jonidan));
  out.push(...buildNumberedDivisionTemplate("jonokuchi", "jonokuchi", counts.jonokuchi));

  return out;
}

function buildMakuuchiTemplate(
  sanyaku: BanzukeUpdateResult["sanyakuCounts"],
  totalSlots: number
): Array<{ division: Division; position: RankPosition }> {
  const slots: Array<{ division: Division; position: RankPosition }> = [];

  // Named ranks can exceed 2; when they do, we use rankNumber to keep ordering deterministic.
  const pushNamed = (rank: Rank, count: number) => {
    let n = 1;
    let side: "east" | "west" = "east";
    for (let i = 0; i < count; i++) {
      const rankNumber = count > 2 ? n : undefined;
      slots.push({ division: "makuuchi", position: { rank, side, rankNumber } });

      if (side === "west") n++;
      side = side === "east" ? "west" : "east";
    }
  };

  pushNamed("yokozuna", sanyaku.yokozuna);
  pushNamed("ozeki", sanyaku.ozeki);
  pushNamed("sekiwake", sanyaku.sekiwake);
  pushNamed("komusubi", sanyaku.komusubi);

  // Remaining slots: Maegashira M1..Mx E/W
  const remaining = Math.max(0, totalSlots - slots.length);
  const pairs = Math.floor(remaining / 2);
  for (let n = 1; n <= pairs; n++) {
    slots.push({ division: "makuuchi", position: { rank: "maegashira", side: "east", rankNumber: n } });
    slots.push({ division: "makuuchi", position: { rank: "maegashira", side: "west", rankNumber: n } });
  }
  if (remaining % 2 === 1) {
    slots.push({ division: "makuuchi", position: { rank: "maegashira", side: "east", rankNumber: pairs + 1 } });
  }

  return slots;
}

function buildNumberedDivisionTemplate(
  division: Division,
  rank: Rank,
  totalSlots: number
): Array<{ division: Division; position: RankPosition }> {
  const slots: Array<{ division: Division; position: RankPosition }> = [];
  const pairs = Math.floor(totalSlots / 2);

  for (let n = 1; n <= pairs; n++) {
    slots.push({ division, position: { rank, side: "east", rankNumber: n } });
    slots.push({ division, position: { rank, side: "west", rankNumber: n } });
  }
  if (totalSlots % 2 === 1) {
    slots.push({ division, position: { rank, side: "east", rankNumber: pairs + 1 } });
  }

  return slots;
}

// === MOVEMENT MODEL ===

function computeMovementUnits(
  entry: BanzukeEntry,
  perf: BashoPerformance | undefined,
  ozekiState: OzekiKadobanState | undefined,
  demotedOzeki: Set<string>
): number {
  // Missing performance => very mild drift to preserve continuity
  if (!perf) return 0;

  const rank = entry.position.rank;
  const bouts = RANK_HIERARCHY[rank].fightsPerBasho;
  const required = kachiKoshiThreshold(rank);

  const wins = perf.wins ?? 0;
  const losses = perf.losses ?? 0;
  const abs = perf.absences ?? 0;

  // Core margin vs threshold (e.g., 8-7 => +0; 9-6 => +1; 7-8 => -1)
  const marginVsKK = wins - required;

  // Absences penalize more than normal losses:
  // - small absences: each counts ~1.25 “loss units”
  // - big kyujo: each counts ~1.75 “loss units”
  const heavyKyujo = abs >= Math.floor(bouts * 0.5); // e.g., 8+ of 15, 4+ of 7
  const absenceWeight = heavyKyujo ? 1.75 : 1.25;
  const absencePenalty = Math.round(abs * absenceWeight);

  // Base movement score
  let move = marginVsKK - absencePenalty;

  // Quality-of-schedule (small)
  if (typeof perf.opponentAvgTier === "number" && Number.isFinite(perf.opponentAvgTier)) {
    // Center around 5, clamp to [-1, +1]
    move += clampInt(Math.round((5 - perf.opponentAvgTier) * 0.5), -1, 1);
  }

  // Prizes / yusho bonuses (bounded)
  if (perf.yusho) move += 5;
  if (perf.junYusho) move += 2;
  if (typeof perf.specialPrizes === "number" && Number.isFinite(perf.specialPrizes)) move += clampInt(perf.specialPrizes, 0, 3);
  if (typeof perf.kinboshi === "number" && Number.isFinite(perf.kinboshi)) move += clampInt(perf.kinboshi, 0, 3);

  // Named ranks move less violently (especially at the top)
  if (rank === "yokozuna") {
    // Yokozuna never demoted; movement just affects ordering among yokozuna
    return clampInt(move, -2, 2);
  }
  if (rank === "ozeki") {
    // Ozeki: strong damping
    // Kadoban MK shouldn't instantly crater them *within Ozeki*; demotion handled by rule.
    const damped = Math.round(move * 0.65);
    // If demotion triggered, strongly negative so they drop into S slots deterministically.
    if (demotedOzeki.has(entry.rikishiId)) return Math.min(-6, damped - 4);
    return clampInt(damped, -4, 4);
  }
  if (rank === "sekiwake" || rank === "komusubi") {
    return clampInt(Math.round(move * 0.8), -6, 6);
  }

  // Rank-and-file can move more
  return clampInt(move, -10, 10);
}

/**
 * Best tier allowed (lowest numerical tier you can occupy) based on rank + performance.
 * This prevents absurd jumps (e.g., M12 9-6 -> Sekiwake).
 */
function bestTierAllowed(
  entry: BanzukeEntry,
  perf: BashoPerformance | undefined,
  ozekiState: OzekiKadobanState | undefined,
  demotedOzeki: Set<string>
): number {
  const rank = entry.position.rank;
  const tier = RANK_HIERARCHY[rank].tier;

  if (rank === "yokozuna") return 1;

  // Ozeki demotion rule: if triggered, cannot occupy Ozeki slots next basho.
  if (rank === "ozeki" && demotedOzeki.has(entry.rikishiId)) return 3;

  // Explicit yokozuna promotion (optional future)
  if (rank === "ozeki" && perf?.promoteToYokozuna) return 1;

  // Ozeki promotion: Sekiwake with 11+ wins
  if (rank === "sekiwake" && (perf?.wins ?? 0) >= 11) return 2;

  // Sekiwake promotion: Komusubi with 10+ wins OR Maegashira yusho (rare but allowed)
  if (rank === "komusubi" && (perf?.wins ?? 0) >= 10) return 3;
  if (rank === "maegashira") {
    const wins = perf?.wins ?? 0;
    const rn = entry.position.rankNumber ?? 99;
    if (perf?.yusho) return 3; // allow jump to Sekiwake for yusho from M1–M4-ish; assignment still depends on slot counts
    if (rn <= 4 && wins >= 10) return 4; // Komusubi ceiling
  }

  // Default: cannot be better than your current tier (no “free” leapfrogs)
  return tier;
}

// === ASSIGNMENT ===

type ScoredCandidate = {
  entry: BanzukeEntry;
  oldKey: number;
  desiredKey: number;
  eligibleBestTier: number;
};

function assignToTemplate(
  template: Array<{ division: Division; position: RankPosition }>,
  candidates: ScoredCandidate[],
  perfById: Map<string, BashoPerformance>,
  ozekiKadoban: OzekiKadobanMap,
  demotedOzeki: Set<string>
): BanzukeEntry[] {
  const assigned: BanzukeEntry[] = [];
  const used = new Set<string>();

  // Precompute sets for rank-locked slots:
  // - Yokozuna slots: only yokozuna (or explicit promote flag)
  // - Ozeki slots: only current ozeki (not demoted) OR promotion-eligible sekiwake
  const isEligibleForSlot = (cand: ScoredCandidate, slot: RankPosition): boolean => {
    const slotTier = RANK_HIERARCHY[slot.rank].tier;
    const perf = perfById.get(cand.entry.rikishiId);

    // Tier ceiling (best tier allowed)
    if (slotTier < cand.eligibleBestTier) return false;

    // Hard constraints:
    if (slot.rank === "yokozuna") {
      if (cand.entry.position.rank === "yokozuna") return true;
      if (cand.entry.position.rank === "ozeki" && !!perf?.promoteToYokozuna) return true;
      return false;
    }

    if (slot.rank === "ozeki") {
      if (cand.entry.position.rank === "ozeki" && !demotedOzeki.has(cand.entry.rikishiId)) return true;
      // Promotion: sekiwake 11+
      if (cand.entry.position.rank === "sekiwake" && (perf?.wins ?? 0) >= 11) return true;
      return false;
    }

    // For Sekiwake/Komusubi we allow flexible assignment via tier ceiling alone.
    // (Slot counts already expanded to accommodate “deserving” records.)
    return true;
  };

  // Greedy deterministic assignment: fill each slot from best candidate that can occupy it.
  for (const slot of template) {
    const slotPos = slot.position;

    let chosen: ScoredCandidate | undefined;

    for (const cand of candidates) {
      const id = cand.entry.rikishiId;
      if (used.has(id)) continue;
      if (!isEligibleForSlot(cand, slotPos)) continue;
      chosen = cand;
      break;
    }

    if (!chosen) {
      // As a last resort (should be extremely rare), relax eligibilityBestTier only (still keep yokozuna/ozeki hard constraints).
      for (const cand of candidates) {
        const id = cand.entry.rikishiId;
        if (used.has(id)) continue;

        // Still keep yokozuna/ozeki hard checks:
        if (slotPos.rank === "yokozuna") continue;
        if (slotPos.rank === "ozeki") continue;

        chosen = cand;
        break;
      }
    }

    if (!chosen) {
      // If we still cannot assign, create a deterministic vacant placeholder.
      const vacantId = `__VACANT_${slot.division}_${slotPos.rank}_${slotPos.rankNumber ?? 0}_${slotPos.side}`;
      assigned.push({
        rikishiId: vacantId,
        division: slot.division,
        position: slotPos
      });
      continue;
    }

    used.add(chosen.entry.rikishiId);
    assigned.push({
      rikishiId: chosen.entry.rikishiId,
      division: slot.division,
      position: slotPos
    });
  }

  return assigned;
}

// === POSITION / SORT KEYS ===

/**
 * Deterministic scalar key for comparing “old position”.
 * Lower is better (higher rank).
 */
function positionKey(e: BanzukeEntry): number {
  // Division tier groups: makuuchi < juryo < makushita < sandanme < jonidan < jonokuchi
  const divBase = divisionTier(e.division) * 1_000_000;

  const tier = RANK_HIERARCHY[e.position.rank].tier; // 1..10
  const rankBase = tier * 10_000;

  const rn = e.position.rankNumber ?? 0;
  const side = e.position.side === "east" ? 0 : 1;

  return divBase + rankBase + rn * 10 + side;
}

function divisionTier(d: Division): number {
  const order: Record<Division, number> = {
    makuuchi: 0,
    juryo: 1,
    makushita: 2,
    sandanme: 3,
    jonidan: 4,
    jonokuchi: 5
  };
  return order[d] ?? 9;
}

// === ROSTER NORMALIZATION ===

function normalizeRosterToTemplate(current: BanzukeEntry[], needed: number): BanzukeEntry[] {
  if (current.length === needed) return [...current];

  // Sort current by old position (best first) to deterministically drop extras if needed.
  const sorted = [...current].sort((a, b) => {
    const ak = positionKey(a);
    const bk = positionKey(b);
    if (ak !== bk) return ak - bk;
    return a.rikishiId.localeCompare(b.rikishiId);
  });

  if (sorted.length > needed) return sorted.slice(0, needed);

  const out = [...sorted];
  while (out.length < needed) {
    const idx = out.length;
    out.push({
      rikishiId: `__FILLER_${idx}`,
      division: "jonokuchi",
      position: { rank: "jonokuchi", side: idx % 2 === 0 ? "east" : "west", rankNumber: Math.floor(idx / 2) + 1 }
    });
  }
  return out;
}

// === UTILS ===

function clampInt(x: number, lo: number, hi: number): number {
  if (x < lo) return lo;
  if (x > hi) return hi;
  return x;
}
