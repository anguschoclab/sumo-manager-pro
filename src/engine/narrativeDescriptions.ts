// Narrative Description System - Converts numeric values to prose
// Per Master Context v1.4: "Numbers appear only where money, rank, or time demand them"

// Attribute descriptions (power, speed, balance, technique: 0-100)
export function describeAttribute(value: number): string {
  if (value >= 90) return "Exceptional";
  if (value >= 75) return "Outstanding";
  if (value >= 60) return "Strong";
  if (value >= 45) return "Capable";
  if (value >= 30) return "Developing";
  if (value >= 15) return "Limited";
  return "Struggling";
}

export function describeAttributeVerbose(attribute: string, value: number): string {
  const level = describeAttribute(value);
  const descriptors: Record<string, Record<string, string>> = {
    power: {
      Exceptional: "His raw strength is fearsome—opponents buckle on contact",
      Outstanding: "A powerful frame that most cannot withstand",
      Strong: "Solid strength, enough to move most men",
      Capable: "Adequate power for his level",
      Developing: "Still building the muscle needed at this rank",
      Limited: "Lacks the power expected of a rikishi",
      Struggling: "Physically overmatched in most contests"
    },
    speed: {
      Exceptional: "Lightning quick—his reactions are almost preternatural",
      Outstanding: "Fast enough to catch opponents off-guard routinely",
      Strong: "Quick on his feet, able to exploit openings",
      Capable: "Moves well enough for his style",
      Developing: "Could be quicker; timing still maturing",
      Limited: "Sluggish compared to peers",
      Struggling: "Slow to react, often caught out"
    },
    balance: {
      Exceptional: "His root is legendary—impossible to shift",
      Outstanding: "Exceptionally stable; rarely loses footing",
      Strong: "Well-grounded, recovers well from pressure",
      Capable: "Adequate balance for competitive sumo",
      Developing: "Sometimes caught leaning; balance needs work",
      Limited: "Unsteady; vulnerable to throws",
      Struggling: "Falls too easily—fundamentals lacking"
    },
    technique: {
      Exceptional: "A master technician—every move is precise",
      Outstanding: "Highly skilled; knows exactly what to do",
      Strong: "Good technical foundation",
      Capable: "Sound basics, can execute his preferred moves",
      Developing: "Technique improving but inconsistent",
      Limited: "Relies on physicality over skill",
      Struggling: "Lacks the craft to compete effectively"
    }
  };
  
  return descriptors[attribute]?.[level] ?? `${level} ${attribute}`;
}

// Aggression (0-100)
export function describeAggression(value: number): string {
  if (value >= 85) return "Relentless";
  if (value >= 70) return "Aggressive";
  if (value >= 55) return "Forward-moving";
  if (value >= 40) return "Patient";
  if (value >= 25) return "Defensive";
  return "Passive";
}

export function describeAggressionVerbose(value: number): string {
  if (value >= 85) return "Fights with overwhelming forward pressure—never retreats";
  if (value >= 70) return "Prefers to attack, constantly pushing the action";
  if (value >= 55) return "A forward-moving style that seeks to control the pace";
  if (value >= 40) return "Picks his moments carefully, waiting for openings";
  if (value >= 25) return "Tends to absorb pressure before countering";
  return "Overly cautious; rarely initiates";
}

// Experience (basho count)
export function describeExperience(value: number): string {
  if (value >= 60) return "Veteran";
  if (value >= 40) return "Experienced";
  if (value >= 24) return "Established";
  if (value >= 12) return "Developing";
  if (value >= 6) return "Green";
  return "Novice";
}

export function describeExperienceVerbose(value: number): string {
  if (value >= 60) return "A seasoned veteran who has seen everything the dohyo offers";
  if (value >= 40) return "Years of experience inform his every move";
  if (value >= 24) return "Established at this level, comfortable in his routines";
  if (value >= 12) return "Still learning, but no longer a newcomer";
  if (value >= 6) return "Young and eager, with much still to learn";
  return "A fresh face, everything still ahead";
}

