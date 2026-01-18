// economics.ts
// Sumo Economics System - Kensho, salaries, and retirement funds
//
// FIXES APPLIED (compile + type-safety + canon):
// - Removed `as any` from allowance lookup by making a typed allowance map.
// - Added compile-time split sanity check helper + runtime guard for split sum.
// - Made basho bonus include kinboshi bump deterministically (optional arg).
// - Added prize payout helpers that correctly update both totalEarnings and currentBashoEarnings.
// - Fixed the createKenshoRecord amount to reflect *immediatePayment* only (as you intended) but now explicit.
// - Added clamps and finite checks everywhere that matters.
// - Kept everything deterministic (no RNG).

import type { Rank, RikishiEconomics, KenshoRecord, BashoName, Division } from "./types";
import { RANK_HIERARCHY } from "./banzuke";

// === INTERNAL UTILS ===
const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));
const clamp0 = (n: number) => Math.max(0, n);
const isFiniteNumber = (n: number) => Number.isFinite(n);

type NonSekitoriRank = Exclude<Rank, "yokozuna" | "ozeki" | "sekiwake" | "komusubi" | "maegashira" | "juryo">;

// === KENSHO (SPONSOR BANNERS) SYSTEM ===

/**
 * Kensho banner split (game constants).
 * NOTE: Real-world values can change; this is your game’s canon constant set.
 */
export const KENSHO_CONFIG = {
  totalValue: 70_000,           // total per banner
  winnerReceives: 30_000,       // immediate cash to winner
  toRetirementFund: 30_000,     // saved into retirement fund
  associationFee: 10_000,       // to association (sink)

  baseKenshoPerBout: {
    yokozuna: 15,
    ozeki: 10,
    sekiwake: 5,
    komusubi: 4,
    maegashira: 2,
    juryo: 1,
    makushita: 0,
    sandanme: 0,
    jonidan: 0,
    jonokuchi: 0
  } as Record<Rank, number>,

  popularityMultiplier: {
    low: 0.5,
    medium: 1.0,
    high: 1.5,
    superstar: 2.0
  }
} as const;

// Sanity check: keep this true forever.
export const KENSHO_SPLIT_SUM =
  KENSHO_CONFIG.winnerReceives + KENSHO_CONFIG.toRetirementFund + KENSHO_CONFIG.associationFee;

// Runtime guard (won’t throw in production unless you want it to)
export function assertKenshoSplitValid(): boolean {
  return KENSHO_SPLIT_SUM === KENSHO_CONFIG.totalValue;
}

/**
 * Calculate expected banner count for a bout.
 * Returns an integer banner count (not Yen).
 */
export function calculateBoutKensho(
  eastRank: Rank,
  westRank: Rank,
  eastPopularity = 50,
  westPopularity = 50,
  isMusubi = false,
  isPlayoff = false,
  day = 1
): number {
  const baseEast = KENSHO_CONFIG.baseKenshoPerBout[eastRank] ?? 0;
  const baseWest = KENSHO_CONFIG.baseKenshoPerBout[westRank] ?? 0;

  let baseKensho = Math.max(baseEast, baseWest) + Math.min(baseEast, baseWest) * 0.5;

  const avgPopularity = (eastPopularity + westPopularity) / 2;
  let popMod = KENSHO_CONFIG.popularityMultiplier.medium;
  if (avgPopularity >= 80) popMod = KENSHO_CONFIG.popularityMultiplier.superstar;
  else if (avgPopularity >= 60) popMod = KENSHO_CONFIG.popularityMultiplier.high;
  else if (avgPopularity >= 40) popMod = KENSHO_CONFIG.popularityMultiplier.medium;
  else popMod = KENSHO_CONFIG.popularityMultiplier.low;

  baseKensho *= popMod;

  if (isMusubi) baseKensho *= 1.5;
  if (isPlayoff) baseKensho *= 3.0;
  if (day === 15) baseKensho *= 1.3;

  return clamp0(Math.round(baseKensho));
}

export interface KenshoPayout {
  kenshoCount: number;
  immediatePayment: number;
  toRetirement: number;
  associationFee: number;
  totalValue: number;
}

/**
 * Convert banner count into yen split.
 */
export function splitKensho(kenshoCount: number): KenshoPayout {
  const count = clamp0(Math.floor(isFiniteNumber(kenshoCount) ? kenshoCount : 0));
  const immediatePayment = count * KENSHO_CONFIG.winnerReceives;
  const toRetirement = count * KENSHO_CONFIG.toRetirementFund;
  const associationFee = count * KENSHO_CONFIG.associationFee;
  const totalValue = count * KENSHO_CONFIG.totalValue;
  return { kenshoCount: count, immediatePayment, toRetirement, associationFee, totalValue };
}

