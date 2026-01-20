// timeBoundary.ts
// Time Boundary System - Week/Month advancement with training, scouting, economy events
// Per Constitution §A3.2-A3.3: Weekly and Monthly boundary processing
//
// DROP-IN (canon + training.ts integration):
// - Deterministic RNG: per-rikishi + per-heya streams (order independent).
// - Uses computeTrainingMultipliers() from training.ts as the single source of truth.
// - No Math.random() (all narrative picks use seeded rng).
// - Fatigue is tracked as `rikishi.fatigue?: number` if present; NEVER writes into stamina.
// - Injury recovery tick uses RECOVERY_EFFECTS.injuryRecovery via computeTrainingMultipliers.
// - Monthly: salary adds to spendable cash (economics.cash) and retirement; avoids O(n^2) expense calcs.
// - Stable iteration over Maps by sorting ids.
// - Safe guards for division-by-zero.
//
// ASSUMPTIONS (safe, optional fields):
// - Rikishi may have optional `fatigue?: number` (0..100). If absent, fatigue is computed but not stored.
// - Rikishi.economics may have optional `cash?: number`.
// - Heya has `funds: number` in your types (required), but this file guards anyway.

import seedrandom from "seedrandom";
import type { WorldState, Rikishi, Heya } from "./types";
import type { TrainingProfile } from "./training";
import { computeTrainingMultipliers, getIndividualFocusMode, createDefaultTrainingProfile } from "./training";
import { calculateMonthlyIncome, calculateRetirementContribution } from "./economics";
import { calculateKoenkaiIncome, type KoenkaiBandType } from "./sponsors";
import { RANK_HIERARCHY } from "./banzuke";
import { runNpcWeeklyAI, initializeNpcAIState } from "./npcAI";
import { initializeAllOyakataPersonalities } from "./oyakataPersonalities";

// === TIME STATE ===

export interface TimeState {
  year: number;
  month: number;
  week: number;
  dayIndexGlobal: number;
  weekIndexGlobal: number;
  phase: "prebasho" | "basho" | "postbasho" | "interbasho";
}

export interface WeeklyBoundaryResult {
  trainingEvents: TrainingEvent[];
  scoutingEvents: ScoutingEvent[];
  fatigueChanges: Map<string, number>; // rikishiId -> fatigueDelta (positive means more fatigue)
  injuryEvents: InjuryEvent[];
}

export interface MonthlyBoundaryResult {
  salaryPayments: SalaryPayment[];
  koenkaiIncome: KoenkaiIncomeEvent[];
  heyaExpenses: HeyaExpense[];
  economySnapshot: EconomySnapshot;
}

export interface TrainingEvent {
  rikishiId: string;
  attribute: string;
  change: number;
  description: string;
}

export interface ScoutingEvent {
  targetId: string;
  observationType: "passive" | "active";
  confidenceGain: number;
  newConfidence: number;
}

export interface InjuryEvent {
  rikishiId: string;
  severity: "minor" | "moderate" | "serious";
  weeksOut: number;
  description: string;
}

export interface SalaryPayment {
  rikishiId: string;
  amount: number;
  type: "salary" | "allowance";
}

export interface KoenkaiIncomeEvent {
  heyaId: string;
  amount: number;
  band: KoenkaiBandType;
}

export interface HeyaExpense {
  heyaId: string;
  category: "rent" | "food" | "utilities" | "staff" | "maintenance";
  amount: number;
}

export interface EconomySnapshot {
  totalHeyaFunds: number;
  totalRikishiFunds: number; // spendable cash, NOT lifetime earnings
  avgRunwayWeeks: number;
}

// === helpers ===

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

function stableSort<T>(arr: T[], keyFn: (x: T) => string): T[] {
  return arr.sort((a, b) => keyFn(a).localeCompare(keyFn(b)));
}

/** Deterministic per-rikishi RNG stream (order independent). */
function rikishiRng(weekSeed: string, rikishiId: string): seedrandom.PRNG {
  return seedrandom(`${weekSeed}-rikishi-${rikishiId}`);
}