// Stamina (0-100)
export function describeStamina(value: number): string {
  if (value >= 85) return "Tireless";
  if (value >= 70) return "Enduring";
  if (value >= 55) return "Resilient";
  if (value >= 40) return "Average";
  if (value >= 25) return "Flagging";
  return "Brittle";
}

export function describeStaminaVerbose(value: number): string {
  if (value >= 85) return "Can go the distance no matter how long the bout";
  if (value >= 70) return "Rarely tires; maintains intensity throughout";
  if (value >= 55) return "Good conditioning; handles long bouts well";
  if (value >= 40) return "Standard stamina for the rank";
  if (value >= 25) return "Tends to fade in extended contests";
  return "Runs out of gas quickly; prefers short bouts";
}

// Momentum (-5 to +5)
export function describeMomentum(value: number): string {
  if (value >= 3) return "On fire";
  if (value >= 1) return "Rising";
  if (value === 0) return "Steady";
  if (value >= -2) return "Struggling";
  return "In crisis";
}

export function describeMomentumVerbose(value: number): string {
  if (value >= 3) return "Riding a wave of confidence—everything is clicking";
  if (value >= 1) return "Form is improving; building belief";
  if (value === 0) return "Neither hot nor cold; performing as expected";
  if (value >= -2) return "Confidence wavering; searching for answers";
  return "Deep in a slump; the pressure is visible";
}

// Career Phase
export function describeCareerPhaseVerbose(phase: string): string {
  const descriptions: Record<string, string> = {
    youth: "Young and raw, with enormous potential still untapped",
    rising: "Growing rapidly, improving with each tournament",
    prime: "At the peak of his powers—this is his time",
    declining: "Experience compensates for fading physicality",
    twilight: "The end approaches, but pride drives him forward"
  };
  return descriptions[phase] ?? "Career status uncertain";
}

// Fatigue (0-100, hidden from player)
export function describeFatigue(value: number): string {
  if (value <= 10) return "Fresh";
  if (value <= 30) return "Lightly worn";
  if (value <= 50) return "Tired";
  if (value <= 70) return "Exhausted";
  return "Spent";
}

export function describeFatigueVerbose(value: number): string {
  if (value <= 10) return "Looks fresh, moving freely without reservation";
  if (value <= 30) return "Minor signs of wear, but nothing concerning";
  if (value <= 50) return "The tournament grind is showing; movements less crisp";
  if (value <= 70) return "Visibly fatigued; conserving energy where possible";
  return "Running on empty; every bout a struggle";
}

// Training effects (percentages to narrative)
export function describeTrainingEffect(multiplier: number): string {
  if (multiplier >= 1.5) return "Dramatically increases";
  if (multiplier >= 1.2) return "Significantly improves";
  if (multiplier >= 1.05) return "Slightly enhances";
  if (multiplier >= 0.95) return "Maintains";
  if (multiplier >= 0.8) return "Slightly reduces";
  if (multiplier >= 0.5) return "Significantly reduces";
  return "Dramatically reduces";
}

// Injury status
export function describeInjuryVerbose(weeksRemaining: number): string {
  if (weeksRemaining >= 8) return "Facing a long road to recovery";
  if (weeksRemaining >= 4) return "Injury healing, but still weeks away";
  if (weeksRemaining >= 2) return "Progressing well; return in sight";
  return "Nearly recovered; could return soon";
}

// Reputation/Prestige (never show numbers per doc)
export function describeReputation(value: number): string {
  if (value >= 90) return "Legendary";
  if (value >= 75) return "Prestigious";
  if (value >= 60) return "Respected";
  if (value >= 45) return "Established";
  if (value >= 30) return "Developing";
  if (value >= 15) return "Modest";
  return "Unknown";
}

