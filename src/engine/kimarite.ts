// Kimarite Registry - Full 82 official winning techniques
// Each technique has style affinities, archetype bonuses, and stance requirements

import type { Style, Stance, TacticalArchetype } from "./types";

export interface Kimarite {
  id: string;
  name: string;
  nameJa?: string;
  category: KimariteCategory;
  kimariteClass: KimariteClass;  // For archetype matching
  description?: string;
  // Style affinities: higher = more likely for that style (0-10)
  styleAffinity: {
    oshi: number;
    yotsu: number;
    hybrid: number;
  };
  // Archetype synergy bonuses (added to weight)
  archetypeBonus: Partial<Record<TacticalArchetype, number>>;
  // Stance requirements
  requiredStances: Stance[];
  // Vector: direction of the technique
  vector: "frontal" | "lateral" | "rear";
  // Grip requirement
  gripNeed: "belt" | "arm" | "none" | "any";
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

// Classes for archetype matching
export type KimariteClass = 
  | "force_out"   // Yorikiri, oshidashi etc
  | "push"        // Push techniques
  | "thrust"      // Thrusting techniques
  | "throw"       // Belt throws
  | "trip"        // Leg trips
  | "twist"       // Twisting throws
  | "slap_pull"   // Hatakikomi family
  | "lift"        // Lifting out
  | "rear"        // From behind
  | "evasion"     // Dodging/sidestep
  | "special"     // Unusual moves
  | "forfeit";    // Non-combat

// Full 82 Kimarite Registry
export const KIMARITE_REGISTRY: Kimarite[] = [
  // === FORCE OUT / PUSH TECHNIQUES ===
  {
    id: "yorikiri",
    name: "Yorikiri",
    nameJa: "寄り切り",
    category: "push",
    kimariteClass: "force_out",
    description: "Frontal force-out while holding opponent's belt",
    styleAffinity: { oshi: 6, yotsu: 9, hybrid: 7 },
    archetypeBonus: { yotsu_specialist: 8, all_rounder: 3 },
    requiredStances: ["belt-dominant", "migi-yotsu", "hidari-yotsu"],
    vector: "frontal",
    gripNeed: "belt",
    baseWeight: 25,
    rarity: "common"
  },
  {
    id: "oshidashi",
    name: "Oshidashi",
    nameJa: "押し出し",
    category: "push",
    kimariteClass: "force_out",
    description: "Frontal push out without belt grip",
    styleAffinity: { oshi: 10, yotsu: 2, hybrid: 5 },
    archetypeBonus: { oshi_specialist: 10, speedster: 3 },
    requiredStances: ["push-dominant", "no-grip"],
    vector: "frontal",
    gripNeed: "none",
    baseWeight: 22,
    rarity: "common"
  },
  {
    id: "oshitaoshi",
    name: "Oshitaoshi",
    nameJa: "押し倒し",
    category: "push",
    kimariteClass: "push",
    description: "Push down onto the dohyo",
    styleAffinity: { oshi: 9, yotsu: 2, hybrid: 5 },
    archetypeBonus: { oshi_specialist: 8 },
    requiredStances: ["push-dominant", "no-grip"],
    vector: "frontal",
    gripNeed: "none",
    baseWeight: 8,
    rarity: "common"
  },
  {
    id: "yoritaoshi",
    name: "Yoritaoshi",
    nameJa: "寄り倒し",
    category: "push",
    kimariteClass: "force_out",
    description: "Lean and crush opponent out",
    styleAffinity: { oshi: 5, yotsu: 8, hybrid: 6 },
    archetypeBonus: { yotsu_specialist: 5, oshi_specialist: 3 },
    requiredStances: ["belt-dominant", "migi-yotsu", "hidari-yotsu"],
    vector: "frontal",
    gripNeed: "belt",
    baseWeight: 6,
    rarity: "uncommon"
  },
  
  // === THRUST TECHNIQUES (Tsuki) ===
  {
    id: "tsukidashi",
    name: "Tsukidashi",
    nameJa: "突き出し",
    category: "thrust",
    kimariteClass: "thrust",
    description: "Thrusting push out",
    styleAffinity: { oshi: 9, yotsu: 2, hybrid: 5 },
    archetypeBonus: { oshi_specialist: 8, speedster: 4 },
    requiredStances: ["push-dominant", "no-grip"],
    vector: "frontal",
    gripNeed: "none",
    baseWeight: 5,
    rarity: "uncommon"
  },
  {
    id: "tsukiotoshi",
    name: "Tsukiotoshi",
    nameJa: "突き落とし",
    category: "thrust",
    kimariteClass: "thrust",
    description: "Thrust down",
    styleAffinity: { oshi: 8, yotsu: 3, hybrid: 5 },
    archetypeBonus: { oshi_specialist: 6 },
    requiredStances: ["push-dominant", "no-grip"],
    vector: "frontal",
    gripNeed: "none",
    baseWeight: 4,
    rarity: "uncommon"
  },
  
  // === THROW TECHNIQUES (Nage) ===
  {
    id: "uwatenage",
    name: "Uwatenage",
    nameJa: "上手投げ",
    category: "throw",
    kimariteClass: "throw",
    description: "Overarm throw",
    styleAffinity: { oshi: 2, yotsu: 10, hybrid: 6 },
    archetypeBonus: { yotsu_specialist: 10, all_rounder: 2 },
    requiredStances: ["belt-dominant", "migi-yotsu", "hidari-yotsu"],
    vector: "lateral",
    gripNeed: "belt",
    baseWeight: 12,
    rarity: "common"
  },
  {
    id: "shitatenage",
    name: "Shitatenage",
    nameJa: "下手投げ",
    category: "throw",
    kimariteClass: "throw",
    description: "Underarm throw",
    styleAffinity: { oshi: 2, yotsu: 10, hybrid: 6 },
    archetypeBonus: { yotsu_specialist: 10, all_rounder: 2 },
    requiredStances: ["belt-dominant", "migi-yotsu", "hidari-yotsu"],
    vector: "lateral",
    gripNeed: "belt",
    baseWeight: 10,
    rarity: "common"
  },
  {
    id: "kotenage",
    name: "Kotenage",
    nameJa: "小手投げ",
    category: "throw",
    kimariteClass: "throw",
    description: "Arm lock throw",
    styleAffinity: { oshi: 4, yotsu: 8, hybrid: 7 },
    archetypeBonus: { yotsu_specialist: 6, trickster: 4 },
    requiredStances: ["belt-dominant", "migi-yotsu", "hidari-yotsu", "no-grip"],
    vector: "lateral",
    gripNeed: "arm",
    baseWeight: 5,
    rarity: "uncommon"
  },
  {
    id: "sukuinage",
    name: "Sukuinage",
    nameJa: "掬い投げ",
    category: "throw",
    kimariteClass: "throw",
    description: "Beltless arm throw",
    styleAffinity: { oshi: 5, yotsu: 7, hybrid: 8 },
    archetypeBonus: { all_rounder: 5, trickster: 3 },
    requiredStances: ["no-grip", "push-dominant"],
    vector: "lateral",
    gripNeed: "arm",
    baseWeight: 4,
    rarity: "uncommon"
  },
  {
    id: "kubinage",
    name: "Kubinage",
    nameJa: "首投げ",
    category: "throw",
    kimariteClass: "throw",
    description: "Headlock throw",
    styleAffinity: { oshi: 3, yotsu: 6, hybrid: 8 },
    archetypeBonus: { trickster: 6, speedster: 3 },
    requiredStances: ["no-grip", "push-dominant"],
    vector: "lateral",
    gripNeed: "none",
    baseWeight: 2,
    rarity: "rare"
  },
  {
    id: "kakenage",
    name: "Kakenage",
    nameJa: "掛け投げ",
    category: "throw",
    kimariteClass: "throw",
    description: "Hooking inner thigh throw",
    styleAffinity: { oshi: 2, yotsu: 8, hybrid: 5 },
    archetypeBonus: { yotsu_specialist: 5, speedster: 3 },
    requiredStances: ["belt-dominant", "migi-yotsu", "hidari-yotsu"],
    vector: "lateral",
    gripNeed: "belt",
    baseWeight: 1,
    rarity: "rare"
  },
  {
    id: "uwatedashinage",
    name: "Uwatedashinage",
    nameJa: "上手出し投げ",
    category: "throw",
    kimariteClass: "throw",
    description: "Pulling overarm throw",
    styleAffinity: { oshi: 3, yotsu: 9, hybrid: 6 },
    archetypeBonus: { yotsu_specialist: 7 },
    requiredStances: ["belt-dominant", "migi-yotsu", "hidari-yotsu"],
    vector: "lateral",
    gripNeed: "belt",
    baseWeight: 3,
    rarity: "uncommon"
  },
  {
    id: "shitatedashinage",
    name: "Shitatedashinage",
    nameJa: "下手出し投げ",
    category: "throw",
    kimariteClass: "throw",
    description: "Pulling underarm throw",
    styleAffinity: { oshi: 3, yotsu: 9, hybrid: 6 },
    archetypeBonus: { yotsu_specialist: 7 },
    requiredStances: ["belt-dominant", "migi-yotsu", "hidari-yotsu"],
    vector: "lateral",
    gripNeed: "belt",
    baseWeight: 3,
    rarity: "uncommon"
  },
  {
    id: "tsukaminage",
    name: "Tsukaminage",
    nameJa: "掴み投げ",
    category: "throw",
    kimariteClass: "throw",
    description: "Lifting throw with double grip",
    styleAffinity: { oshi: 1, yotsu: 9, hybrid: 4 },
    archetypeBonus: { yotsu_specialist: 6 },
    requiredStances: ["belt-dominant"],
    vector: "lateral",
    gripNeed: "belt",
    baseWeight: 1,
    rarity: "rare"
  },
  {
    id: "nichonage",
    name: "Nichonage",
    nameJa: "二丁投げ",
    category: "throw",
    kimariteClass: "throw",
    description: "Double arm throw",
    styleAffinity: { oshi: 2, yotsu: 8, hybrid: 6 },
    archetypeBonus: { yotsu_specialist: 4, trickster: 3 },
    requiredStances: ["belt-dominant", "migi-yotsu", "hidari-yotsu"],
    vector: "lateral",
    gripNeed: "arm",
    baseWeight: 0.5,
    rarity: "legendary"
  },
  {
    id: "tokkurinage",
    name: "Tokkurinage",
    nameJa: "徳利投げ",
    category: "throw",
    kimariteClass: "throw",
    description: "Two-hand head throw",
    styleAffinity: { oshi: 3, yotsu: 5, hybrid: 7 },
    archetypeBonus: { trickster: 6, speedster: 3 },
    requiredStances: ["no-grip"],
    vector: "lateral",
    gripNeed: "none",
    baseWeight: 0.5,
    rarity: "legendary"
  },
  
  // === PULL TECHNIQUES (Hiki / Slap-Pull) ===
  {
    id: "hatakikomi",
    name: "Hatakikomi",
    nameJa: "叩き込み",
    category: "pull",
    kimariteClass: "slap_pull",
    description: "Slap down",
    styleAffinity: { oshi: 7, yotsu: 4, hybrid: 9 },
    archetypeBonus: { trickster: 10, speedster: 6, all_rounder: 2 },
    requiredStances: ["no-grip", "push-dominant"],
    vector: "frontal",
    gripNeed: "none",
    baseWeight: 15,
    rarity: "common"
  },
  {
    id: "hikiotoshi",
    name: "Hikiotoshi",
    nameJa: "引き落とし",
    category: "pull",
    kimariteClass: "slap_pull",
    description: "Hand pull down",
    styleAffinity: { oshi: 6, yotsu: 5, hybrid: 7 },
    archetypeBonus: { trickster: 6, speedster: 4 },
    requiredStances: ["no-grip", "push-dominant"],
    vector: "frontal",
    gripNeed: "none",
    baseWeight: 6,
    rarity: "uncommon"
  },
  {
    id: "katasukashi",
    name: "Katasukashi",
    nameJa: "肩透かし",
    category: "pull",
    kimariteClass: "slap_pull",
    description: "Under-shoulder swing down",
    styleAffinity: { oshi: 5, yotsu: 6, hybrid: 8 },
    archetypeBonus: { trickster: 8, speedster: 5 },
    requiredStances: ["no-grip"],
    vector: "lateral",
    gripNeed: "none",
    baseWeight: 3,
    rarity: "uncommon"
  },
  {
    id: "hikkake",
    name: "Hikkake",
    nameJa: "引っ掛け",
    category: "pull",
    kimariteClass: "slap_pull",
    description: "Arm grabbing force out",
    styleAffinity: { oshi: 5, yotsu: 5, hybrid: 7 },
    archetypeBonus: { trickster: 5, all_rounder: 3 },
    requiredStances: ["no-grip", "push-dominant"],
    vector: "lateral",
    gripNeed: "arm",
    baseWeight: 2,
    rarity: "uncommon"
  },
  
  // === TRIP TECHNIQUES (Gake) ===
  {
    id: "sotogake",
    name: "Sotogake",
    nameJa: "外掛け",
    category: "trip",
    kimariteClass: "trip",
    description: "Outside leg trip",
    styleAffinity: { oshi: 3, yotsu: 8, hybrid: 6 },
    archetypeBonus: { yotsu_specialist: 5, speedster: 6 },
    requiredStances: ["belt-dominant", "migi-yotsu", "hidari-yotsu"],
    vector: "frontal",
    gripNeed: "belt",
    baseWeight: 3,
    rarity: "uncommon"
  },
  {
    id: "uchigake",
    name: "Uchigake",
    nameJa: "内掛け",
    category: "trip",
    kimariteClass: "trip",
    description: "Inside leg trip",
    styleAffinity: { oshi: 3, yotsu: 8, hybrid: 6 },
    archetypeBonus: { yotsu_specialist: 5, speedster: 6 },
    requiredStances: ["belt-dominant", "migi-yotsu", "hidari-yotsu"],
    vector: "frontal",
    gripNeed: "belt",
    baseWeight: 2,
    rarity: "uncommon"
  },
  {
    id: "ketaguri",
    name: "Ketaguri",
    nameJa: "蹴手繰り",
    category: "trip",
    kimariteClass: "trip",
    description: "Ankle kick at tachiai",
    styleAffinity: { oshi: 6, yotsu: 4, hybrid: 8 },
    archetypeBonus: { trickster: 10, speedster: 8 },
    requiredStances: ["no-grip"],
    vector: "lateral",
    gripNeed: "none",
    baseWeight: 2,
    rarity: "rare"
  },
  {
    id: "kirikaeshi",
    name: "Kirikaeshi",
    nameJa: "切り返し",
    category: "trip",
    kimariteClass: "trip",
    description: "Twisting backward knee trip",
    styleAffinity: { oshi: 2, yotsu: 8, hybrid: 5 },
    archetypeBonus: { yotsu_specialist: 6, trickster: 4 },
    requiredStances: ["belt-dominant", "migi-yotsu", "hidari-yotsu"],
    vector: "lateral",
    gripNeed: "belt",
    baseWeight: 1,
    rarity: "rare"
  },
  {
    id: "susoharai",
    name: "Susoharai",
    nameJa: "裾払い",
    category: "trip",
    kimariteClass: "trip",
    description: "Rear foot sweep",
    styleAffinity: { oshi: 4, yotsu: 6, hybrid: 7 },
    archetypeBonus: { speedster: 7, trickster: 5 },
    requiredStances: ["no-grip", "push-dominant"],
    vector: "lateral",
    gripNeed: "none",
    baseWeight: 1,
    rarity: "rare"
  },
  {
    id: "sotokomata",
    name: "Sotokomata",
    nameJa: "外小股",
    category: "trip",
    kimariteClass: "trip",
    description: "Outside thigh scoop",
    styleAffinity: { oshi: 3, yotsu: 7, hybrid: 6 },
    archetypeBonus: { trickster: 5, speedster: 4 },
    requiredStances: ["belt-dominant", "migi-yotsu", "hidari-yotsu"],
    vector: "lateral",
    gripNeed: "belt",
    baseWeight: 0.5,
    rarity: "legendary"
  },
  {
    id: "uchimuso",
    name: "Uchimuso",
    nameJa: "内無双",
    category: "trip",
    kimariteClass: "trip",
    description: "Inside thigh twist down",
    styleAffinity: { oshi: 3, yotsu: 7, hybrid: 6 },
    archetypeBonus: { trickster: 6, yotsu_specialist: 3 },
    requiredStances: ["belt-dominant", "migi-yotsu", "hidari-yotsu"],
    vector: "lateral",
    gripNeed: "belt",
    baseWeight: 0.5,
    rarity: "rare"
  },
  {
    id: "sotomuso",
    name: "Sotomuso",
    nameJa: "外無双",
    category: "trip",
    kimariteClass: "trip",
    description: "Outside thigh twist down",
    styleAffinity: { oshi: 3, yotsu: 7, hybrid: 6 },
    archetypeBonus: { trickster: 6, yotsu_specialist: 3 },
    requiredStances: ["belt-dominant", "migi-yotsu", "hidari-yotsu"],
    vector: "lateral",
    gripNeed: "belt",
    baseWeight: 0.5,
    rarity: "rare"
  },
  {
    id: "kawazugake",
    name: "Kawazugake",
    nameJa: "河津掛け",
    category: "trip",
    kimariteClass: "trip",
    description: "Hooking backward counter throw (dangerous)",
    styleAffinity: { oshi: 2, yotsu: 6, hybrid: 7 },
    archetypeBonus: { trickster: 8, speedster: 5 },
    requiredStances: ["belt-dominant"],
    vector: "rear",
    gripNeed: "belt",
    baseWeight: 0.3,
    rarity: "legendary"
  },
  
  // === REAR TECHNIQUES (Okuri) ===
  {
    id: "okuridashi",
    name: "Okuridashi",
    nameJa: "送り出し",
    category: "rear",
    kimariteClass: "rear",
    description: "Rear push out",
    styleAffinity: { oshi: 7, yotsu: 5, hybrid: 7 },
    archetypeBonus: { oshi_specialist: 5, speedster: 4, all_rounder: 3 },
    requiredStances: ["push-dominant", "belt-dominant"],
    vector: "rear",
    gripNeed: "any",
    baseWeight: 5,
    rarity: "uncommon"
  },
  {
    id: "okuritaoshi",
    name: "Okuritaoshi",
    nameJa: "送り倒し",
    category: "rear",
    kimariteClass: "rear",
    description: "Rear push down",
    styleAffinity: { oshi: 6, yotsu: 5, hybrid: 6 },
    archetypeBonus: { oshi_specialist: 4, speedster: 3 },
    requiredStances: ["push-dominant", "belt-dominant"],
    vector: "rear",
    gripNeed: "any",
    baseWeight: 2,
    rarity: "uncommon"
  },
  {
    id: "okurinage",
    name: "Okurinage",
    nameJa: "送り投げ",
    category: "rear",
    kimariteClass: "rear",
    description: "Rear throw down",
    styleAffinity: { oshi: 4, yotsu: 7, hybrid: 6 },
    archetypeBonus: { yotsu_specialist: 5, trickster: 3 },
    requiredStances: ["belt-dominant"],
    vector: "rear",
    gripNeed: "belt",
    baseWeight: 1,
    rarity: "rare"
  },
  {
    id: "okurihikiotoshi",
    name: "Okurihikiotoshi",
    nameJa: "送り引き落とし",
    category: "rear",
    kimariteClass: "rear",
    description: "Rear pull down",
    styleAffinity: { oshi: 5, yotsu: 5, hybrid: 6 },
    archetypeBonus: { trickster: 5, speedster: 3 },
    requiredStances: ["no-grip", "push-dominant"],
    vector: "rear",
    gripNeed: "none",
    baseWeight: 1,
    rarity: "rare"
  },
  {
    id: "okuritsukiotoshi",
    name: "Okuritsukiotoshi",
    nameJa: "送り突き落とし",
    category: "rear",
    kimariteClass: "rear",
    description: "Rear thrust down",
    styleAffinity: { oshi: 6, yotsu: 4, hybrid: 5 },
    archetypeBonus: { oshi_specialist: 4 },
    requiredStances: ["push-dominant"],
    vector: "rear",
    gripNeed: "none",
    baseWeight: 0.5,
    rarity: "rare"
  },
  {
    id: "okuritsuridashi",
    name: "Okuritsuridashi",
    nameJa: "送り吊り出し",
    category: "rear",
    kimariteClass: "rear",
    description: "Rear lift out",
    styleAffinity: { oshi: 2, yotsu: 8, hybrid: 4 },
    archetypeBonus: { yotsu_specialist: 5 },
    requiredStances: ["belt-dominant"],
    vector: "rear",
    gripNeed: "belt",
    baseWeight: 0.3,
    rarity: "legendary"
  },
  
  // === LIFT TECHNIQUES (Tsuri) ===
  {
    id: "tsuridashi",
    name: "Tsuridashi",
    nameJa: "吊り出し",
    category: "lift",
    kimariteClass: "lift",
    description: "Lift out",
    styleAffinity: { oshi: 2, yotsu: 9, hybrid: 4 },
    archetypeBonus: { yotsu_specialist: 8 },
    requiredStances: ["belt-dominant"],
    vector: "frontal",
    gripNeed: "belt",
    baseWeight: 2,
    rarity: "rare"
  },
  {
    id: "tsuriotoshi",
    name: "Tsuriotoshi",
    nameJa: "吊り落とし",
    category: "lift",
    kimariteClass: "lift",
    description: "Lift and throw down",
    styleAffinity: { oshi: 1, yotsu: 9, hybrid: 3 },
    archetypeBonus: { yotsu_specialist: 6 },
    requiredStances: ["belt-dominant"],
    vector: "frontal",
    gripNeed: "belt",
    baseWeight: 1,
    rarity: "legendary"
  },
  
  // === TWIST TECHNIQUES (Hineri) ===
  {
    id: "shitatehineri",
    name: "Shitatehineri",
    nameJa: "下手捻り",
    category: "twist",
    kimariteClass: "twist",
    description: "Underarm twist down",
    styleAffinity: { oshi: 2, yotsu: 9, hybrid: 5 },
    archetypeBonus: { yotsu_specialist: 7, trickster: 3 },
    requiredStances: ["belt-dominant", "migi-yotsu", "hidari-yotsu"],
    vector: "lateral",
    gripNeed: "belt",
    baseWeight: 2,
    rarity: "uncommon"
  },
  {
    id: "uwatehineri",
    name: "Uwatehineri",
    nameJa: "上手捻り",
    category: "twist",
    kimariteClass: "twist",
    description: "Overarm twist down",
    styleAffinity: { oshi: 2, yotsu: 9, hybrid: 5 },
    archetypeBonus: { yotsu_specialist: 7, trickster: 3 },
    requiredStances: ["belt-dominant", "migi-yotsu", "hidari-yotsu"],
    vector: "lateral",
    gripNeed: "belt",
    baseWeight: 2,
    rarity: "uncommon"
  },
  {
    id: "kainahineri",
    name: "Kainahineri",
    nameJa: "腕捻り",
    category: "twist",
    kimariteClass: "twist",
    description: "Arm twist down",
    styleAffinity: { oshi: 4, yotsu: 7, hybrid: 6 },
    archetypeBonus: { trickster: 5, yotsu_specialist: 3 },
    requiredStances: ["no-grip", "push-dominant"],
    vector: "lateral",
    gripNeed: "arm",
    baseWeight: 1,
    rarity: "rare"
  },
  {
    id: "zubuneri",
    name: "Zubuneri",
    nameJa: "ずぶねり",
    category: "twist",
    kimariteClass: "twist",
    description: "Headlock twist down",
    styleAffinity: { oshi: 4, yotsu: 5, hybrid: 7 },
    archetypeBonus: { trickster: 6, speedster: 3 },
    requiredStances: ["no-grip"],
    vector: "lateral",
    gripNeed: "none",
    baseWeight: 0.5,
    rarity: "rare"
  },
  
  // === SPECIAL TECHNIQUES ===
  {
    id: "abisetaoshi",
    name: "Abisetaoshi",
    nameJa: "浴びせ倒し",
    category: "special",
    kimariteClass: "special",
    description: "Backward force down (leaning on opponent)",
    styleAffinity: { oshi: 4, yotsu: 7, hybrid: 5 },
    archetypeBonus: { yotsu_specialist: 4, oshi_specialist: 3 },
    requiredStances: ["belt-dominant"],
    vector: "frontal",
    gripNeed: "belt",
    baseWeight: 2,
    rarity: "uncommon"
  },
  {
    id: "komatasukui",
    name: "Komatasukui",
    nameJa: "小股掬い",
    category: "special",
    kimariteClass: "special",
    description: "Over-thigh scooping body drop",
    styleAffinity: { oshi: 3, yotsu: 8, hybrid: 6 },
    archetypeBonus: { yotsu_specialist: 5, trickster: 4 },
    requiredStances: ["belt-dominant", "migi-yotsu", "hidari-yotsu"],
    vector: "lateral",
    gripNeed: "belt",
    baseWeight: 1,
    rarity: "rare"
  },
  {
    id: "yaguranage",
    name: "Yaguranage",
    nameJa: "櫓投げ",
    category: "special",
    kimariteClass: "special",
    description: "Inner thigh propping throw",
    styleAffinity: { oshi: 1, yotsu: 10, hybrid: 4 },
    archetypeBonus: { yotsu_specialist: 8 },
    requiredStances: ["belt-dominant"],
    vector: "lateral",
    gripNeed: "belt",
    baseWeight: 0.3,
    rarity: "legendary"
  },
  {
    id: "ipponzeoi",
    name: "Ipponzeoi",
    nameJa: "一本背負い",
    category: "special",
    kimariteClass: "special",
    description: "One-armed shoulder throw",
    styleAffinity: { oshi: 3, yotsu: 8, hybrid: 7 },
    archetypeBonus: { trickster: 8, speedster: 5 },
    requiredStances: ["no-grip"],
    vector: "lateral",
    gripNeed: "arm",
    baseWeight: 0.3,
    rarity: "legendary"
  },
  {
    id: "izori",
    name: "Izori",
    nameJa: "居反り",
    category: "special",
    kimariteClass: "special",
    description: "Backward lean body drop",
    styleAffinity: { oshi: 2, yotsu: 6, hybrid: 8 },
    archetypeBonus: { trickster: 10, speedster: 6 },
    requiredStances: ["no-grip"],
    vector: "rear",
    gripNeed: "none",
    baseWeight: 0.2,
    rarity: "legendary"
  },
  {
    id: "sabaori",
    name: "Sabaori",
    nameJa: "鯖折り",
    category: "special",
    kimariteClass: "special",
    description: "Forward body slam",
    styleAffinity: { oshi: 3, yotsu: 8, hybrid: 5 },
    archetypeBonus: { yotsu_specialist: 6 },
    requiredStances: ["belt-dominant"],
    vector: "frontal",
    gripNeed: "belt",
    baseWeight: 1,
    rarity: "rare"
  },
  {
    id: "harimanage",
    name: "Harimanage",
    nameJa: "波離間投げ",
    category: "special",
    kimariteClass: "special",
    description: "Backward pivot throw",
    styleAffinity: { oshi: 3, yotsu: 7, hybrid: 7 },
    archetypeBonus: { trickster: 7, speedster: 4 },
    requiredStances: ["belt-dominant", "migi-yotsu", "hidari-yotsu"],
    vector: "lateral",
    gripNeed: "belt",
    baseWeight: 0.5,
    rarity: "legendary"
  },
  {
    id: "kimedashi",
    name: "Kimedashi",
    nameJa: "極め出し",
    category: "special",
    kimariteClass: "special",
    description: "Arm barring force out",
    styleAffinity: { oshi: 5, yotsu: 6, hybrid: 6 },
    archetypeBonus: { yotsu_specialist: 4, all_rounder: 3 },
    requiredStances: ["push-dominant", "no-grip"],
    vector: "frontal",
    gripNeed: "arm",
    baseWeight: 2,
    rarity: "uncommon"
  },
  {
    id: "kimetaoshi",
    name: "Kimetaoshi",
    nameJa: "極め倒し",
    category: "special",
    kimariteClass: "special",
    description: "Arm barring force down",
    styleAffinity: { oshi: 5, yotsu: 6, hybrid: 6 },
    archetypeBonus: { yotsu_specialist: 4 },
    requiredStances: ["push-dominant", "no-grip"],
    vector: "frontal",
    gripNeed: "arm",
    baseWeight: 1,
    rarity: "rare"
  },
  {
    id: "ashitori",
    name: "Ashitori",
    nameJa: "足取り",
    category: "special",
    kimariteClass: "special",
    description: "Leg pick",
    styleAffinity: { oshi: 4, yotsu: 5, hybrid: 8 },
    archetypeBonus: { trickster: 8, speedster: 6 },
    requiredStances: ["no-grip"],
    vector: "frontal",
    gripNeed: "none",
    baseWeight: 1,
    rarity: "rare"
  },
  {
    id: "mitokorozeme",
    name: "Mitokorozeme",
    nameJa: "三所攻め",
    category: "special",
    kimariteClass: "special",
    description: "Triple attack (arm, leg, body)",
    styleAffinity: { oshi: 2, yotsu: 9, hybrid: 5 },
    archetypeBonus: { yotsu_specialist: 8 },
    requiredStances: ["belt-dominant"],
    vector: "frontal",
    gripNeed: "belt",
    baseWeight: 0.2,
    rarity: "legendary"
  },
  {
    id: "tsutaezori",
    name: "Tsutaezori",
    nameJa: "伝え反り",
    category: "special",
    kimariteClass: "special",
    description: "Leaning backward body drop",
    styleAffinity: { oshi: 2, yotsu: 6, hybrid: 7 },
    archetypeBonus: { trickster: 8, speedster: 5 },
    requiredStances: ["no-grip"],
    vector: "rear",
    gripNeed: "none",
    baseWeight: 0.2,
    rarity: "legendary"
  },
  {
    id: "shumokuzori",
    name: "Shumokuzori",
    nameJa: "撞木反り",
    category: "special",
    kimariteClass: "special",
    description: "Hammer backward body drop",
    styleAffinity: { oshi: 2, yotsu: 5, hybrid: 7 },
    archetypeBonus: { trickster: 8 },
    requiredStances: ["no-grip"],
    vector: "rear",
    gripNeed: "arm",
    baseWeight: 0.1,
    rarity: "legendary"
  },
  {
    id: "kakezori",
    name: "Kakezori",
    nameJa: "掛け反り",
    category: "special",
    kimariteClass: "special",
    description: "Hooking backward body drop",
    styleAffinity: { oshi: 2, yotsu: 6, hybrid: 7 },
    archetypeBonus: { trickster: 8, speedster: 4 },
    requiredStances: ["belt-dominant"],
    vector: "rear",
    gripNeed: "belt",
    baseWeight: 0.1,
    rarity: "legendary"
  },
  {
    id: "tasukizori",
    name: "Tasukizori",
    nameJa: "襷反り",
    category: "special",
    kimariteClass: "special",
    description: "Cross-body backward throw",
    styleAffinity: { oshi: 2, yotsu: 6, hybrid: 7 },
    archetypeBonus: { trickster: 8 },
    requiredStances: ["no-grip"],
    vector: "rear",
    gripNeed: "arm",
    baseWeight: 0.1,
    rarity: "legendary"
  },
  {
    id: "omata",
    name: "Omata",
    nameJa: "大股",
    category: "special",
    kimariteClass: "special",
    description: "Thigh grabbing push down",
    styleAffinity: { oshi: 3, yotsu: 7, hybrid: 6 },
    archetypeBonus: { trickster: 5, yotsu_specialist: 3 },
    requiredStances: ["belt-dominant"],
    vector: "frontal",
    gripNeed: "any",
    baseWeight: 0.5,
    rarity: "rare"
  },
  {
    id: "watashikomi",
    name: "Watashikomi",
    nameJa: "渡し込み",
    category: "special",
    kimariteClass: "special",
    description: "Thigh hooking body drop",
    styleAffinity: { oshi: 3, yotsu: 8, hybrid: 6 },
    archetypeBonus: { yotsu_specialist: 5, trickster: 4 },
    requiredStances: ["belt-dominant"],
    vector: "lateral",
    gripNeed: "belt",
    baseWeight: 0.5,
    rarity: "rare"
  },
  {
    id: "nimaigeri",
    name: "Nimaigeri",
    nameJa: "二枚蹴り",
    category: "special",
    kimariteClass: "trip",
    description: "Double leg kick",
    styleAffinity: { oshi: 4, yotsu: 5, hybrid: 7 },
    archetypeBonus: { trickster: 7, speedster: 6 },
    requiredStances: ["no-grip"],
    vector: "lateral",
    gripNeed: "none",
    baseWeight: 0.3,
    rarity: "legendary"
  },
  {
    id: "kirinuke",
    name: "Kirinuke",
    nameJa: "切り抜け",
    category: "special",
    kimariteClass: "evasion",
    description: "Escape and push out (opponent falls out)",
    styleAffinity: { oshi: 5, yotsu: 4, hybrid: 8 },
    archetypeBonus: { speedster: 8, trickster: 6 },
    requiredStances: ["no-grip"],
    vector: "lateral",
    gripNeed: "none",
    baseWeight: 0.5,
    rarity: "rare"
  },
  {
    id: "sotomakiwari",
    name: "Sotomakiwari",
    nameJa: "外巻割り",
    category: "special",
    kimariteClass: "special",
    description: "Outside wrapping force down",
    styleAffinity: { oshi: 3, yotsu: 7, hybrid: 6 },
    archetypeBonus: { yotsu_specialist: 5, trickster: 3 },
    requiredStances: ["belt-dominant"],
    vector: "lateral",
    gripNeed: "belt",
    baseWeight: 0.3,
    rarity: "legendary"
  },
  {
    id: "uchimakiwari",
    name: "Uchimakiwari",
    nameJa: "内巻割り",
    category: "special",
    kimariteClass: "special",
    description: "Inside wrapping force down",
    styleAffinity: { oshi: 3, yotsu: 7, hybrid: 6 },
    archetypeBonus: { yotsu_specialist: 5, trickster: 3 },
    requiredStances: ["belt-dominant"],
    vector: "lateral",
    gripNeed: "belt",
    baseWeight: 0.3,
    rarity: "legendary"
  },
  {
    id: "okottashi",
    name: "Okottashi",
    nameJa: "押っ付け倒し",
    category: "special",
    kimariteClass: "push",
    description: "Pressing armpit push down",
    styleAffinity: { oshi: 7, yotsu: 4, hybrid: 6 },
    archetypeBonus: { oshi_specialist: 5 },
    requiredStances: ["push-dominant", "no-grip"],
    vector: "frontal",
    gripNeed: "none",
    baseWeight: 1,
    rarity: "rare"
  },
  {
    id: "waridashi",
    name: "Waridashi",
    nameJa: "割り出し",
    category: "special",
    kimariteClass: "force_out",
    description: "Thigh spreading force out",
    styleAffinity: { oshi: 4, yotsu: 7, hybrid: 6 },
    archetypeBonus: { yotsu_specialist: 5 },
    requiredStances: ["belt-dominant"],
    vector: "frontal",
    gripNeed: "belt",
    baseWeight: 1,
    rarity: "rare"
  },
  {
    id: "ushiromotare",
    name: "Ushiromotare",
    nameJa: "後ろもたれ",
    category: "special",
    kimariteClass: "rear",
    description: "Rear body slam",
    styleAffinity: { oshi: 3, yotsu: 6, hybrid: 6 },
    archetypeBonus: { yotsu_specialist: 4 },
    requiredStances: ["belt-dominant"],
    vector: "rear",
    gripNeed: "belt",
    baseWeight: 0.3,
    rarity: "legendary"
  },
  
  // === FORFEIT/SPECIAL RESULTS ===
  {
    id: "fusensho",
    name: "Fusensho",
    nameJa: "不戦勝",
    category: "forfeit",
    kimariteClass: "forfeit",
    description: "Win by default (opponent absent)",
    styleAffinity: { oshi: 0, yotsu: 0, hybrid: 0 },
    archetypeBonus: {},
    requiredStances: [],
    vector: "frontal",
    gripNeed: "none",
    baseWeight: 0,
    rarity: "common"
  },
  {
    id: "hansoku",
    name: "Hansoku",
    nameJa: "反則",
    category: "forfeit",
    kimariteClass: "forfeit",
    description: "Win by foul (opponent's illegal move)",
    styleAffinity: { oshi: 0, yotsu: 0, hybrid: 0 },
    archetypeBonus: {},
    requiredStances: [],
    vector: "frontal",
    gripNeed: "none",
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

export function getKimariteByClass(kimariteClass: KimariteClass): Kimarite[] {
  return KIMARITE_REGISTRY.filter(k => k.kimariteClass === kimariteClass);
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

export function getKimariteForArchetype(archetype: TacticalArchetype): Kimarite[] {
  return KIMARITE_REGISTRY
    .filter(k => (k.archetypeBonus[archetype] ?? 0) > 0)
    .sort((a, b) => (b.archetypeBonus[archetype] ?? 0) - (a.archetypeBonus[archetype] ?? 0));
}

// Stats
export function getKimariteCount(): number {
  return KIMARITE_REGISTRY.filter(k => k.category !== "forfeit").length;
}
