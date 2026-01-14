// Sumo Economics System - Kensho, salaries, and retirement funds
// Authentic financial simulation

import type { Rank, RikishiEconomics, KenshoRecord, BashoName } from "./types";
import { RANK_HIERARCHY } from "./banzuke";

// === KENSHO (SPONSOR BANNERS) SYSTEM ===

// Real kensho values (as of recent years)
export const KENSHO_CONFIG = {
  totalValue: 70_000,           // ¥70,000 total per banner
  winnerReceives: 30_000,       // Winner gets ¥30,000 immediately
  toRetirementFund: 30_000,     // ¥30,000 to retirement fund
  associationFee: 10_000,       // ¥10,000 to JSA
  
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

// Calculate kensho for a bout
export function calculateBoutKensho(
  eastRank: Rank,
  westRank: Rank,
  eastPopularity: number = 50,
  westPopularity: number = 50,
  isMusubi: boolean = false,     // Final bout of the day
  isPlayoff: boolean = false,    // Championship playoff
  day: number = 1
): number {
  const baseEast = KENSHO_CONFIG.baseKenshoPerBout[eastRank] || 0;
  const baseWest = KENSHO_CONFIG.baseKenshoPerBout[westRank] || 0;
  
  // Higher rank bout gets base from both wrestlers
  let baseKensho = Math.max(baseEast, baseWest) + Math.min(baseEast, baseWest) * 0.5;
  
  // Popularity modifier
  const avgPopularity = (eastPopularity + westPopularity) / 2;
  let popMod = 1.0;
  if (avgPopularity >= 80) popMod = KENSHO_CONFIG.popularityMultiplier.superstar;
  else if (avgPopularity >= 60) popMod = KENSHO_CONFIG.popularityMultiplier.high;
  else if (avgPopularity >= 40) popMod = KENSHO_CONFIG.popularityMultiplier.medium;
  else popMod = KENSHO_CONFIG.popularityMultiplier.low;
  
  baseKensho *= popMod;
  
  // Special bout bonuses
  if (isMusubi) baseKensho *= 1.5;
  if (isPlayoff) baseKensho *= 3.0;
  if (day === 15) baseKensho *= 1.3; // Senshuraku bonus
  
  return Math.round(baseKensho);
}

// Process kensho win
export function processKenshoWin(
  kenshoCount: number,
  currentEconomics: RikishiEconomics
): { immediatePayment: number; toRetirement: number; updatedEconomics: RikishiEconomics } {
  const immediatePayment = kenshoCount * KENSHO_CONFIG.winnerReceives;
  const toRetirement = kenshoCount * KENSHO_CONFIG.toRetirementFund;
  
  return {
    immediatePayment,
    toRetirement,
    updatedEconomics: {
      ...currentEconomics,
      careerKenshoWon: currentEconomics.careerKenshoWon + kenshoCount,
      retirementFund: currentEconomics.retirementFund + toRetirement,
      totalEarnings: currentEconomics.totalEarnings + immediatePayment + toRetirement
    }
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
  } as Record<string, number>,
  
  // Bonus multipliers
  bashoBonus: 1.0,        // Extra month salary after each basho
  yearEndBonus: 2.0,      // Year-end bonus
  
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
    junYusho: 2_000_000,   // Runner-up (makuuchi only)
    ginoSho: 2_000_000,    // Technique prize
    kantosho: 2_000_000,   // Fighting spirit
    shukunsho: 2_000_000,  // Outstanding performance
    kinboshi: 100_000      // Bonus per kinboshi (maegashira beats yokozuna)
  }
};

// Calculate monthly income for a rikishi
export function calculateMonthlyIncome(rank: Rank): number {
  const info = RANK_HIERARCHY[rank];
  
  if (info.isSekitori) {
    return info.salary;
  }
  
  // Non-sekitori get allowance only
  return SALARY_CONFIG.allowances[rank] || 70_000;
}