/** Deterministic per-heya RNG stream for monthly variance (order independent). */
function heyaRng(monthSeed: string, heyaId: string): seedrandom.PRNG {
  return seedrandom(`${monthSeed}-heya-${heyaId}`);
}

function getRikishiFatigue(r: Rikishi): number {
  const anyR = r as any;
  const f = typeof anyR.fatigue === "number" ? anyR.fatigue : 0;
  return clamp(f, 0, 100);
}

function setRikishiFatigue(r: Rikishi, fatigue: number): void {
  const anyR = r as any;
  // Only persist if the property exists (or your types include it)
  if (typeof anyR.fatigue === "number" || "fatigue" in anyR) {
    anyR.fatigue = clamp(fatigue, 0, 100);
  }
}

function getRikishiCash(r: Rikishi): number {
  const econ = (r as any).economics;
  if (!econ) return 0;
  return typeof econ.cash === "number" ? econ.cash : 0;
}

function addRikishiCash(r: Rikishi, delta: number): void {
  const econ = (r as any).economics;
  if (!econ) return;
  if (typeof econ.cash !== "number") econ.cash = 0;
  econ.cash += delta;
}

// Try to read a heya training state if you later add it to Heya.
// We keep this file drop-in compatible by treating it as optional.
type HeyaTrainingStateLite = {
  profile: TrainingProfile;
  focusSlots: Array<{ rikishiId: string; mode: "develop" | "push" | "protect" | "rebuild" }>;
  maxFocusSlots: number;
};

function getHeyaTrainingProfile(heya: Heya): TrainingProfile {
  const t = (heya as any).trainingState as HeyaTrainingStateLite | undefined;
  return t?.profile ?? createDefaultTrainingProfile();
}

function getHeyaFocusMode(heya: Heya, rikishiId: string): "develop" | "push" | "protect" | "rebuild" | null {
  const t = (heya as any).trainingState as HeyaTrainingStateLite | undefined;
  if (!t) return null;
  // Use helper if you fully type trainingState later; otherwise simple lookup here.
  // (Avoid importing BeyaTrainingState type to reduce circular risk.)
  const found = t.focusSlots?.find(s => s.rikishiId === rikishiId);
  return found ? found.mode : null;
}

// === WEEKLY BOUNDARY (Constitution §A3.2) ===

export function processWeeklyBoundary(world: WorldState, weekSeed: string): WeeklyBoundaryResult {
  // Anchor RNG for any future “global weekly events” (kept deterministic even if unused now)
  const _rng = seedrandom(weekSeed);

  const trainingEvents: TrainingEvent[] = [];
  const scoutingEvents: ScoutingEvent[] = [];
  const fatigueChanges = new Map<string, number>();
  const injuryEvents: InjuryEvent[] = [];

  // Stable iteration: heya ids
  const heyaEntries = stableSort(Array.from(world.heyas.entries()), ([id]) => id);

  for (const [heyaId, heya] of heyaEntries) {
    const profile = getHeyaTrainingProfile(heya);
    // Stable roster iteration
    const roster = [...heya.rikishiIds].sort((a, b) => a.localeCompare(b));

    for (const rikishiId of roster) {
      const rikishi = world.rikishi.get(rikishiId);
      if (!rikishi) continue;

      const rrng = rikishiRng(weekSeed, rikishiId);

      // Injury recovery tick (deterministic)
      if ((rikishi as any).injured) {
        const weeks = Math.max(0, (rikishi as any).injuryWeeksRemaining || 0);

        if (weeks > 0) {
          // Recovery speed comes from training recovery emphasis.
          // (If you prefer: use a separate "medical" system later.)
          const m = computeTrainingMultipliers({
            rikishi,
            heya,
            profile,
            individualMode: getHeyaFocusMode(heya, rikishiId)
          });

          // Deterministic reduction: high recovery can occasionally tick 2 weeks.
          let dec = 1;
          const extraChance = clamp((m.injuryRecoveryMult - 1) * 0.75, 0, 0.35); // gentle
          if (rrng() < extraChance) dec = 2;

          const after = Math.max(0, weeks - dec);
          (rikishi as any).injuryWeeksRemaining = after;
          if (after === 0) (rikishi as any).injured = false;
        } else {
          (rikishi as any).injuryWeeksRemaining = 0;
          (rikishi as any).injured = false;
        }

        continue;
      }

      // Training step
      const individualMode = getHeyaFocusMode(heya, rikishiId);
      const trainingResult = processRikishiTraining(rikishi, profile, heya, individualMode, rrng);

      trainingEvents.push(...trainingResult.events);
      fatigueChanges.set(rikishiId, trainingResult.fatigueDelta);

      // Apply fatigue delta to hidden fatigue (NOT stamina)
      const beforeFatigue = getRikishiFatigue(rikishi);
      const afterFatigue = clamp(beforeFatigue + trainingResult.fatigueDelta, 0, 100);
      setRikishiFatigue(rikishi, afterFatigue);

      // Injury check
      const injury = checkForInjury(rikishi, profile, heya, individualMode, rrng);
      if (injury) {
        injuryEvents.push(injury);
        (rikishi as any).injured = true;
        (rikishi as any).injuryWeeksRemaining = injury.weeksOut;
      }
    }

    void heyaId;
  }

  // TODO: scouting events (kept as stub)
  void _rng;

  return { trainingEvents, scoutingEvents, fatigueChanges, injuryEvents };
}