/**
 * Apply kensho payout to a rikishi’s economics (deterministic).
 * (Association fee is not tracked on rikishi; it’s a sink.)
 */
export function applyKenshoWinToEconomics(payout: KenshoPayout, currentEconomics: RikishiEconomics): RikishiEconomics {
  return {
    ...currentEconomics,
    careerKenshoWon: clamp0(currentEconomics.careerKenshoWon + payout.kenshoCount),
    retirementFund: clamp0(currentEconomics.retirementFund + payout.toRetirement),
    totalEarnings: clamp0(currentEconomics.totalEarnings + payout.immediatePayment + payout.toRetirement),
    currentBashoEarnings: clamp0(currentEconomics.currentBashoEarnings + payout.immediatePayment + payout.toRetirement)
  };
}

/**
 * Backwards-compatible wrapper (matches your old signature).
 */
export function processKenshoWin(
  kenshoCount: number,
  currentEconomics: RikishiEconomics
): { immediatePayment: number; toRetirement: number; updatedEconomics: RikishiEconomics } {
  const payout = splitKensho(kenshoCount);
  return {
    immediatePayment: payout.immediatePayment,
    toRetirement: payout.toRetirement,
    updatedEconomics: applyKenshoWinToEconomics(payout, currentEconomics)
  };
}

// === SALARY SYSTEM ===

export const SALARY_CONFIG = {
  allowances: {
    makushita: 150_000,
    sandanme: 100_000,
    jonidan: 80_000,
    jonokuchi: 70_000
  } as const satisfies Record<NonSekitoriRank, number>,

  bashoBonus: 1.0,
  yearEndBonus: 2.0,

  prizes: {
    yusho: {
      makuuchi: 10_000_000,
      juryo: 2_000_000,
      makushita: 500_000,
      sandanme: 300_000,
      jonidan: 200_000,
      jonokuchi: 100_000
    },
    junYusho: 2_000_000,
    ginoSho: 2_000_000,
    kantosho: 2_000_000,
    shukunsho: 2_000_000,
    kinboshi: 100_000
  }
} as const;

export function calculateMonthlyIncome(rank: Rank): number {
  const info = RANK_HIERARCHY[rank];
  if (info.isSekitori) return info.salary;

  // Non-sekitori allowance only
  const allowance = SALARY_CONFIG.allowances[rank as NonSekitoriRank];
  return allowance ?? 70_000;
}

/**
 * Basho bonus (sekitori only).
 * Optional: pass kinboshiCount to include the lifetime bump deterministically.
 */
export function calculateBashoBonus(rank: Rank, wins: number, kinboshiCount = 0): number {
  const info = RANK_HIERARCHY[rank];
  if (!info.isSekitori) return 0;

  let bonus = info.salary * SALARY_CONFIG.bashoBonus;

  const expectedWins = info.fightsPerBasho / 2;
  const performanceMod = 1 + (wins - expectedWins) * 0.05;

  // Kinboshi bump: ¥4,000 added to each future basho bonus per kinboshi (canon from your design)
  const kinboshiBump = clamp0(Math.floor(kinboshiCount)) * 4_000;

  return Math.round(bonus * Math.max(0.5, performanceMod) + kinboshiBump);
}

// === PRIZE MONEY HELPERS ===

export type SpecialPrize = "junYusho" | "ginoSho" | "kantosho" | "shukunsho";

export function getYushoPrize(division: Division): number {
  if (division === "makuuchi") return SALARY_CONFIG.prizes.yusho.makuuchi;
  if (division === "juryo") return SALARY_CONFIG.prizes.yusho.juryo;
  if (division === "makushita") return SALARY_CONFIG.prizes.yusho.makushita;
  if (division === "sandanme") return SALARY_CONFIG.prizes.yusho.sandanme;
  if (division === "jonidan") return SALARY_CONFIG.prizes.yusho.jonidan;
  return SALARY_CONFIG.prizes.yusho.jonokuchi;
}

export function applyPrizeToEconomics(amount: number, econ: RikishiEconomics): RikishiEconomics {
  const a = clamp0(Math.round(isFiniteNumber(amount) ? amount : 0));
  if (a === 0) return econ;
  return {
    ...econ,
    totalEarnings: clamp0(econ.totalEarnings + a),
    currentBashoEarnings: clamp0(econ.currentBashoEarnings + a)
  };
}

// === RETIREMENT FUND ===

