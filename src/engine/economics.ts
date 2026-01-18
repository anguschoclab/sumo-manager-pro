// Sumo Economics System - Kensho, salaries, and retirement funds
// Canon fixes applied:
// - No Math.random usage (none existed here, kept that way)
// - Kensho is processed as three-way split (winner cash / retirement / JSA fee) and totals reconcile
// - Added helper to process a bout’s kensho end-to-end (winner + heya cut + record)
// - Ensured economics updates also track currentBashoEarnings consistently
// - Fixed/clarified allowance typing (Rank-safe where possible)
// - Made kinboshi bonus semantics consistent (store count; payout should be applied by basho-bonus calc)
// - Added deterministic “kensho estimate” helpers but no RNG

import type { Rank, RikishiEconomics, KenshoRecord, BashoName } from "./types";
import { RANK_HIERARCHY } from "./banzuke";

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

  // Kensho attraction factors
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

  // Popularity modifier (0.5 - 2.0)
  popularityMultiplier: {
    low: 0.5,
    medium: 1.0,
    high: 1.5,
    superstar: 2.0
  }
};

// Sanity check: keep this true forever.
export const KENSHO_SPLIT_SUM = KENSHO_CONFIG.winnerReceives + KENSHO_CONFIG.toRetirementFund + KENSHO_CONFIG.associationFee;

/**
 * Calculate expected banner count for a bout.
 * Returns an integer banner count (not Yen).
 */
export function calculateBoutKensho(
  eastRank: Rank,
  westRank: Rank,
  eastPopularity: number = 50,
  westPopularity: number = 50,
  isMusubi: boolean = false,
  isPlayoff: boolean = false,
  day: number = 1
): number {
  const baseEast = KENSHO_CONFIG.baseKenshoPerBout[eastRank] ?? 0;
  const baseWest = KENSHO_CONFIG.baseKenshoPerBout[westRank] ?? 0;

  // Base: higher rank dominates, but the other contributes.
  let baseKensho = Math.max(baseEast, baseWest) + Math.min(baseEast, baseWest) * 0.5;

  // Popularity modifier (avg of the two)
  const avgPopularity = (eastPopularity + westPopularity) / 2;
  let popMod = KENSHO_CONFIG.popularityMultiplier.medium;
  if (avgPopularity >= 80) popMod = KENSHO_CONFIG.popularityMultiplier.superstar;
  else if (avgPopularity >= 60) popMod = KENSHO_CONFIG.popularityMultiplier.high;
  else if (avgPopularity >= 40) popMod = KENSHO_CONFIG.popularityMultiplier.medium;
  else popMod = KENSHO_CONFIG.popularityMultiplier.low;

  baseKensho *= popMod;

  // Special bout bonuses
  if (isMusubi) baseKensho *= 1.5;
  if (isPlayoff) baseKensho *= 3.0;
  if (day === 15) baseKensho *= 1.3;

  // Kensho are discrete banners
  return Math.max(0, Math.round(baseKensho));
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
  const count = Math.max(0, Math.floor(kenshoCount));
  const immediatePayment = count * KENSHO_CONFIG.winnerReceives;
  const toRetirement = count * KENSHO_CONFIG.toRetirementFund;
  const associationFee = count * KENSHO_CONFIG.associationFee;
  const totalValue = count * KENSHO_CONFIG.totalValue;

  return { kenshoCount: count, immediatePayment, toRetirement, associationFee, totalValue };
}

/**
 * Apply kensho payout to a rikishi’s economics (deterministic).
 */