export function describeReputationVerbose(value: number): string {
  if (value >= 90) return "One of the great institutions of sumo";
  if (value >= 75) return "A stable of considerable prestige and history";
  if (value >= 60) return "Well-respected in sumo circles";
  if (value >= 45) return "An established presence in the sumo world";
  if (value >= 30) return "Building a name; the foundation is there";
  if (value >= 15) return "A small stable, still seeking recognition";
  return "Little known outside dedicated followers";
}

// Facility quality (0-100)
export function describeFacilityQuality(value: number): string {
  if (value >= 85) return "State-of-the-art";
  if (value >= 70) return "Excellent";
  if (value >= 55) return "Good";
  if (value >= 40) return "Adequate";
  if (value >= 25) return "Modest";
  return "Basic";
}

export function describeFacilityVerbose(type: string, value: number): string {
  const level = describeFacilityQuality(value);
  const descriptions: Record<string, Record<string, string>> = {
    training: {
      "State-of-the-art": "The finest training equipment and dohyo—wrestlers develop rapidly here",
      Excellent: "Top-quality facilities that give wrestlers every advantage",
      Good: "Solid training setup that serves the stable well",
      Adequate: "Basic but functional equipment; gets the job done",
      Modest: "Simple facilities; wrestlers must work harder to improve",
      Basic: "Minimal equipment; training effectiveness suffers"
    },
    recovery: {
      "State-of-the-art": "Medical-grade recovery center with every modern treatment",
      Excellent: "Excellent recovery facilities speed healing significantly",
      Good: "Good recovery options help wrestlers bounce back",
      Adequate: "Standard recovery setup; nothing special",
      Modest: "Limited recovery options; injuries linger longer",
      Basic: "Minimal recovery support; wrestlers heal slowly"
    },
    nutrition: {
      "State-of-the-art": "Elite chanko and nutrition program; wrestlers thrive",
      Excellent: "Excellent kitchen and nutritional support",
      Good: "Good food program supporting wrestler health",
      Adequate: "Standard stable cuisine; nutritionally sound",
      Modest: "Basic fare; nutrition could be improved",
      Basic: "Minimal kitchen facilities; nutrition is inconsistent"
    }
  };
  
  return descriptions[type]?.[level] ?? `${level} ${type} facilities`;
}

// Comparative descriptions
export function compareAttribute(value: number, average: number): string {
  const diff = value - average;
  if (diff >= 20) return "far above peers";
  if (diff >= 10) return "above average";
  if (diff >= -10) return "typical for his rank";
  if (diff >= -20) return "below average";
  return "well below peers";
}

// Win/Loss trend (allowed as numbers per doc, but can add context)
export function describeRecord(wins: number, losses: number): { record: string; assessment: string } {
  const record = `${wins}-${losses}`;
  const total = wins + losses;
  
  if (total === 0) return { record, assessment: "No bouts yet" };
  
  const winRate = wins / total;
  let assessment: string;
  
  if (winRate >= 0.8) assessment = "Dominant";
  else if (winRate >= 0.6) assessment = "Strong";
  else if (winRate >= 0.5) assessment = "Competitive";
  else if (winRate >= 0.4) assessment = "Struggling";
  else assessment = "In trouble";
  
  return { record, assessment };
}

// Archetype narrative descriptions
export function describeArchetypeVerbose(archetype: string): string {
  const descriptions: Record<string, string> = {
    oshi_specialist: "A pure pusher-thruster who overwhelms with forward pressure",
    yotsu_specialist: "A belt fighter who excels when grips are secured",
    speedster: "Lightning quick, relying on speed and timing",
    trickster: "A technician with a deep bag of tricks",
    all_rounder: "Versatile and adaptable, comfortable in any situation"
  };
  return descriptions[archetype] ?? "A unique fighting style";
}

// Style descriptions
export function describeStyleVerbose(style: string): string {
  const descriptions: Record<string, string> = {
    oshi: "Prefers pushing and thrusting, keeping opponents at arm's length",
    yotsu: "Seeks the belt, using grips to control and throw",
    hybrid: "Comfortable both pushing and on the belt; adapts to each opponent"
  };
  return descriptions[style] ?? "Distinctive approach to sumo";
}
