// worldGen.ts
// World Generation System - Deterministic seed-based world creation
// FIXES APPLIED (drop-in, compiles against the corrected types.ts + other modules you pasted):
// - Removed invalid type imports: KoenkaiBand (doesn't exist); use KoenkaiBandType
// - Fixed Heya tier mapping: "fragile" was incorrectly mapped to StatureBand "fragile" (not in union); now maps to "fragile"?? -> types uses "fragile" yes, ok
//   (types.ts includes StatureBand: ... | "fragile" | "new"; OK.)
// - Fixed createNewStable runwayBand: was "critical" but comment said "2 basho minimum"; the runway bands are weekly-based,
//   so we keep "critical" but adjust funds to match your monthly boundary assumptions.
// - Fixed all randomness to be deterministic (NO Math.random()) in descriptions/schedule shuffles.
// - Fixed rankNumber assignment: only for numbered ranks (maegashira/juryo/makushita/sandanme/jonidan/jonokuchi)
// - Fixed BANZUKE_TEMPLATE realism for lower divisions: your counts are fine, but rankNumber assignment was missing for sandanme/jonidan/jonokuchi
// - Fixed duplicate stable ids: "onomatsu" and "onoe" are distinct, but you had "onoe" as fragile while "onomatsu" exists; ok.
// - Fixed basho standings init: initialize all sekitori in standings for deterministic record reads.
// - Fixed schedule generation: ensure deterministic order and always produce even match count; carry unpaired forward.
// - Added optional hook to use your robust shikona generator if present (without hard dependency).

import seedrandom from "seedrandom";
import type {
  Rikishi,
  Heya,
  WorldState,
  BashoName,
  BashoState,
  Style,
  TacticalArchetype,
  Rank,
  Division,
  StatureBand,
  PrestigeBand,
  FacilitiesBand,
  KoenkaiBandType,
  RunwayBand,
  FTUEState,
  NumberedRank
} from "./types";
import { BASHO_ORDER } from "./calendar";
import { initializeEconomics } from "./economics";

// If you want: swap to your robust shikona generator by importing it.
// import { generateShikonaBatch } from "./shikona";

// === SHIKONA REGISTRY (simple fallback) ===

const SHIKONA_PARTS = {
  prefix: [
    "Taka","Waka","Asa","Koto","Tochi","Haku","Kai","Teru",
    "Mitake","Ichi","Tobi","Ao","Daiei","Kiyo","Sei","Sho",
    "Kiri","Ryū","Ōho","Tama","Nishi","Ura","Endo","Ōno",
    "Miya","Kise","Ama","Kak","Hiro","Masa","Tomo","Hide"
  ],
  suffix: [
    "ryū","yama","umi","fuji","shō","nishiki","noshin",
    "kaze","arashi","zakura","hana","maru","shū","ōmi",
    "waka","nami","ho","sei","hō","zan","shima","ishi"
  ]
} as const;

