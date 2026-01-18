// economics.ts
// Sumo Economics System - Kensho, salaries, and retirement funds
//
// DROP-IN for updated types.ts (with required RikishiEconomics.cash)
//
// Notes:
// - `cash` is spendable funds on the rikishi.
// - `totalEarnings` is lifetime cumulative (includes retirement + cash payouts).
// - `currentBashoEarnings` is current-tournament earnings (includes retirement + cash payouts).
// - Kensho: immediatePayment -> cash; toRetirement -> retirementFund; associationFee -> sink.

import type { Rank, RikishiEconomics, KenshoRecord, BashoName, Division } from "./types";
import { RANK_HIERARCHY } from "./banzuke";

// === INTERNAL UTILS ===
const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));
const clamp0 = (n: number) => Math.max(0, n);
const isFiniteNumber = (n: number) => Number.isFinite(n);

type NonSekitoriRank = Exclude<Rank, "yokozuna" | "ozeki" | "sekiwake" | "komusubi" | "maegashira" | "juryo">;

// === KENSHO (SPONSOR BANNERS) SYSTEM ===

export const KENSHO_CONFIG = {
  totalValue: 70_000,       // total per banner
  winnerReceives: 30_000,   // immediate cash to winner
  toRetirementFund: 30_000, // saved into retirement fund
  associationFee: 10_000,   // sink

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

export const KENSHO_SPLIT_SUM =
  KENSHO_CONFIG.winnerReceives + KENSHO_CONFIG.toRetirementFund + KENSHO_CONFIG.associationFee;

export function assertKenshoSplitValid(): boolean {
  return KENSHO_SPLIT_SUM === KENSHO_CONFIG.totalValue;
}

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
  immediatePayment: number; // cash
  toRetirement: number;
  associationFee: number;
  totalValue: number;
}

export function splitKensho(kenshoCount: number): KenshoPayout {
  const count = clamp0(Math.floor(isFiniteNumber(kenshoCount) ? kenshoCount : 0));
  const immediatePayment = count * KENSHO_CONFIG.winnerReceives;
  const toRetirement = count * KENSHO_CONFIG.toRetirementFund;
  const associationFee = count * KENSHO_CONFIG.associationFee;
  const totalValue = count * KENSHO_CONFIG.totalValue;
  return { kenshoCount: count, immediatePayment, toRetirement, associationFee, totalValue };
}

export function applyKenshoWinToEconomics(payout: KenshoPayout, econ: RikishiEconomics): RikishiEconomics {
  const cashBefore = clamp0(econ.cash);
  const cashAfter = cashBefore + payout.immediatePayment;

  return {
    ...econ,
    cash: cashAfter,
    careerKenshoWon: clamp0(econ.careerKenshoWon + payout.kenshoCount),
    retirementFund: clamp0(econ.retirementFund + payout.toRetirement),
    totalEarnings: clamp0(econ.totalEarnings + payout.immediatePayment + payout.toRetirement),
    currentBashoEarnings: clamp0(econ.currentBashoEarnings + payout.immediatePayment + payout.toRetirement)
  };
}

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

  const allowance = SALARY_CONFIG.allowances[rank as NonSekitoriRank];
  return allowance ?? 70_000;
}

export function calculateBashoBonus(rank: Rank, wins: number, kinboshiCount = 0): number {
  const info = RANK_HIERARCHY[rank];
  if (!info.isSekitori) return 0;

  let bonus = info.salary * SALARY_CONFIG.bashoBonus;

  const expectedWins = info.fightsPerBasho / 2;
  const performanceMod = 1 + (wins - expectedWins) * 0.05;

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

/**
 * Apply prize to econ:
 * - increases cash (spendable)
 * - increases totals
 */
export function applyPrizeToEconomics(amount: number, econ: RikishiEconomics): RikishiEconomics {
  const a = clamp0(Math.round(isFiniteNumber(amount) ? amount : 0));
  if (a === 0) return econ;

  return {
    ...econ,
    cash: clamp0(econ.cash + a),
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
  const serviceBonus = years * RETIREMENT_CONFIG.serviceBonus * 6;
  return clamp0(economics.retirementFund + serviceBonus);
}

// === KINBOSHI ===

export function isKinboshi(winnerRank: Rank, loserRank: Rank): boolean {
  return winnerRank === "maegashira" && loserRank === "yokozuna";
}

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
    cash: 0,
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

// === END-TO-END BOUT HELPERS ===

export interface BoutKenshoOutcome {
  payout: KenshoPayout;
  winnerEconomics: RikishiEconomics;
  winnerRecord: KenshoRecord | null;
  heyaCut: number;
}

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
    winnerRecord:
      payout.kenshoCount > 0 ? createKenshoRecord(args.bashoName, args.day, args.opponentId, payout.kenshoCount) : null,
    heyaCut
  };
}
