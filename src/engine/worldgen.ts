// World Generation System - Deterministic seed-based world creation
// Follows Foundations Contract v1.0

import seedrandom from "seedrandom";
import type { 
  Rikishi, Heya, WorldState, BashoName, BashoState, 
  Style, TacticalArchetype, Rank, Division 
} from "./types";
import { BASHO_ORDER } from "./calendar";
import { initializeEconomics } from "./economics";

// === SHIKONA REGISTRY ===

const SHIKONA_PARTS = {
  prefix: [
    "Taka", "Waka", "Asa", "Koto", "Tochi", "Haku", "Kai", "Teru", 
    "Mitake", "Ichi", "Tobi", "Ao", "Daiei", "Kiyo", "Sei", "Sho",
    "Kiri", "Ryū", "Ōho", "Tama", "Nishi", "Ura", "Endo", "Ōno",
    "Miya", "Kise", "Ama", "Kak", "Hiro", "Masa", "Tomo", "Hide"
  ],
  suffix: [
    "ryū", "yama", "umi", "fuji", "shō", "nishiki", "noshin", 
    "kaze", "arashi", "zakura", "hana", "maru", "shū", "ōmi",
    "waka", "nami", "ho", "sei", "hō", "zan", "shima", "ishi"
  ]
};

const HEYA_NAMES = [
  { id: "miyagino", name: "Miyagino-beya", nameJa: "宮城野部屋" },
  { id: "kasugano", name: "Kasugano-beya", nameJa: "春日野部屋" },
  { id: "takasago", name: "Takasago-beya", nameJa: "高砂部屋" },
  { id: "dewanoumi", name: "Dewanoumi-beya", nameJa: "出羽海部屋" },
  { id: "tokitsukaze", name: "Tokitsukaze-beya", nameJa: "時津風部屋" },
  { id: "nishonoseki", name: "Nishonoseki-beya", nameJa: "二所ノ関部屋" },
  { id: "isegahama", name: "Isegahama-beya", nameJa: "伊勢ヶ濱部屋" },
  { id: "kokonoe", name: "Kokonoe-beya", nameJa: "九重部屋" },
  { id: "tatsunami", name: "Tatsunami-beya", nameJa: "立浪部屋" },
  { id: "sadogatake", name: "Sadogatake-beya", nameJa: "佐渡ヶ嶽部屋" },
  { id: "oitekaze", name: "Oitekaze-beya", nameJa: "追手風部屋" },
  { id: "kataonami", name: "Kataonami-beya", nameJa: "片男波部屋" },
];

const NATIONALITIES = [
  { code: "JP", name: "Japan", weight: 75 },
  { code: "MN", name: "Mongolia", weight: 8 },
  { code: "GE", name: "Georgia", weight: 3 },
  { code: "BG", name: "Bulgaria", weight: 2 },
  { code: "US", name: "USA", weight: 2 },
  { code: "BR", name: "Brazil", weight: 2 },
  { code: "PH", name: "Philippines", weight: 2 },
  { code: "EG", name: "Egypt", weight: 1 },
  { code: "CN", name: "China", weight: 2 },
  { code: "UA", name: "Ukraine", weight: 1 },
];

// === GENERATION HELPERS ===

function seededShuffle<T>(array: T[], rng: seedrandom.PRNG): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function seededChoice<T>(array: T[], rng: seedrandom.PRNG): T {
  return array[Math.floor(rng() * array.length)];
}

function seededWeightedChoice<T extends { weight: number }>(
  items: T[], 
  rng: seedrandom.PRNG
): T {
  const total = items.reduce((sum, item) => sum + item.weight, 0);
  let roll = rng() * total;
  for (const item of items) {
    roll -= item.weight;
    if (roll <= 0) return item;
  }
  return items[items.length - 1];
}

