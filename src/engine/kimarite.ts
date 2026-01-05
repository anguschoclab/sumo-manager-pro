// Kimarite Registry - 82 official winning techniques
// Each technique has style affinities and stance requirements

import type { Style, Stance } from "./types";

export interface Kimarite {
  id: string;
  name: string;
  nameJa?: string;
  category: KimariteCategory;
  description?: string;
  // Style affinities: higher = more likely for that style
  styleAffinity: {
    oshi: number;   // 0-10
    yotsu: number;  // 0-10
    hybrid: number; // 0-10
  };
  // Stance requirements
  requiredStances: Stance[];
  // Base frequency weight (higher = more common)
  baseWeight: number;
  // Rarity tier for narrative purposes
  rarity: "common" | "uncommon" | "rare" | "legendary";
}

export type KimariteCategory = 
  | "push"      // Oshi-dashi family
  | "thrust"    // Tsuki family
  | "throw"     // Nage family
  | "trip"      // Kake/gake family
  | "twist"     // Hineri family
  | "pull"      // Hiki family
  | "lift"      // Tsuri family
  | "rear"      // Okuri family
  | "special"   // Rare/unusual
  | "forfeit";  // Non-combat

export const KIMARITE_REGISTRY: Kimarite[] = [
  // === PUSH TECHNIQUES (Oshi) ===
  {
    id: "yorikiri",
    name: "Yorikiri",
    nameJa: "寄り切り",
    category: "push",
    description: "Frontal force-out while holding opponent's belt",
    styleAffinity: { oshi: 6, yotsu: 8, hybrid: 7 },
    requiredStances: ["belt-dominant", "migi-yotsu", "hidari-yotsu"],
    baseWeight: 25,
    rarity: "common"
  },
  {
    id: "oshidashi",
    name: "Oshidashi",
    nameJa: "押し出し",
    category: "push",
    description: "Frontal push out",
    styleAffinity: { oshi: 10, yotsu: 3, hybrid: 6 },
    requiredStances: ["push-dominant", "no-grip"],
    baseWeight: 22,
    rarity: "common"
  },
  {
    id: "oshitaoshi",
    name: "Oshitaoshi",
    nameJa: "押し倒し",
    category: "push",
    description: "Frontal push down",
    styleAffinity: { oshi: 9, yotsu: 2, hybrid: 5 },
    requiredStances: ["push-dominant", "no-grip"],
    baseWeight: 8,
    rarity: "common"
  },
  {
    id: "yoritaoshi",
    name: "Yoritaoshi",
    nameJa: "寄り倒し",
    category: "push",
    description: "Frontal crush out",
    styleAffinity: { oshi: 5, yotsu: 7, hybrid: 6 },
    requiredStances: ["belt-dominant", "migi-yotsu", "hidari-yotsu"],
    baseWeight: 6,
    rarity: "uncommon"
  },
  
  // === THRUST TECHNIQUES (Tsuki) ===
  {
    id: "tsukidashi",
    name: "Tsukidashi",
    nameJa: "突き出し",
    category: "thrust",
    description: "Frontal thrust out",
    styleAffinity: { oshi: 9, yotsu: 2, hybrid: 5 },
    requiredStances: ["push-dominant", "no-grip"],
    baseWeight: 5,
    rarity: "uncommon"
  },
  {
    id: "tsukiotoshi",
    name: "Tsukiotoshi",
    nameJa: "突き落とし",
    category: "thrust",
    description: "Thrust down",
    styleAffinity: { oshi: 8, yotsu: 3, hybrid: 5 },
    requiredStances: ["push-dominant", "no-grip"],
    baseWeight: 4,
    rarity: "uncommon"
  },
  
  // === THROW TECHNIQUES (Nage) ===
  {
    id: "uwatenage",
    name: "Uwatenage",
    nameJa: "上手投げ",
    category: "throw",
    description: "Overarm throw",
    styleAffinity: { oshi: 2, yotsu: 10, hybrid: 6 },
    requiredStances: ["belt-dominant", "migi-yotsu", "hidari-yotsu"],
    baseWeight: 12,
    rarity: "common"
  },
  {
    id: "shitatenage",
    name: "Shitatenage",
    nameJa: "下手投げ",
    category: "throw",
    description: "Underarm throw",
    styleAffinity: { oshi: 2, yotsu: 10, hybrid: 6 },
    requiredStances: ["belt-dominant", "migi-yotsu", "hidari-yotsu"],
    baseWeight: 10,
    rarity: "common"
  },
  {
    id: "kotenage",
    name: "Kotenage",
    nameJa: "小手投げ",
    category: "throw",
    description: "Arm lock throw",
    styleAffinity: { oshi: 4, yotsu: 8, hybrid: 7 },
    requiredStances: ["belt-dominant", "migi-yotsu", "hidari-yotsu", "no-grip"],
    baseWeight: 5,
    rarity: "uncommon"
  },
  {
    id: "sukuinage",
    name: "Sukuinage",
    nameJa: "掬い投げ",
    category: "throw",
    description: "Beltless arm throw",
    styleAffinity: { oshi: 5, yotsu: 7, hybrid: 8 },
    requiredStances: ["no-grip", "push-dominant"],
    baseWeight: 4,
    rarity: "uncommon"
  },
  {
    id: "kubinage",
    name: "Kubinage",
    nameJa: "首投げ",
    category: "throw",
    description: "Headlock throw",
    styleAffinity: { oshi: 3, yotsu: 6, hybrid: 8 },
    requiredStances: ["no-grip", "push-dominant"],
    baseWeight: 2,
    rarity: "rare"
  },
  {
    id: "kakenage",
    name: "Kakenage",
    nameJa: "掛け投げ",
    category: "throw",
    description: "Hooking inner thigh throw",
    styleAffinity: { oshi: 2, yotsu: 8, hybrid: 5 },
    requiredStances: ["belt-dominant", "migi-yotsu", "hidari-yotsu"],
    baseWeight: 1,
    rarity: "rare"
  },
  {
    id: "uwatedashinage",
    name: "Uwatedashinage",
    nameJa: "上手出し投げ",
    category: "throw",
    description: "Pulling overarm throw",
    styleAffinity: { oshi: 3, yotsu: 9, hybrid: 6 },
    requiredStances: ["belt-dominant", "migi-yotsu", "hidari-yotsu"],
    baseWeight: 3,
    rarity: "uncommon"
  },
  {
    id: "shitatedashinage",
    name: "Shitatedashinage",
    nameJa: "下手出し投げ",
    category: "throw",
    description: "Pulling underarm throw",
    styleAffinity: { oshi: 3, yotsu: 9, hybrid: 6 },
    requiredStances: ["belt-dominant", "migi-yotsu", "hidari-yotsu"],
    baseWeight: 3,
    rarity: "uncommon"
  },
  
  // === PULL TECHNIQUES (Hiki) ===
  {
    id: "hatakikomi",
    name: "Hatakikomi",
    nameJa: "叩き込み",
    category: "pull",
    description: "Slap down",
    styleAffinity: { oshi: 7, yotsu: 4, hybrid: 8 },
    requiredStances: ["no-grip", "push-dominant"],
    baseWeight: 15,
    rarity: "common"
  },
  {
    id: "hikiotoshi",
    name: "Hikiotoshi",
    nameJa: "引き落とし",
    category: "pull",
    description: "Hand pull down",
    styleAffinity: { oshi: 6, yotsu: 5, hybrid: 7 },
    requiredStances: ["no-grip", "push-dominant"],
    baseWeight: 6,
    rarity: "uncommon"
  },
  {
    id: "katasukashi",
    name: "Katasukashi",
    nameJa: "肩透かし",
    category: "pull",
    description: "Under-shoulder swing down",
    styleAffinity: { oshi: 5, yotsu: 6, hybrid: 8 },
    requiredStances: ["no-grip"],
    baseWeight: 3,
    rarity: "uncommon"
  },
  
  // === TRIP TECHNIQUES (Gake) ===
  {
    id: "sotogake",
    name: "Sotogake",
    nameJa: "外掛け",
    category: "trip",
    description: "Outside leg trip",
    styleAffinity: { oshi: 3, yotsu: 8, hybrid: 6 },
    requiredStances: ["belt-dominant", "migi-yotsu", "hidari-yotsu"],
    baseWeight: 3,
    rarity: "uncommon"
  },
  {
    id: "uchigake",
    name: "Uchigake",
    nameJa: "内掛け",
    category: "trip",
    description: "Inside leg trip",
    styleAffinity: { oshi: 3, yotsu: 8, hybrid: 6 },
    requiredStances: ["belt-dominant", "migi-yotsu", "hidari-yotsu"],
    baseWeight: 2,
    rarity: "uncommon"
  },
  {
    id: "ketaguri",
    name: "Ketaguri",
    nameJa: "蹴手繰り",
    category: "trip",
    description: "Ankle kick",
    styleAffinity: { oshi: 6, yotsu: 4, hybrid: 8 },
    requiredStances: ["no-grip"],
    baseWeight: 2,
    rarity: "rare"
  },
  {
    id: "kirikaeshi",
    name: "Kirikaeshi",
    nameJa: "切り返し",
    category: "trip",
    description: "Twisting backward knee trip",
    styleAffinity: { oshi: 2, yotsu: 8, hybrid: 5 },
    requiredStances: ["belt-dominant", "migi-yotsu", "hidari-yotsu"],
    baseWeight: 1,
    rarity: "rare"
  },
  
  // === REAR TECHNIQUES (Okuri) ===
  {
    id: "okuridashi",
    name: "Okuridashi",
    nameJa: "送り出し",
    category: "rear",
    description: "Rear push out",
    styleAffinity: { oshi: 7, yotsu: 5, hybrid: 7 },
    requiredStances: ["push-dominant", "belt-dominant"],
    baseWeight: 5,
    rarity: "uncommon"
  },
  {
    id: "okuritaoshi",
    name: "Okuritaoshi",
    nameJa: "送り倒し",
    category: "rear",
    description: "Rear push down",
    styleAffinity: { oshi: 6, yotsu: 5, hybrid: 6 },
    requiredStances: ["push-dominant", "belt-dominant"],
    baseWeight: 2,
    rarity: "uncommon"
  },
  {
    id: "okurinage",
    name: "Okurinage",
    nameJa: "送り投げ",
    category: "rear",
    description: "Rear throw down",
    styleAffinity: { oshi: 4, yotsu: 7, hybrid: 6 },
    requiredStances: ["belt-dominant"],
    baseWeight: 1,
    rarity: "rare"
  },
  
  // === LIFT TECHNIQUES (Tsuri) ===
  {
    id: "tsuridashi",
    name: "Tsuridashi",
    nameJa: "吊り出し",
    category: "lift",
    description: "Lift out",
    styleAffinity: { oshi: 2, yotsu: 9, hybrid: 4 },
    requiredStances: ["belt-dominant"],
    baseWeight: 2,
    rarity: "rare"
  },
  {
    id: "tsuriotoshi",
    name: "Tsuriotoshi",
    nameJa: "吊り落とし",
    category: "lift",
    description: "Lift and throw down",
    styleAffinity: { oshi: 1, yotsu: 9, hybrid: 3 },
    requiredStances: ["belt-dominant"],
    baseWeight: 1,
    rarity: "legendary"
  },
  
  // === TWIST TECHNIQUES (Hineri) ===
  {
    id: "shitatehineri",
    name: "Shitatehineri",
    nameJa: "下手捻り",
    category: "twist",
    description: "Underarm twist down",
    styleAffinity: { oshi: 2, yotsu: 9, hybrid: 5 },
    requiredStances: ["belt-dominant", "migi-yotsu", "hidari-yotsu"],
    baseWeight: 2,
    rarity: "uncommon"
  },
  {
    id: "uwatehineri",
    name: "Uwatehineri",
    nameJa: "上手捻り",
    category: "twist",
    description: "Overarm twist down",
    styleAffinity: { oshi: 2, yotsu: 9, hybrid: 5 },
    requiredStances: ["belt-dominant", "migi-yotsu", "hidari-yotsu"],
    baseWeight: 2,
    rarity: "uncommon"
  },
  
  // === SPECIAL TECHNIQUES ===
  {
    id: "abisetaoshi",
    name: "Abisetaoshi",
    nameJa: "浴びせ倒し",
    category: "special",
    description: "Backward force down",
    styleAffinity: { oshi: 4, yotsu: 7, hybrid: 5 },
    requiredStances: ["belt-dominant"],
    baseWeight: 2,
    rarity: "uncommon"
  },
  {
    id: "komatasukui",
    name: "Komatasukui",
    nameJa: "小股掬い",
    category: "special",
    description: "Over-thigh scooping body drop",
    styleAffinity: { oshi: 3, yotsu: 8, hybrid: 6 },
    requiredStances: ["belt-dominant", "migi-yotsu", "hidari-yotsu"],
    baseWeight: 1,
    rarity: "rare"
  },
  {
    id: "yaguranage",
    name: "Yaguranage",
    nameJa: "櫓投げ",
    category: "special",
    description: "Inner thigh propping throw",
    styleAffinity: { oshi: 1, yotsu: 10, hybrid: 4 },
    requiredStances: ["belt-dominant"],
    baseWeight: 0.5,
    rarity: "legendary"
  },
  {
    id: "ipponzeoi",
    name: "Ipponzeoi",
    nameJa: "一本背負い",
    category: "special",
    description: "One-armed shoulder throw",
    styleAffinity: { oshi: 3, yotsu: 8, hybrid: 7 },
    requiredStances: ["no-grip"],
    baseWeight: 0.5,
    rarity: "legendary"
  },
  {
    id: "izori",
    name: "Izori",
    nameJa: "居反り",
    category: "special",
    description: "Backward lean body drop",
    styleAffinity: { oshi: 2, yotsu: 6, hybrid: 8 },
    requiredStances: ["no-grip"],
    baseWeight: 0.2,
    rarity: "legendary"
  },
  
  // === FORFEIT/SPECIAL RESULTS ===
  {
    id: "fusensho",
    name: "Fusensho",
    nameJa: "不戦勝",
    category: "forfeit",
    description: "Win by default (opponent absent)",
    styleAffinity: { oshi: 0, yotsu: 0, hybrid: 0 },
    requiredStances: [],
    baseWeight: 0,
    rarity: "common"
  },
  {
    id: "hansoku",
    name: "Hansoku",
    nameJa: "反則",
    category: "forfeit",
    description: "Win by foul",
    styleAffinity: { oshi: 0, yotsu: 0, hybrid: 0 },
    requiredStances: [],
    baseWeight: 0,
    rarity: "rare"
  },
];

// Lookup helpers
export function getKimarite(id: string): Kimarite | undefined {
  return KIMARITE_REGISTRY.find(k => k.id === id);
}

export function getKimariteByCategory(category: KimariteCategory): Kimarite[] {
  return KIMARITE_REGISTRY.filter(k => k.category === category);
}

export function getKimariteForStance(stance: Stance): Kimarite[] {
  return KIMARITE_REGISTRY.filter(k => 
    k.requiredStances.length === 0 || k.requiredStances.includes(stance)
  );
}

export function getKimariteForStyle(style: Style): Kimarite[] {
  return KIMARITE_REGISTRY
    .filter(k => k.styleAffinity[style] >= 5)
    .sort((a, b) => b.styleAffinity[style] - a.styleAffinity[style]);
}
