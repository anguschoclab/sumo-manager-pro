// Play-by-Play Narrative Generator
// Based on Constitution PBP System Section 7
// 12-step canonical order with ritual elements
// "The bout is resolved by the engine. It is remembered by the hall."

import seedrandom from "seedrandom";
import type { BoutResult, BoutLogEntry, Rikishi, BashoName } from "./types";
import { BASHO_CALENDAR } from "./calendar";
import { RANK_HIERARCHY } from "./banzuke";

interface NarrativeContext {
  rng: seedrandom.PRNG;
  east: Rikishi;
  west: Rikishi;
  result: BoutResult;
  venue: string;
  venueName: string;
  day: number;
  voiceStyle: "formal" | "dramatic" | "understated";
  crowdStyle: "restrained" | "responsive" | "intimate";
  isHighStakes: boolean;
  boutSeed: string;
  hasKensho: boolean;
  kenshoCount: number;
  sponsorName: string | null;
}

// Venue profiles for regional tone (Section 5.3)
const VENUE_PROFILES: Record<string, { 
  shortName: string;
  tone: string; 
  crowdStyle: "restrained" | "responsive" | "intimate";
  crowdPersonality: string;
}> = {
  "Ryōgoku Kokugikan, Tokyo": { 
    shortName: "Ryōgoku",
    tone: "authoritative", 
    crowdStyle: "restrained",
    crowdPersonality: "The old guard watches with knowing eyes"
  },
  "EDION Arena Osaka": { 
    shortName: "Osaka",
    tone: "warm", 
    crowdStyle: "responsive",
    crowdPersonality: "The Osaka crowd wears their hearts openly"
  },
  "Aichi Prefectural Gymnasium": { 
    shortName: "Nagoya",
    tone: "warm", 
    crowdStyle: "responsive",
    crowdPersonality: "Nagoya fans know their sumo"
  },
  "Fukuoka Kokusai Center": { 
    shortName: "Fukuoka",
    tone: "lively", 
    crowdStyle: "intimate",
    crowdPersonality: "This crowd remembers everyone who has ever stepped on their dohyo"
  },
};

// Kensho sponsor name generation for narrative flavor
const KENSHO_SPONSORS = [
  "Nagatanien", "Morinaga", "Yaokin", "Kirin Brewery",
  "Suntory", "Takashimaya", "Mitsukoshi", "Asahi Breweries",
  "Pocari Sweat", "Meiji Holdings", "Yamazaki Baking"
];

// Voice style based on day and context (Section 5.2)
function getVoiceStyle(day: number, isHighStakes: boolean): "formal" | "dramatic" | "understated" {
  if (day >= 13 || isHighStakes) return "dramatic";
  if (day <= 5) return "understated";
  return "formal";
}

// Determine kensho presence based on rank and stakes
function determineKensho(east: Rikishi, west: Rikishi, day: number, rng: seedrandom.PRNG): { 
  hasKensho: boolean; 
  count: number; 
  sponsorName: string | null;
} {
  const eastRank = RANK_HIERARCHY[east.rank];
  const westRank = RANK_HIERARCHY[west.rank];
  const highestTier = Math.min(eastRank.tier, westRank.tier);
  
  // Higher ranked bouts and late basho get more kensho
  let baseChance = 0;
  let baseCount = 0;
  
  if (highestTier <= 1) { // Yokozuna
    baseChance = 0.95;
    baseCount = 15 + Math.floor(rng() * 20);
  } else if (highestTier <= 2) { // Ozeki
    baseChance = 0.85;
    baseCount = 8 + Math.floor(rng() * 12);
  } else if (highestTier <= 4) { // Sekiwake/Komusubi
    baseChance = 0.70;
    baseCount = 4 + Math.floor(rng() * 8);
  } else if (highestTier <= 5) { // Upper Maegashira
    baseChance = 0.50;
    baseCount = 2 + Math.floor(rng() * 4);
  } else {
    baseChance = 0.15;
    baseCount = 1 + Math.floor(rng() * 2);
  }
  
  // Late basho bonus
  if (day >= 13) {
    baseChance = Math.min(1, baseChance + 0.20);
    baseCount = Math.floor(baseCount * 1.3);
  }
  
  const hasKensho = rng() < baseChance;
  const sponsorName = hasKensho ? pick(rng, KENSHO_SPONSORS) : null;
  
  return { hasKensho, count: hasKensho ? baseCount : 0, sponsorName };
}

