// Procedural Sponsors, Kenshō & Supporters System
// Per Constitution: Economy/Sponsor spec

import seedrandom from "seedrandom";

// === SPONSOR TIER SYSTEM ===

export type SponsorTier = "T0" | "T1" | "T2" | "T3" | "T4" | "T5";

export type SponsorCategory = 
  | "local_business"
  | "regional_corporation"
  | "national_brand"
  | "alumni_association"
  | "cultural_foundation"
  | "private_benefactor"
  | "anonymous_patron";

export type SponsorTone = "traditional" | "modern" | "luxury" | "local" | "industrial" | "civic";

export type SponsorRole = "kensho" | "koenkai_member" | "koenkai_pillar" | "benefactor" | "creditor";

// === SPONSOR ENTITY ===

export interface SponsorRelationship {
  relId: string;
  sponsorId: string;
  targetType: "league" | "basho" | "beya" | "rikishi";
  targetId: string;
  role: SponsorRole;
  strength: 1 | 2 | 3 | 4 | 5;
  startedAtTick: number;
  endsAtTick?: number;
  notesTag?: string;
}

export interface Sponsor {
  sponsorId: string;
  displayName: string;
  shortName?: string;
  category: SponsorCategory;
  tier: SponsorTier;
  originRegionId: string;
  industryTag: string;
  toneTag: SponsorTone;
  
  // Hidden simulation traits (never fully shown to player)
  prestigeAffinity: number;    // 0..100
  loyalty: number;             // 0..100
  scandalTolerance: number;    // 0..100
  riskAppetite: number;        // 0..100
  visibilityPreference: 0 | 1 | 2;
  
  // Dynamic state
  active: boolean;
  createdAtTick: number;
  lastSeenTick: number;
  relationships: SponsorRelationship[];
}

// === KOENKAI (SUPPORTERS ASSOCIATION) ===

export type KoenkaiBandType = "none" | "weak" | "moderate" | "strong" | "powerful";

export interface Koenkai {
  koenkaiId: string;
  beyaId: string;
  strengthBand: KoenkaiBandType;
  members: SponsorRelationship[];
  createdAtTick: number;
  lastChangedTick: number;
}

// === KENSHO BANNER SLOT ===

export interface KenshoBannerSlot {
  bannerId: string;
  boutId: string;
  sponsorId: string;
  tier: SponsorTier;
  displayName: string;
  ceremonyStyleTag: "classic" | "premium" | "quiet";
}

// === NAME GENERATION COMPONENTS ===

const SPONSOR_NAME_PREFIXES = [
  "Hokuto", "Namba", "Kansai", "Tokai", "Yamato", "Sakura", "Mizuho",
  "Asahi", "Nihon", "Kinki", "Chuo", "Meiji", "Shonan", "Sanwa",
  "Sumitomo", "Marubeni", "Taiyo", "Kirin", "Sapporo", "Toyama",
  "Niigata", "Sendai", "Fukuoka", "Nagoya", "Osaka", "Kyoto",
  "Aichi", "Shizuoka", "Chiba", "Saitama", "Yokohama", "Kobe",
  "Takeda", "Matsuda", "Ogawa", "Tanaka", "Yamamoto", "Watanabe"
];

const SPONSOR_NAME_CORES = [
  "Transport", "Logistics", "Industries", "Foods", "Trading",
  "Construction", "Manufacturing", "Electronics", "Automotive",
  "Marine", "Textiles", "Metals", "Chemicals", "Pharma",
  "Breweries", "Fisheries", "Agriculture", "Forestry", "Mining",
  "Commerce", "Finance", "Insurance", "Real Estate", "Tourism"
];

const SPONSOR_NAME_SUFFIXES = [
  "Co.", "Corp.", "Inc.", "Ltd.", "Group", "Holdings", "Works",
  "Industries", "Enterprises", "Associates", "Partners", "Trust",
  "Foundation", "Institute", "Society", "Association", "Club"
];

const LEGACY_SUFFIXES = [
  "Foundation", "Trust", "Institute", "Cultural Society", "Memorial"
];

const FAMILY_NAMES = [
  "Hayashi", "Kobayashi", "Nakamura", "Yoshida", "Sasaki",
  "Yamaguchi", "Matsumoto", "Inoue", "Kimura", "Shimizu",
  "Kato", "Abe", "Hashimoto", "Mori", "Ishikawa", "Okada"
];

const REGIONS = [
  "tokyo", "osaka", "kyoto", "nagoya", "fukuoka", "sapporo",
  "sendai", "hiroshima", "kobe", "yokohama", "chiba", "saitama"
];

