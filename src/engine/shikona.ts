// Robust Shikona (Ring Name) Generation System (Basho)
// Deterministic, culturally-authentic, with:
// - weighted patterns (authentic distribution)
// - progressive uniqueness escalation (connector/extra component before digits)
// - house styles (heya naming “feel”)
// - rank progression (prestige chance, 3-part frequency, length caps)
// - safe validation + conservative display formatting

import seedrandom from "seedrandom";

// ----------------------------
// Types
// ----------------------------

export interface ShikonaGenerationConfig {
  nationality?: string;
  heyaId?: string;   // used to select house style deterministically
  rank?: string;     // e.g. "Jonokuchi", "Sandanme", "Makushita", "Jūryō", "Makuuchi", "Yokozuna"
  preferPrestigious?: boolean;
}

type CategoryMap<T> = Record<string, T[]>;

type RankTier =
  | "rookie"     // Jonokuchi/Jonidan
  | "developing" // Sandanme
  | "upper"      // Makushita
  | "salaried"   // Juryo
  | "top"        // Makuuchi
  | "legend";    // Ozeki/Yokozuna (or equivalent in your game)

type PatternId =
  | "nat+terrain"
  | "power+any"
  | "nature+noble"
  | "tradition+flora"
  | "regional+ending"
  | "cat+cat"
  | "triple"; // prefix + connector + suffix

type PatternWeights = Record<PatternId, number>;

type HouseStyleId =
  | "power_mountain"
  | "sea_wind"
  | "tradition_flora"
  | "regional_endings"
  | "balanced_classic"
  | "dragon_noble";

interface HouseStyle {
  id: HouseStyleId;
  name: string;
  // bias pattern weights (added on top of base weights)
  patternBias: Partial<PatternWeights>;
  // bias category selection chance for prefix categories
  prefixCategoryBias: Partial<Record<keyof typeof SHIKONA_PREFIXES, number>>;
  // bias suffix category selection chance
  suffixCategoryBias: Partial<Record<keyof typeof SHIKONA_SUFFIXES, number>>;
  // optional connector bias for triple pattern
  connectorBias?: Partial<Record<Connector, number>>;
}

type Connector = "no" | "ga" | "shi" | "kuni" | "iwa" | "yori";

// ----------------------------
// Data: Components
// ----------------------------

// Prefixes often relate to: power, nature, legacy, region, mythology
const SHIKONA_PREFIXES = {
  power: ["Taka", "Waka", "Dai", "Ō", "Kō", "Sei", "Ryū", "Rai", "Tetsu", "Gō", "Yū", "Shin", "Ken", "Kyō", "Sō"],
  nature: ["Asa", "Nishi", "Higa", "Aki", "Fuyu", "Haru", "Natsu", "Kaze", "Yama", "Umi", "Tani", "Mori", "Hana", "Tsuki"],
  tradition: ["Tochi", "Haku", "Kai", "Koto", "Miya", "Mitake", "Kiyo", "Sada", "Teru", "Ichi", "Ao", "Kiri", "Tama", "Ura"],
  regional: ["Endo", "Ōno", "Namba", "Chiya", "Tobi", "Shō", "Masa", "Tomo", "Hide", "Kise", "Ama", "Kak", "Hiro"],
} as const;

// Suffixes often relate to: mountains, water, attributes, dragons
const SHIKONA_SUFFIXES = {
  mountain: ["yama", "zan", "take", "mine", "iwa", "shima", "ishi"],
  water: ["umi", "nami", "kawa", "ryū", "taki", "mizu"],
  sky: ["kaze", "arashi", "sora", "kumo", "tora"],
  flora: ["fuji", "sakura", "hana", "take", "matsu", "ume"],
  noble: ["shō", "nishiki", "hō", "ōmi", "sei", "ryu"],
  endings: ["noshin", "maru", "shū", "ho", "waka"],
} as const;

// Historically significant patterns (rare)
const PRESTIGIOUS_FULL_NAMES = [
  "Hakuryū",
  "Kaiō",
  "Takanofuji",
  "Wakatora",
  "Asashōryū",
  "Kotoshōgiku",
  "Tochishima",
  "Terunofuji",
  "Mitakeumi",
  "Ichinojō",
  "Aoiyama",
  "Kirishima",
  "Tamanoshima",
] as const;

