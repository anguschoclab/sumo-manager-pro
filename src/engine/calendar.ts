// Basho Calendar System - Six authentic tournaments per year
// Based on real sumo tournament schedule

import type { BashoName, BashoInfo } from "./types";

// The six official basho (grand tournaments)
export const BASHO_CALENDAR: Record<BashoName, BashoInfo> = {
  hatsu: {
    name: "hatsu",
    nameJa: "初場所",
    nameEn: "New Year Tournament",
    month: 1,
    location: "Tokyo",
    venue: "Ryōgoku Kokugikan",
    venueJa: "両国国技館",
    startDay: 8, // Second Sunday of January (approximate)
    season: "winter",
    description: "The first basho of the year, held in the new year spirit"
  },
  haru: {
    name: "haru",
    nameJa: "春場所",
    nameEn: "Spring Tournament",
    month: 3,
    location: "Osaka",
    venue: "Edion Arena Osaka",
    venueJa: "エディオンアリーナ大阪",
    startDay: 10,
    season: "spring",
    description: "The spring basho held in Osaka, known for passionate local fans"
  },
  natsu: {
    name: "natsu",
    nameJa: "夏場所",
    nameEn: "Summer Tournament",
    month: 5,
    location: "Tokyo",
    venue: "Ryōgoku Kokugikan",
    venueJa: "両国国技館",
    startDay: 12,
    season: "summer",
    description: "The summer basho returns to Tokyo's sumo heartland"
  },
  nagoya: {
    name: "nagoya",
    nameJa: "名古屋場所",
    nameEn: "Nagoya Tournament",
    month: 7,
    location: "Nagoya",
    venue: "Aichi Prefectural Gymnasium",
    venueJa: "愛知県体育館",
    startDay: 7,
    season: "summer",
    description: "The midsummer basho, often the hottest and most grueling"
  },
  aki: {
    name: "aki",
    nameJa: "秋場所",
    nameEn: "Autumn Tournament",
    month: 9,
    location: "Tokyo",
    venue: "Ryōgoku Kokugikan",
    venueJa: "両国国技館",
    startDay: 8,
    season: "autumn",
    description: "The autumn basho, traditionally when new stars emerge"
  },
  kyushu: {
    name: "kyushu",
    nameJa: "九州場所",
    nameEn: "Kyushu Tournament",
    month: 11,
    location: "Fukuoka",
    venue: "Fukuoka Kokusai Center",
    venueJa: "福岡国際センター",
    startDay: 10,
    season: "autumn",
    description: "The year's final basho, held in southern Japan"
  }
};

// Basho order for iteration
export const BASHO_ORDER: BashoName[] = [
  "hatsu", "haru", "natsu", "nagoya", "aki", "kyushu"
];

// Get basho by number (1-6)
export function getBashoByNumber(num: 1 | 2 | 3 | 4 | 5 | 6): BashoInfo {
  return BASHO_CALENDAR[BASHO_ORDER[num - 1]];
}

// Get next basho in sequence
export function getNextBasho(current: BashoName): BashoName {
  const idx = BASHO_ORDER.indexOf(current);
  return BASHO_ORDER[(idx + 1) % 6];
}

// Get basho index (0-5)
export function getBashoIndex(name: BashoName): number {
  return BASHO_ORDER.indexOf(name);
}

// Calculate weeks between basho (for interim period)
export function getInterimWeeks(from: BashoName, to: BashoName): number {
  const fromInfo = BASHO_CALENDAR[from];
  const toInfo = BASHO_CALENDAR[to];
  
  // Each basho is 15 days (~2 weeks)
  // Calculate months between, then convert to weeks
  let monthDiff = toInfo.month - fromInfo.month;
  if (monthDiff <= 0) monthDiff += 12; // Wrap around year
  
  // Approximately 4 weeks per month, minus 2 weeks for basho duration
  return Math.max(4, monthDiff * 4 - 2);
}

// Seasonal flavor text for narrative
export const SEASONAL_FLAVOR: Record<BashoInfo["season"], string[]> = {
  winter: [
    "Cold winds blow across the kokugikan as the new year begins.",
    "Steam rises from the chanko pots as rikishi prepare for the first basho.",
    "The fresh spirit of the new year fills the arena."
  ],
  spring: [
    "Cherry blossoms frame the arena as spring arrives.",
    "The Osaka crowds bring their passionate energy to every bout.",
    "Spring rain patters on the roof as the tournament unfolds."
  ],
  summer: [
    "Heat shimmers over the dohyo in the height of summer.",
    "Fans wave uchiwa as the temperature rises with the action.",
    "The summer sun beats down, testing the endurance of every rikishi."
  ],
  autumn: [
    "Autumn leaves drift past the kokugikan windows.",
    "The cooling air brings renewed vigor to the competition.",
    "As the year winds down, every bout carries extra weight."
  ]
};

// Get random seasonal flavor text
export function getSeasonalFlavor(season: BashoInfo["season"]): string {
  const options = SEASONAL_FLAVOR[season];
  return options[Math.floor(Math.random() * options.length)];
}

// Tournament day names (for display)
export function getDayName(day: number): { dayNum: string; dayJa: string } {
  const dayNames: Record<number, string> = {
    1: "初日",      // Shonichi - First day
    7: "中日",      // Nakabi - Middle day (Week 1)
    8: "中日",      // Nakabi - Middle day (Week 2 start)
    14: "千秋楽前日", // Senshuraku Zenjitsu - Day before final
    15: "千秋楽"     // Senshuraku - Final day
  };
  
  return {
    dayNum: `Day ${day}`,
    dayJa: dayNames[day] || `${day}日目`
  };
}

// Check if it's a key day (extra narrative weight)
export function isKeyDay(day: number): boolean {
  return day === 1 || day === 7 || day === 8 || day === 14 || day === 15;
}
