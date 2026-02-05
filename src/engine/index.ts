 // Engine barrel exports
 // Selective re-exports to avoid conflicts
 
 export * from "./types";
 export * from "./shikona";
 export * from "./saveload";
 export * from "./world";
 export * from "./worldgen";
 export * from "./bout";
 export * from "./schedule";
 export * from "./calendar";
 export * from "./pbp";
 export * from "./narrative";
 export * from "./narrativeDescriptions";
 export * from "./matchmaking";
 export * from "./media";
 export * from "./almanac";
 export * from "./h2h";
 export * from "./lifecycle";
 
 // Selective exports to avoid conflicts
 export { RANK_HIERARCHY, updateBanzuke, determineSpecialPrizes, isKachiKoshi, isMakeKoshi } from "./banzuke";
 export { generateScoutCandidates, recruitCandidate, RANK_NAMES } from "./scouting";
 export { tickWeek as economicsTickWeek, onBoutResolved as onBoutResolvedEconomics } from "./economics";
 export { applyWeeklyTraining, getCareerPhase, computeTrainingMultipliers, PHASE_EFFECTS } from "./training";
 export { advanceWeeks, processWeeklyBoundary, processMonthlyBoundary, applyWeeklyScouting } from "./timeBoundary";
 export { generateWeeklyDigest } from "./uiDigest";
 export type { DigestItem, DigestSection, UIDigest } from "./uiDigest";
