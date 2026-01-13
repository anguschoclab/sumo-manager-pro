// Robust Shikona (Ring Name) Generation System
// Per Constitution: Deterministic, culturally authentic name generation

import seedrandom from "seedrandom";

// === SHIKONA COMPONENTS (AUTHENTIC SUMO NAMING) ===

// Prefixes often relate to: power, nature, legacy, region, mythology
const SHIKONA_PREFIXES = {
  // Power/Strength themes
  power: [
    "Taka", "Waka", "Dai", "Ō", "Kō", "Sei", "Ryū", "Rai", 
    "Tetsu", "Gō", "Yū", "Shin", "Ken", "Kyō", "Sō"
  ],
  // Nature themes  
  nature: [
    "Asa", "Nishi", "Higa", "Aki", "Fuyu", "Haru", "Natsu",
    "Kaze", "Yama", "Umi", "Tani", "Mori", "Hana", "Tsuki"
  ],
  // Mythology/Tradition
  tradition: [
    "Tochi", "Haku", "Kai", "Koto", "Miya", "Mitake", "Kiyo",
    "Sada", "Teru", "Ichi", "Ao", "Kiri", "Tama", "Ura"
  ],
  // Regional/Place
  regional: [
    "Endo", "Ōno", "Namba", "Chiya", "Tobi", "Shō", "Masa",
    "Tomo", "Hide", "Kise", "Ama", "Kak", "Hiro"
  ]
};

// Suffixes often relate to: mountains, water, attributes, dragons
const SHIKONA_SUFFIXES = {
  // Mountain/Earth
  mountain: [
    "yama", "zan", "take", "mine", "iwa", "shima", "ishi"
  ],
  // Water/Sea
  water: [
    "umi", "nami", "kawa", "ryū", "taki", "mizu"
  ],
  // Wind/Sky
  sky: [
    "kaze", "arashi", "sora", "kumo", "tora"
  ],
  // Nature/Plants
  flora: [
    "fuji", "sakura", "hana", "take", "matsu", "ume"
  ],
  // Abstract/Noble
  noble: [
    "shō", "nishiki", "hō", "ōmi", "sei", "ryu"
  ],
  // Endings
  endings: [
    "noshin", "maru", "shū", "ho", "waka"
  ]
};

// Special full names (historically significant patterns)
const PRESTIGIOUS_FULL_NAMES = [
  "Hakuryū", "Kaiō", "Takanofuji", "Wakatora", "Asashōryū",
  "Kotoshōgiku", "Tochishima", "Terunofuji", "Mitakeumi",
  "Ichinojō", "Aoiyama", "Kirishima", "Tamanoshima"
];

// Nationality-influenced naming patterns
const NATIONALITY_PREFIXES: Record<string, string[]> = {
  Mongolia: ["Teru", "Haku", "Ichi", "Ao", "Ryū", "Dai"],
  Georgia: ["Tochi", "Gaga", "Koto", "Koko"],
  Bulgaria: ["Ao", "Koto", "Bara"],
  USA: ["Musa", "Aka", "Taka", "Dai"],
  Brazil: ["Kai", "Asa", "Sho"],
  Egypt: ["Ō", "Sada", "Osa"],
  default: ["Taka", "Waka", "Asa", "Koto", "Tochi", "Haku", "Kai"]
};

// === GENERATION HELPERS ===

function selectFromCategory<T>(
  categories: Record<string, T[]>,
  rng: seedrandom.PRNG
): T {
  const allKeys = Object.keys(categories);
  const category = allKeys[Math.floor(rng() * allKeys.length)];
  const items = categories[category];
  return items[Math.floor(rng() * items.length)];
}

function selectFromArray<T>(array: T[], rng: seedrandom.PRNG): T {
  return array[Math.floor(rng() * array.length)];
}

// === MAIN SHIKONA GENERATION ===

export interface ShikonaGenerationConfig {
  nationality?: string;
  heyaId?: string;
  rank?: string;
  preferPrestigious?: boolean;
}

/**
 * Generate a unique shikona (ring name) for a rikishi
 * Deterministic based on seed
 */
export function generateShikona(
  rng: seedrandom.PRNG,
  usedNames: Set<string>,
  config: ShikonaGenerationConfig = {}
): string {
  const maxAttempts = 100;
  
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const name = generateShikonaCandidate(rng, config, attempt);
    const normalizedName = name.toLowerCase();
    
    if (!usedNames.has(normalizedName)) {
      usedNames.add(normalizedName);
      return name;
    }
  }
  
  // Fallback with disambiguator
  const fallbackPrefix = selectFromCategory(SHIKONA_PREFIXES, rng);
  const fallbackSuffix = selectFromCategory(SHIKONA_SUFFIXES, rng);
  const disambiguator = Math.floor(rng() * 100);
  const fallbackName = `${fallbackPrefix}${fallbackSuffix}${disambiguator}`;
  usedNames.add(fallbackName.toLowerCase());
  return fallbackName;
}