function processRikishiTraining(
  rikishi: Rikishi,
  profile: TrainingProfile,
  heya: Heya,
  individualMode: "develop" | "push" | "protect" | "rebuild" | null,
  rng: seedrandom.PRNG
): { events: TrainingEvent[]; fatigueDelta: number } {
  const events: TrainingEvent[] = [];

  const m = computeTrainingMultipliers({
    rikishi,
    heya,
    profile,
    individualMode
  });

  // Base growth chance (per attribute per week)
  const baseChance = 0.1; // tuned to “slow grind”
  const growthChance = baseChance * m.growthMult;

  // Fatigue delta: positive = more fatigue, negative = recovery
  const baseFatigue = 5;
  const fatigueAdded = baseFatigue * m.fatigueMult;
  const fatigueReduced = baseFatigue * 1.2 * m.fatigueRecoveryMult;
  const fatigueDelta = fatigueAdded - fatigueReduced;

  const attributes: Array<{ name: "power" | "speed" | "technique" | "balance" }> = [
    { name: "power" },
    { name: "speed" },
    { name: "technique" },
    { name: "balance" }
  ];

  for (const attr of attributes) {
    const key = attr.name;
    const currentValue = (rikishi as any)[key] as number;

    // Diminishing returns at high values
    const diminishing = Math.max(0.2, 1 - (currentValue - 70) / 100);

    // Final per-attribute chance
    const chance = clamp(growthChance * m.attr[key] * diminishing, 0, 0.85);

    if (rng() < chance) {
      (rikishi as any)[key] = Math.min(100, currentValue + 1);
      events.push({
        rikishiId: rikishi.id,
        attribute: key,
        change: 1,
        description: getTrainingDescription(key, profile, rng)
      });
    }
  }

  // Experience slow increase (kept deterministic)
  if (rng() < 0.15 * m.growthMult) {
    rikishi.experience = Math.min(100, rikishi.experience + 1);
  }

  return { events, fatigueDelta };
}

function checkForInjury(
  rikishi: Rikishi,
  profile: TrainingProfile,
  heya: Heya,
  individualMode: "develop" | "push" | "protect" | "rebuild" | null,
  rng: seedrandom.PRNG
): InjuryEvent | null {
  const m = computeTrainingMultipliers({ rikishi, heya, profile, individualMode });

  const fatigue = getRikishiFatigue(rikishi);

  // Base injury chance per week (very low)
  const baseChance = 0.005;

  // Fatigue increases risk gently; focus/punishing increases via multipliers
  const injuryChance = baseChance * m.injuryRiskMult * (1 + fatigue / 200);

  if (rng() < injuryChance) {
    const roll = rng();
    let severity: "minor" | "moderate" | "serious";
    let weeksOut: number;

    if (roll < 0.7) {
      severity = "minor";
      weeksOut = 1 + Math.floor(rng() * 2); // 1-2
    } else if (roll < 0.95) {
      severity = "moderate";
      weeksOut = 2 + Math.floor(rng() * 4); // 2-5
    } else {
      severity = "serious";
      weeksOut = 6 + Math.floor(rng() * 8); // 6-13
    }

    return {
      rikishiId: rikishi.id,
      severity,
      weeksOut,
      description: getInjuryDescription(severity, rng)
    };
  }

  return null;
}