// === STEP 1: VENUE & DAY FRAMING ===
function generateVenueFraming(ctx: NarrativeContext): string[] {
  const { day, venueName, voiceStyle } = ctx;
  const lines: string[] = [];
  
  if (voiceStyle === "dramatic") {
    if (day === 15) {
      lines.push(`Day Fifteen—senshuraku—here in ${venueName}. The air is electric.`);
    } else if (day >= 13) {
      lines.push(`Day ${day} in ${venueName}, and the hall is already alive.`);
    } else {
      lines.push(`Day ${day} here in ${venueName}, and the crowd is already alive.`);
    }
  } else if (voiceStyle === "understated") {
    lines.push(`Day ${day} in ${venueName}. The early basho rhythm continues.`);
  } else {
    lines.push(`Day ${day} at ${venueName}.`);
  }
  
  return lines;
}

// === STEP 2: RANK / STAKE CONTEXT ===
function generateRankContext(ctx: NarrativeContext): string[] {
  const { east, west, isHighStakes, voiceStyle } = ctx;
  const lines: string[] = [];
  
  const eastRank = RANK_HIERARCHY[east.rank];
  const westRank = RANK_HIERARCHY[west.rank];
  
  if (isHighStakes && voiceStyle !== "understated") {
    if (eastRank.tier <= 1 || westRank.tier <= 1) {
      lines.push("A Yokozuna bout. The hall knows what this demands.");
    } else if (eastRank.tier <= 2 || westRank.tier <= 2) {
      lines.push("Ozeki-level sumo. The stakes are clear.");
    }
  }
  
  return lines;
}

// === STEP 3: RING ENTRANCE RITUALS ===
function generateRingEntrance(ctx: NarrativeContext): string[] {
  const { east, west, crowdStyle, voiceStyle, isHighStakes, rng } = ctx;
  const lines: string[] = [];
  
  const eastRank = RANK_HIERARCHY[east.rank];
  const westRank = RANK_HIERARCHY[west.rank];
  
  if (crowdStyle === "intimate") {
    lines.push(`${east.shikona} steps onto the dohyo—greeted warmly by this hall.`);
    lines.push(`${west.shikona} follows, expression tight.`);
  } else if (crowdStyle === "responsive") {
    if (isHighStakes) {
      lines.push(`${east.shikona} approaches the dohyo. The hall stirs.`);
      lines.push(`${west.shikona} rises. A ripple of anticipation.`);
    } else {
      lines.push(`${east.shikona} takes his position.`);
      lines.push(`${west.shikona} settles across the ring.`);
    }
  } else {
    // Restrained Tokyo style
    if (eastRank.tier <= 2 || westRank.tier <= 2) {
      lines.push(`${east.shikona} ascends. The hall knows what this rank demands.`);
      lines.push(`${west.shikona} waits. History watches.`);
    } else {
      lines.push(`${east.shikona} and ${west.shikona} take their marks.`);
    }
  }
  
  return lines;
}

// === RITUAL ELEMENTS (Section 7.2) ===
// Salt throwing (shio-maki), foot stamping, posture & breathing

