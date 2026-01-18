// timeBoundary.ts
// Time Boundary System - Week/Month advancement with training, scouting, economy events
// Per Constitution §A3.2-A3.3: Weekly and Monthly boundary processing
//
// FIXES APPLIED (canon + correctness):
// - Removed non-deterministic Math.random() usage (training/injury text now uses rng).
// - Fixed stamina vs fatigue bug: weekly fatigue should NOT write into `rikishi.stamina`.
//   Instead we update `rikishi.fatigue` if present, otherwise we keep fatigue in the result map only.
// - Deterministic per-rikishi RNG streams so iteration order doesn’t change outcomes.
//   (heya iteration order / rikishiIds order no longer affects training/injury outcomes.)
// - Injury recovery tick decrements weeks and clears injured deterministically.
// - Monthly salary payments now actually update rikishi funds (and retirement) safely,
//   not just totalEarnings (which is lifetime, not spendable).
// - Monthly heya expenses are grouped per heya (no “filter the growing list” O(n^2) logic).
// - Guard division-by-zero when world.heyas.size === 0.
// - Removed unused imports (Rank, SALARY_CONFIG) and dead variables.
// - Month boundary logic stays “4 weeks = 1 month” as you wrote, but now explicit and safe.
// - Uses stable sorting for determinism when iterating arrays derived from Maps.
//
// NOTE: This assumes types may optionally include:
// - Rikishi.fatigue?: number (0..100, hidden)
// - Rikishi.economics?: { cash?: number; totalEarnings: number; retirementFund: number }
// - Heya.funds?: number
// If your actual types differ, keep the patterns and adjust field names.

import seedrandom from "seedrandom";
import type { WorldState, Rikishi, Heya } from "./types";
import {
  INTENSITY_EFFECTS,
  RECOVERY_EFFECTS,
  FOCUS_EFFECTS,
  getCareerPhase,
  PHASE_EFFECTS,
  type TrainingProfile
} from "./training";
import { calculateMonthlyIncome, calculateRetirementContribution } from "./economics";
import { calculateKoenkaiIncome, type KoenkaiBandType } from "./sponsors";
import { RANK_HIERARCHY } from "./banzuke";

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
  fatigueChanges: Map<string, number>; // rikishiId -> fatigueDelta
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

function getDefaultTrainingProfile(): TrainingProfile {
  return {
    intensity: "balanced",
    focus: "neutral",
    styleBias: "neutral",
    recovery: "normal"
  };
}

/**
 * Derive a deterministic sub-RNG for an entity so outcomes don’t depend on iteration order.
 * (IMPORTANT for map iteration stability + future refactors.)
 */
function deriveRng(parent: seedrandom.PRNG, salt: string): seedrandom.PRNG {
  // parent() consumption stays deterministic; salt keeps streams stable across loops
  const s = `${salt}-${Math.floor(parent() * 1_000_000_000)}`;
  return seedrandom(s);
}

/** Pull a per-rikishi RNG without consuming parent unpredictably across other entities. */
function rikishiRng(weekSeed: string, rikishiId: string): seedrandom.PRNG {
  return seedrandom(`${weekSeed}-rikishi-${rikishiId}`);
}

/** Pull a per-heya RNG for expenses variance, independent of other heyas. */
function heyaRng(monthSeed: string, heyaId: string): seedrandom.PRNG {
  return seedrandom(`${monthSeed}-heya-${heyaId}`);
}

function getRikishiFatigue(r: Rikishi): number {
  // Optional fatigue stat. If you don’t have it, we treat fatigue as 0.
  const anyR = r as any;
  const f = typeof anyR.fatigue === "number" ? anyR.fatigue : 0;
  return clamp(f, 0, 100);
}

function setRikishiFatigue(r: Rikishi, fatigue: number): void {
  const anyR = r as any;
  if (typeof anyR.fatigue === "number" || "fatigue" in anyR) {
    anyR.fatigue = clamp(fatigue, 0, 100);
  }
}

function getRikishiCash(r: Rikishi): number {
  const anyR = r as any;
  const econ = anyR.economics;
  const cash = econ && typeof econ.cash === "number" ? econ.cash : 0;
  return cash;
}

function addRikishiCash(r: Rikishi, delta: number): void {
  const anyR = r as any;
  if (!anyR.economics) return;
  if (typeof anyR.economics.cash !== "number") anyR.economics.cash = 0;
  anyR.economics.cash += delta;
}

// === WEEKLY BOUNDARY (Constitution §A3.2) ===

