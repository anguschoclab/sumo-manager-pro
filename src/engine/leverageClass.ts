// Leverage Class System
// Per Constitution: Computed from physique, affects kimarite viability and physics

export type LeverageClass = 
  | "CompactAnchor"  // Short, low center of gravity - hard to move
  | "LongLever"      // Tall with reach - grip advantage
  | "TopHeavy"       // High center of mass - vulnerable to trips/pulls
  | "MobileLight"    // Light and agile - angles and escapes
  | "Standard";      // Baseline

export interface LeverageClassProfile {
  name: LeverageClass;
  description: string;
  oshiBias: number;
  yotsuBias: number;
  throwBias: number;
  tripBias: number;
  pulldownBias: number;
  reversalBias: number;
  stabilityBonus: number;
  mobilityBonus: number;
}

// Constitution Section 8.2: LeverageClass × KimariteFamily Physical Bias
export const LEVERAGE_PROFILES: Record<LeverageClass, LeverageClassProfile> = {
  CompactAnchor: {
    name: "CompactAnchor",
    description: "Low center of gravity, hard to move, strong base",
    oshiBias: 1.20,
    yotsuBias: 1.10,
    throwBias: 0.95,
    tripBias: 0.85,
    pulldownBias: 0.95,
    reversalBias: 0.90,
    stabilityBonus: 12,
    mobilityBonus: -5
  },
  LongLever: {
    name: "LongLever",
    description: "Tall with reach advantage, grip leverage",
    oshiBias: 0.95,
    yotsuBias: 1.20,
    throwBias: 1.20,
    tripBias: 0.95,
    pulldownBias: 0.90,
    reversalBias: 1.10,
    stabilityBonus: -3,
    mobilityBonus: 5
  },
  TopHeavy: {
    name: "TopHeavy",
    description: "High center of mass, vulnerable to trips and pulls",
    oshiBias: 1.10,
    yotsuBias: 0.95,
    throwBias: 0.90,
    tripBias: 0.80,
    pulldownBias: 1.25,
    reversalBias: 0.85,
    stabilityBonus: -8,
    mobilityBonus: 0
  },
  MobileLight: {
    name: "MobileLight",
    description: "Light and agile, excels at angles and escapes",
    oshiBias: 0.90,
    yotsuBias: 0.90,
    throwBias: 0.95,
    tripBias: 1.25,
    pulldownBias: 1.05,
    reversalBias: 1.10,
    stabilityBonus: -5,
    mobilityBonus: 15
  },
  Standard: {
    name: "Standard",
    description: "Balanced physique, no particular advantages or weaknesses",
    oshiBias: 1.00,
    yotsuBias: 1.00,
    throwBias: 1.00,
    tripBias: 1.00,
    pulldownBias: 1.00,
    reversalBias: 1.00,
    stabilityBonus: 0,
    mobilityBonus: 0
  }
};

// Compute leverage class from height and weight
// Per Constitution: deterministic based on body geometry
export function computeLeverageClass(height: number, weight: number): LeverageClass {
  const bmi = weight / ((height / 100) ** 2);
  const heightCategory = height < 175 ? "short" : height > 188 ? "tall" : "average";
  
  // Compact Anchor: Short with high BMI (low center of gravity)
  if (heightCategory === "short" && bmi > 38) {
    return "CompactAnchor";
  }
  
  // Long Lever: Tall with moderate BMI
  if (heightCategory === "tall" && bmi >= 28 && bmi <= 42) {
    return "LongLever";
  }
  
  // Top Heavy: Tall with high BMI
  if (heightCategory === "tall" && bmi > 42) {
    return "TopHeavy";
  }
  
  // Mobile Light: Any height with low weight
  if (weight < 120) {
    return "MobileLight";
  }
  
  // Standard: Everything else
  return "Standard";
}

// Get narrative description of leverage class for UI
export function describeLeverageClass(leverageClass: LeverageClass): string {
  const profile = LEVERAGE_PROFILES[leverageClass];
  return profile.description;
}

// Apply leverage class bias to kimarite selection weights
export function getLeverageBias(
  leverageClass: LeverageClass,
  kimariteFamily: "OSHI" | "YOTSU" | "THROW" | "TRIP" | "PULLDOWN" | "REVERSAL" | "SPECIAL"
): number {
  const profile = LEVERAGE_PROFILES[leverageClass];
  
  switch (kimariteFamily) {
    case "OSHI":
      return profile.oshiBias;
    case "YOTSU":
      return profile.yotsuBias;
    case "THROW":
      return profile.throwBias;
    case "TRIP":
      return profile.tripBias;
    case "PULLDOWN":
      return profile.pulldownBias;
    case "REVERSAL":
      return profile.reversalBias;
    case "SPECIAL":
      return 1.0; // Neutral for special moves
    default:
      return 1.0;
  }
}