function generateRitualElements(ctx: NarrativeContext): string[] {
  const { east, west, voiceStyle, isHighStakes, rng } = ctx;
  const lines: string[] = [];
  
  // Salt throwing - always for dramatic/formal, sometimes for understated
  if (voiceStyle !== "understated" || rng() < 0.5) {
    const saltPhrases = voiceStyle === "dramatic" 
      ? [
          `${east.shikona} steps forward, lifting the salt high before casting it across the ring.`,
          `${east.shikona} throws the salt with practiced ceremony—a generous handful.`,
          `Salt arcs through the air from ${east.shikona}'s hand, catching the light.`
        ]
      : [
          `${east.shikona} takes his salt.`,
          `${east.shikona} tosses the salt—a simple gesture.`
        ];
    lines.push(pick(rng, saltPhrases));
    
    // West's salt throw
    const westSaltPhrases = voiceStyle === "dramatic"
      ? [
          `${west.shikona} follows, stamping the clay, eyes fixed ahead.`,
          `${west.shikona} answers with his own throw—deliberate, focused.`,
          `${west.shikona} rises, throws, and settles. The ritual unfolds.`
        ]
      : [
          `${west.shikona} follows suit.`,
          `${west.shikona} takes his turn.`
        ];
    lines.push(pick(rng, westSaltPhrases));
  }
  
  // Foot stamping (shiko) - occasionally shown
  if (voiceStyle === "dramatic" && isHighStakes && rng() < 0.4) {
    const stampPhrases = [
      "Both men stamp the clay—the sound echoes in the rafters.",
      "The shiko stamps ring out, driving away evil spirits.",
      "They stomp in rhythm, the ancient gesture of purification."
    ];
    lines.push(pick(rng, stampPhrases));
  }
  
  // Posture and breathing
  if (voiceStyle === "dramatic" && rng() < 0.3) {
    const posturePhrases = [
      "Deep breaths. Shoulders squared. The moment approaches.",
      "They settle into themselves. The crowd goes quiet.",
      "A final exhale. Both men find their center."
    ];
    lines.push(pick(rng, posturePhrases));
  }
  
  return lines;
}

// === KENSHO BANNER PRE-BOUT ===
function generateKenshoBanners(ctx: NarrativeContext): string[] {
  const { hasKensho, kenshoCount, sponsorName, voiceStyle } = ctx;
  const lines: string[] = [];
  
  if (hasKensho && sponsorName) {
    if (voiceStyle === "dramatic") {
      if (kenshoCount >= 20) {
        lines.push(`The banners multiply—${kenshoCount} kenshō today! ${sponsorName} and others line the dohyo.`);
      } else if (kenshoCount >= 10) {
        lines.push(`The banners from ${sponsorName} and others frame the dohyo as the crowd settles.`);
      } else {
        lines.push(`Kenshō banners circle the ring. ${sponsorName} among them.`);
      }
    } else if (voiceStyle === "formal") {
      lines.push(`${kenshoCount} kenshō banners are presented.`);
    }
    // Understated voice skips kensho description
  }
  
  return lines;
}

// === STEP 4: SHIKIRI TENSION ===
function generateShikiriTension(ctx: NarrativeContext): string[] {
  const { voiceStyle, crowdStyle, rng } = ctx;
  const lines: string[] = [];
  
  if (voiceStyle === "dramatic") {
    const shikiriPhrases = [
      "They crouch at the shikiri-sen. The crowd holds its breath.",
      "They crouch at the shikiri-sen… no hesitation.",
      "Down to the line. Eyes locked. Waiting.",
      "At the shikiri-sen now. Fingers to the clay. Silence falls."
    ];
    lines.push(pick(rng, shikiriPhrases));
    
    // Eye contact moment
    if (rng() < 0.4) {
      lines.push("Neither blinks.");
    }
  } else if (voiceStyle === "formal") {
    lines.push("They settle at the line.");
  } else {
    lines.push("Ready positions.");
  }
  
  return lines;
}

// === STEP 5: TACHIAI IMPACT ===
function generateTachiai(ctx: NarrativeContext, entry: BoutLogEntry): string[] {
  const { voiceStyle, east, west, rng, crowdStyle } = ctx;
  const lines: string[] = [];
  
  const winnerSide = entry.data?.winner as string;
  const winnerName = winnerSide === "east" ? east.shikona : west.shikona;
  const margin = entry.data?.margin as number || 0;
  
  // The fan drop - critical moment
  if (voiceStyle === "dramatic") {
    lines.push("The fan drops—*tachiai!*");
    
    if (margin > 10) {
      const impactPhrases = [
        "A violent collision! The sound echoes through the hall!",
        "They crash together—the sound ripples through the hall!",
        "An explosive clash! Bodies collide with thunderous force!"
      ];
      lines.push(pick(rng, impactPhrases));
      lines.push(`${winnerName} drives forward—the crowd responds!`);
    } else if (margin > 5) {
      lines.push("They crash together! Neither gives!");
      lines.push(`${winnerName} finds the better of it—just.`);
    } else {
      lines.push("A measured clash—evenly matched!");
    }
  } else if (voiceStyle === "understated") {
    lines.push("The fan drops.");
    if (margin > 10) {
      lines.push(`${winnerName} wins the tachiai decisively.`);
    } else {
      lines.push("A clean charge from both. Neither surprised.");
    }
  } else {
    // Formal
    lines.push("The fan drops—tachiai.");
    if (margin > 8) {
      lines.push(`${winnerName} takes control from the start.`);
    } else {
      lines.push("The initial clash is even. The bout begins.");
    }
  }
  
  return lines;
}

