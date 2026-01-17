// Auto-Sim and Observer Mode System
// Per Constitution §7: Auto-Sim "Watch the World" Mode
// Allows hands-off simulation with configurable duration and stop conditions

import seedrandom from "seedrandom";
import type { WorldState, BashoName, BoutResult, Rikishi } from "./types";
import { simulateBout } from "./bout";
import { getNextBasho, BASHO_CALENDAR } from "./calendar";
import { advanceWeeks, processWeeklyBoundary, processMonthlyBoundary, type TimeState } from "./timeBoundary";
import { RANK_HIERARCHY, isKachiKoshi, isMakeKoshi } from "./banzuke";
import { initializeBasho, generateDaySchedule } from "./worldgen";

// === AUTO-SIM CONFIGURATION ===

export type SimDuration = 
  | { type: "days"; count: number }
  | { type: "weeks"; count: number }
  | { type: "months"; count: number }
  | { type: "basho"; count: number }
  | { type: "years"; count: number }
  | { type: "untilEvent"; eventType: StopCondition };

export type StopCondition = 
  | "yokozunaPromotion"
  | "ozekiPromotion"
  | "yusho"
  | "stableInsolvency"
  | "majorInjury"
  | "scandal"
  | "retirementOfStar"
  | "never";

export type VerbosityLevel = "minimal" | "standard" | "detailed";

export interface AutoSimConfig {
  duration: SimDuration;
  stopConditions: StopCondition[];
  verbosity: VerbosityLevel;
  delegationPolicy: "conservative" | "balanced" | "aggressive";
  observerMode: boolean; // true = no player stable, pure world sim
  playerHeyaId?: string;
}

export interface AutoSimResult {
  startYear: number;
  endYear: number;
  bashoSimulated: number;
  daysSimulated: number;
  stoppedBy: StopCondition | "completed";
  chronicle: ChronicleReport;
  finalWorld: WorldState;
}

export interface ChronicleReport {
  topChampions: ChampionEntry[];
  biggestScandals: string[];
  greatestRivalries: RivalryEntry[];
  eraLabels: string[];
  recordsBroken: RecordEntry[];
  highlights: string[];
}

export interface ChampionEntry {
  rikishiId: string;
  shikona: string;
  yushoCount: number;
  bestRank: string;
}

export interface RivalryEntry {
  eastId: string;
  westId: string;
  eastName: string;
  westName: string;
  meetingCount: number;
  description: string;
}

export interface RecordEntry {
  type: string;
  holder: string;
  value: string;
  brokenOn: string;
}

// === BASHO SIMULATION ===

export interface BashoSimResult {
  bashoName: BashoName;
  year: number;
  yushoWinner: { id: string; shikona: string; wins: number; losses: number };
  junYusho: string[];
  standings: Map<string, { wins: number; losses: number }>;
  keyBouts: BoutResult[];
  injuries: string[];
  promotions: PromotionEvent[];
  demotions: DemotionEvent[];
}

export interface PromotionEvent {
  rikishiId: string;
  from: string;
  to: string;
  description: string;
}

export interface DemotionEvent {
  rikishiId: string;
  from: string;
  to: string;
  description: string;
}