// Nationality-influenced naming patterns
const NATIONALITY_PREFIXES: Record<string, string[]> = {
  Mongolia: ["Teru", "Haku", "Ichi", "Ao", "Ryū", "Dai"],
  Georgia: ["Tochi", "Gaga", "Koto", "Koko"],
  Bulgaria: ["Ao", "Koto", "Bara"],
  USA: ["Musa", "Aka", "Taka", "Dai"],
  Brazil: ["Kai", "Asa", "Sho"],
  Egypt: ["Ō", "Sada", "Osa"],
  default: ["Taka", "Waka", "Asa", "Koto", "Tochi", "Haku", "Kai"],
};

// ----------------------------
// House styles (heya “feel”)
// ----------------------------

const HOUSE_STYLES: HouseStyle[] = [
  {
    id: "power_mountain",
    name: "Power & Mountain Lineage",
    patternBias: { "power+any": 8, "nat+terrain": 6, "cat+cat": 3, triple: -2 },
    prefixCategoryBias: { power: 8, tradition: 2 },
    suffixCategoryBias: { mountain: 8, noble: 2 },
  },
  {
    id: "sea_wind",
    name: "Sea & Wind Poets",
    patternBias: { "nat+terrain": 8, "cat+cat": 4, triple: 2 },
    prefixCategoryBias: { nature: 6, tradition: 1 },
    suffixCategoryBias: { water: 7, sky: 6, mountain: -2 },
    connectorBias: { no: 3, yori: 2 },
  },
  {
    id: "tradition_flora",
    name: "Temple & Blossom Tradition",
    patternBias: { "tradition+flora": 10, "nature+noble": 2, triple: 2, "regional+ending": -2 },
    prefixCategoryBias: { tradition: 8, nature: 2 },
    suffixCategoryBias: { flora: 9, noble: 2 },
    connectorBias: { shi: 2, ga: 1 },
  },
  {
    id: "regional_endings",
    name: "Regional Maru House",
    patternBias: { "regional+ending": 12, "cat+cat": 4, triple: -2 },
    prefixCategoryBias: { regional: 10 },
    suffixCategoryBias: { endings: 10, mountain: 1 },
  },
  {
    id: "dragon_noble",
    name: "Dragon & Noble Court",
    patternBias: { "power+any": 4, "nature+noble": 8, triple: 3 },
    prefixCategoryBias: { power: 4, tradition: 3 },
    suffixCategoryBias: { noble: 9, water: 2 },
    connectorBias: { kuni: 2, iwa: 1, ga: 1 },
  },
  {
    id: "balanced_classic",
    name: "Balanced Classic",
    patternBias: { "cat+cat": 4, "nat+terrain": 2 },
    prefixCategoryBias: { power: 2, nature: 2, tradition: 2, regional: 2 },
    suffixCategoryBias: { mountain: 2, water: 2, sky: 2, flora: 2, noble: 2, endings: 2 },
  },
];

// Optional: curated mapping if you want specific stables to always have a known style.
// If absent, style is chosen deterministically from heyaId by hashing.
const HEYA_STYLE_MAP: Record<string, HouseStyleId> = {
  // "heya-001": "power_mountain",
  // "heya-002": "sea_wind",
};

// ----------------------------
// Rank progression rules
// ----------------------------

interface RankRule {
  tier: RankTier;
  prestigeChance: number; // base chance if preferPrestigious = true
  tripleChance: number;   // chance to use 3-part (connector) when pattern supports it
  maxLen: number;         // soft cap for candidate names (before fallback)
  // additional bias on patterns by rank (stacked with base + house)
  patternBias: Partial<PatternWeights>;
}