const INDUSTRY_TAGS = [
  "logistics", "foods", "manufacturing", "construction", "retail",
  "hospitality", "finance", "cultural", "sports", "media"
];

// === SPONSOR GENERATION ===

export function generateSponsorName(
  rng: seedrandom.PRNG,
  tier: SponsorTier
): { displayName: string; shortName: string } {
  const prefix = SPONSOR_NAME_PREFIXES[Math.floor(rng() * SPONSOR_NAME_PREFIXES.length)];
  const core = SPONSOR_NAME_CORES[Math.floor(rng() * SPONSOR_NAME_CORES.length)];
  
  if (tier === "T5") {
    // Legacy/Benefactor patterns
    const familyName = FAMILY_NAMES[Math.floor(rng() * FAMILY_NAMES.length)];
    const legacySuffix = LEGACY_SUFFIXES[Math.floor(rng() * LEGACY_SUFFIXES.length)];
    const pattern = Math.floor(rng() * 3);
    
    if (pattern === 0) {
      return { displayName: `${familyName} ${legacySuffix}`, shortName: familyName };
    } else if (pattern === 1) {
      return { displayName: `${prefix} ${core} Holdings`, shortName: prefix };
    } else {
      return { displayName: `${core} ${legacySuffix}`, shortName: core };
    }
  }
  
  if (tier === "T3" || tier === "T4") {
    // National/Legacy patterns
    const suffix = SPONSOR_NAME_SUFFIXES[Math.floor(rng() * SPONSOR_NAME_SUFFIXES.length)];
    const pattern = Math.floor(rng() * 3);
    
    if (pattern === 0) {
      return { displayName: `${prefix} ${core} ${suffix}`, shortName: prefix };
    } else if (pattern === 1) {
      return { displayName: `${prefix}-${core} ${suffix}`, shortName: prefix };
    } else {
      const divisionTag = ["Sports", "Cultural", "Trading"][Math.floor(rng() * 3)];
      return { displayName: `${core} ${suffix} ${divisionTag}`, shortName: core };
    }
  }
  
  // T0-T2 patterns
  const suffix = SPONSOR_NAME_SUFFIXES[Math.floor(rng() * SPONSOR_NAME_SUFFIXES.length)];
  const pattern = Math.floor(rng() * 3);
  
  if (pattern === 0) {
    return { displayName: `${prefix} ${core}`, shortName: prefix };
  } else if (pattern === 1) {
    return { displayName: `${core} ${suffix}`, shortName: core };
  } else {
    return { displayName: `${prefix} ${core} ${suffix}`, shortName: prefix };
  }
}