export function simulateEntireBasho(
  world: WorldState,
  bashoName: BashoName,
  seed: string
): BashoSimResult {
  const rng = seedrandom(seed);
  const basho = initializeBasho(world, bashoName);
  const standings = new Map<string, { wins: number; losses: number }>();
  const keyBouts: BoutResult[] = [];
  const injuries: string[] = [];
  
  // Initialize standings
  for (const [id, rikishi] of world.rikishi) {
    if (rikishi.division === "makuuchi" || rikishi.division === "juryo") {
      standings.set(id, { wins: 0, losses: 0 });
      rikishi.currentBashoWins = 0;
      rikishi.currentBashoLosses = 0;
    }
  }
  
  // Simulate all 15 days
  for (let day = 1; day <= 15; day++) {
    generateDaySchedule(world, basho, day, seed);
    
    const dayMatches = basho.matches.filter(m => m.day === day && !m.result);
    
    for (let boutIndex = 0; boutIndex < dayMatches.length; boutIndex++) {
      const match = dayMatches[boutIndex];
      const east = world.rikishi.get(match.eastRikishiId);
      const west = world.rikishi.get(match.westRikishiId);
      
      if (!east || !west) continue;
      if (east.injured || west.injured) continue;
      
      const boutSeed = `${seed}-d${day}-b${boutIndex}`;
      const result = simulateBout(east, west, boutSeed);
      match.result = result;
      
      // Update records
      const winner = result.winner === "east" ? east : west;
      const loser = result.winner === "east" ? west : east;
      
      winner.currentBashoWins++;
      winner.careerWins++;
      loser.currentBashoLosses++;
      loser.careerLosses++;
      
      const winnerStanding = standings.get(winner.id) || { wins: 0, losses: 0 };
      const loserStanding = standings.get(loser.id) || { wins: 0, losses: 0 };
      standings.set(winner.id, { wins: winnerStanding.wins + 1, losses: winnerStanding.losses });
      standings.set(loser.id, { wins: loserStanding.wins, losses: loserStanding.losses + 1 });
      
      // Track key bouts (upsets, high-rank, senshuraku)
      if (result.upset || day === 15 || 
          RANK_HIERARCHY[east.rank].tier <= 2 || 
          RANK_HIERARCHY[west.rank].tier <= 2) {
        keyBouts.push(result);
      }
      
      // Random injury check during basho
      if (rng() < 0.003) {
        const injured = rng() < 0.5 ? winner : loser;
        injured.injured = true;
        injured.injuryWeeksRemaining = 2 + Math.floor(rng() * 4);
        injuries.push(injured.shikona);
      }
    }
  }
  
  // Determine yusho winner
  const sortedStandings = Array.from(standings.entries())
    .map(([id, record]) => ({
      id,
      rikishi: world.rikishi.get(id)!,
      ...record
    }))
    .filter(s => s.rikishi)
    .sort((a, b) => b.wins - a.wins || a.losses - b.losses);
  
  const yushoEntry = sortedStandings[0];
  const yushoWinner = {
    id: yushoEntry?.id || "",
    shikona: yushoEntry?.rikishi.shikona || "Unknown",
    wins: yushoEntry?.wins || 0,
    losses: yushoEntry?.losses || 0
  };
  
  // Jun-yusho (runner-up, same wins as 2nd place)
  const junYusho = sortedStandings
    .filter(s => s.id !== yushoEntry?.id && s.wins === sortedStandings[1]?.wins)
    .map(s => s.rikishi.shikona);
  
  // Calculate promotions/demotions
  const promotions: PromotionEvent[] = [];
  const demotions: DemotionEvent[] = [];
  
  for (const [id, record] of standings) {
    const rikishi = world.rikishi.get(id);
    if (!rikishi) continue;
    
    const kk = isKachiKoshi(record.wins, record.losses);
    const mk = isMakeKoshi(record.wins, record.losses);
    
    if (kk && canPromote(rikishi.rank)) {
      const newRank = getPromotedRank(rikishi.rank, record.wins);
      if (newRank !== rikishi.rank) {
        promotions.push({
          rikishiId: id,
          from: rikishi.rank,
          to: newRank,
          description: `${rikishi.shikona} promoted from ${rikishi.rank} to ${newRank}`
        });
      }
    } else if (mk && canDemote(rikishi.rank)) {
      const newRank = getDemotedRank(rikishi.rank);
      if (newRank !== rikishi.rank) {
        demotions.push({
          rikishiId: id,
          from: rikishi.rank,
          to: newRank,
          description: `${rikishi.shikona} demoted from ${rikishi.rank} to ${newRank}`
        });
      }
    }
  }
  
  return {
    bashoName,
    year: world.year,
    yushoWinner,
    junYusho,
    standings,
    keyBouts,
    injuries,
    promotions,
    demotions
  };
}