export function processWeeklyBoundary(world: WorldState, weekSeed: string): WeeklyBoundaryResult {
  const rng = seedrandom(weekSeed);

  const trainingEvents: TrainingEvent[] = [];
  const scoutingEvents: ScoutingEvent[] = [];
  const fatigueChanges = new Map<string, number>();
  const injuryEvents: InjuryEvent[] = [];

  // Stable iteration: sort heyas by id
  const heyaEntries = stableSort(Array.from(world.heyas.entries()), ([id]) => id);

  for (const [heyaId, heya] of heyaEntries) {
    const profile = getDefaultTrainingProfile();

    // stable iteration: sort rikishiIds (string compare)
    const roster = [...heya.rikishiIds].sort((a, b) => a.localeCompare(b));

    for (const rikishiId of roster) {
      const rikishi = world.rikishi.get(rikishiId);
      if (!rikishi) continue;

      // Use per-rikishi RNG so outcomes are independent of roster ordering
      const rrng = rikishiRng(weekSeed, rikishiId);

      // Injured recovery tick
      if ((rikishi as any).injured) {
        if ((rikishi as any).injuryWeeksRemaining > 0) {
          (rikishi as any).injuryWeeksRemaining--;
          if ((rikishi as any).injuryWeeksRemaining <= 0) {
            (rikishi as any).injuryWeeksRemaining = 0;
            (rikishi as any).injured = false;
          }
        }
        continue;
      }

      const trainingResult = processRikishiTraining(rikishi, profile, heya, rrng);
      trainingEvents.push(...trainingResult.events);

      fatigueChanges.set(rikishiId, trainingResult.fatigueDelta);

      // Apply fatigue delta to hidden fatigue (NOT stamina)
      const beforeFatigue = getRikishiFatigue(rikishi);
      const afterFatigue = clamp(beforeFatigue + trainingResult.fatigueDelta, 0, 100);
      setRikishiFatigue(rikishi, afterFatigue);

      // Injury check
      const injuryResult = checkForInjury(rikishi, profile, rrng);
      if (injuryResult) {
        injuryEvents.push(injuryResult);
        (rikishi as any).injured = true;
        (rikishi as any).injuryWeeksRemaining = injuryResult.weeksOut;
      }
    }
  }

  // TODO: scoutingEvents (passive observation refresh) – left intentionally blank per your stub

  // rng is intentionally unused beyond determinism “anchor” (okay).
  void rng;

  return { trainingEvents, scoutingEvents, fatigueChanges, injuryEvents };
}

function processRikishiTraining(
  rikishi: Rikishi,
  profile: TrainingProfile,
  heya: Heya,
  rng: seedrandom.PRNG
): { events: TrainingEvent[]; fatigueDelta: number } {
  const events: TrainingEvent[] = [];

  const intensityEffect = INTENSITY_EFFECTS[profile.intensity];
  const recoveryEffect = RECOVERY_EFFECTS[profile.recovery];
  const focusEffect = FOCUS_EFFECTS[profile.focus];
  const careerPhase = getCareerPhase(rikishi.experience);
  const phaseEffect = PHASE_EFFECTS[careerPhase];

  // Base growth rate (per week)
  const baseGrowth = 0.1;
  const growthMod = intensityEffect.growthMult * phaseEffect.growthMod;

  // Fatigue delta: +fatigue means MORE tired.
  // training adds fatigue; recovery reduces fatigue.
  const baseFatigue = 5;
  const fatigueAdded = baseFatigue * intensityEffect.fatigueGain;
  const fatigueReduced = baseFatigue * 1.2 * recoveryEffect.fatigueDecay;
  const fatigueDelta = fatigueAdded - fatigueReduced; // positive = gain fatigue, negative = recover

  const attributes: Array<{ name: string; key: keyof Rikishi; mult: number }> = [
    { name: "power", key: "power" as keyof Rikishi, mult: focusEffect.power },
    { name: "speed", key: "speed" as keyof Rikishi, mult: focusEffect.speed },
    { name: "technique", key: "technique" as keyof Rikishi, mult: focusEffect.technique },
    { name: "balance", key: "balance" as keyof Rikishi, mult: focusEffect.balance }
  ];

  for (const attr of attributes) {
    const currentValue = (rikishi as any)[attr.key] as number;
    const gain = baseGrowth * growthMod * attr.mult;

    // Diminishing returns at high values
    const diminishing = Math.max(0.2, 1 - (currentValue - 70) / 100);
    const actualGain = gain * diminishing;

    if (rng() < actualGain) {
      (rikishi as any)[attr.key] = Math.min(100, currentValue + 1);
      events.push({
        rikishiId: rikishi.id,
        attribute: attr.name,
        change: 1,
        description: getTrainingDescription(attr.name, profile, rng, heya)
      });
    }
  }

  // Experience slow increase (if your experience is "basho count" this should live elsewhere;
  // leaving as-is but deterministic.)
  if (rng() < 0.15) {
    rikishi.experience = Math.min(100, rikishi.experience + 1);
  }

  return { events, fatigueDelta };
}

