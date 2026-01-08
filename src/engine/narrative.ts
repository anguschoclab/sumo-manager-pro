// Play-by-Play Narrative Generator
// Based on PBP System v2.0 Definitive Canon

import seedrandom from "seedrandom";
import type { BoutResult, BoutLogEntry, Rikishi, BashoName } from "./types";
import { BASHO_CALENDAR } from "./calendar";

interface NarrativeContext {
  rng: seedrandom.PRNG;
  east: Rikishi;
  west: Rikishi;
  result: BoutResult;
  venue: string;
  day: number;
  voiceStyle: "formal" | "dramatic" | "understated";
}

// Venue profiles for regional tone
const VENUE_PROFILES: Record<string, { tone: string; crowdStyle: string }> = {
  "Ryōgoku Kokugikan, Tokyo": { tone: "authoritative", crowdStyle: "restrained" },
  "EDION Arena Osaka": { tone: "warm", crowdStyle: "responsive" },
  "Aichi Prefectural Gymnasium": { tone: "warm", crowdStyle: "responsive" },
  "Fukuoka Kokusai Center": { tone: "lively", crowdStyle: "intimate" },
};

// Voice style based on day and context
function getVoiceStyle(day: number, isHighStakes: boolean): "formal" | "dramatic" | "understated" {
  if (day >= 13 || isHighStakes) return "dramatic";
  if (day <= 5) return "understated";
  return "formal";
}

// Tachiai narration templates
const TACHIAI_TEMPLATES = {
  formal: [
    "The gyoji calls them forward. Both crouch at the shikiri-sen.",
    "They meet at the center. The fan drops—tachiai.",
    "A measured charge from both wrestlers."
  ],
  dramatic: [
    "The tension breaks! The fan drops—TACHIAI!",
    "A thunderous collision echoes through the hall!",
    "They explode from the crouch! The crowd gasps!"
  ],
  understated: [
    "They step to the line. The bout begins quietly.",
    "A controlled start from both competitors.",
    "The tachiai is clean, efficient."
  ]
};

// Clinch narration templates
const CLINCH_TEMPLATES = {
  "belt-dominant": [
    "{winner} finds the belt immediately—deep grip!",
    "A powerful mawashi grip from {winner}.",
    "{winner} secures dominant position on the belt."
  ],
  "push-dominant": [
    "No belt—this will be a pushing battle.",
    "{winner} keeps distance, hands at the chest.",
    "They settle into an oshi-zumo exchange."
  ],
  "migi-yotsu": [
    "Right-hand inside for both—migi-yotsu.",
    "They lock up in migi-yotsu position.",
    "Classic right-hand grip established."
  ],
  "hidari-yotsu": [
    "Left-hand inside—hidari-yotsu.",
    "They settle into a left-handed grip battle.",
    "Hidari-yotsu—the traditional stance."
  ],
  "no-grip": [
    "Both struggle for position, neither commits.",
    "A tense standoff, no clear grip established.",
    "They circle, searching for an opening."
  ]
};

// Momentum narration
const MOMENTUM_PHRASES = {
  formal: [
    "The struggle continues at the center.",
    "{name} presses forward methodically.",
    "Neither wrestler yields ground easily."
  ],
  dramatic: [
    "The crowd senses the tide shifting!",
    "{name} surges with desperate power!",
    "At the straw! The voices rise!"
  ],
  understated: [
    "A patient exchange of pressure.",
    "Subtle adjustments from both.",
    "The bout extends, fatigue setting in."
  ],
  recovery: [
    "{name} finds new footing!",
    "A remarkable recovery from {name}!",
    "{name} refuses to yield!"
  ],
  lateral: [
    "{name} slides to the side!",
    "Lateral movement from {name}!",
    "{name} angles for advantage!"
  ],
  rear: [
    "{name} gets behind—dangerous position!",
    "The back is exposed! {name} capitalizes!",
    "{name} circles to the rear!"
  ]
};

// Finish narration
const FINISH_TEMPLATES = {
  formal: [
    "{winner} executes {kimarite}. The bout is decided.",
    "By {kimarite}, {winner} prevails.",
    "{winner} finishes cleanly with {kimarite}."
  ],
  dramatic: [
    "{winner} SURGES! {kimarite}! It is OVER!",
    "AT THE EDGE—{kimarite}! {winner} WINS!",
    "The crowd ERUPTS! {kimarite} from {winner}!"
  ],
  understated: [
    "{winner} applies {kimarite}. Quietly decisive.",
    "The finish comes by {kimarite}.",
    "{winner} completes the bout with {kimarite}."
  ],
  counter: [
    "{winner} COUNTERS! {kimarite}! A reversal!",
    "What a turnaround! {winner} with {kimarite}!",
    "The tables turn—{kimarite} from {winner}!"
  ]
};