function getTrainingDescription(attribute: string, profile: TrainingProfile, rng: seedrandom.PRNG): string {
  const descriptions: Record<string, string[]> = {
    power: ["Heavy pushing drills show results", "Strength training pays dividends", "Teppo practice builds power"],
    speed: ["Footwork drills improve agility", "Speed training shows progress", "Quick reaction exercises pay off"],
    technique: ["Form refinement yields improvement", "Technical drilling bears fruit", "Kimarite practice shows growth"],
    balance: ["Stability work improves posture", "Balance exercises take effect", "Core training strengthens center"]
  };

  const options = descriptions[attribute] || ["Training shows improvement"];
  const idx = Math.floor(rng() * options.length);

  void profile; // reserved for future per-profile phrasing
  return options[idx];
}

function getInjuryDescription(severity: "minor" | "moderate" | "serious", rng: seedrandom.PRNG): string {
  const descriptions: Record<string, string[]> = {
    minor: ["Minor muscle strain during practice", "Light sprain from training session", "Bruising from intensive keiko"],
    moderate: ["Strained ligament requires rest", "Knee discomfort needs attention", "Back strain from overexertion"],
    serious: ["Significant injury during training", "Major strain requires extended recovery", "Serious knee injury diagnosed"]
  };

  const options = descriptions[severity];
  return options[Math.floor(rng() * options.length)];
}

// === MONTHLY BOUNDARY (Constitution §A3.3) ===

export function processMonthlyBoundary(world: WorldState, monthSeed: string): MonthlyBoundaryResult {
  const _rng = seedrandom(monthSeed);

  const salaryPayments: SalaryPayment[] = [];
  const koenkaiIncome: KoenkaiIncomeEvent[] = [];
  const heyaExpenses: HeyaExpense[] = [];

  // Salaries for all rikishi (stable iteration)
  const rikishiEntries = stableSort(Array.from(world.rikishi.entries()), ([id]) => id);

  for (const [id, rikishi] of rikishiEntries) {
    const income = calculateMonthlyIncome(rikishi.rank);
    const rankInfo = RANK_HIERARCHY[rikishi.rank];

    salaryPayments.push({
      rikishiId: id,
      amount: income,
      type: rankInfo.isSekitori ? "salary" : "allowance"
    });

    // Update economics safely
    const econ = (rikishi as any).economics;
    if (econ) {
      econ.totalEarnings = (econ.totalEarnings || 0) + income;
      addRikishiCash(rikishi, income);

      const retirementContrib = calculateRetirementContribution(rikishi.rank);
      econ.retirementFund = (econ.retirementFund || 0) + retirementContrib;
      // If you want retirement to reduce cash, uncomment:
      // addRikishiCash(rikishi, -retirementContrib);
    }
  }

  // Heya economics (stable iteration)
  const heyaEntries = stableSort(Array.from(world.heyas.entries()), ([id]) => id);

  for (const [heyaId, heya] of heyaEntries) {
    const hrng = heyaRng(monthSeed, heyaId);

    const band: KoenkaiBandType = (heya as any).koenkaiBand || "none";
    const koenkaiAmount = calculateKoenkaiIncome(band);
    koenkaiIncome.push({ heyaId, amount: koenkaiAmount, band });

    const rosterSize = heya.rikishiIds.length;

    const expenseCategories: Array<{ category: HeyaExpense["category"]; baseCost: number }> = [
      { category: "rent", baseCost: 2_000_000 },
      { category: "food", baseCost: 500_000 + rosterSize * 150_000 },
      { category: "utilities", baseCost: 300_000 + rosterSize * 20_000 },
      { category: "staff", baseCost: 1_500_000 },
      { category: "maintenance", baseCost: 200_000 }
    ];

    let totalExpenses = 0;

    for (const exp of expenseCategories) {
      const variance = 1 + (hrng() - 0.5) * 0.1; // +/-5%
      const amount = Math.floor(exp.baseCost * variance);
      heyaExpenses.push({ heyaId, category: exp.category, amount });
      totalExpenses += amount;
    }

    const fundsBefore = typeof heya.funds === "number" ? heya.funds : (heya as any).funds || 0;
    const fundsAfter = fundsBefore + koenkaiAmount - totalExpenses;

    (heya as any).funds = fundsAfter;
    (heya as any).runwayBand = deriveRunwayBand(fundsAfter);
  }

  const totalHeyaFunds = Array.from(world.heyas.values()).reduce((sum, h) => sum + ((h as any).funds || 0), 0);
  const totalRikishiFunds = Array.from(world.rikishi.values()).reduce((sum, r) => sum + getRikishiCash(r), 0);

  const heyaCount = world.heyas.size;
  const avgRunwayWeeks =
    heyaCount > 0
      ? Array.from(world.heyas.values()).reduce((sum, h) => sum + runwayBandToWeeks((h as any).runwayBand), 0) /
        heyaCount
      : 0;

  void _rng;

  return {
    salaryPayments,
    koenkaiIncome,
    heyaExpenses,
    economySnapshot: {
      totalHeyaFunds,
      totalRikishiFunds,
      avgRunwayWeeks
    }
  };
}