// Calculate basho bonus
export function calculateBashoBonus(rank: Rank, wins: number): number {
  const info = RANK_HIERARCHY[rank];
  
  if (!info.isSekitori) return 0;
  
  // Base bonus = monthly salary
  let bonus = info.salary * SALARY_CONFIG.bashoBonus;
  
  // Performance modifier
  const expectedWins = info.fightsPerBasho / 2;
  const performanceMod = 1 + (wins - expectedWins) * 0.05;
  
  return Math.round(bonus * Math.max(0.5, performanceMod));
}

// === RETIREMENT FUND ===

export const RETIREMENT_CONFIG = {
  // JSA contribution based on rank
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
  
  // Years of service bonus
  serviceBonus: 100_000,  // Per year as sekitori
  
  // Minimum for oyakata eligibility
  oyakataMinimum: 50_000_000  // Need ¥50M+ to buy kabu
};

// Calculate retirement fund contribution per basho
export function calculateRetirementContribution(rank: Rank): number {
  return RETIREMENT_CONFIG.jsaContribution[rank] || 10_000;
}

// Estimate retirement payout
export function estimateRetirementPayout(
  economics: RikishiEconomics,
  yearsAsSekitori: number
): number {
  const serviceBonus = yearsAsSekitori * RETIREMENT_CONFIG.serviceBonus * 6; // 6 basho per year
  return economics.retirementFund + serviceBonus;
}

// === KINBOSHI (GOLD STAR) SYSTEM ===

// Kinboshi: when a maegashira defeats a yokozuna
export function isKinboshi(winnerRank: Rank, loserRank: Rank): boolean {
  return winnerRank === "maegashira" && loserRank === "yokozuna";
}

// Kinboshi creates lifetime bonus
export function calculateKinboshiBonus(kinboshiCount: number): number {
  // Each kinboshi adds ¥4,000 to every future basho bonus
  return kinboshiCount * 4_000 * 6; // Annual value
}

// === HEYA (STABLE) ECONOMICS ===

export const HEYA_CONFIG = {
  // Monthly support per sekitori
  sekitoriSupport: 500_000,
  
  // Per-win bonus from kensho
  kenshoHeyaCut: 10_000,  // Heya gets ¥10k per kensho won
  
  // Sponsorship tiers based on stable prestige
  sponsorshipTiers: {
    low: 1_000_000,
    medium: 3_000_000,
    high: 7_000_000,
    elite: 15_000_000
  }
};

// Calculate heya monthly income
export function calculateHeyaIncome(
  sekitoriCount: number,
  totalKenshoWon: number,
  prestige: number
): number {
  const sekitoriIncome = sekitoriCount * HEYA_CONFIG.sekitoriSupport;
  const kenshoIncome = totalKenshoWon * HEYA_CONFIG.kenshoHeyaCut;
  
  let sponsorship = HEYA_CONFIG.sponsorshipTiers.low;
  if (prestige >= 80) sponsorship = HEYA_CONFIG.sponsorshipTiers.elite;
  else if (prestige >= 60) sponsorship = HEYA_CONFIG.sponsorshipTiers.high;
  else if (prestige >= 40) sponsorship = HEYA_CONFIG.sponsorshipTiers.medium;
  
  return sekitoriIncome + kenshoIncome + sponsorship;
}

// === SPECIAL CEREMONIES & COSTS ===

export const CEREMONY_COSTS = {
  yokozunaDohyoIri: 3_000_000,    // Rope-making ceremony
  mawashiPurchase: 500_000,        // Silk mawashi for sekitori
  keshoMawashi: 1_000_000,         // Ceremonial apron
  retirementDanpatsushiki: 2_000_000  // Hair-cutting ceremony
};

// Initialize economics for new rikishi
export function initializeEconomics(): RikishiEconomics {
  return {
    retirementFund: 0,
    careerKenshoWon: 0,
    kinboshiCount: 0,
    totalEarnings: 0,
    currentBashoEarnings: 0,
    popularity: 30  // Base popularity
  };
}

// Create kensho record for a bout
export function createKenshoRecord(
  bashoName: BashoName,
  day: number,
  opponentId: string,
  kenshoCount: number
): KenshoRecord {
  return {
    bashoName,
    day,
    opponentId,
    kenshoCount,
    amount: kenshoCount * KENSHO_CONFIG.winnerReceives
  };
}