function generateShikonaCandidate(
  rng: seedrandom.PRNG,
  config: ShikonaGenerationConfig,
  attempt: number
): string {
  // Occasionally use prestigious full name pattern
  if (config.preferPrestigious && rng() < 0.1) {
    const prestigiousBase = selectFromArray(PRESTIGIOUS_FULL_NAMES, rng);
    if (attempt > 0) {
      // Add suffix for uniqueness on retry
      return prestigiousBase + "II";
    }
    return prestigiousBase;
  }
  
  // Get nationality-influenced prefixes
  const nationalityPrefixes = config.nationality 
    ? (NATIONALITY_PREFIXES[config.nationality] || NATIONALITY_PREFIXES.default)
    : NATIONALITY_PREFIXES.default;
  
  // Choose generation pattern
  const pattern = Math.floor(rng() * 6);
  
  switch (pattern) {
    case 0: {
      // Pattern: NationalityPrefix + Mountain/Water suffix
      const prefix = selectFromArray(nationalityPrefixes, rng);
      const suffix = rng() < 0.5 
        ? selectFromArray(SHIKONA_SUFFIXES.mountain, rng)
        : selectFromArray(SHIKONA_SUFFIXES.water, rng);
      return prefix + suffix;
    }
    case 1: {
      // Pattern: Power prefix + Nature suffix
      const prefix = selectFromArray(SHIKONA_PREFIXES.power, rng);
      const suffix = selectFromCategory(SHIKONA_SUFFIXES, rng);
      return prefix + suffix;
    }
    case 2: {
      // Pattern: Nature prefix + Noble suffix
      const prefix = selectFromArray(SHIKONA_PREFIXES.nature, rng);
      const suffix = selectFromArray(SHIKONA_SUFFIXES.noble, rng);
      return prefix + suffix;
    }
    case 3: {
      // Pattern: Tradition prefix + Flora suffix
      const prefix = selectFromArray(SHIKONA_PREFIXES.tradition, rng);
      const suffix = selectFromArray(SHIKONA_SUFFIXES.flora, rng);
      return prefix + suffix;
    }
    case 4: {
      // Pattern: Regional prefix + Ending
      const prefix = selectFromArray(SHIKONA_PREFIXES.regional, rng);
      const suffix = selectFromArray(SHIKONA_SUFFIXES.endings, rng);
      return prefix + suffix;
    }
    case 5: {
      // Pattern: Double-component (Prefix + Middle + Suffix for longer names)
      const prefix = selectFromCategory(SHIKONA_PREFIXES, rng);
      const suffix = selectFromCategory(SHIKONA_SUFFIXES, rng);
      // Occasionally add a second element
      if (rng() < 0.3) {
        const middle = selectFromArray(["no", "ga", "shi"], rng);
        return prefix + middle + suffix;
      }
      return prefix + suffix;
    }
    default: {
      const prefix = selectFromCategory(SHIKONA_PREFIXES, rng);
      const suffix = selectFromCategory(SHIKONA_SUFFIXES, rng);
      return prefix + suffix;
    }
  }
}

/**
 * Generate a batch of unique shikona names
 */
export function generateShikonaBatch(
  seed: string,
  count: number,
  configs: ShikonaGenerationConfig[] = []
): string[] {
  const rng = seedrandom(seed);
  const usedNames = new Set<string>();
  const names: string[] = [];
  
  for (let i = 0; i < count; i++) {
    const config = configs[i] || {};
    names.push(generateShikona(rng, usedNames, config));
  }
  
  return names;
}

/**
 * Validate that a shikona follows authentic patterns
 */
export function isValidShikona(name: string): boolean {
  // Basic validation: 2-12 characters, romanized Japanese patterns
  if (name.length < 2 || name.length > 12) return false;
  if (!/^[A-Za-zōūĀā]+$/.test(name)) return false;
  return true;
}

/**
 * Get a display-friendly version with macrons
 */
export function formatShikonaDisplay(name: string): string {
  // Add common macron patterns for long vowels
  return name
    .replace(/ou/g, "ō")
    .replace(/uu/g, "ū")
    .replace(/Ou/g, "Ō")
    .replace(/Uu/g, "Ū");
}