function checkForInjury(rikishi: Rikishi, profile: TrainingProfile, rng: seedrandom.PRNG): InjuryEvent | null {
  const intensityEffect = INTENSITY_EFFECTS[profile.intensity];
  const careerPhase = getCareerPhase(rikishi.experience);
  const phaseEffect = PHASE_EFFECTS[careerPhase];

  const fatigue = getRikishiFatigue(rikishi);

  const baseChance = 0.005;
  const injuryChance =
    baseChance *
    intensityEffect.injuryRisk *
    phaseEffect.injurySensitivity *
    (1 + fatigue / 200); // more fatigue => higher risk

  if (rng() < injuryChance) {
    const severityRoll = rng();
    let severity: "minor" | "moderate" | "serious";
    let weeksOut: number;

    if (severityRoll < 0.7) {
      severity = "minor";
      weeksOut = 1 + Math.floor(rng() * 2);
    } else if (severityRoll < 0.95) {
      severity = "moderate";
      weeksOut = 2 + Math.floor(rng() * 4);
    } else {
      severity = "serious";
      weeksOut = 6 + Math.floor(rng() * 8);
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

function getTrainingDescription(attribute: string, profile: TrainingProfile, rng: seedrandom.PRNG, heya: Heya): string {
  // You can later bias by heya style/training focus; for now deterministic pick.
  const descriptions: Record<string, string[]> = {
    power: ["Heavy pushing drills show results", "Strength training pays dividends", "Teppo practice builds power"],
    speed: ["Footwork drills improve agility", "Speed training shows progress", "Quick reaction exercises pay off"],
    technique: ["Form refinement yields improvement", "Technical drilling bears fruit", "Kimarite practice shows growth"],
    balance: ["Stability work improves posture", "Balance exercises take effect", "Core training strengthens center"]
  };

  const options = descriptions[attribute] || ["Training shows improvement"];
  const idx = Math.floor(rng() * options.length);
  void profile;
  void heya;
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
  const rng = seedrandom(monthSeed);

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

    // Update rikishi economics safely
    if ((rikishi as any).economics) {
      (rikishi as any).economics.totalEarnings = ((rikishi as any).economics.totalEarnings || 0) + income;

      // Spendable cash (optional but recommended)
      addRikishiCash(rikishi, income);

      // Retirement contribution
      const retirementContrib = calculateRetirementContribution(rikishi.rank);
      (rikishi as any).economics.retirementFund = ((rikishi as any).economics.retirementFund || 0) + retirementContrib;
      // Retirement is typically withheld; if you want it to reduce cash, subtract here.
      // addRikishiCash(rikishi, -retirementContrib);
    }
  }

  // Heya economics (stable iteration)
  const heyaEntries = stableSort(Array.from(world.heyas.entries()), ([id]) => id);

  // Track per-heya totals as we go (avoid O(n^2) filters)
  const perHeyaExpenseTotal = new Map<string, number>();

  for (const [heyaId, heya] of heyaEntries) {
    const hrng = heyaRng(monthSeed, heyaId);

    // Kōenkai income
    const band: KoenkaiBandType = (heya as any).koenkaiBand || "none";
    const koenkaiAmount = calculateKoenkaiIncome(band);

    koenkaiIncome.push({ heyaId, amount: koenkaiAmount, band });

    // Monthly expenses
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

    perHeyaExpenseTotal.set(heyaId, totalExpenses);

    // Update heya funds
    const incomeTotal = koenkaiAmount;
    const fundsBefore = (heya.funds || 0) as number;
    const fundsAfter = fundsBefore + incomeTotal - totalExpenses;

    heya.funds = fundsAfter;
    (heya as any).runwayBand = deriveRunwayBand(fundsAfter);
  }

  // Economy snapshot
  const totalHeyaFunds = Array.from(world.heyas.values()).reduce((sum, h) => sum + (h.funds || 0), 0);

  // Prefer spendable cash if you track it; otherwise 0 (NOT totalEarnings)
  const totalRikishiFunds = Array.from(world.rikishi.values()).reduce((sum, r) => sum + getRikishiCash(r), 0);

  const heyaCount = world.heyas.size;
  const avgRunwayWeeks =
    heyaCount > 0
      ? Array.from(world.heyas.values()).reduce((sum, h) => sum + runwayBandToWeeks((h as any).runwayBand), 0) / heyaCount
      : 0;

  void rng;

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

  for (let w = 0; w < totalWeeks; w++) {
    const weekSeed = `${world.seed}-week-${currentTime.weekIndexGlobal}`;

    // Weekly boundary
    const weekResult = processWeeklyBoundary(world, weekSeed);
    weeklyResults.push(weekResult);

    // Advance week
    currentTime.week++;
    currentTime.weekIndexGlobal++;
    currentTime.dayIndexGlobal += 7;

    // Month boundary: your model is 4 weeks per month (explicit)
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
