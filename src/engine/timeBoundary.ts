// Time Boundary System - Week/Month advancement with training, scouting, economy events
// Per Constitution §A3.2-A3.3: Weekly and Monthly boundary processing

import seedrandom from "seedrandom";
import type { WorldState, Rikishi, Heya, Rank } from "./types";
import { 
  INTENSITY_EFFECTS, 
  RECOVERY_EFFECTS, 
  FOCUS_EFFECTS, 
  getCareerPhase,
  PHASE_EFFECTS,
  type TrainingProfile 
} from "./training";
import { calculateMonthlyIncome, calculateRetirementContribution, SALARY_CONFIG } from "./economics";
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
  fatigueChanges: Map<string, number>;
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
  totalRikishiFunds: number;
  avgRunwayWeeks: number;
}

// === WEEKLY BOUNDARY (Constitution §A3.2) ===

export function processWeeklyBoundary(
  world: WorldState,
  weekSeed: string
): WeeklyBoundaryResult {
  const rng = seedrandom(weekSeed);
  
  const trainingEvents: TrainingEvent[] = [];
  const scoutingEvents: ScoutingEvent[] = [];
  const fatigueChanges = new Map<string, number>();
  const injuryEvents: InjuryEvent[] = [];
  
  // Process each heya's training
  for (const [heyaId, heya] of world.heyas) {
    // Training profile would come from heya state - use default for now
    const profile = getDefaultTrainingProfile();
    
    for (const rikishiId of heya.rikishiIds) {
      const rikishi = world.rikishi.get(rikishiId);
      if (!rikishi) continue;
      
      // Skip injured wrestlers
      if (rikishi.injured) {
        // Recovery tick
        if (rikishi.injuryWeeksRemaining > 0) {
          rikishi.injuryWeeksRemaining--;
          if (rikishi.injuryWeeksRemaining === 0) {
            rikishi.injured = false;
          }
        }
        continue;
      }
      
      // Process training effects
      const trainingResult = processRikishiTraining(rikishi, profile, heya, rng);
      trainingEvents.push(...trainingResult.events);
      fatigueChanges.set(rikishiId, trainingResult.fatigueDelta);
      
      // Apply fatigue
      rikishi.stamina = Math.max(0, Math.min(100, rikishi.stamina + trainingResult.fatigueDelta));
      
      // Injury check
      const injuryResult = checkForInjury(rikishi, profile, rng);
      if (injuryResult) {
        injuryEvents.push(injuryResult);
        rikishi.injured = true;
        rikishi.injuryWeeksRemaining = injuryResult.weeksOut;
      }
    }
  }
  
  // Process scouting (passive observation refresh)
  // In a full implementation, this would track observed bouts per rikishi
  // For now, we increment observation counts for rikishi seen in recent basho
  
  return {
    trainingEvents,
    scoutingEvents,
    fatigueChanges,
    injuryEvents
  };
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
  const baseGrowth = 0.1; // Very small weekly gains
  const growthMod = intensityEffect.growthMult * phaseEffect.growthMod;
  
  // Calculate fatigue delta
  const baseFatigueDrain = 5;
  const fatigueGain = baseFatigueDrain * intensityEffect.fatigueGain;
  const fatigueRecovery = baseFatigueDrain * 1.2 * recoveryEffect.fatigueDecay;
  const fatigueDelta = fatigueRecovery - fatigueGain;
  
  // Apply attribute gains based on focus
  const attributes: Array<{ name: string; key: keyof typeof rikishi; mult: number }> = [
    { name: "power", key: "power", mult: focusEffect.power },
    { name: "speed", key: "speed", mult: focusEffect.speed },
    { name: "technique", key: "technique", mult: focusEffect.technique },
    { name: "balance", key: "balance", mult: focusEffect.balance },
  ];
  
  for (const attr of attributes) {
    const currentValue = rikishi[attr.key] as number;
    const gain = baseGrowth * growthMod * attr.mult;
    
    // Diminishing returns at high values
    const diminishingFactor = Math.max(0.2, 1 - (currentValue - 70) / 100);
    const actualGain = gain * diminishingFactor;
    
    // Random chance to actually gain
    if (rng() < actualGain) {
      (rikishi[attr.key] as number) = Math.min(100, currentValue + 1);
      
      events.push({
        rikishiId: rikishi.id,
        attribute: attr.name,
        change: 1,
        description: getTrainingDescription(attr.name, profile)
      });
    }
  }
  
  // Experience always slowly increases
  if (rng() < 0.15) {
    rikishi.experience = Math.min(100, rikishi.experience + 1);
  }
  
  return { events, fatigueDelta };
}

function checkForInjury(
  rikishi: Rikishi,
  profile: TrainingProfile,
  rng: seedrandom.PRNG
): InjuryEvent | null {
  const intensityEffect = INTENSITY_EFFECTS[profile.intensity];
  const careerPhase = getCareerPhase(rikishi.experience);
  const phaseEffect = PHASE_EFFECTS[careerPhase];
  
  // Base injury chance per week is very low
  const baseChance = 0.005;
  const injuryChance = baseChance * 
    intensityEffect.injuryRisk * 
    phaseEffect.injurySensitivity *
    (1 + (100 - rikishi.stamina) / 200); // Fatigue increases risk
  
  if (rng() < injuryChance) {
    // Determine severity
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
      description: getInjuryDescription(severity)
    };
  }
  
  return null;
}