// === STEP 6: CONTROL ESTABLISHMENT (Clinch) ===
function generateClinch(ctx: NarrativeContext, entry: BoutLogEntry): string[] {
  const { voiceStyle, east, west, rng } = ctx;
  const lines: string[] = [];
  
  const stance = entry.data?.stance as string || "no-grip";
  const advantage = entry.data?.advantage as string;
  const advantagedName = advantage === "east" ? east.shikona : advantage === "west" ? west.shikona : null;
  
  switch (stance) {
    case "belt-dominant":
      if (advantagedName) {
        if (voiceStyle === "dramatic") {
          lines.push(`A murmur spreads—${advantagedName} has the belt!`);
        } else {
          lines.push(`${advantagedName} secures the mawashi. Deep grip.`);
        }
      } else {
        lines.push("Both find the belt. A yotsu battle now.");
      }
      break;
      
    case "push-dominant":
      if (voiceStyle === "dramatic") {
        lines.push("No belt work here—pure oshi-zumo!");
        if (advantagedName) {
          lines.push(`${advantagedName} presses, hands driving at the chest!`);
        }
      } else {
        lines.push("They settle into a pushing exchange.");
      }
      break;
      
    case "migi-yotsu":
      lines.push("Migi-yotsu—right hand inside for both.");
      if (advantagedName) {
        lines.push(`${advantagedName} has the better angle.`);
      }
      break;
      
    case "hidari-yotsu":
      lines.push("Hidari-yotsu position. Left hands in.");
      break;
      
    default:
      if (voiceStyle === "dramatic") {
        lines.push("They struggle for position—neither can settle!");
      } else {
        lines.push("No clear grip established yet.");
      }
  }
  
  return lines;
}

// === STEP 7: MOMENTUM SHIFT(S) ===
function generateMomentum(ctx: NarrativeContext, entry: BoutLogEntry): string[] {
  const { voiceStyle, east, west, result, rng, crowdStyle } = ctx;
  const lines: string[] = [];
  
  const recovery = entry.data?.recovery as boolean;
  const position = entry.data?.position as string;
  
  // Position descriptions - center→edge language axis
  if (position === "edge" || position === "straw") {
    if (voiceStyle === "dramatic") {
      lines.push("They drift toward the edge—voices rising!");
    } else if (voiceStyle === "formal") {
      lines.push("The bout moves to the tawara.");
    } else {
      lines.push("Near the straw now.");
    }
  } else if (position === "lateral") {
    const mover = east.speed > west.speed ? east.shikona : west.shikona;
    lines.push(`${mover} angles sideways—seeking advantage!`);
  } else if (position === "rear") {
    const winnerName = result.winner === "east" ? east.shikona : west.shikona;
    if (voiceStyle === "dramatic") {
      lines.push(`${winnerName} circles behind! Dangerous position!`);
    } else {
      lines.push(`${winnerName} finds the back.`);
    }
  }
  
  // Recovery moments - balance stable→compromised
  if (recovery) {
    const trailingName = result.winner === "east" ? west.shikona : east.shikona;
    if (voiceStyle === "dramatic") {
      lines.push(`${trailingName} gives ground but stays balanced!`);
      if (crowdStyle === "intimate" || crowdStyle === "responsive") {
        lines.push("The crowd holds its breath!");
      }
    } else {
      lines.push(`${trailingName} absorbs the pressure. Still alive.`);
    }
    return lines;
  }
  
  // General momentum - intent: pressing, waiting, adjusting
  const leadingSide = entry.data?.leader as string;
  const leadingName = leadingSide === "east" ? east.shikona : leadingSide === "west" ? west.shikona : null;
  
  if (leadingName && rng() > 0.4) {
    if (voiceStyle === "dramatic") {
      const phrases = [
        `${leadingName} presses forward!`,
        `${leadingName} surges—feeling it now!`,
        `The pressure from ${leadingName} is relentless!`
      ];
      lines.push(pick(rng, phrases));
    } else if (voiceStyle === "formal") {
      lines.push(`${leadingName} maintains forward pressure.`);
    } else {
      lines.push(`${leadingName} presses. Patient.`);
    }
  }
  
  return lines;
}