// === FULL AUTO-SIM ===

export function runAutoSim(
  world: WorldState,
  config: AutoSimConfig
): AutoSimResult {
  const startYear = world.year;
  let bashoSimulated = 0;
  let daysSimulated = 0;
  let stoppedBy: StopCondition | "completed" = "completed";
  
  const chronicle: ChronicleReport = {
    topChampions: [],
    biggestScandals: [],
    greatestRivalries: [],
    eraLabels: [],
    recordsBroken: [],
    highlights: []
  };
  
  // Track champions
  const championCounts = new Map<string, number>();
  
  // Calculate target based on duration
  let targetBasho = 0;
  switch (config.duration.type) {
    case "days":
      targetBasho = Math.ceil(config.duration.count / 15);
      break;
    case "weeks":
      targetBasho = Math.ceil(config.duration.count / 3);
      break;
    case "months":
      targetBasho = config.duration.count / 2;
      break;
    case "basho":
      targetBasho = config.duration.count;
      break;
    case "years":
      targetBasho = config.duration.count * 6;
      break;
    case "untilEvent":
      targetBasho = 600; // Max 100 years
      break;
  }
  
  // Main simulation loop
  while (bashoSimulated < targetBasho) {
    const bashoName = world.currentBashoName || "hatsu";
    const bashoSeed = `${world.seed}-basho-${world.year}-${bashoName}`;
    
    // Simulate the basho
    const bashoResult = simulateEntireBasho(world, bashoName, bashoSeed);
    bashoSimulated++;
    daysSimulated += 15;
    
    // Track champion
    const prevCount = championCounts.get(bashoResult.yushoWinner.id) || 0;
    championCounts.set(bashoResult.yushoWinner.id, prevCount + 1);
    
    // Add highlight
    if (config.verbosity !== "minimal") {
      chronicle.highlights.push(
        `${bashoName.charAt(0).toUpperCase() + bashoName.slice(1)} ${world.year}: ${bashoResult.yushoWinner.shikona} wins with ${bashoResult.yushoWinner.wins}-${bashoResult.yushoWinner.losses}`
      );
    }
    
    // Check stop conditions
    for (const condition of config.stopConditions) {
      if (checkStopCondition(condition, bashoResult, world, config)) {
        stoppedBy = condition;
        break;
      }
    }
    
    if (stoppedBy !== "completed") break;
    
    // Advance to next basho
    const nextBasho = getNextBasho(bashoName);
    const isNewYear = nextBasho === "hatsu";
    
    // Process inter-basho time (roughly 6-8 weeks)
    const interBashoWeeks = 6 + Math.floor(Math.random() * 3);
    const timeState: TimeState = {
      year: world.year,
      month: BASHO_CALENDAR[bashoName].month,
      week: 3,
      dayIndexGlobal: daysSimulated,
      weekIndexGlobal: Math.floor(daysSimulated / 7),
      phase: "interbasho"
    };
    
    advanceWeeks(world, interBashoWeeks, timeState);
    
    // Update world state
    world.currentBashoName = nextBasho;
    if (isNewYear) {
      world.year++;
    }
    
    // Apply promotions/demotions (simplified - full implementation would use banzuke system)
    // Note: Rank changes would normally go through proper promotion/demotion logic
    
    // Store history
    world.history.push({
      year: bashoResult.year,
      bashoNumber: getBashoNumber(bashoName),
      bashoName,
      yusho: bashoResult.yushoWinner.id,
      junYusho: bashoResult.junYusho,
      prizes: {
        yushoAmount: 10_000_000,
        junYushoAmount: 2_000_000,
        specialPrizes: 2_000_000
      }
    });
  }
  
  // Build chronicle
  chronicle.topChampions = Array.from(championCounts.entries())
    .map(([id, count]) => {
      const rikishi = world.rikishi.get(id);
      return {
        rikishiId: id,
        shikona: rikishi?.shikona || "Unknown",
        yushoCount: count,
        bestRank: rikishi?.rank || "unknown"
      };
    })
    .sort((a, b) => b.yushoCount - a.yushoCount)
    .slice(0, 10);
  
  // Era labels
  if (bashoSimulated >= 6) {
    const topChamp = chronicle.topChampions[0];
    if (topChamp && topChamp.yushoCount >= 3) {
      chronicle.eraLabels.push(`The ${topChamp.shikona} Era (${startYear}-${world.year})`);
    }
  }
  
  return {
    startYear,
    endYear: world.year,
    bashoSimulated,
    daysSimulated,
    stoppedBy,
    chronicle,
    finalWorld: world
  };
}