function gaussianRandom(rng: seedrandom.PRNG, mean: number, stdDev: number): number {
  const u1 = rng();
  const u2 = rng();
  const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  return mean + z * stdDev;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

// === RIKISHI GENERATION ===

interface RikishiGenerationConfig {
  targetRank: Rank;
  division: Division;
  heyaId: string;
}

function generateShikona(rng: seedrandom.PRNG, usedNames: Set<string>): string {
  let attempts = 0;
  while (attempts < 100) {
    const prefix = seededChoice(SHIKONA_PARTS.prefix, rng);
    const suffix = seededChoice(SHIKONA_PARTS.suffix, rng);
    const name = prefix + suffix;
    
    if (!usedNames.has(name.toLowerCase())) {
      usedNames.add(name.toLowerCase());
      return name;
    }
    attempts++;
  }
  // Fallback with number
  const num = Math.floor(rng() * 100);
  return `Rikishi${num}`;
}

function generateRikishi(
  rng: seedrandom.PRNG, 
  config: RikishiGenerationConfig,
  usedNames: Set<string>,
  id: string
): Rikishi {
  const shikona = generateShikona(rng, usedNames);
  const nationality = seededWeightedChoice(NATIONALITIES, rng);
  
  // Physical attributes based on rank
  const rankMultiplier = getRankMultiplier(config.targetRank);
  
  const height = Math.round(gaussianRandom(rng, 180, 8));
  const weight = Math.round(gaussianRandom(rng, 140 + rankMultiplier * 15, 20));
  
  // Stats based on rank with variance
  const baseStats = 40 + rankMultiplier * 12;
  const statVariance = 15;
  
  const power = clamp(Math.round(gaussianRandom(rng, baseStats, statVariance)), 20, 100);
  const speed = clamp(Math.round(gaussianRandom(rng, baseStats, statVariance)), 20, 100);
  const balance = clamp(Math.round(gaussianRandom(rng, baseStats, statVariance)), 20, 100);
  const technique = clamp(Math.round(gaussianRandom(rng, baseStats, statVariance)), 20, 100);
  const aggression = clamp(Math.round(gaussianRandom(rng, 50, 20)), 20, 100);
  const experience = clamp(Math.round(gaussianRandom(rng, baseStats, statVariance)), 20, 100);
  
  // Style and archetype based on stats
  const style = determineStyle(power, speed, technique, rng);
  const archetype = determineArchetype(style, power, speed, technique, rng);
  
  // Favored kimarite based on style
  const favoredKimarite = selectFavoredKimarite(style, archetype, rng);
  
  // Career record based on experience
  const totalBouts = Math.floor(experience * 10 + rng() * 200);
  const winRate = 0.45 + (rankMultiplier / 10) * 0.1 + rng() * 0.1;
  const careerWins = Math.floor(totalBouts * winRate);
  const careerLosses = totalBouts - careerWins;
  
  return {
    id,
    shikona,
    heyaId: config.heyaId,
    nationality: nationality.name,
    height,
    weight,
    power,
    speed,
    balance,
    technique,
    aggression,
    experience,
    momentum: Math.floor(rng() * 11) - 5,
    stamina: 100,
    injured: rng() < 0.05,
    injuryWeeksRemaining: 0,
    style,
    archetype,
    division: config.division,
    rank: config.targetRank,
    rankNumber: getRankNumber(config.targetRank, rng),
    side: rng() < 0.5 ? "east" : "west",
    careerWins,
    careerLosses,
    currentBashoWins: 0,
    currentBashoLosses: 0,
    favoredKimarite,
    weakAgainstStyles: determineWeaknesses(style, rng),
    economics: {
      ...initializeEconomics(),
      retirementFund: Math.floor(careerWins * 50000 + rng() * 10000000),
      careerKenshoWon: Math.floor(careerWins * 0.3 + rng() * 100),
      kinboshiCount: config.targetRank === "maegashira" ? Math.floor(rng() * 4) : 0,
      totalEarnings: Math.floor(careerWins * 100000 + rng() * 20000000),
      popularity: clamp(Math.round(gaussianRandom(rng, 50, 20)), 10, 100)
    }
  };
}

function getRankMultiplier(rank: Rank): number {
  const multipliers: Record<Rank, number> = {
    yokozuna: 5,
    ozeki: 4.5,
    sekiwake: 4,
    komusubi: 3.8,
    maegashira: 3,
    juryo: 2.5,
    makushita: 2,
    sandanme: 1.5,
    jonidan: 1,
    jonokuchi: 0.5
  };
  return multipliers[rank] || 1;
}

function getRankNumber(rank: Rank, rng: seedrandom.PRNG): number | undefined {
  if (rank === "maegashira") return Math.floor(rng() * 17) + 1;
  if (rank === "juryo") return Math.floor(rng() * 14) + 1;
  if (rank === "makushita") return Math.floor(rng() * 60) + 1;
  return undefined;
}

function determineStyle(power: number, speed: number, technique: number, rng: seedrandom.PRNG): Style {
  if (power > speed + 10 && power > technique) return "oshi";
  if (technique > power && technique > speed) return "yotsu";
  if (speed > power + 10) return rng() < 0.5 ? "hybrid" : "oshi";
  return rng() < 0.5 ? "hybrid" : "yotsu";
}

function determineArchetype(
  style: Style, 
  power: number, 
  speed: number, 
  technique: number,
  rng: seedrandom.PRNG
): TacticalArchetype {
  if (style === "oshi" && power > 75) return "oshi_specialist";
  if (style === "yotsu" && technique > 75) return "yotsu_specialist";
  if (speed > 80) return "speedster";
  if (rng() < 0.15) return "trickster";
  return "all_rounder";
}

function selectFavoredKimarite(
  style: Style, 
  archetype: TacticalArchetype, 
  rng: seedrandom.PRNG
): string[] {
  const kimariteByStyle: Record<Style, string[]> = {
    oshi: ["oshidashi", "tsukidashi", "oshitaoshi", "hatakikomi"],
    yotsu: ["yorikiri", "uwatenage", "shitatenage", "sotogake"],
    hybrid: ["yorikiri", "oshidashi", "hatakikomi", "kotenage"]
  };
  
  const pool = kimariteByStyle[style];
  const count = 2 + Math.floor(rng() * 2);
  return seededShuffle(pool, rng).slice(0, count);
}

function determineWeaknesses(style: Style, rng: seedrandom.PRNG): Style[] {
  if (rng() < 0.3) return [];
  
  const weaknesses: Record<Style, Style[]> = {
    oshi: ["yotsu"],
    yotsu: ["oshi"],
    hybrid: []
  };
  
  return weaknesses[style] || [];
}

// === HEYA GENERATION ===

function generateHeya(
  rng: seedrandom.PRNG,
  heyaInfo: typeof HEYA_NAMES[0],
  rikishiIds: string[]
): Heya {
  const prestige = clamp(Math.round(gaussianRandom(rng, 50, 20)), 10, 100);
  
  return {
    id: heyaInfo.id,
    name: heyaInfo.name,
    oyakataId: `oyakata-${heyaInfo.id}`,
    rikishiIds,
    reputation: prestige,
    funds: Math.floor(10_000_000 + rng() * 90_000_000),
    facilities: {
      training: clamp(Math.round(gaussianRandom(rng, 50, 15)), 20, 100),
      recovery: clamp(Math.round(gaussianRandom(rng, 50, 15)), 20, 100),
      nutrition: clamp(Math.round(gaussianRandom(rng, 50, 15)), 20, 100)
    }
  };
}

// === BANZUKE GENERATION ===

interface BanzukeSlot {
  rank: Rank;
  division: Division;
  count: number;
}

const BANZUKE_TEMPLATE: BanzukeSlot[] = [
  { rank: "yokozuna", division: "makuuchi", count: 2 },
  { rank: "ozeki", division: "makuuchi", count: 3 },
  { rank: "sekiwake", division: "makuuchi", count: 2 },
  { rank: "komusubi", division: "makuuchi", count: 2 },
  { rank: "maegashira", division: "makuuchi", count: 33 },
  { rank: "juryo", division: "juryo", count: 28 },
  { rank: "makushita", division: "makushita", count: 60 },
  { rank: "sandanme", division: "sandanme", count: 50 },
  { rank: "jonidan", division: "jonidan", count: 40 },
  { rank: "jonokuchi", division: "jonokuchi", count: 20 },
];

// === WORLD GENERATION ===

export interface WorldGenConfig {
  seed: string;
  startYear?: number;
  startBasho?: BashoName;
}

export function generateWorld(config: WorldGenConfig): WorldState {
  const rng = seedrandom(config.seed);
  const usedNames = new Set<string>();
  
  const year = config.startYear || 2024;
  const startBasho = config.startBasho || "hatsu";
  
  // Generate heya
  const heyaList = seededShuffle(HEYA_NAMES, rng).slice(0, 10);
  const heyas = new Map<string, Heya>();
  const allRikishi = new Map<string, Rikishi>();
  
  let rikishiCounter = 0;
  
  // Distribute rikishi across heya and ranks
  for (const slot of BANZUKE_TEMPLATE) {
    const rikishiPerHeya = Math.ceil(slot.count / heyaList.length);
    let remaining = slot.count;
    
    for (const heyaInfo of heyaList) {
      if (remaining <= 0) break;
      
      const count = Math.min(rikishiPerHeya, remaining);
      remaining -= count;
      
      for (let i = 0; i < count; i++) {
        const id = `r-${++rikishiCounter}`;
        const rikishi = generateRikishi(rng, {
          targetRank: slot.rank,
          division: slot.division,
          heyaId: heyaInfo.id
        }, usedNames, id);
        
        allRikishi.set(id, rikishi);
      }
    }
  }
  
  // Assign east/west properly
  assignBanzukePositions(allRikishi, rng);
  
  // Create heya with their rikishi
  for (const heyaInfo of heyaList) {
    const rikishiIds = Array.from(allRikishi.values())
      .filter(r => r.heyaId === heyaInfo.id)
      .map(r => r.id);
    
    heyas.set(heyaInfo.id, generateHeya(rng, heyaInfo, rikishiIds));
  }
  
  return {
    seed: config.seed,
    year,
    week: 1,
    currentBashoName: startBasho,
    heyas,
    rikishi: allRikishi,
    currentBasho: undefined,
    history: []
  };
}

function assignBanzukePositions(
  rikishi: Map<string, Rikishi>, 
  rng: seedrandom.PRNG
): void {
  const byRank = new Map<Rank, Rikishi[]>();
  
  for (const r of rikishi.values()) {
    const list = byRank.get(r.rank) || [];
    list.push(r);
    byRank.set(r.rank, list);
  }
  
  for (const [rank, wrestlers] of byRank) {
    // Sort by power score for ranking
    const sorted = wrestlers.sort((a, b) => {
      const scoreA = a.power + a.technique + a.experience;
      const scoreB = b.power + b.technique + b.experience;
      return scoreB - scoreA;
    });
    
    let rankNum = 1;
    let side: "east" | "west" = "east";
    
    for (const wrestler of sorted) {
      wrestler.side = side;
      if (rank === "maegashira" || rank === "juryo" || rank === "makushita") {
        wrestler.rankNumber = rankNum;
      }
      
      // Alternate sides
      if (side === "west") rankNum++;
      side = side === "east" ? "west" : "east";
    }
  }
}

// === BASHO INITIALIZATION ===

export function initializeBasho(
  world: WorldState, 
  bashoName: BashoName
): BashoState {
  const bashoNumber = (BASHO_ORDER.indexOf(bashoName) + 1) as 1 | 2 | 3 | 4 | 5 | 6;
  
  // Reset rikishi basho stats
  for (const rikishi of world.rikishi.values()) {
    rikishi.currentBashoWins = 0;
    rikishi.currentBashoLosses = 0;
    if (rikishi.economics) {
      rikishi.economics.currentBashoEarnings = 0;
    }
  }
  
  return {
    year: world.year,
    bashoNumber,
    bashoName,
    day: 1,
    matches: [],
    standings: new Map()
  };
}

// === SCHEDULE GENERATION ===

export function generateDaySchedule(
  world: WorldState,
  basho: BashoState,
  day: number,
  seed: string
): void {
  const rng = seedrandom(`${seed}-day${day}`);
  
  // Get active rikishi by division
  const makuuchi = Array.from(world.rikishi.values())
    .filter(r => r.division === "makuuchi" && !r.injured);
  
  const juryo = Array.from(world.rikishi.values())
    .filter(r => r.division === "juryo" && !r.injured);
  
  // Create matchups avoiding same-heya and recent opponents
  const makuuchiMatches = createMatchups(makuuchi, basho, rng);
  const juryoMatches = createMatchups(juryo, basho, rng);
  
  // Add to schedule
  for (const match of [...juryoMatches, ...makuuchiMatches]) {
    basho.matches.push({
      day,
      eastRikishiId: match.east,
      westRikishiId: match.west
    });
  }
}

function createMatchups(
  rikishi: Rikishi[],
  basho: BashoState,
  rng: seedrandom.PRNG
): { east: string; west: string }[] {
  const matches: { east: string; west: string }[] = [];
  const used = new Set<string>();
  
  // Get previous opponents
  const previousOpponents = new Map<string, Set<string>>();
  for (const match of basho.matches) {
    const eastOpp = previousOpponents.get(match.eastRikishiId) || new Set();
    eastOpp.add(match.westRikishiId);
    previousOpponents.set(match.eastRikishiId, eastOpp);
    
    const westOpp = previousOpponents.get(match.westRikishiId) || new Set();
    westOpp.add(match.eastRikishiId);
    previousOpponents.set(match.westRikishiId, westOpp);
  }
  
  // Sort by current record (similar records face each other)
  const sorted = [...rikishi].sort((a, b) => {
    const aWins = basho.standings.get(a.id)?.wins || 0;
    const bWins = basho.standings.get(b.id)?.wins || 0;
    return bWins - aWins;
  });
  
  for (let i = 0; i < sorted.length; i++) {
    const east = sorted[i];
    if (used.has(east.id)) continue;
    
    // Find opponent
    for (let j = i + 1; j < sorted.length; j++) {
      const west = sorted[j];
      if (used.has(west.id)) continue;
      if (west.heyaId === east.heyaId) continue; // Same stable
      if (previousOpponents.get(east.id)?.has(west.id)) continue;
      
      matches.push({ east: east.id, west: west.id });
      used.add(east.id);
      used.add(west.id);
      break;
    }
  }
  
  return seededShuffle(matches, rng);
}