const RANK_RULES: RankRule[] = [
  {
    tier: "rookie",
    prestigeChance: 0.02,
    tripleChance: 0.05,
    maxLen: 14,
    patternBias: { triple: -3, "regional+ending": 1, "cat+cat": 2 },
  },
  {
    tier: "developing",
    prestigeChance: 0.04,
    tripleChance: 0.08,
    maxLen: 16,
    patternBias: { triple: -1, "cat+cat": 2 },
  },
  {
    tier: "upper",
    prestigeChance: 0.06,
    tripleChance: 0.12,
    maxLen: 18,
    patternBias: { triple: 1, "nature+noble": 1, "tradition+flora": 1 },
  },
  {
    tier: "salaried",
    prestigeChance: 0.08,
    tripleChance: 0.16,
    maxLen: 20,
    patternBias: { triple: 2, "nat+terrain": 1 },
  },
  {
    tier: "top",
    prestigeChance: 0.12,
    tripleChance: 0.20,
    maxLen: 22,
    patternBias: { triple: 3, "tradition+flora": 1, "power+any": 1 },
  },
  {
    tier: "legend",
    prestigeChance: 0.16,
    tripleChance: 0.24,
    maxLen: 24,
    patternBias: { triple: 4, "power+any": 1, "nature+noble": 1 },
  },
];

// ----------------------------
// Core helpers
// ----------------------------

function pick<T>(arr: readonly T[], rng: seedrandom.PRNG): T {
  return arr[Math.floor(rng() * arr.length)];
}

function weightedPick<T>(items: Array<{ item: T; w: number }>, rng: seedrandom.PRNG): T {
  const total = items.reduce((s, x) => s + Math.max(0, x.w), 0);
  // Guard against all weights <= 0
  if (total <= 0) return items[0].item;

  let r = rng() * total;
  for (const x of items) {
    const w = Math.max(0, x.w);
    r -= w;
    if (r <= 0) return x.item;
  }
  return items[items.length - 1].item;
}

