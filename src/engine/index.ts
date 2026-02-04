// index.ts
// Basho Engine Public API
// Simple re-export barrel - avoids duplicate export issues by being selective

// Core types - single source of truth
export * from "./types";

// Kimarite - exclude duplicate types
export {
  type Kimarite,
  type KimariteCategory,
  KIMARITE_REGISTRY,
  KIMARITE_REGISTRY_APPEND,
  KIMARITE_ALL,
  getKimarite,
  getKimariteByCategory,
  getKimariteByClass,
  getKimariteForStance,
  getKimariteForStyle,
  getKimariteForArchetype,
  getKimariteCount
} from "./kimarite";

// Leverage - exclude duplicate types
export {
  type LeverageClassProfile,
  LEVERAGE_PROFILES,
  computeLeverageClass,
  kimariteToFamily,
  getLeverageBias,
  getLeverageMultiplier,
  getLeverageBiasDelta,
  getStabilityBonus,
  getMobilityBonus
} from "./leverageClass";

export * from "./bout";
export * from "./calendar";

// Banzuke - export selectively to avoid conflicts with other modules
export {
  type RankInfo,
  RANK_HIERARCHY,
  compareRanks,
  formatRank,
  getRankTitleJa,
  isKachiKoshi,
  isMakeKoshi,
  kachiKoshiThreshold,
  type OzekiKadobanState,
  type OzekiKadobanMap,
  getOzekiStatus,
  type BanzukeEntry,
  type BashoPerformance,
  type MovementEvent,
  type BanzukeUpdateResult,
  updateBanzuke
} from "./banzuke";

export * from "./economics";

// Training - exclude duplicate types
export {
  INTENSITY_EFFECTS,
  RECOVERY_EFFECTS,
  FOCUS_EFFECTS,
  FOCUS_MODE_EFFECTS,
  type CareerPhase,
  PHASE_EFFECTS,
  getCareerPhase,
  getMaxFocusSlots,
  createDefaultTrainingProfile,
  createDefaultTrainingState,
  sanitizeFocusSlots,
  setFocusSlot,
  clearFocusSlot,
  getIndividualFocusMode,
  type TrainingMultipliers,
  computeTrainingMultipliers,
  getIntensityLabel,
  getFocusLabel,
  getStyleBiasLabel,
  getRecoveryLabel,
  getFocusModeLabel
} from "./training";

// TimeBoundary - rename InjuryEvent to avoid conflict
export {
  type TimeState,
  type WeeklyBoundaryResult,
  type MonthlyBoundaryResult,
  type TrainingEvent,
  type ScoutingEvent,
  type InjuryEvent as TimeBoundaryInjuryEvent,
  type SalaryPayment,
  type KoenkaiIncomeEvent,
  type HeyaExpense,
  type EconomySnapshot,
  processWeeklyBoundary,
  processMonthlyBoundary
} from "./timeBoundary";

export * from "./shikona";

// Scouting - these types are also in types.ts but we need the functions
export {
  type AttributeType,
  type PublicRikishiInfo,
  type ScoutedAttributeTruthSnapshot,
  type ScoutedRikishi,
  type ScoutedAttribute,
  calculateScoutingLevel,
  getConfidenceFromLevel,
  getConfidenceLevel,
  getEstimatedValue
} from "./scouting";

export * from "./pbp";
export * from "./media";
export * from "./saveload";
export * from "./almanac";
export * from "./historyIndex";
export * from "./matchmaking";
export * from "./schedule";
export * from "./worldgen";
export * from "./autoSim";
export * from "./oyakataPersonalities";
export * from "./npcAI";
export * from "./rivalries";

// Injuries - export selectively to avoid PromotionEvent/DemotionEvent conflicts
export {
  type InjurySeverity,
  type InjuryBodyArea,
  type InjuryType,
  type InjuryRecord,
  type InjuriesState,
  createDefaultInjuriesState,
  applyInjuryRecord
} from "./injuries";

export * from "./events";
export * from "./uiDigest";

// uiModels - exclude ScoutingInvestment duplicate, export what exists
export {
  type UILocale,
  type UIText,
  type UIIconRef,
  type UIChip,
  type Yen,
  type UITimeState,
  type UIPublicRikishi,
  type UIScoutedAttribute,
  type UIScoutedAttributes,
  type UIScoutingSummary,
  type UIRikishiScoutView,
  type UIStatureBand,
  type UIPrestigeBand,
  type UIFacilitiesBand,
  type UIKoenkaiBand,
  type UIRunwayBand,
  type UIHeyaSummary
} from "./uiModels";

export * from "./mockData";
