import { Rikishi, Rank, RikishiStats, GameState } from "./types";
import { generateRikishiName } from "./shikona";

// --- RETIREMENT LOGIC ---

/**
 * Evaluates if a rikishi should retire based on age, injury, and performance.
 * Returns a reason string if they retire, or null if they continue.
 */
export function checkRetirement(rikishi: Rikishi, currentYear: number): string | null {
  const age = currentYear - rikishi.birthYear;
  
  // 1. Mandatory Retirement
  if (age >= 40) return "Mandatory Age Retirement";

  // 2. Injury Forced Retirement
  if (rikishi.injuryStatus.isInjured && rikishi.injuryStatus.severity > 90) {
    return "Career-Ending Injury";
  }

  // 3. Natural Aging Curve (Probability increases with age)
  // Age 30: ~0% chance per basho
  // Age 35: ~10% chance per basho
  // Age 38: ~40% chance per basho
  const baseRetireChance = Math.max(0, (age - 32) * 0.05);
  const roll = Math.random();

  if (roll < baseRetireChance) {
    return "Age & Fatigue";
  }

  // 4. Performance Drop (Rank-based)
  // If they fall to Jonokuchi and are older than 25, high chance to quit
  if (rikishi.rank === "Jonokuchi" && age > 25) {
    if (Math.random() < 0.3) return "Lack of Performance";
  }

  return null;
}

// --- REGENERATION (REPLACEMENT) LOGIC ---

const ORIGINS = [
  { name: "Hokkaido", weightMod: 1.05, strMod: 1.0 },
  { name: "Tokyo", weightMod: 0.95, techMod: 1.1 },
  { name: "Aomori", weightMod: 1.0, strMod: 1.05 },
  { name: "Mongolia", weightMod: 0.9, strMod: 1.2, mentalMod: 1.2 }, // Strong but light
  { name: "Georgia", weightMod: 1.1, strMod: 1.1 },
  { name: "Brazil", weightMod: 1.0, techMod: 0.9, speedMod: 1.1 },
  { name: "Nihon University", weightMod: 1.0, techMod: 1.3, isElite: true }, // Elite amateur
  { name: "Nippon Sport Science Univ", weightMod: 1.05, stamMod: 1.2, isElite: true },
];

const ARCHETYPES = [
  { type: "Oshi-zumo", desc: "Pusher/Thruster", statFocus: ["strength", "speed"] },
  { type: "Yotsu-zumo", desc: "Grappler", statFocus: ["strength", "technique"] },
  { type: "Technician", desc: "Small but skilled", statFocus: ["technique", "speed", "adaptability"] },
  { type: "Tank", desc: "Massive immovable object", statFocus: ["weight", "strength"] },
];

/**
 * Generates a new rookie rikishi to replace a retired one.
 */
export function generateRookie(currentYear: number, targetRank: Rank = "Jonokuchi"): Rikishi {
  const origin = ORIGINS[Math.floor(Math.random() * ORIGINS.length)];
  const archetype = ARCHETYPES[Math.floor(Math.random() * ARCHETYPES.length)];
  
  // Elite amateurs are older but start with better stats
  const isElite = (origin as any).isElite || false;
  const age = isElite ? 22 : 15 + Math.floor(Math.random() * 3); 

  const baseStat = isElite ? 40 : 20;
  const variance = 15;

  const stats: RikishiStats = {
    strength: baseStat + Math.random() * variance,
    technique: baseStat + Math.random() * variance,
    speed: baseStat + Math.random() * variance,
    weight: 100 + Math.random() * 60, // kg
    stamina: baseStat + Math.random() * variance,
    mental: baseStat + Math.random() * variance,
    adaptability: baseStat + Math.random() * variance,
  };

  // Apply Origin Modifiers
  if ((origin as any).strMod) stats.strength *= (origin as any).strMod;
  if ((origin as any).techMod) stats.technique *= (origin as any).techMod;
  if ((origin as any).speedMod) stats.speed *= (origin as any).speedMod;
  if ((origin as any).weightMod) stats.weight *= (origin as any).weightMod;

  // Apply Archetype Focus (Boost primary stats)
  archetype.statFocus.forEach(stat => {
    (stats as any)[stat] *= 1.2;
  });

  return {
    id: crypto.randomUUID(),
    name: "Unknown", // Placeholder, updated by shikona
    shikona: generateRikishiName(),
    heyaId: "scout_pool", // Needs to be assigned to a heya later
    rank: isElite ? "Makushita" : targetRank, // Elite amateurs start higher (Makushita Tsukedashi equivalent)
    stats,
    birthYear: currentYear - age,
    origin: origin.name,
    archetype: archetype.type,
    careerRecord: { wins: 0, losses: 0, yusho: 0 },
    currentBashoRecord: { wins: 0, losses: 0 },
    history: [],
    h2h: {},
    injuryStatus: { isInjured: false, severity: 0, location: "", weeksToHeal: 0 },
    condition: 100,
    motivation: 50 + Math.random() * 50,
    personalityTraits: [],
  };
}
