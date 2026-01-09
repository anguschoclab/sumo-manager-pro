// Play-by-Play Narrative Generator
// Based on PBP System v2.0 Definitive Canon
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
}

// Venue profiles for regional tone (Section 4.1)
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

// Voice style based on day and context (Section 3.1)
function getVoiceStyle(day: number, isHighStakes: boolean): "formal" | "dramatic" | "understated" {
  if (day >= 13 || isHighStakes) return "dramatic";
  if (day <= 5) return "understated";
  return "formal";
}

// Opening lines - setting the scene
function generateOpening(ctx: NarrativeContext): string[] {
  const { day, venueName, voiceStyle, crowdStyle, east, west, isHighStakes } = ctx;
  const lines: string[] = [];
  
  const eastRank = RANK_HIERARCHY[east.rank];
  const westRank = RANK_HIERARCHY[west.rank];
  
  // Day and venue atmosphere
  if (voiceStyle === "dramatic") {
    if (day >= 14) {
      lines.push(`Day ${day === 15 ? "Fifteen—senshuraku" : "Fourteen"} here in ${venueName}, and the crowd is already alive.`);
    } else {
      lines.push(`Day ${day} here in ${venueName}, and the crowd is already alive.`);
    }
  } else if (voiceStyle === "understated") {
    lines.push(`Day ${day} in ${venueName}. The early basho rhythm continues.`);
  } else {
    lines.push(`Day ${day} at ${venueName}.`);
  }
  
  // Wrestler entrances based on crowd style and stakes
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

// Shikiri and tachiai - the ritual and clash
function generateTachiai(ctx: NarrativeContext, entry: BoutLogEntry): string[] {
  const { voiceStyle, east, west, rng } = ctx;
  const lines: string[] = [];
  
  const winnerSide = entry.data?.winner as string;
  const winnerName = winnerSide === "east" ? east.shikona : west.shikona;
  const loserName = winnerSide === "east" ? west.shikona : east.shikona;
  const margin = entry.data?.margin as number || 0;
  
  // Always reference the gyoji (ritual anchor per 2.3)
  lines.push("The gyoji calls them forward.");
  
  // The crouch and charge
  if (voiceStyle === "dramatic") {
    lines.push("They crouch at the shikiri-sen… no hesitation.");
    lines.push("The fan drops—*tachiai!*");
    
    if (margin > 10) {
      lines.push("A violent collision! The sound echoes!");
      lines.push(`${winnerName} drives forward—the crowd responds!`);
    } else if (margin > 5) {
      lines.push("They crash together! Neither gives!");
      lines.push(`${winnerName} finds the better of it—just.`);
    } else {
      lines.push("A measured clash—evenly matched!");
    }
  } else if (voiceStyle === "understated") {
    lines.push("They settle. A moment. The fan drops.");
    if (margin > 10) {
      lines.push(`${winnerName} wins the tachiai decisively.`);
    } else {
      lines.push("A clean charge from both. Neither surprised.");
    }
  } else {
    // Formal
    lines.push("They meet at the line. The fan drops—tachiai.");
    if (margin > 8) {
      lines.push(`${winnerName} takes control from the start.`);
    } else {
      lines.push("The initial clash is even. The bout begins.");
    }
  }
  
  return lines;
}

// Clinch and grip battle
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
          lines.push(`A murmur spreads—${advantagedName} has found the belt!`);
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

// Momentum shifts - the battle in the ring
function generateMomentum(ctx: NarrativeContext, entry: BoutLogEntry): string[] {
  const { voiceStyle, east, west, result, rng, crowdStyle } = ctx;
  const lines: string[] = [];
  
  const recovery = entry.data?.recovery as boolean;
  const position = entry.data?.position as string;
  const leadingSide = entry.data?.leader as string;
  const leadingName = leadingSide === "east" ? east.shikona : leadingSide === "west" ? west.shikona : null;
  const trailingSide = leadingSide === "east" ? "west" : "east";
  const trailingName = trailingSide === "east" ? east.shikona : west.shikona;
  
  // Position descriptions (per 2.2 - emphasize position center→edge)
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
  
  // Recovery moments (per 2.2 - balance stable→compromised)
  if (recovery) {
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
  
  // General momentum (per 2.2 - intent: pressing, waiting, adjusting)
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

// Turning point - the decisive moment
function generateTurningPoint(ctx: NarrativeContext): string[] {
  const { voiceStyle, east, west, result, rng } = ctx;
  const lines: string[] = [];
  
  const loserName = result.winner === "east" ? west.shikona : east.shikona;
  
  // Per 2.2 - turning points: hesitation, grip, reset failure
  if (voiceStyle === "dramatic") {
    const turningPoints = [
      `${loserName} hesitates—just a moment!`,
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

// The finish
function generateFinish(ctx: NarrativeContext, entry: BoutLogEntry): string[] {
  const { voiceStyle, east, west, crowdStyle, rng } = ctx;
  const lines: string[] = [];
  
  const winnerSide = entry.data?.winner as string;
  const winnerName = winnerSide === "east" ? east.shikona : west.shikona;
  const kimariteName = entry.data?.kimariteName as string || ctx.result.kimariteName;
  const isCounter = entry.data?.isCounter as boolean;
  
  // Build to the finish
  if (voiceStyle === "dramatic") {
    lines.push(`${winnerName} surges!`);
    lines.push("At the straw—out!");
    
    // Crowd eruption (per Section 5.2)
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
      lines.push(`${winnerName} executes cleanly.`);
    }
    lines.push("The gyoji points east." );
  }
  
  return lines;
}

// Closing summary
function generateClosing(ctx: NarrativeContext): string[] {
  const { voiceStyle, east, west, result, venueName, day } = ctx;
  const lines: string[] = [];
  
  const winner = result.winner === "east" ? east : west;
  const loser = result.winner === "east" ? west : east;
  
  // Evocative closing (like the sample bout)
  if (voiceStyle === "dramatic") {
    // Style-specific closing observations
    const closings = [
      `What a moment in ${venueName}! Patience, balance, and pressure carry ${winner.shikona} through.`,
      `${winner.shikona} has done it! The hall will remember this one.`,
      `Sumo at its finest. ${winner.shikona} prevails.`,
      `Day ${day} delivers. ${winner.shikona} stands victorious.`
    ];
    lines.push(pick(ctx.rng, closings));
  } else if (voiceStyle === "understated") {
    lines.push(`${winner.shikona} moves to ${winner.currentBashoWins + 1} wins.`);
  } else {
    lines.push(`${winner.shikona} defeats ${loser.shikona} by ${result.kimariteName}.`);
  }
  
  return lines;
}

// Main narrative generator
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
  
  // Deterministic seed per bout for reproducibility (Section 9)
  const boutSeed = `${bashoName}-${day}-${east.id}-${west.id}-${result.kimarite}`;
  const rng = seedrandom(boutSeed);
  
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
    boutSeed
  };

  const lines: string[] = [];
  
  // Opening scene
  lines.push(...generateOpening(ctx));
  
  // Process bout log entries
  let hasClimax = false;
  for (const entry of result.log) {
    switch (entry.phase) {
      case "tachiai":
        lines.push(...generateTachiai(ctx, entry));
        break;
      case "clinch":
        lines.push(...generateClinch(ctx, entry));
        break;
      case "momentum":
        const momentumLines = generateMomentum(ctx, entry);
        // Don't add too many momentum lines
        if (momentumLines.length > 0 && lines.length < 12) {
          lines.push(...momentumLines);
        }
        break;
      case "finish":
        // Add turning point before finish
        if (!hasClimax) {
          lines.push(...generateTurningPoint(ctx));
          hasClimax = true;
        }
        lines.push(...generateFinish(ctx, entry));
        break;
    }
  }
  
  // Closing
  lines.push(...generateClosing(ctx));
  
  return lines;
}

function pick<T>(rng: seedrandom.PRNG, arr: T[]): T {
  return arr[Math.floor(rng() * arr.length)];
}