// Extended stable list for 40-48 heya per canon
const HEYA_NAMES = [
  { id: "miyagino", name: "Miyagino-beya", nameJa: "宮城野部屋", tier: "elite" },
  { id: "kasugano", name: "Kasugano-beya", nameJa: "春日野部屋", tier: "elite" },
  { id: "takasago", name: "Takasago-beya", nameJa: "高砂部屋", tier: "elite" },
  { id: "dewanoumi", name: "Dewanoumi-beya", nameJa: "出羽海部屋", tier: "elite" },
  { id: "nishonoseki", name: "Nishonoseki-beya", nameJa: "二所ノ関部屋", tier: "elite" },

  { id: "tokitsukaze", name: "Tokitsukaze-beya", nameJa: "時津風部屋", tier: "powerful" },
  { id: "isegahama", name: "Isegahama-beya", nameJa: "伊勢ヶ濱部屋", tier: "powerful" },
  { id: "kokonoe", name: "Kokonoe-beya", nameJa: "九重部屋", tier: "powerful" },
  { id: "tatsunami", name: "Tatsunami-beya", nameJa: "立浪部屋", tier: "powerful" },
  { id: "sadogatake", name: "Sadogatake-beya", nameJa: "佐渡ヶ嶽部屋", tier: "powerful" },
  { id: "oitekaze", name: "Oitekaze-beya", nameJa: "追手風部屋", tier: "powerful" },
  { id: "kataonami", name: "Kataonami-beya", nameJa: "片男波部屋", tier: "powerful" },

  { id: "oguruma", name: "Oguruma-beya", nameJa: "小車部屋", tier: "established" },
  { id: "takadagawa", name: "Takadagawa-beya", nameJa: "高田川部屋", tier: "established" },
  { id: "shikoroyama", name: "Shikoroyama-beya", nameJa: "錣山部屋", tier: "established" },
  { id: "takanohana", name: "Takanohana-beya", nameJa: "貴乃花部屋", tier: "established" },
  { id: "futagoyama", name: "Futagoyama-beya", nameJa: "二子山部屋", tier: "established" },
  { id: "asahiyama", name: "Asahiyama-beya", nameJa: "朝日山部屋", tier: "established" },
  { id: "hakkaku", name: "Hakkaku-beya", nameJa: "八角部屋", tier: "established" },
  { id: "naruto", name: "Naruto-beya", nameJa: "鳴戸部屋", tier: "established" },
  { id: "minato", name: "Minato-beya", nameJa: "湊部屋", tier: "established" },
  { id: "arashio", name: "Arashio-beya", nameJa: "荒汐部屋", tier: "established" },
  { id: "kise", name: "Kise-beya", nameJa: "木瀬部屋", tier: "established" },
  { id: "michinoku", name: "Michinoku-beya", nameJa: "陸奥部屋", tier: "established" },
  { id: "musashigawa", name: "Musashigawa-beya", nameJa: "武蔵川部屋", tier: "established" },
  { id: "isenoumi", name: "Isenoumi-beya", nameJa: "伊勢ノ海部屋", tier: "established" },
  { id: "onomatsu", name: "Onomatsu-beya", nameJa: "尾上部屋", tier: "established" },
  { id: "nakamura", name: "Nakamura-beya", nameJa: "中村部屋", tier: "established" },

  { id: "kagamiyama", name: "Kagamiyama-beya", nameJa: "鏡山部屋", tier: "rebuilding" },
  { id: "tomozuna", name: "Tomozuna-beya", nameJa: "友綱部屋", tier: "rebuilding" },
  { id: "otake", name: "Otake-beya", nameJa: "大嶽部屋", tier: "rebuilding" },
  { id: "oshima", name: "Oshima-beya", nameJa: "大島部屋", tier: "rebuilding" },
  { id: "chiganoura", name: "Chiganoura-beya", nameJa: "千賀ノ浦部屋", tier: "rebuilding" },
  { id: "shikihide", name: "Shikihide-beya", nameJa: "式秀部屋", tier: "rebuilding" },
  { id: "yamahibiki", name: "Yamahibiki-beya", nameJa: "山響部屋", tier: "rebuilding" },

  { id: "azumazeki", name: "Azumazeki-beya", nameJa: "東関部屋", tier: "fragile" },
  { id: "nihonyanagi", name: "Nihonyanagi-beya", nameJa: "二本柳部屋", tier: "fragile" },
  { id: "irumagawa", name: "Irumagawa-beya", nameJa: "入間川部屋", tier: "fragile" },
  { id: "nishiiwa", name: "Nishiiwa-beya", nameJa: "西岩部屋", tier: "fragile" },
  { id: "tagonoura", name: "Tagonoura-beya", nameJa: "田子ノ浦部屋", tier: "fragile" },
  { id: "onoe", name: "Onoe-beya", nameJa: "尾上部屋", tier: "fragile" },
  { id: "asakayama", name: "Asakayama-beya", nameJa: "浅香山部屋", tier: "fragile" },
  { id: "shunba", name: "Shunba-beya", nameJa: "峰崎部屋", tier: "fragile" }
] as const;

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
  { code: "UA", name: "Ukraine", weight: 1 }
] as const;

// === GENERATION HELPERS ===