export function generateSponsor(
  rng: seedrandom.PRNG,
  tier: SponsorTier,
  createdAtTick: number,
  existingIds: Set<string>
): Sponsor {
  const { displayName, shortName } = generateSponsorName(rng, tier);
  
  // Generate unique ID
  let sponsorId = `sponsor_${displayName.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
  let attempts = 0;
  while (existingIds.has(sponsorId) && attempts < 100) {
    sponsorId = `sponsor_${displayName.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${Math.floor(rng() * 1000)}`;
    attempts++;
  }
  existingIds.add(sponsorId);
  
  // Category distribution per Constitution
  const categoryRoll = rng();
  let category: SponsorCategory;
  if (categoryRoll < 0.30) category = "local_business";
  else if (categoryRoll < 0.50) category = "regional_corporation";
  else if (categoryRoll < 0.62) category = "national_brand";
  else if (categoryRoll < 0.72) category = "alumni_association";
  else if (categoryRoll < 0.82) category = "cultural_foundation";
  else if (categoryRoll < 0.94) category = "private_benefactor";
  else category = "anonymous_patron";
  
  // Trait ranges by tier per Constitution
  const tierTraits = getTierTraitRanges(tier);
  
  return {
    sponsorId,
    displayName,
    shortName,
    category,
    tier,
    originRegionId: REGIONS[Math.floor(rng() * REGIONS.length)],
    industryTag: INDUSTRY_TAGS[Math.floor(rng() * INDUSTRY_TAGS.length)],
    toneTag: ["traditional", "modern", "luxury", "local", "industrial", "civic"][Math.floor(rng() * 6)] as SponsorTone,
    prestigeAffinity: Math.floor(tierTraits.prestigeMin + rng() * (tierTraits.prestigeMax - tierTraits.prestigeMin)),
    loyalty: Math.floor(tierTraits.loyaltyMin + rng() * (tierTraits.loyaltyMax - tierTraits.loyaltyMin)),
    scandalTolerance: Math.floor(30 + rng() * 50),
    riskAppetite: tier === "T5" ? Math.floor(60 + rng() * 40) : Math.floor(20 + rng() * 60),
    visibilityPreference: tier === "T5" ? 2 : (Math.floor(rng() * 3) as 0 | 1 | 2),
    active: true,
    createdAtTick,
    lastSeenTick: createdAtTick,
    relationships: []
  };
}

function getTierTraitRanges(tier: SponsorTier): { 
  prestigeMin: number; prestigeMax: number; 
  loyaltyMin: number; loyaltyMax: number;
} {
  switch (tier) {
    case "T0": return { prestigeMin: 10, prestigeMax: 35, loyaltyMin: 10, loyaltyMax: 40 };
    case "T1": return { prestigeMin: 15, prestigeMax: 45, loyaltyMin: 20, loyaltyMax: 55 };
    case "T2": return { prestigeMin: 25, prestigeMax: 60, loyaltyMin: 30, loyaltyMax: 70 };
    case "T3": return { prestigeMin: 40, prestigeMax: 75, loyaltyMin: 40, loyaltyMax: 80 };
    case "T4": return { prestigeMin: 50, prestigeMax: 90, loyaltyMin: 50, loyaltyMax: 95 };
    case "T5": return { prestigeMin: 70, prestigeMax: 100, loyaltyMin: 60, loyaltyMax: 100 };
  }
}

// === SPONSOR POOL GENERATION ===

export interface SponsorPool {
  sponsors: Map<string, Sponsor>;
  koenkais: Map<string, Koenkai>;
}

export function generateSponsorPool(
  worldSeed: string,
  worldSizeScalar: number = 1
): SponsorPool {
  const rng = seedrandom(worldSeed + "_sponsors");
  const existingIds = new Set<string>();
  
  // Initial pool size per Constitution: S = 180 + (WorldSizeScalar × 60)
  const poolSize = 180 + Math.floor(worldSizeScalar * 60);
  
  // Tier distribution per Constitution
  const tierDistribution: Record<SponsorTier, number> = {
    T0: 0.35,
    T1: 0.25,
    T2: 0.20,
    T3: 0.12,
    T4: 0.07,
    T5: 0.01
  };
  
  const sponsors = new Map<string, Sponsor>();
  
  for (let i = 0; i < poolSize; i++) {
    const roll = rng();
    let tier: SponsorTier = "T0";
    let cumulative = 0;
    
    for (const [t, prob] of Object.entries(tierDistribution)) {
      cumulative += prob;
      if (roll < cumulative) {
        tier = t as SponsorTier;
        break;
      }
    }
    
    const sponsor = generateSponsor(rng, tier, 0, existingIds);
    sponsors.set(sponsor.sponsorId, sponsor);
  }
  
  return {
    sponsors,
    koenkais: new Map()
  };
}

// === KENSHO BANNER ASSIGNMENT ===

export type BoutImportanceBucket = "low" | "mid" | "high" | "peak";

const TIER_CAPS: Record<BoutImportanceBucket, { maxT4Plus: number; maxT3: number }> = {
  low: { maxT4Plus: 0, maxT3: 1 },
  mid: { maxT4Plus: 1, maxT3: 2 },
  high: { maxT4Plus: 2, maxT3: 4 },
  peak: { maxT4Plus: 4, maxT3: 6 }
};

export function determineBoutImportance(
  eastRank: string,
  westRank: string,
  day: number,
  isYushoContention: boolean = false,
  isPlayoff: boolean = false
): BoutImportanceBucket {
  if (isPlayoff) return "peak";
  
  const topRanks = ["yokozuna", "ozeki", "sekiwake", "komusubi"];
  const isTopRank = topRanks.includes(eastRank) || topRanks.includes(westRank);
  
  if (isYushoContention || (day === 15 && isTopRank)) return "peak";
  if (isTopRank) return "high";
  
  const midRanks = ["maegashira"];
  const isMidRank = midRanks.includes(eastRank) || midRanks.includes(westRank);
  if (isMidRank) return "mid";
  
  return "low";
}

export function assignKenshoBanners(
  boutId: string,
  bannerCount: number,
  importance: BoutImportanceBucket,
  sponsorPool: SponsorPool,
  rng: seedrandom.PRNG
): KenshoBannerSlot[] {
  if (bannerCount === 0) return [];
  
  const caps = TIER_CAPS[importance];
  const activeSponsors = Array.from(sponsorPool.sponsors.values()).filter(s => s.active);
  
  // Sort by score (deterministic)
  const scored = activeSponsors.map(s => ({
    sponsor: s,
    score: s.prestigeAffinity * 0.5 + s.loyalty * 0.3 + (s.tier === "T5" ? 20 : 0)
  })).sort((a, b) => b.score - a.score || a.sponsor.sponsorId.localeCompare(b.sponsor.sponsorId));
  
  const slots: KenshoBannerSlot[] = [];
  let t4Count = 0;
  let t3Count = 0;
  
  for (let i = 0; i < bannerCount && i < scored.length; i++) {
    const sponsor = scored[i].sponsor;
    
    // Check tier caps
    if ((sponsor.tier === "T4" || sponsor.tier === "T5") && t4Count >= caps.maxT4Plus) continue;
    if (sponsor.tier === "T3" && t3Count >= caps.maxT3) continue;
    
    if (sponsor.tier === "T4" || sponsor.tier === "T5") t4Count++;
    if (sponsor.tier === "T3") t3Count++;
    
    const ceremonyStyle = sponsor.tier === "T5" || sponsor.tier === "T4" ? "premium" : 
                          sponsor.visibilityPreference === 0 ? "quiet" : "classic";
    
    slots.push({
      bannerId: `${boutId}_banner_${i}`,
      boutId,
      sponsorId: sponsor.sponsorId,
      tier: sponsor.tier,
      displayName: sponsor.displayName,
      ceremonyStyleTag: ceremonyStyle
    });
  }
  
  return slots;
}

// === KOENKAI MANAGEMENT ===

export function createKoenkai(
  beyaId: string,
  sponsorPool: SponsorPool,
  prestigeBand: string,
  rng: seedrandom.PRNG,
  currentTick: number
): Koenkai {
  const koenkaiId = `koenkai_${beyaId}`;
  
  // Select initial members (3-7 sponsors)
  const memberCount = 3 + Math.floor(rng() * 5);
  const eligibleSponsors = Array.from(sponsorPool.sponsors.values())
    .filter(s => s.active && (s.tier === "T1" || s.tier === "T2" || s.tier === "T3"))
    .sort((a, b) => b.prestigeAffinity - a.prestigeAffinity);
  
  const members: SponsorRelationship[] = [];
  
  for (let i = 0; i < Math.min(memberCount, eligibleSponsors.length); i++) {
    const sponsor = eligibleSponsors[i];
    const isPillar = i === 0 && sponsor.tier !== "T1";
    
    members.push({
      relId: `rel_${koenkaiId}_${sponsor.sponsorId}`,
      sponsorId: sponsor.sponsorId,
      targetType: "beya",
      targetId: beyaId,
      role: isPillar ? "koenkai_pillar" : "koenkai_member",
      strength: isPillar ? 4 : 2,
      startedAtTick: currentTick
    });
  }
  
  // Determine strength band based on prestige
  let strengthBand: KoenkaiBandType = "moderate";
  if (prestigeBand === "elite") strengthBand = "powerful";
  else if (prestigeBand === "respected") strengthBand = "strong";
  else if (prestigeBand === "struggling") strengthBand = "weak";
  else if (prestigeBand === "unknown") strengthBand = "none";
  
  return {
    koenkaiId,
    beyaId,
    strengthBand,
    members,
    createdAtTick: currentTick,
    lastChangedTick: currentTick
  };
}

// === MONTHLY INCOME FROM KOENKAI ===

const KOENKAI_MONTHLY_INCOME: Record<KoenkaiBandType, number> = {
  none: 0,
  weak: 500_000,
  moderate: 1_500_000,
  strong: 3_500_000,
  powerful: 7_000_000
};

export function calculateKoenkaiIncome(strengthBand: KoenkaiBandType): number {
  return KOENKAI_MONTHLY_INCOME[strengthBand];
}

// === BENEFACTOR ESCALATION ===

export function selectBenefactor(
  beyaId: string,
  sponsorPool: SponsorPool,
  koenkai: Koenkai | undefined,
  rng: seedrandom.PRNG
): Sponsor | null {
  // Priority 1: Existing kōenkai pillar with highest riskAppetite
  if (koenkai) {
    const pillars = koenkai.members
      .filter(m => m.role === "koenkai_pillar")
      .map(m => sponsorPool.sponsors.get(m.sponsorId))
      .filter((s): s is Sponsor => s !== undefined)
      .sort((a, b) => b.riskAppetite - a.riskAppetite);
    
    if (pillars.length > 0 && pillars[0].riskAppetite >= 50) {
      return pillars[0];
    }
  }
  
  // Priority 2: Global pool highest-tier sponsor with high riskAppetite
  const eligible = Array.from(sponsorPool.sponsors.values())
    .filter(s => s.active && (s.tier === "T4" || s.tier === "T5") && s.riskAppetite >= 60)
    .sort((a, b) => b.riskAppetite - a.riskAppetite);
  
  if (eligible.length > 0) {
    return eligible[0];
  }
  
  return null;
}