// Crowd reactions
const CROWD_REACTIONS = {
  restrained: ["A murmur of appreciation.", "Polite applause fills the hall.", "The crowd nods in respect."],
  responsive: ["The hall responds with energy!", "Cheers sweep through the crowd!", "The fans show their approval!"],
  intimate: ["This crowd remembers them well.", "A warm reception from Fukuoka!", "The hall comes alive!"]
};

// Generate full narrative for a bout
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
  
  const isHighStakes = 
    east.rank === "yokozuna" || west.rank === "yokozuna" ||
    east.rank === "ozeki" || west.rank === "ozeki";
  
  const voiceStyle = getVoiceStyle(day, isHighStakes);
  const seed = `narrative-${result.kimarite}-${Date.now()}`;
  const rng = seedrandom(seed);
  
  const ctx: NarrativeContext = {
    rng,
    east,
    west,
    result,
    venue,
    day,
    voiceStyle
  };

  const lines: string[] = [];
  
  // Opening
  lines.push(`Day ${day} at ${venue}.`);
  lines.push(`${east.shikona} (East) faces ${west.shikona} (West).`);
  
  // Process each log entry
  for (const entry of result.log) {
    const narratedLine = narratePhase(ctx, entry, venueProfile.crowdStyle);
    if (narratedLine) {
      lines.push(narratedLine);
    }
  }
  
  // Closing
  const winner = result.winner === "east" ? east : west;
  const crowdReaction = pick(rng, CROWD_REACTIONS[venueProfile.crowdStyle as keyof typeof CROWD_REACTIONS] || CROWD_REACTIONS.restrained);
  lines.push(crowdReaction);
  lines.push(`Winner: ${winner.shikona} by ${result.kimariteName}.`);
  
  return lines;
}

function narratePhase(ctx: NarrativeContext, entry: BoutLogEntry, crowdStyle: string): string | null {
  const { rng, east, west, voiceStyle } = ctx;
  
  switch (entry.phase) {
    case "tachiai": {
      const winnerName = entry.data?.winner === "east" ? east.shikona : west.shikona;
      const template = pick(rng, TACHIAI_TEMPLATES[voiceStyle]);
      const margin = entry.data?.margin as number || 0;
      
      if (margin > 10) {
        return `${template} ${winnerName} dominates the initial charge!`;
      } else if (margin > 5) {
        return `${template} ${winnerName} takes the edge.`;
      } else {
        return `${template} An even clash—slight advantage to ${winnerName}.`;
      }
    }
    
    case "clinch": {
      const stance = entry.data?.stance as string || "no-grip";
      const templates = CLINCH_TEMPLATES[stance as keyof typeof CLINCH_TEMPLATES] || CLINCH_TEMPLATES["no-grip"];
      const template = pick(rng, templates);
      const advantage = entry.data?.advantage as string;
      const advantagedName = advantage === "east" ? east.shikona : advantage === "west" ? west.shikona : "";
      return template.replace("{winner}", advantagedName || "Neither wrestler");
    }
    
    case "momentum": {
      const recovery = entry.data?.recovery as boolean;
      const position = entry.data?.position as string;
      
      if (position === "lateral") {
        const speedier = east.speed > west.speed ? east.shikona : west.shikona;
        const template = pick(rng, MOMENTUM_PHRASES.lateral);
        return template.replace("{name}", speedier);
      }
      
      if (position === "rear") {
        const advantaged = ctx.result.winner === "east" ? east.shikona : west.shikona;
        const template = pick(rng, MOMENTUM_PHRASES.rear);
        return template.replace("{name}", advantaged);
      }
      
      if (recovery) {
        const description = entry.description || "";
        const nameMatch = description.match(/^(\S+)/);
        const name = nameMatch ? nameMatch[1] : "";
        const template = pick(rng, MOMENTUM_PHRASES.recovery);
        return template.replace("{name}", name);
      }
      
      // Skip generic momentum ticks ~50% of the time to avoid repetition
      if (rng() < 0.5) return null;
      
      const template = pick(rng, MOMENTUM_PHRASES[voiceStyle]);
      const active = rng() < 0.5 ? east.shikona : west.shikona;
      return template.replace("{name}", active);
    }
    
    case "finish": {
      const isCounter = entry.data?.isCounter as boolean;
      const winnerName = entry.data?.winner === "east" ? east.shikona : west.shikona;
      const kimariteName = entry.data?.kimariteName as string || "force-out";
      
      const templates = isCounter 
        ? FINISH_TEMPLATES.counter 
        : FINISH_TEMPLATES[voiceStyle];
      
      const template = pick(rng, templates);
      return template
        .replace("{winner}", winnerName)
        .replace("{kimarite}", kimariteName);
    }
    
    default:
      return null;
  }
}

function pick<T>(rng: seedrandom.PRNG, arr: T[]): T {
  return arr[Math.floor(rng() * arr.length)];
}