function checkStopCondition(
  condition: StopCondition,
  bashoResult: BashoSimResult,
  world: WorldState,
  config: AutoSimConfig
): boolean {
  switch (condition) {
    case "yokozunaPromotion":
      return bashoResult.promotions.some(p => p.to === "yokozuna");
    
    case "ozekiPromotion":
      return bashoResult.promotions.some(p => p.to === "ozeki");
    
    case "yusho":
      if (config.playerHeyaId) {
        const winner = world.rikishi.get(bashoResult.yushoWinner.id);
        return winner?.heyaId === config.playerHeyaId;
      }
      return false;
    
    case "stableInsolvency":
      if (config.playerHeyaId) {
        const heya = world.heyas.get(config.playerHeyaId);
        return heya?.runwayBand === "desperate";
      }
      return false;
    
    case "majorInjury":
      if (config.playerHeyaId) {
        const heya = world.heyas.get(config.playerHeyaId);
        if (heya) {
          return bashoResult.injuries.some(name => 
            heya.rikishiIds.some(id => world.rikishi.get(id)?.shikona === name)
          );
        }
      }
      return false;
    
    case "never":
      return false;
    
    default:
      return false;
  }
}

function canPromote(rank: string): boolean {
  return rank !== "yokozuna";
}

function canDemote(rank: string): boolean {
  return !["yokozuna", "jonokuchi"].includes(rank);
}

function getPromotedRank(rank: string, wins: number): string {
  const promotionMap: Record<string, string> = {
    ozeki: wins >= 13 ? "yokozuna" : "ozeki", // Needs consistent great performance
    sekiwake: wins >= 13 ? "ozeki" : "sekiwake", // 33 wins over 3 basho typically
    komusubi: wins >= 10 ? "sekiwake" : "komusubi",
    maegashira: wins >= 10 ? "komusubi" : "maegashira",
    juryo: wins >= 10 ? "maegashira" : "juryo",
    makushita: wins >= 5 ? "juryo" : "makushita",
    sandanme: wins >= 5 ? "makushita" : "sandanme",
    jonidan: wins >= 5 ? "sandanme" : "jonidan",
    jonokuchi: wins >= 5 ? "jonidan" : "jonokuchi"
  };
  return promotionMap[rank] || rank;
}

function getDemotedRank(rank: string): string {
  const demotionMap: Record<string, string> = {
    ozeki: "sekiwake", // Ozeki demotion after losing record
    sekiwake: "komusubi",
    komusubi: "maegashira",
    maegashira: "juryo",
    juryo: "makushita",
    makushita: "sandanme",
    sandanme: "jonidan",
    jonidan: "jonokuchi"
  };
  return demotionMap[rank] || rank;
}

function getBashoNumber(name: BashoName): 1 | 2 | 3 | 4 | 5 | 6 {
  const numbers: Record<BashoName, 1 | 2 | 3 | 4 | 5 | 6> = {
    hatsu: 1, haru: 2, natsu: 3, nagoya: 4, aki: 5, kyushu: 6
  };
  return numbers[name];
}
