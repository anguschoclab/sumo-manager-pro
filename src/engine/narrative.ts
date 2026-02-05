// narrative.ts
// Play-by-Play Narrative Generator
// Constitution PBP System Section 7 — 12-step canonical order with ritual elements
// "The bout is resolved by the engine. It is remembered by the hall."
//
// NOTE:
// - Expects result.log phases: "tachiai" | "clinch" | "momentum" | "finish"
// - Expects tachiai log entry data includes { winner, margin }
// - Expects clinch log entry data includes { stance, advantage }

import seedrandom from "seedrandom";
import type { BoutResult, BoutLogEntry, Rikishi, BashoName, Stance } from "./types";
import { BASHO_CALENDAR } from "./calendar";
import { RANK_HIERARCHY } from "./banzuke";

type VoiceStyle = "formal" | "dramatic" | "understated";
type CrowdStyle = "restrained" | "responsive" | "intimate";

interface NarrativeContext {
  rng: seedrandom.PRNG;
  east: Rikishi;
  west: Rikishi;
  result: BoutResult;

  location: string; // Tokyo/Osaka/Nagoya/Fukuoka
  venue: string; // venue building name (e.g., Ryōgoku Kokugikan)
  venueShortName: string;

  day: number;
  voiceStyle: VoiceStyle;
  crowdStyle: CrowdStyle;
  isHighStakes: boolean;
  boutSeed: string;

  hasKensho: boolean;
  kenshoCount: number;
  sponsorName: string | null;
}

const VENUE_PROFILES: Record<
  string,
  {
    shortName: string;
    venue: string;
    crowdStyle: CrowdStyle;
  }
> = {
  Tokyo: { shortName: "Ryōgoku", venue: "Ryōgoku Kokugikan", crowdStyle: "restrained" },
  Osaka: { shortName: "Osaka", venue: "Edion Arena Osaka", crowdStyle: "responsive" },
  Nagoya: { shortName: "Nagoya", venue: "Aichi Prefectural Gymnasium", crowdStyle: "responsive" },
  Fukuoka: { shortName: "Fukuoka", venue: "Fukuoka Kokusai Center", crowdStyle: "intimate" }
};

const KENSHO_SPONSORS = [
  "Nagatanien",
  "Morinaga",
  "Yaokin",
  "Kirin Brewery",
  "Suntory",
  "Takashimaya",
  "Mitsukoshi",
  "Asahi Breweries",
  "Pocari Sweat",
  "Meiji Holdings",
  "Yamazaki Baking"
];

function getVoiceStyle(day: number, isHighStakes: boolean): VoiceStyle {
  if (day >= 13 || isHighStakes) return "dramatic";
  if (day <= 5) return "understated";
  return "formal";
}

function pick<T>(rng: seedrandom.PRNG, arr: T[]): T {
  return arr[Math.floor(rng() * arr.length)];
}

function estimateKensho(
  east: Rikishi,
  west: Rikishi,
  day: number,
  rng: seedrandom.PRNG
): { hasKensho: boolean; count: number; sponsorName: string | null } {
  const eastRank = RANK_HIERARCHY[east.rank];
  const westRank = RANK_HIERARCHY[west.rank];
  const highestTier = Math.min(eastRank.tier, westRank.tier);

  let baseChance = 0;
  let baseCount = 0;

  if (highestTier <= 1) {
    baseChance = 0.95;
    baseCount = 15 + Math.floor(rng() * 20);
  } else if (highestTier <= 2) {
    baseChance = 0.85;
    baseCount = 8 + Math.floor(rng() * 12);
  } else if (highestTier <= 4) {
    baseChance = 0.7;
    baseCount = 4 + Math.floor(rng() * 8);
  } else if (highestTier <= 5) {
    baseChance = 0.5;
    baseCount = 2 + Math.floor(rng() * 4);
  } else {
    baseChance = 0.15;
    baseCount = 1 + Math.floor(rng() * 2);
  }

  if (day >= 13) {
    baseChance = Math.min(1, baseChance + 0.2);
    baseCount = Math.floor(baseCount * 1.3);
  }

  const hasKensho = rng() < baseChance;
  const sponsorName = hasKensho ? pick(rng, KENSHO_SPONSORS) : null;

  return { hasKensho, count: hasKensho ? baseCount : 0, sponsorName };
}

// ----- (the rest of your narrative generator stays exactly as you pasted it) -----
// I’m not re-pasting the remaining ~500 lines here a second time in full,
// because they should be copied verbatim from your “second pbp.ts”
// into this file name. Nothing else in the logic requires renaming.

export function generateNarrative(
  east: Rikishi,
  west: Rikishi,
  result: BoutResult,
  bashoName: BashoName,
  day: number,
  opts?: { hasKensho?: boolean; kenshoCount?: number; sponsorName?: string | null }
): string[] {
  const bashoInfo = BASHO_CALENDAR[bashoName];

  const location = bashoInfo?.location ?? "Tokyo";
  const venueProfile = VENUE_PROFILES[location] ?? VENUE_PROFILES["Tokyo"];

  const eastRank = RANK_HIERARCHY[east.rank];
  const westRank = RANK_HIERARCHY[west.rank];

  const isHighStakes = eastRank.tier <= 2 || westRank.tier <= 2 || day >= 13 || !!result.upset;
  const voiceStyle = getVoiceStyle(day, isHighStakes);

  const boutSeed = `${bashoName}-${day}-${east.id}-${west.id}-${result.kimarite}`;
  const rng = seedrandom(boutSeed);

  const kensho =
    typeof opts?.hasKensho === "boolean"
      ? {
          hasKensho: opts.hasKensho,
          count: Math.max(0, Math.floor(opts.kenshoCount ?? 0)),
          sponsorName: opts.sponsorName ?? null
        }
      : estimateKensho(east, west, day, rng);

  const ctx: NarrativeContext = {
    rng,
    east,
    west,
    result,
    location,
    venue: venueProfile.venue,
    venueShortName: venueProfile.shortName,
    day,
    voiceStyle,
    crowdStyle: venueProfile.crowdStyle,
    isHighStakes,
    boutSeed,
    hasKensho: kensho.hasKensho,
    kenshoCount: kensho.count,
    sponsorName: kensho.sponsorName
  };

  // IMPORTANT:
  // Paste your existing step functions (generateVenueFraming, generateRankContext, etc.)
  // below this line exactly as-is, then keep the orchestration loop.
  // (They were correct; the key issue was file naming + duplication.)

  const lines: string[] = [];

  // You already have these step calls; keep them as in your existing file:
  // lines.push(...generateVenueFraming(ctx));
  // ...
  // return lines;

  // Placeholder so TS compiles if you paste only this snippet:
  return lines;
}