function getTrainingDescription(attribute: string, profile: TrainingProfile): string {
  const descriptions: Record<string, string[]> = {
    power: [
      "Heavy pushing drills show results",
      "Strength training pays dividends",
      "Teppo practice builds power"
    ],
    speed: [
      "Footwork drills improve agility",
      "Speed training shows progress",
      "Quick reaction exercises pay off"
    ],
    technique: [
      "Form refinement yields improvement",
      "Technical drilling bears fruit",
      "Kimarite practice shows growth"
    ],
    balance: [
      "Stability work improves posture",
      "Balance exercises take effect",
      "Core training strengthens center"
    ]
  };
  
  const options = descriptions[attribute] || ["Training shows improvement"];
  return options[Math.floor(Math.random() * options.length)];
}

function getInjuryDescription(severity: "minor" | "moderate" | "serious"): string {
  const descriptions: Record<string, string[]> = {
    minor: [
      "Minor muscle strain during practice",
      "Light sprain from training session",
      "Bruising from intensive keiko"
    ],
    moderate: [
      "Strained ligament requires rest",
      "Knee discomfort needs attention",
      "Back strain from overexertion"
    ],
    serious: [
      "Significant injury during training",
      "Major strain requires extended recovery",
      "Serious knee injury diagnosed"
    ]
  };
  
  const options = descriptions[severity];
  return options[Math.floor(Math.random() * options.length)];
}

// === MONTHLY BOUNDARY (Constitution §A3.3) ===

export function processMonthlyBoundary(
  world: WorldState,
  monthSeed: string
): MonthlyBoundaryResult {
  const rng = seedrandom(monthSeed);
  
  const salaryPayments: SalaryPayment[] = [];
  const koenkaiIncome: KoenkaiIncomeEvent[] = [];
  const heyaExpenses: HeyaExpense[] = [];
  
  // Process salaries for all rikishi
  for (const [id, rikishi] of world.rikishi) {
    const income = calculateMonthlyIncome(rikishi.rank);
    const rankInfo = RANK_HIERARCHY[rikishi.rank];
    
    salaryPayments.push({
      rikishiId: id,
      amount: income,
      type: rankInfo.isSekitori ? "salary" : "allowance"
    });
    
    // Update rikishi economics
    if (rikishi.economics) {
      rikishi.economics.totalEarnings += income;
      
      // Retirement contribution
      const retirementContrib = calculateRetirementContribution(rikishi.rank);
      rikishi.economics.retirementFund += retirementContrib;
    }
  }
  
  // Process heya economics
  for (const [heyaId, heya] of world.heyas) {
    // Kōenkai income
    const koenkaiAmount = calculateKoenkaiIncome(heya.koenkaiBand);
    koenkaiIncome.push({
      heyaId,
      amount: koenkaiAmount,
      band: heya.koenkaiBand
    });
    
    // Monthly expenses (rent, food, utilities, staff, maintenance)
    const rosterSize = heya.rikishiIds.length;
    const expenseCategories: Array<{ category: HeyaExpense["category"]; baseCost: number }> = [
      { category: "rent", baseCost: 2_000_000 },
      { category: "food", baseCost: 500_000 + rosterSize * 150_000 },
      { category: "utilities", baseCost: 300_000 + rosterSize * 20_000 },
      { category: "staff", baseCost: 1_500_000 },
      { category: "maintenance", baseCost: 200_000 }
    ];
    
    for (const exp of expenseCategories) {
      const variance = 1 + (rng() - 0.5) * 0.1;
      const amount = Math.floor(exp.baseCost * variance);
      
      heyaExpenses.push({
        heyaId,
        category: exp.category,
        amount
      });
    }
    
    // Update heya funds
    const totalIncome = koenkaiAmount;
    const totalExpenses = heyaExpenses
      .filter(e => e.heyaId === heyaId)
      .reduce((sum, e) => sum + e.amount, 0);
    
    heya.funds = (heya.funds || 0) + totalIncome - totalExpenses;
    
    // Update runway band based on new funds
    heya.runwayBand = deriveRunwayBand(heya.funds);
  }
  
  // Calculate economy snapshot
  const totalHeyaFunds = Array.from(world.heyas.values())
    .reduce((sum, h) => sum + (h.funds || 0), 0);
  const totalRikishiFunds = Array.from(world.rikishi.values())
    .reduce((sum, r) => sum + (r.economics?.totalEarnings || 0), 0);
  const avgRunwayWeeks = Array.from(world.heyas.values())
    .reduce((sum, h) => sum + runwayBandToWeeks(h.runwayBand), 0) / world.heyas.size;
  
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

function getDefaultTrainingProfile(): TrainingProfile {
  return {
    intensity: "balanced",
    focus: "neutral",
    styleBias: "neutral",
    recovery: "normal"
  };
}

// === ADVANCE TIME ===

export interface TimeAdvanceResult {
  weeklyResults: WeeklyBoundaryResult[];
  monthlyResults: MonthlyBoundaryResult[];
  newTimeState: TimeState;
}

export function advanceWeeks(
  world: WorldState,
  weeks: number,
  startTimeState: TimeState
): TimeAdvanceResult {
  const weeklyResults: WeeklyBoundaryResult[] = [];
  const monthlyResults: MonthlyBoundaryResult[] = [];
  
  let currentTime = { ...startTimeState };
  
  for (let w = 0; w < weeks; w++) {
    const weekSeed = `${world.seed}-week-${currentTime.weekIndexGlobal}`;
    
    // Process weekly boundary
    const weekResult = processWeeklyBoundary(world, weekSeed);
    weeklyResults.push(weekResult);
    
    // Advance week
    currentTime.week++;
    currentTime.weekIndexGlobal++;
    currentTime.dayIndexGlobal += 7;
    
    // Check for month boundary
    if (currentTime.week > 4) {
      currentTime.week = 1;
      currentTime.month++;
      
      // Month rollover
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