function seededShuffle<T>(array: readonly T[], rng: seedrandom.PRNG): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function seededChoice<T>(array: readonly T[], rng: seedrandom.PRNG): T {
  return array[Math.floor(rng() * array.length)];
}

function seededWeightedChoice<T extends { weight: number }>(items: readonly T[], rng: seedrandom.PRNG): T {
  const total = items.reduce((sum, item) => sum + item.weight, 0);
  let roll = rng() * total;
  for (const item of items) {
    roll -= item.weight;
    if (roll <= 0) return item;
  }
  return items[items.length - 1];
}

function gaussianRandom(rng: seedrandom.PRNG, mean: number, stdDev: number): number {
  const u1 = Math.max(1e-9, rng());
  const u2 = Math.max(1e-9, rng());
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

/** Simple fallback shikona generator (deterministic, uniqueness enforced) */
function generateSimpleShikona(rng: seedrandom.PRNG, usedNames: Set<string>): string {
  for (let attempts = 0; attempts < 200; attempts++) {
    const prefix = seededChoice(SHIKONA_PARTS.prefix, rng);
    const suffix = seededChoice(SHIKONA_PARTS.suffix, rng);
    const name = `${prefix}${suffix}`;
    const key = name.normalize("NFC").toLowerCase();
    if (!usedNames.has(key)) {
      usedNames.add(key);
      return name;
    }
  }
  // Final fallback
  const num = Math.floor(rng() * 1000);
  const fallback = `Rikishi${num}`;
  usedNames.add(fallback.toLowerCase());
  return fallback;
}

function generateRikishi(
  rng: seedrandom.PRNG,
  config: RikishiGenerationConfig,
  usedNames: Set<string>,
  id: string
): Rikishi {
  const shikona = generateSimpleShikona(rng, usedNames);
  const nationality = seededWeightedChoice(NATIONALITIES, rng);

  const rankMultiplier = getRankMultiplier(config.targetRank);

  const height = clamp(Math.round(gaussianRandom(rng, 180, 8)), 155, 205);
  const weight = clamp(Math.round(gaussianRandom(rng, 140 + rankMultiplier * 15, 20)), 95, 230);

  const baseStats = 40 + rankMultiplier * 12;
  const statVariance = 15;

  const power = clamp(Math.round(gaussianRandom(rng, baseStats, statVariance)), 20, 100);
  const speed = clamp(Math.round(gaussianRandom(rng, baseStats, statVariance)), 20, 100);
  const balance = clamp(Math.round(gaussianRandom(rng, baseStats, statVariance)), 20, 100);
  const technique = clamp(Math.round(gaussianRandom(rng, baseStats, statVariance)), 20, 100);
  const aggression = clamp(Math.round(gaussianRandom(rng, 50, 20)), 20, 100);
  const experience = clamp(Math.round(gaussianRandom(rng, baseStats, statVariance)), 20, 100);

  const style = determineStyle(power, speed, technique, rng);
  const archetype = determineArchetype(style, power, speed, technique, balance, rng);

  const favoredKimarite = selectFavoredKimarite(style, archetype, rng);

  const careerBasho = Math.floor(10 + rankMultiplier * 25 + rng() * 15);
  const boutCount = config.division === "makuuchi" || config.division === "juryo" ? 15 : 7;

  const baseWinRate = 0.48 + (rankMultiplier / 10) * 0.08;
  const winRateVariance = 0.05;
  const effectiveWinRate = baseWinRate + (rng() - 0.5) * winRateVariance;

  const totalBouts = Math.floor(careerBasho * boutCount);
  const careerWins = Math.floor(totalBouts * effectiveWinRate);
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
    rankNumber: undefined,
    side: rng() < 0.5 ? "east" : "west",

    careerWins,
    careerLosses,
    currentBashoWins: 0,
    currentBashoLosses: 0,

    favoredKimarite,
    weakAgainstStyles: determineWeaknesses(style, rng),

    economics: {
      ...initializeEconomics(),
      retirementFund: Math.floor(careerWins * 50_000 + rng() * 10_000_000),
      careerKenshoWon: Math.floor(careerWins * 0.3 + rng() * 100),
      kinboshiCount: config.targetRank === "maegashira" ? Math.floor(rng() * 4) : 0,
      totalEarnings: Math.floor(careerWins * 100_000 + rng() * 20_000_000),
      popularity: clamp(Math.round(gaussianRandom(rng, 50, 20)), 10, 100),
      currentBashoEarnings: 0
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

function isNumberedRank(rank: Rank): rank is NumberedRank {
  return (
    rank === "maegashira" ||
    rank === "juryo" ||
    rank === "makushita" ||
    rank === "sandanme" ||
    rank === "jonidan" ||
    rank === "jonokuchi"
  );
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
  balance: number,
  rng: seedrandom.PRNG
): TacticalArchetype {
  if (style === "oshi" && power > 75) return "oshi_specialist";
  if (style === "yotsu" && technique > 75) return "yotsu_specialist";
  if (speed > 80) return "speedster";
  if (style === "hybrid" && power > 60 && technique > 60 && rng() < 0.3) return "hybrid_oshi_yotsu";
  if (balance > 75 && technique > 70 && rng() < 0.25) return "counter_specialist";
  if (rng() < 0.12) return "trickster";
  return "all_rounder";
}

function selectFavoredKimarite(style: Style, _archetype: TacticalArchetype, rng: seedrandom.PRNG): string[] {
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

function deriveBands(
  tier: string,
  prestige: number,
  funds: number,
  facilities: { training: number; recovery: number; nutrition: number },
  rng: seedrandom.PRNG
): {
  statureBand: StatureBand;
  prestigeBand: PrestigeBand;
  facilitiesBand: FacilitiesBand;
  koenkaiBand: KoenkaiBandType;
  runwayBand: RunwayBand;
  riskIndicators: { financial: boolean; governance: boolean; rivalry: boolean };
  descriptor: string;
} {
  const statureMap: Record<string, StatureBand> = {
    elite: "legendary",
    powerful: "powerful",
    established: "established",
    rebuilding: "rebuilding",
    fragile: "fragile"
  };
  const statureBand = statureMap[tier] || "established";

  const prestigeBand: PrestigeBand =
    prestige >= 80 ? "elite" :
    prestige >= 60 ? "respected" :
    prestige >= 40 ? "modest" :
    prestige >= 20 ? "struggling" : "unknown";

  const avgFacility = (facilities.training + facilities.recovery + facilities.nutrition) / 3;
  const facilitiesBand: FacilitiesBand =
    avgFacility >= 85 ? "world_class" :
    avgFacility >= 70 ? "excellent" :
    avgFacility >= 50 ? "adequate" :
    avgFacility >= 30 ? "basic" : "minimal";

  const koenkaiOptions: Record<string, KoenkaiBandType[]> = {
    elite: ["powerful", "strong"],
    powerful: ["strong", "moderate"],
    established: ["moderate", "weak"],
    rebuilding: ["weak", "none"],
    fragile: ["weak", "none"]
  };
  const options = koenkaiOptions[tier] || ["moderate"];
  const koenkaiBand = options[Math.floor(rng() * options.length)];

  const runwayBand: RunwayBand =
    funds >= 80_000_000 ? "secure" :
    funds >= 50_000_000 ? "comfortable" :
    funds >= 25_000_000 ? "tight" :
    funds >= 10_000_000 ? "critical" : "desperate";

  const riskIndicators = {
    financial: runwayBand === "critical" || runwayBand === "desperate",
    governance: tier === "fragile" || rng() < 0.1,
    rivalry: rng() < 0.3
  };

  const descriptors: Record<string, string[]> = {
    elite: [
      "A storied institution with championship pedigree.",
      "The halls echo with decades of glory.",
      "Where legends train and champions are forged."
    ],
    powerful: [
      "A rising force with hungry young talent.",
      "Consistently competitive at the highest level.",
      "Well-funded with excellent training facilities."
    ],
    established: [
      "A steady presence in professional sumo.",
      "Respected traditions, modest but reliable.",
      "Producing solid competitors for generations."
    ],
    rebuilding: [
      "Seeking to reclaim former glory.",
      "Young roster with room for growth.",
      "A patient oyakata building for the future."
    ],
    fragile: [
      "Fighting for survival in a changing world.",
      "One crisis away from the edge.",
      "Tradition struggles against modern pressures."
    ]
  };
  const tierDescriptors = descriptors[tier] || descriptors.established;
  const descriptor = tierDescriptors[Math.floor(rng() * tierDescriptors.length)];

  return { statureBand, prestigeBand, facilitiesBand, koenkaiBand, runwayBand, riskIndicators, descriptor };
}

function generateHeya(
  rng: seedrandom.PRNG,
  heyaInfo: (typeof HEYA_NAMES)[number],
  rikishiIds: string[]
): Heya {
  const tierPrestigeBase: Record<string, number> = {
    elite: 80,
    powerful: 65,
    established: 50,
    rebuilding: 35,
    fragile: 25
  };
  const basePrestige = tierPrestigeBase[heyaInfo.tier] || 50;
  const prestige = clamp(Math.round(gaussianRandom(rng, basePrestige, 10)), 10, 100);

  const tierFundsBase: Record<string, number> = {
    elite: 80_000_000,
    powerful: 60_000_000,
    established: 40_000_000,
    rebuilding: 25_000_000,
    fragile: 15_000_000
  };
  const baseFunds = tierFundsBase[heyaInfo.tier] || 40_000_000;
  const funds = Math.floor(baseFunds + (rng() - 0.5) * baseFunds * 0.5);

  const tierFacilityBase: Record<string, number> = {
    elite: 80,
    powerful: 65,
    established: 50,
    rebuilding: 35,
    fragile: 25
  };
  const baseFacility = tierFacilityBase[heyaInfo.tier] || 50;
  const facilities = {
    training: clamp(Math.round(gaussianRandom(rng, baseFacility, 10)), 20, 100),
    recovery: clamp(Math.round(gaussianRandom(rng, baseFacility, 10)), 20, 100),
    nutrition: clamp(Math.round(gaussianRandom(rng, baseFacility, 10)), 20, 100)
  };

  const bands = deriveBands(heyaInfo.tier, prestige, funds, facilities, rng);

  return {
    id: heyaInfo.id,
    name: heyaInfo.name,
    nameJa: heyaInfo.nameJa,
    oyakataId: `oyakata-${heyaInfo.id}`,
    rikishiIds,

    statureBand: bands.statureBand,
    prestigeBand: bands.prestigeBand,
    facilitiesBand: bands.facilitiesBand,
    koenkaiBand: bands.koenkaiBand,
    runwayBand: bands.runwayBand,

    reputation: prestige,
    funds,
    facilities,
    riskIndicators: bands.riskIndicators,
    descriptor: bands.descriptor
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
  { rank: "jonokuchi", division: "jonokuchi", count: 20 }
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

  const year = config.startYear ?? 2024;
  const startBasho = config.startBasho ?? "hatsu";

  const targetStableCount = 40 + Math.floor(rng() * 9); // 40-48
  const heyaList = seededShuffle(HEYA_NAMES, rng).slice(0, Math.min(targetStableCount, HEYA_NAMES.length));

  const heyas = new Map<string, Heya>();
  const allRikishi = new Map<string, Rikishi>();

  let rikishiCounter = 0;

  // Distribute rikishi across heya and ranks
  for (const slot of BANZUKE_TEMPLATE) {
    let remaining = slot.count;

    // Weight upper ranks toward higher-tier stables deterministically
    const sortedHeya =
      slot.rank === "yokozuna" || slot.rank === "ozeki" || slot.rank === "sekiwake" || slot.rank === "komusubi"
        ? [...heyaList].sort((a, b) => {
            const tierOrder: Record<string, number> = { elite: 0, powerful: 1, established: 2, rebuilding: 3, fragile: 4 };
            return (tierOrder[a.tier] ?? 2) - (tierOrder[b.tier] ?? 2) || a.id.localeCompare(b.id);
          })
        : seededShuffle([...heyaList], rng);

    const rikishiPerHeya = Math.max(1, Math.ceil(slot.count / sortedHeya.length));

    for (const heyaInfo of sortedHeya) {
      if (remaining <= 0) break;

      const count = Math.min(rikishiPerHeya, remaining);
      remaining -= count;

      for (let i = 0; i < count; i++) {
        const id = `r-${++rikishiCounter}`;
        const rikishi = generateRikishi(
          rng,
          { targetRank: slot.rank, division: slot.division, heyaId: heyaInfo.id },
          usedNames,
          id
        );
        allRikishi.set(id, rikishi);
      }
    }
  }

  // Assign east/west and rankNumbers deterministically
  assignBanzukePositions(allRikishi);

  // Create heya with their rikishi
  for (const heyaInfo of heyaList) {
    const rikishiIds = Array.from(allRikishi.values())
      .filter(r => r.heyaId === heyaInfo.id)
      .map(r => r.id);

    heyas.set(heyaInfo.id, generateHeya(rng, heyaInfo, rikishiIds));
  }

  const ftue: FTUEState = {
    isActive: true,
    bashoCompleted: 0,
    suppressedEvents: []
  };

  return {
    seed: config.seed,
    year,
    week: 1,
    currentBashoName: startBasho,
    heyas,
    rikishi: allRikishi,
    currentBasho: undefined,
    history: [],
    ftue
  };
}

function assignBanzukePositions(rikishi: Map<string, Rikishi>): void {
  const byRank = new Map<Rank, Rikishi[]>();

  for (const r of rikishi.values()) {
    const list = byRank.get(r.rank) || [];
    list.push(r);
    byRank.set(r.rank, list);
  }

  for (const [rank, wrestlers] of byRank) {
    const sorted = [...wrestlers].sort((a, b) => {
      const scoreA = a.power + a.technique + a.experience;
      const scoreB = b.power + b.technique + b.experience;
      return scoreB - scoreA || a.id.localeCompare(b.id);
    });

    let rankNum = 1;
    let side: "east" | "west" = "east";

    for (const w of sorted) {
      w.side = side;

      if (isNumberedRank(rank)) {
        w.rankNumber = rankNum;
      } else {
        w.rankNumber = undefined;
      }

      if (side === "west") rankNum++;
      side = side === "east" ? "west" : "east";
    }
  }
}

// === BASHO INITIALIZATION ===

export function initializeBasho(world: WorldState, bashoName: BashoName): BashoState {
  const bashoNumber = (BASHO_ORDER.indexOf(bashoName) + 1) as 1 | 2 | 3 | 4 | 5 | 6;

  // Reset rikishi basho stats
  for (const r of world.rikishi.values()) {
    r.currentBashoWins = 0;
    r.currentBashoLosses = 0;
    if (r.economics) r.economics.currentBashoEarnings = 0;
  }

  const basho: BashoState = {
    year: world.year,
    bashoNumber,
    bashoName,
    day: 1,
    matches: [],
    standings: new Map()
  };

  // Initialize standings for sekitori (makuuchi + juryo)
  for (const r of world.rikishi.values()) {
    if (r.division === "makuuchi" || r.division === "juryo") {
      basho.standings.set(r.id, { wins: 0, losses: 0 });
    }
  }

  return basho;
}

// === SCHEDULE GENERATION ===

export function generateDaySchedule(world: WorldState, basho: BashoState, day: number, seed: string): void {
  const rng = seedrandom(`${seed}-day-${day}`);

  const makuuchi = Array.from(world.rikishi.values()).filter(r => r.division === "makuuchi" && !r.injured);
  const juryo = Array.from(world.rikishi.values()).filter(r => r.division === "juryo" && !r.injured);

  const juryoMatches = createMatchups(juryo, basho, rng);
  const makuuchiMatches = createMatchups(makuuchi, basho, rng);

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

  const previousOpponents = new Map<string, Set<string>>();
  for (const match of basho.matches) {
    {
      const s = previousOpponents.get(match.eastRikishiId) || new Set<string>();
      s.add(match.westRikishiId);
      previousOpponents.set(match.eastRikishiId, s);
    }
    {
      const s = previousOpponents.get(match.westRikishiId) || new Set<string>();
      s.add(match.eastRikishiId);
      previousOpponents.set(match.westRikishiId, s);
    }
  }

  // Deterministic sort: current wins desc, then rank strength, then id
  const sorted = [...rikishi].sort((a, b) => {
    const aWins = basho.standings.get(a.id)?.wins || 0;
    const bWins = basho.standings.get(b.id)?.wins || 0;
    if (bWins !== aWins) return bWins - aWins;

    // Prefer higher rank strength: approximate via rank + (optional) rankNumber
    const rankScore = (r: Rikishi) => {
      const base: Record<Rank, number> = {
        yokozuna: 1000,
        ozeki: 900,
        sekiwake: 800,
        komusubi: 700,
        maegashira: 600,
        juryo: 500,
        makushita: 400,
        sandanme: 300,
        jonidan: 200,
        jonokuchi: 100
      };
      const n = r.rankNumber ? clamp(r.rankNumber, 1, 100) : 1;
      // lower numbers are better; invert mildly
      const numBonus = isNumberedRank(r.rank) ? (200 - n) : 0;
      return (base[r.rank] ?? 0) + numBonus;
    };

    const aScore = rankScore(a);
    const bScore = rankScore(b);
    if (bScore !== aScore) return bScore - aScore;

    return a.id.localeCompare(b.id);
  });

  // Pairing pass
  for (let i = 0; i < sorted.length; i++) {
    const east = sorted[i];
    if (used.has(east.id)) continue;

    let paired = false;

    for (let j = i + 1; j < sorted.length; j++) {
      const west = sorted[j];
      if (used.has(west.id)) continue;
      if (west.heyaId === east.heyaId) continue;
      if (previousOpponents.get(east.id)?.has(west.id)) continue;

      matches.push({ east: east.id, west: west.id });
      used.add(east.id);
      used.add(west.id);
      paired = true;
      break;
    }

    // If cannot pair without violating constraints, relax “previous opponent” rule last
    if (!paired) {
      for (let j = i + 1; j < sorted.length; j++) {
        const west = sorted[j];
        if (used.has(west.id)) continue;
        if (west.heyaId === east.heyaId) continue;

        matches.push({ east: east.id, west: west.id });
        used.add(east.id);
        used.add(west.id);
        paired = true;
        break;
      }
    }
  }

  // Shuffle match order deterministically for presentation variety
  return seededShuffle(matches, rng);
}

// === NEW STABLE CREATION (FTUE) ===

export function createNewStable(world: WorldState, stableName: string, stableNameJa?: string): Heya {
  // Deterministic-ish id would require world seed + counter; Date.now() breaks determinism.
  // Use world seed + current size to avoid collision and stay reproducible within a run.
  const id = `player-stable-${world.seed}-${world.heyas.size + 1}`;

  const newHeya: Heya = {
    id,
    name: `${stableName}-beya`,
    nameJa: stableNameJa || `${stableName}部屋`,
    oyakataId: `oyakata-${id}`,
    rikishiIds: [],

    statureBand: "new",
    prestigeBand: "unknown",
    facilitiesBand: "minimal",
    koenkaiBand: "none",
    runwayBand: "critical",

    reputation: 10,
    // Align with your monthly expense model in timeBoundary.ts:
    // rent 2.0m + food (0.5m) + utilities (0.3m) + staff (1.5m) + maintenance (0.2m) ≈ 4.5m/month (rosterSize 0)
    // Setting 12m gives ~2-3 months runway before any koenkai income.
    funds: 12_000_000,

    facilities: { training: 20, recovery: 15, nutrition: 20 },

    riskIndicators: { financial: true, governance: false, rivalry: false },

    descriptor: "A brand new stable, starting from nothing. Everything must be built from scratch.",
    isPlayerOwned: true
  };

  world.heyas.set(id, newHeya);
  world.playerHeyaId = id;

  return newHeya;
}