function normalizeKey(name: string): string {
  return name.normalize("NFC").toLowerCase();
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

function simpleHashToIndex(s: string, mod: number): number {
  // deterministic string hash -> [0, mod)
  let h = 2166136261; // FNV-ish
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  // >>> 0 converts to uint32
  return (h >>> 0) % mod;
}

function resolveRankTier(rank?: string): RankTier {
  const r = (rank || "").toLowerCase();

  // Common sumo tiers; adapt freely to your game's rank set
  if (r.includes("yokozuna") || r.includes("ōzeki") || r.includes("ozeki")) return "legend";
  if (r.includes("makuuchi")) return "top";
  if (r.includes("jūryō") || r.includes("juryo")) return "salaried";
  if (r.includes("makushita")) return "upper";
  if (r.includes("sandanme")) return "developing";
  if (r.includes("jonidan") || r.includes("jonokuchi")) return "rookie";

  // Default if unknown:
  return "developing";
}

function getRankRule(rank?: string): RankRule {
  const tier = resolveRankTier(rank);
  return RANK_RULES.find(r => r.tier === tier) || RANK_RULES[1];
}

function getHouseStyle(heyaId?: string): HouseStyle {
  if (!heyaId) {
    // stable default if none provided
    return HOUSE_STYLES.find(s => s.id === "balanced_classic") || HOUSE_STYLES[0];
  }

  const mapped = HEYA_STYLE_MAP[heyaId];
  if (mapped) {
    return HOUSE_STYLES.find(s => s.id === mapped) || HOUSE_STYLES[0];
  }

  const idx = simpleHashToIndex(heyaId, HOUSE_STYLES.length);
  return HOUSE_STYLES[idx];
}

function mergePatternWeights(base: PatternWeights, ...biases: Array<Partial<PatternWeights>>): PatternWeights {
  const out: PatternWeights = { ...base };
  for (const b of biases) {
    for (const k of Object.keys(b) as PatternId[]) {
      out[k] = (out[k] ?? 0) + (b[k] ?? 0);
    }
  }
  // prevent negative weights from killing everything; keep within sane bounds
  for (const k of Object.keys(out) as PatternId[]) {
    out[k] = clamp(out[k], -50, 100);
  }
  return out;
}

function choosePattern(rng: seedrandom.PRNG, weights: PatternWeights): PatternId {
  return weightedPick<PatternId>(
    (Object.keys(weights) as PatternId[]).map(p => ({ item: p, w: weights[p] })),
    rng
  );
}

function pickPrefixByCategoryBias(rng: seedrandom.PRNG, bias: HouseStyle["prefixCategoryBias"]): string {
  const categories = Object.keys(SHIKONA_PREFIXES) as Array<keyof typeof SHIKONA_PREFIXES>;
  const weights = categories.map(cat => ({ item: cat, w: 10 + (bias[cat] ?? 0) })); // base 10 each
  const chosen = weightedPick(weights, rng);
  return pick(SHIKONA_PREFIXES[chosen], rng);
}

function pickSuffixByCategoryBias(rng: seedrandom.PRNG, bias: HouseStyle["suffixCategoryBias"]): string {
  const categories = Object.keys(SHIKONA_SUFFIXES) as Array<keyof typeof SHIKONA_SUFFIXES>;
  const weights = categories.map(cat => ({ item: cat, w: 10 + (bias[cat] ?? 0) })); // base 10 each
  const chosen = weightedPick(weights, rng);
  return pick(SHIKONA_SUFFIXES[chosen], rng);
}

function nationalityPool(config: ShikonaGenerationConfig): string[] {
  if (!config.nationality) return NATIONALITY_PREFIXES.default;
  return NATIONALITY_PREFIXES[config.nationality] || NATIONALITY_PREFIXES.default;
}

function pickConnector(rng: seedrandom.PRNG, house: HouseStyle): Connector {
  const base: Record<Connector, number> = {
    no: 10,
    ga: 7,
    shi: 5,
    kuni: 3,
    iwa: 3,
    yori: 2,
  };
  const b = house.connectorBias || {};
  const items = (Object.keys(base) as Connector[]).map(c => ({ item: c, w: base[c] + (b[c] ?? 0) }));
  return weightedPick(items, rng);
}

function enforceSoftMaxLen(name: string, maxLen: number): boolean {
  return name.length <= maxLen;
}

// ----------------------------
// Generation (main)
// ----------------------------

const BASE_PATTERN_WEIGHTS: PatternWeights = {
  "nat+terrain": 18,
  "power+any": 18,
  "nature+noble": 16,
  "tradition+flora": 14,
  "regional+ending": 10,
  "cat+cat": 18,
  triple: 6,
};

function generateCandidate(
  rng: seedrandom.PRNG,
  config: ShikonaGenerationConfig,
  attempt: number,
  house: HouseStyle,
  rankRule: RankRule
): string {
  const nat = nationalityPool(config);

  // Prestigious (rare, rank-scaled, only if preferPrestigious)
  if (config.preferPrestigious) {
    const p = rankRule.prestigeChance;
    if (rng() < p) {
      const base = pick(PRESTIGIOUS_FULL_NAMES, rng);
      // On retry, prefer a legitimate extension before anything else
      if (attempt > 0) {
        const extra = pickSuffixByCategoryBias(rng, house.suffixCategoryBias);
        return base + extra;
      }
      return base;
    }
  }

  // Pick a pattern with base + rank + house biases
  const patternWeights = mergePatternWeights(BASE_PATTERN_WEIGHTS, rankRule.patternBias, house.patternBias);
  const pattern = choosePattern(rng, patternWeights);

  switch (pattern) {
    case "nat+terrain": {
      const prefix = pick(nat, rng);
      const suffix = rng() < 0.5 ? pick(SHIKONA_SUFFIXES.mountain, rng) : pick(SHIKONA_SUFFIXES.water, rng);
      return prefix + suffix;
    }
    case "power+any": {
      const prefix = pick(SHIKONA_PREFIXES.power, rng);
      const suffix = pickSuffixByCategoryBias(rng, house.suffixCategoryBias);
      return prefix + suffix;
    }
    case "nature+noble": {
      const prefix = pick(SHIKONA_PREFIXES.nature, rng);
      const suffix = pick(SHIKONA_SUFFIXES.noble, rng);
      return prefix + suffix;
    }
    case "tradition+flora": {
      const prefix = pick(SHIKONA_PREFIXES.tradition, rng);
      const suffix = pick(SHIKONA_SUFFIXES.flora, rng);
      return prefix + suffix;
    }
    case "regional+ending": {
      const prefix = pick(SHIKONA_PREFIXES.regional, rng);
      const suffix = pick(SHIKONA_SUFFIXES.endings, rng);
      return prefix + suffix;
    }
    case "cat+cat": {
      const prefix = pickPrefixByCategoryBias(rng, house.prefixCategoryBias);
      const suffix = pickSuffixByCategoryBias(rng, house.suffixCategoryBias);
      return prefix + suffix;
    }
    case "triple": {
      // Rank controls how often we “commit” to triple; otherwise fall back to cat+cat
      if (rng() > rankRule.tripleChance) {
        const prefix = pickPrefixByCategoryBias(rng, house.prefixCategoryBias);
        const suffix = pickSuffixByCategoryBias(rng, house.suffixCategoryBias);
        return prefix + suffix;
      }
      const prefix = pickPrefixByCategoryBias(rng, house.prefixCategoryBias);
      const connector = pickConnector(rng, house);
      const suffix = pickSuffixByCategoryBias(rng, house.suffixCategoryBias);
      return prefix + connector + suffix;
    }
  }
}

export function generateShikona(
  rng: seedrandom.PRNG,
  usedNames: Set<string>,
  config: ShikonaGenerationConfig = {}
): string {
  const house = getHouseStyle(config.heyaId);
  const rankRule = getRankRule(config.rank);

  const maxAttempts = 140;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    let name = generateCandidate(rng, config, attempt, house, rankRule);

    // Soft cap by rank: if too long, re-roll (deterministically) by continuing attempts
    if (!enforceSoftMaxLen(name, rankRule.maxLen)) continue;

    // Progressive uniqueness escalation:
    // - Attempts 0-39: normal generation
    // - Attempts 40-89: extend with a legit extra suffix (not digits)
    // - Attempts 90-139: allow 3-part (even if pattern wasn't triple), then extra suffix
    if (attempt >= 40 && attempt < 90) {
      const extra = pickSuffixByCategoryBias(rng, house.suffixCategoryBias);
      if (enforceSoftMaxLen(name + extra, rankRule.maxLen + 4)) name = name + extra;
    } else if (attempt >= 90) {
      // force a connector insertion if not already present
      const connector = pickConnector(rng, house);
      const extra = pickSuffixByCategoryBias(rng, house.suffixCategoryBias);
      const forced = name + connector + extra;
      if (enforceSoftMaxLen(forced, rankRule.maxLen + 6)) name = forced;
    }

    const key = normalizeKey(name);
    if (!usedNames.has(key)) {
      usedNames.add(key);
      return name;
    }
  }

  // Final fallback: digits, last resort, larger space to avoid collisions
  const fallbackHouse = getHouseStyle(config.heyaId);
  const prefix = pickPrefixByCategoryBias(rng, fallbackHouse.prefixCategoryBias);
  const suffix = pickSuffixByCategoryBias(rng, fallbackHouse.suffixCategoryBias);
  const disambiguator = Math.floor(rng() * 1000);
  const fallback = `${prefix}${suffix}${disambiguator}`;
  usedNames.add(normalizeKey(fallback));
  return fallback;
}