// === STEP 8: DECISIVE ACTION (Turning Point) ===
function generateTurningPoint(ctx: NarrativeContext): string[] {
  const { voiceStyle, east, west, result, rng } = ctx;
  const lines: string[] = [];
  
  const loserName = result.winner === "east" ? west.shikona : east.shikona;
  
  // Per Constitution - turning points: hesitation, grip break, reset failure
  if (voiceStyle === "dramatic") {
    const turningPoints = [
      `${loserName} hesitates—just a moment!`,
      "A hesitation—just enough!",
      `A grip slips! The balance shifts!`,
      `${loserName} tries to reset—too late!`,
      `The legs give! There's nothing left!`,
      `One step too far—the opening appears!`
    ];
    lines.push(pick(rng, turningPoints));
  } else if (voiceStyle === "formal") {
    lines.push("The decisive moment arrives.");
  }
  
  return lines;
}

// === STEP 9-10: GYOJI RULING & KIMARITE EMPHASIS ===
function generateFinish(ctx: NarrativeContext, entry: BoutLogEntry): string[] {
  const { voiceStyle, east, west, crowdStyle, rng, result } = ctx;
  const lines: string[] = [];
  
  const winnerSide = entry.data?.winner as string;
  const winnerName = winnerSide === "east" ? east.shikona : west.shikona;
  const kimariteName = entry.data?.kimariteName as string || result.kimariteName;
  const isCounter = entry.data?.isCounter as boolean;
  
  // Build to the finish
  if (voiceStyle === "dramatic") {
    if (isCounter) {
      lines.push(`A reversal! ${winnerName} finds the counter!`);
    } else {
      lines.push(`${winnerName} drives through with **a textbook ${kimariteName}!**`);
    }
    lines.push("Out!");
    
    // Crowd eruption
    if (crowdStyle === "intimate") {
      lines.push("The hall erupts!");
    } else if (crowdStyle === "responsive") {
      lines.push("The crowd roars its approval!");
    } else {
      lines.push("A wave of applause fills Ryōgoku.");
    }
  } else if (voiceStyle === "understated") {
    if (isCounter) {
      lines.push(`${winnerName} finds the counter. It is done.`);
    } else {
      lines.push(`${winnerName} completes the work. Quietly decisive.`);
    }
    lines.push("Polite applause.");
  } else {
    // Formal
    if (isCounter) {
      lines.push(`A reversal! ${winnerName} with the counter!`);
    } else {
      lines.push(`${winnerName} executes cleanly by ${kimariteName}.`);
    }
    const gyojiDir = winnerSide === "east" ? "east" : "west";
    lines.push(`The gyoji points ${gyojiDir}.`);
  }
  
  return lines;
}

// === STEP 11: KENSHO CEREMONY ===
function generateKenshoCeremony(ctx: NarrativeContext): string[] {
  const { hasKensho, kenshoCount, sponsorName, voiceStyle, result, east, west } = ctx;
  const lines: string[] = [];
  
  if (!hasKensho) return lines;
  
  const winner = result.winner === "east" ? east : west;
  
  if (voiceStyle === "dramatic") {
    lines.push("The banners are lowered.");
    if (kenshoCount >= 10) {
      lines.push("The envelopes are presented, one by one.");
    } else {
      lines.push("The envelopes are presented.");
    }
    lines.push(`${winner.shikona} receives the kenshō with a measured bow.`);
  } else if (voiceStyle === "formal") {
    lines.push(`${winner.shikona} collects the kenshō.`);
  }
  // Understated voice skips kensho ceremony
  
  return lines;
}