export const RETIREMENT_CONFIG = {
  jsaContribution: {
    yokozuna: 500_000,
    ozeki: 400_000,
    sekiwake: 300_000,
    komusubi: 300_000,
    maegashira: 200_000,
    juryo: 150_000,
    makushita: 50_000,
    sandanme: 30_000,
    jonidan: 20_000,
    jonokuchi: 10_000
  } as const satisfies Record<Rank, number>,

  serviceBonus: 100_000,
  oyakataMinimum: 50_000_000
} as const;

export function calculateRetirementContribution(rank: Rank): number {
  return RETIREMENT_CONFIG.jsaContribution[rank] ?? 10_000;
}

export function estimateRetirementPayout(economics: RikishiEconomics, yearsAsSekitori: number): number {
  const years = clamp0(Math.floor(isFiniteNumber(yearsAsSekitori) ? yearsAsSekitori : 0));
  const serviceBonus = years * RETIREMENT_CONFIG.serviceBonus * 6; // 6 basho/year
  return clamp0(economics.retirementFund + serviceBonus);
}

// === KINBOSHI ===

export function isKinboshi(winnerRank: Rank, loserRank: Rank): boolean {
  return winnerRank === "maegashira" && loserRank === "yokozuna";
}

/**
 * Annualized value helper (for UI / projections).
 */
export function calculateKinboshiBonusAnnual(kinboshiCount: number): number {
  return clamp0(Math.floor(kinboshiCount)) * 4_000 * 6;
}

// === HEYA (STABLE) ECONOMICS ===

export const HEYA_CONFIG = {
  sekitoriSupport: 500_000,
  kenshoHeyaCut: 10_000,
  sponsorshipTiers: {
    low: 1_000_000,
    medium: 3_000_000,
    high: 7_000_000,
    elite: 15_000_000
  }
} as const;

export function calculateHeyaIncome(sekitoriCount: number, totalKenshoWon: number, prestige: number): number {
  const sekitoriIncome = clamp0(Math.floor(sekitoriCount)) * HEYA_CONFIG.sekitoriSupport;
  const kenshoIncome = clamp0(Math.floor(totalKenshoWon)) * HEYA_CONFIG.kenshoHeyaCut;

  let sponsorship = HEYA_CONFIG.sponsorshipTiers.low;
  if (prestige >= 80) sponsorship = HEYA_CONFIG.sponsorshipTiers.elite;
  else if (prestige >= 60) sponsorship = HEYA_CONFIG.sponsorshipTiers.high;
  else if (prestige >= 40) sponsorship = HEYA_CONFIG.sponsorshipTiers.medium;

  return sekitoriIncome + kenshoIncome + sponsorship;
}

// === CEREMONIES & COSTS ===

export const CEREMONY_COSTS = {
  yokozunaDohyoIri: 3_000_000,
  mawashiPurchase: 500_000,
  keshoMawashi: 1_000_000,
  retirementDanpatsushiki: 2_000_000
} as const;

// === INIT ===

export function initializeEconomics(): RikishiEconomics {
  return {
    retirementFund: 0,
    careerKenshoWon: 0,
    kinboshiCount: 0,
    totalEarnings: 0,
    currentBashoEarnings: 0,
    popularity: 30
  };
}

// === RECORDS ===

export function createKenshoRecord(
  bashoName: BashoName,
  day: number,
  opponentId: string,
  kenshoCount: number
): KenshoRecord {
  const payout = splitKensho(kenshoCount);
  return {
    bashoName,
    day,
    opponentId,
    kenshoCount: payout.kenshoCount,
    // amount is the immediate cash paid to winner (retirement part is tracked in economics)
    amount: payout.immediatePayment
  };
}

// === END-TO-END BOUT HELPERS ===

export interface BoutKenshoOutcome {
  payout: KenshoPayout;
  winnerEconomics: RikishiEconomics;
  winnerRecord: KenshoRecord | null;
  heyaCut: number; // yen
}

/**
 * Deterministic: process kensho for a single bout.
 * Caller applies heyaCut to heya treasury (if you track it).
 */
export function processBoutKenshoWin(args: {
  bashoName: BashoName;
  day: number;
  opponentId: string;
  kenshoCount: number;
  winnerEconomics: RikishiEconomics;
}): BoutKenshoOutcome {
  const payout = splitKensho(args.kenshoCount);
  const winnerEconomics = applyKenshoWinToEconomics(payout, args.winnerEconomics);
  const heyaCut = payout.kenshoCount * HEYA_CONFIG.kenshoHeyaCut;

  return {
    payout,
    winnerEconomics,
    winnerRecord: payout.kenshoCount > 0
      ? createKenshoRecord(args.bashoName, args.day, args.opponentId, payout.kenshoCount)
      : null,
    heyaCut
  };
}