export function applyKenshoWinToEconomics(
  payout: KenshoPayout,
  currentEconomics: RikishiEconomics
): RikishiEconomics {
  return {
    ...currentEconomics,
    careerKenshoWon: currentEconomics.careerKenshoWon + payout.kenshoCount,
    retirementFund: currentEconomics.retirementFund + payout.toRetirement,
    totalEarnings: currentEconomics.totalEarnings + payout.immediatePayment + payout.toRetirement,
    currentBashoEarnings: currentEconomics.currentBashoEarnings + payout.immediatePayment + payout.toRetirement
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
  const updatedEconomics = applyKenshoWinToEconomics(payout, currentEconomics);
  return {
    immediatePayment: payout.immediatePayment,
    toRetirement: payout.toRetirement,
    updatedEconomics
  };
}

// === SALARY SYSTEM ===

export const SALARY_CONFIG = {
  // Monthly allowances for non-sekitori
  allowances: {
    makushita: 150_000,
    sandanme: 100_000,
    jonidan: 80_000,
    jonokuchi: 70_000
  } as Record<Exclude<Rank, "yokozuna" | "ozeki" | "sekiwake" | "komusubi" | "maegashira" | "juryo">, number>,

  // Bonus multipliers
  bashoBonus: 1.0,
  yearEndBonus: 2.0,

  // Prize money
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
};

export function calculateMonthlyIncome(rank: Rank): number {
  const info = RANK_HIERARCHY[rank];
  if (info.isSekitori) return info.salary;

  // Non-sekitori get allowance only
  return (SALARY_CONFIG.allowances as any)[rank] ?? 70_000;
}

export function calculateBashoBonus(rank: Rank, wins: number): number {
  const info = RANK_HIERARCHY[rank];
  if (!info.isSekitori) return 0;

  let bonus = info.salary * SALARY_CONFIG.bashoBonus;

  const expectedWins = info.fightsPerBasho / 2;
  const performanceMod = 1 + (wins - expectedWins) * 0.05;

  return Math.round(bonus * Math.max(0.5, performanceMod));
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
  } as Record<Rank, number>,

  serviceBonus: 100_000, // per year as sekitori (paid out at retirement estimate)
  oyakataMinimum: 50_000_000
};

export function calculateRetirementContribution(rank: Rank): number {
  return RETIREMENT_CONFIG.jsaContribution[rank] ?? 10_000;
}

export function estimateRetirementPayout(economics: RikishiEconomics, yearsAsSekitori: number): number {
  // 6 basho per year
  const serviceBonus = Math.max(0, yearsAsSekitori) * RETIREMENT_CONFIG.serviceBonus * 6;
  return economics.retirementFund + serviceBonus;
}

// === KINBOSHI ===

export function isKinboshi(winnerRank: Rank, loserRank: Rank): boolean {
  return winnerRank === "maegashira" && loserRank === "yokozuna";
}

/**
 * Kinboshi creates a long-term “bonus bump”.
// Each kinboshi adds ¥4,000 to every future basho bonus -> annualized value returned here.
 */
export function calculateKinboshiBonusAnnual(kinboshiCount: number): number {
  return Math.max(0, kinboshiCount) * 4_000 * 6;
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
};

export function calculateHeyaIncome(sekitoriCount: number, totalKenshoWon: number, prestige: number): number {
  const sekitoriIncome = Math.max(0, sekitoriCount) * HEYA_CONFIG.sekitoriSupport;
  const kenshoIncome = Math.max(0, totalKenshoWon) * HEYA_CONFIG.kenshoHeyaCut;

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
};

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
    amount: payout.immediatePayment
  };
}

// === END-TO-END BOUT HELPERS (optional but recommended) ===

export interface BoutKenshoOutcome {
  payout: KenshoPayout;
  winnerEconomics: RikishiEconomics;
  winnerRecord: KenshoRecord | null;
  heyaCut: number; // yen
}

/**
 * Deterministic: process kensho for a single bout.
 * Caller handles applying the heyaCut to heya treasury (if you track it).
 */
export function processBoutKenshoWin(args: {
  bashoName: BashoName;
  day: number;
  opponentId: string;
  kenshoCount: number;
  winnerEconomics: RikishiEconomics;
}): BoutKenshoOutcome {
  const payout = splitKensho(args.kenshoCount);
  const updated = applyKenshoWinToEconomics(payout, args.winnerEconomics);

  return {
    payout,
    winnerEconomics: updated,
    winnerRecord: payout.kenshoCount > 0 ? createKenshoRecord(args.bashoName, args.day, args.opponentId, payout.kenshoCount) : null,
    heyaCut: payout.kenshoCount * HEYA_CONFIG.kenshoHeyaCut
  };
}