// === STEP 12: IMMEDIATE AFTERMATH FRAMING (Closing) ===
function generateClosing(ctx: NarrativeContext): string[] {
  const { voiceStyle, east, west, result, venueName, day, rng } = ctx;
  const lines: string[] = [];
  
  const winner = result.winner === "east" ? east : west;
  const loser = result.winner === "east" ? west : east;
  
  if (voiceStyle === "dramatic") {
    const closings = [
      `What a moment in ${venueName}! Patience, balance, and pressure carry ${winner.shikona} through.`,
      `${winner.shikona} has done it! The hall will remember this one.`,
      `Sumo at its finest. ${winner.shikona} prevails.`,
      `Day ${day} delivers. ${winner.shikona} stands victorious.`
    ];
    lines.push(pick(rng, closings));
  } else if (voiceStyle === "understated") {
    lines.push(`${winner.shikona} moves to ${winner.currentBashoWins + 1} wins.`);
  } else {
    lines.push(`${winner.shikona} defeats ${loser.shikona} by ${result.kimariteName}.`);
  }
  
  return lines;
}

// === MAIN NARRATIVE GENERATOR ===
// Follows 12-step canonical order per Constitution Section 3.2
export function generateNarrative(
  east: Rikishi,
  west: Rikishi,
  result: BoutResult,
  bashoName: BashoName,
  day: number
): string[] {
  const bashoInfo = BASHO_CALENDAR[bashoName];
  const venue = bashoInfo?.location || "Ryōgoku Kokugikan, Tokyo";
  const venueProfile = VENUE_PROFILES[venue] || VENUE_PROFILES["Ryōgoku Kokugikan, Tokyo"];
  
  const eastRank = RANK_HIERARCHY[east.rank];
  const westRank = RANK_HIERARCHY[west.rank];
  
  const isHighStakes = 
    eastRank.tier <= 2 || westRank.tier <= 2 || // Yokozuna or Ozeki
    day >= 13 || // Late basho
    result.upset; // Upsets are always high stakes
  
  const voiceStyle = getVoiceStyle(day, isHighStakes);
  
  // Deterministic seed per bout for reproducibility
  const boutSeed = `${bashoName}-${day}-${east.id}-${west.id}-${result.kimarite}`;
  const rng = seedrandom(boutSeed);
  
  // Determine kensho presence
  const kenshoInfo = determineKensho(east, west, day, rng);
  
  const ctx: NarrativeContext = {
    rng,
    east,
    west,
    result,
    venue,
    venueName: venueProfile.shortName,
    day,
    voiceStyle,
    crowdStyle: venueProfile.crowdStyle,
    isHighStakes,
    boutSeed,
    hasKensho: kenshoInfo.hasKensho,
    kenshoCount: kenshoInfo.count,
    sponsorName: kenshoInfo.sponsorName
  };

  const lines: string[] = [];
  
  // === 12-STEP CANONICAL ORDER ===
  
  // 1. Venue & day framing
  lines.push(...generateVenueFraming(ctx));
  
  // 2. Rank / stake context
  lines.push(...generateRankContext(ctx));
  
  // 3. Ring entrance rituals
  lines.push(...generateRingEntrance(ctx));
  
  // RITUAL ELEMENTS (salt throwing, foot stamping, posture)
  lines.push(...generateRitualElements(ctx));
  
  // KENSHO BANNERS (pre-bout display)
  lines.push(...generateKenshoBanners(ctx));
  
  // 4. Shikiri tension
  lines.push(...generateShikiriTension(ctx));
  
  // Process bout log entries for steps 5-10
  let hasClimax = false;
  for (const entry of result.log) {
    switch (entry.phase) {
      case "tachiai":
        // 5. Tachiai impact
        lines.push(...generateTachiai(ctx, entry));
        break;
      case "clinch":
        // 6. Control establishment
        lines.push(...generateClinch(ctx, entry));
        break;
      case "momentum":
        // 7. Momentum shift(s)
        const momentumLines = generateMomentum(ctx, entry);
        if (momentumLines.length > 0 && lines.length < 18) {
          lines.push(...momentumLines);
        }
        break;
      case "finish":
        // 8. Decisive action (turning point)
        if (!hasClimax) {
          lines.push(...generateTurningPoint(ctx));
          hasClimax = true;
        }
        // 9-10. Gyoji ruling & kimarite emphasis
        lines.push(...generateFinish(ctx, entry));
        break;
    }
  }
  
  // 11. Kenshō ceremony (if present)
  lines.push(...generateKenshoCeremony(ctx));
  
  // 12. Immediate aftermath framing
  lines.push(...generateClosing(ctx));
  
  return lines;
}

function pick<T>(rng: seedrandom.PRNG, arr: T[]): T {
  return arr[Math.floor(rng() * arr.length)];
}