export function generateShikonaBatch(
  seed: string,
  count: number,
  configs: ShikonaGenerationConfig[] = []
): string[] {
  const rng = seedrandom(seed);
  const used = new Set<string>();
  const out: string[] = [];

  for (let i = 0; i < count; i++) {
    out.push(generateShikona(rng, used, configs[i] || {}));
  }

  return out;
}

// ----------------------------
// Validation & Display
// ----------------------------

// Allows ASCII letters + common macrons: āīūēō and uppercase variants.
// Note: if you decide to allow apostrophes or hyphens later, add them here.
const SHIKONA_ALLOWED = /^[A-Za-zĀĪŪĒŌāīūēō]+$/;

export function isValidShikona(name: string): boolean {
  const n = name.normalize("NFC");
  // Rank rules allow longer; 2..24 is a sane baseline for romanized shikona
  if (n.length < 2 || n.length > 24) return false;
  return SHIKONA_ALLOWED.test(n);
}

/**
 * Display formatting: conservative + idempotent.
 * We only NFC-normalize; we do NOT “guess” macrons from ou/uu (requires dictionary).
 */
export function formatShikonaDisplay(name: string): string {
  return name.normalize("NFC");
}

// ----------------------------
// Optional: Debug helpers (handy in dev builds)
// ----------------------------

export function getResolvedHouseStyle(heyaId?: string): { id: HouseStyleId; name: string } {
  const hs = getHouseStyle(heyaId);
  return { id: hs.id, name: hs.name };
}

export function getResolvedRankTier(rank?: string): RankTier {
  return resolveRankTier(rank);
}