function deriveRunwayBand(funds: number): "secure" | "comfortable" | "tight" | "critical" | "desperate" {
  if (funds >= 80_000_000) return "secure";
  if (funds >= 50_000_000) return "comfortable";
  if (funds >= 25_000_000) return "tight";
  if (funds >= 10_000_000) return "critical";
  return "desperate";
}

function runwayBandToWeeks(band: string): number {
  const weeks: Record<string, number> = {
    secure: 52,
    comfortable: 26,
    tight: 12,
    critical: 4,
    desperate: 2
  };
  return weeks[band] || 12;
}

// === ADVANCE TIME ===

export interface TimeAdvanceResult {
  weeklyResults: WeeklyBoundaryResult[];
  monthlyResults: MonthlyBoundaryResult[];
  newTimeState: TimeState;
}

export function advanceWeeks(world: WorldState, weeks: number, startTimeState: TimeState): TimeAdvanceResult {
  const weeklyResults: WeeklyBoundaryResult[] = [];
  const monthlyResults: MonthlyBoundaryResult[] = [];

  let currentTime: TimeState = { ...startTimeState };
  const totalWeeks = Math.max(0, Math.floor(weeks));

  // Initialize NPC AI states if not already done
  initializeNpcAIState(world);
  
  // Initialize Oyakata personalities if not already done
  initializeAllOyakataPersonalities(world);

  for (let w = 0; w < totalWeeks; w++) {
    const weekSeed = `${world.seed}-week-${currentTime.weekIndexGlobal}`;

    // Run NPC AI decisions BEFORE training tick (so training state is set for the week)
    runNpcWeeklyAI(world, { weekIndexGlobal: currentTime.weekIndexGlobal });

    const weekResult = processWeeklyBoundary(world, weekSeed);
    weeklyResults.push(weekResult);

    currentTime.week++;
    currentTime.weekIndexGlobal++;
    currentTime.dayIndexGlobal += 7;

    // Month boundary: 4 weeks per month (explicit)
    if (currentTime.week > 4) {
      currentTime.week = 1;
      currentTime.month++;

      if (currentTime.month > 12) {
        currentTime.month = 1;
        currentTime.year++;
      }

      const monthSeed = `${world.seed}-month-${currentTime.year}-${currentTime.month}`;
      const monthResult = processMonthlyBoundary(world, monthSeed);
      monthlyResults.push(monthResult);
    }
  }

  return {
    weeklyResults,
    monthlyResults,
    newTimeState: currentTime
  };
}
