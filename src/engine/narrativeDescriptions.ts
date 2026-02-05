// narrativeDescriptions.ts
// =======================================================
// Static Narrative Descriptions (Banded prose library)
//
// Purpose:
// - Provide flavorful, consistent text for UI panels, tooltips, bios, summaries.
// - Decoupled from bout simulation + PBP logs.
// - Deterministic by input (no randomness).
//
// Typical consumers:
// - Rikishi profile screens (stats, style, archetype, career phase)
// - Training results screens
// - Medical/fatigue status summaries
// - Stable / coach descriptions
// =======================================================

export type StyleKey = "oshi" | "yotsu" | "hybrid";
export type ArchetypeKey =
  | "oshi_specialist"
  | "yotsu_specialist"
  | "speedster"
  | "trickster"
  | "all_rounder"
  | "hybrid_oshi_yotsu"
  | "counter_specialist";

export type CareerPhase = "youth" | "rising" | "prime" | "declining" | "twilight";

export type AttributeKey = "power" | "speed" | "balance" | "technique" | "strength" | "stamina" | "spirit" | "experience";

export type FatigueBand = "fresh" | "warm" | "worked" | "gassed" | "spent";
export type InjuryBand = "healthy" | "banged_up" | "strained" | "injured" | "out";

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}

function band5(v: number): 0 | 1 | 2 | 3 | 4 {
  // Expect v in 0..100 (we clamp anyway)
  const x = clamp(v, 0, 100);
  if (x < 20) return 0;
  if (x < 40) return 1;
  if (x < 60) return 2;
  if (x < 80) return 3;
  return 4;
}

function titleCase(s: string): string {
  return s.length ? s[0].toUpperCase() + s.slice(1) : s;
}

/** =========================
 *  Core stat descriptions
 *  ========================= */

const STAT_ADJECTIVES: Record<AttributeKey, string[]> = {
  power: ["light hitter", "solid striker", "heavy-handed", "punishing", "wrecking ball"],
  speed: ["plodding", "steady", "quick", "explosive", "blink-fast"],
  balance: ["wobbly", "settable", "stable", "hard to move", "rooted in stone"],
  technique: ["raw", "learning", "polished", "crafty", "masterful"],
  strength: ["underpowered", "stout", "strong", "overbearing", "iron-grip strong"],
  stamina: ["fragile", "limited tank", "workmanlike", "endless motor", "will not fade"],
  spirit: ["tentative", "composed", "confident", "fearless", "unyielding"],
  experience: ["green", "learning fast", "seasoned", "veteran", "old hand"]
};

const STAT_EXPLANATIONS: Record<AttributeKey, string[]> = {
  power: [
    "Wins only when the position is perfect.",
    "Can move opponents with clean contact.",
    "Regularly drives people back with thrusts or force-outs.",
    "Can change a bout with one big hit.",
    "A terrifying force — opponents feel it immediately."
  ],
  speed: [
    "Struggles to create angles.",
    "Keeps up in straight lines, not in scrambles.",
    "Quick enough to win exchanges in motion.",
    "Creates openings with footwork and timing.",
    "Turns fractions of a second into winning positions."
  ],
  balance: [
    "One shove can ruin the stance.",
    "Can be tipped if feet get crossed.",
    "Generally stays under control.",
    "Absorbs impact and keeps posture.",
    "Refuses to fall — survives at the tawara more than seems possible."
  ],
  technique: [
    "Relies on effort and strength.",
    "Has a few reliable patterns.",
    "Executes basics cleanly.",
    "Sets traps and wins with details.",
    "Reads grips, hips, and timing like a book."
  ],
  strength: [
    "Needs leverage to hold ground.",
    "Can fight chest-to-chest briefly.",
    "Holds position under normal pressure.",
    "Wins grips and pries opponents loose.",
    "When the hands connect, the opponent’s plan starts collapsing."
  ],
  stamina: [
    "Bouts turn dangerous after a few seconds.",
    "Fades if forced to grind.",
    "Can work a normal-length bout without collapse.",
    "Outlasts opponents in long clinches.",
    "Still dangerous late — pressure never stops."
  ],
  spirit: [
    "Can be shaken by setbacks.",
    "Settles after early nerves.",
    "Competes with clear intent.",
    "Doesn’t flinch under pressure.",
    "Walks forward like the outcome is inevitable."
  ],
  experience: [
    "Bites on feints and loses position.",
    "Learns quickly, but still gets caught.",
    "Knows when to reset and when to risk.",
    "Rarely panics — chooses good moments.",
    "Makes opponents fight his bout, not theirs."
  ]
};

export function describeAttribute(key: AttributeKey, value: number): { label: string; line: string } {
  const b = band5(value);
  return {
    label: titleCase(STAT_ADJECTIVES[key][b]),
    line: STAT_EXPLANATIONS[key][b]
  };
}

/** =========================
 *  Style descriptions
 *  ========================= */

const STYLE_LABELS: Record<StyleKey, string> = {
  oshi: "Oshi-zumo",
  yotsu: "Yotsu-zumo",
  hybrid: "Hybrid"
};

const STYLE_LINES: Record<StyleKey, string[]> = {
  oshi: [
    "Lives on the hands — thrust, shove, and overwhelm.",
    "Prefers open space and forward pressure.",
    "If the arms get inside, the bout changes fast."
  ],
  yotsu: [
    "Belt-first sumo — grips, hips, and leverage.",
    "Wants to slow the chaos and win in close.",
    "If the mawashi is secured, the tide can turn instantly."
  ],
  hybrid: [
    "Comfortable in either world — hands or belt.",
    "Adapts to the opponent’s shape of sumo.",
    "The plan changes mid-bout without warning."
  ]
};

export function describeStyle(style: StyleKey): { label: string; lines: string[] } {
  return { label: STYLE_LABELS[style], lines: STYLE_LINES[style] ?? [] };
}

/** =========================
 *  Archetype descriptions
 *  ========================= */

const ARCHETYPE_LABELS: Record<ArchetypeKey, string> = {
  oshi_specialist: "Oshi Specialist",
  yotsu_specialist: "Yotsu Specialist",
  speedster: "Speedster",
  trickster: "Trickster",
  all_rounder: "All-Rounder",
  hybrid_oshi_yotsu: "Hybrid Enforcer",
  counter_specialist: "Counter Specialist"
};

const ARCHETYPE_LINES: Record<ArchetypeKey, string[]> = {
  oshi_specialist: [
    "Starts fast and tries to end it fast.",
    "If the opponent’s feet stop moving, it’s over.",
    "Most dangerous when he can keep the bout upright and open."
  ],
  yotsu_specialist: [
    "Wants the belt and a steady walk to the edge.",
    "Wins with patience, pressure, and posture.",
    "If he settles his hips, the opponent is already late."
  ],
  speedster: [
    "Creates angles, steals position, and makes you chase.",
    "Most lethal when the fight gets messy.",
    "A half-step is enough for him."
  ],
  trickster: [
    "Lives on timing — feints, pulls, and sudden turns.",
    "Baits over-commitment and punishes it.",
    "Dangerous when the opponent is emotional or rushing."
  ],
  all_rounder: [
    "No obvious weakness, no obvious tells.",
    "Can win the boring way or the clever way.",
    "Makes the opponent solve different problems in one bout."
  ],
  hybrid_oshi_yotsu: [
    "Starts with hands, finishes on the belt — or the reverse.",
    "Switches gears the instant the opponent hesitates.",
    "Hard to scout: the attack changes with the first contact."
  ],
  counter_specialist: [
    "Invites pressure, then turns it back.",
    "Most lethal when the opponent thinks they’re winning.",
    "Wins the critical moment rather than the whole bout."
  ]
};

export function describeArchetype(archetype: ArchetypeKey): { label: string; lines: string[] } {
  return { label: ARCHETYPE_LABELS[archetype], lines: ARCHETYPE_LINES[archetype] ?? [] };
}

/** =========================
 *  Career phase model (UI copy)
 *  ========================= */

const CAREER_LABELS: Record<CareerPhase, string> = {
  youth: "Youth",
  rising: "Rising",
  prime: "Prime",
  declining: "Declining",
  twilight: "Twilight"
};

const CAREER_LINES: Record<CareerPhase, string[]> = {
  youth: ["Raw but hungry.", "Improving quickly.", "Wins on energy more than polish."],
  rising: ["Tools are coming together.", "Confidence is growing.", "Harder to push around each month."],
  prime: ["Knows his sumo.", "Can win in multiple ways.", "The plan is sharp and repeatable."],
  declining: ["Still dangerous, but the margins are thinner.", "Wins by craft and timing.", "Needs good positions more than before."],
  twilight: ["A veteran presence.", "Fights with experience and pride.", "Still has moments — but must choose them carefully."]
};

export function describeCareerPhase(phase: CareerPhase): { label: string; lines: string[] } {
  return { label: CAREER_LABELS[phase], lines: CAREER_LINES[phase] ?? [] };
}

/** Optional helper: infer phase from age (if you use age) */
export function inferCareerPhaseFromAge(age: number): CareerPhase {
  if (!Number.isFinite(age)) return "prime";
  if (age <= 20) return "youth";
  if (age <= 24) return "rising";
  if (age <= 30) return "prime";
  if (age <= 35) return "declining";
  return "twilight";
}

/** =========================
 *  Fatigue / injury summaries
 *  ========================= */

export function fatigueBandFromValue(fatigue: number): FatigueBand {
  const f = clamp(fatigue, 0, 100);
  if (f < 15) return "fresh";
  if (f < 35) return "warm";
  if (f < 55) return "worked";
  if (f < 75) return "gassed";
  return "spent";
}

export function describeFatigue(fatigue: number): { band: FatigueBand; line: string } {
  const band = fatigueBandFromValue(fatigue);
  const lines: Record<FatigueBand, string> = {
    fresh: "Looks fresh — footwork stays clean.",
    warm: "Loose and warm — breathing steady.",
    worked: "Working now — form holds, but effort shows.",
    gassed: "Breathing hard — mistakes become expensive.",
    spent: "Running on fumes — balance and timing begin to slip."
  };
  return { band, line: lines[band] };
}

export function injuryBandFromValue(severity: number): InjuryBand {
  const s = clamp(severity, 0, 100);
  if (s < 10) return "healthy";
  if (s < 30) return "banged_up";
  if (s < 55) return "strained";
  if (s < 80) return "injured";
  return "out";
}

export function describeInjury(severity: number): { band: InjuryBand; line: string } {
  const band = injuryBandFromValue(severity);
  const lines: Record<InjuryBand, string> = {
    healthy: "No visible issues.",
    banged_up: "Some bruises — nothing unusual in a basho.",
    strained: "Movement looks guarded — something is bothering him.",
    injured: "Clearly compromised — every exchange costs more.",
    out: "Not fit to compete."
  };
  return { band, line: lines[band] };
}

/** =========================
 *  Record / momentum blurbs
 *  ========================= */

export function describeRecord(wins: number, losses: number): string {
  const total = Math.max(1, wins + losses);
  const pct = wins / total;

  if (wins >= 10) return `Flying at ${wins}-${losses}. Everything is working.`;
  if (wins >= 8) return `Strong at ${wins}-${losses}. In the mix.`;
  if (wins === 7) return `Holding at ${wins}-${losses}. One good day changes the story.`;
  if (wins === 6) return `Teetering at ${wins}-${losses}. Needs a push to secure kachi-koshi.`;
  if (wins <= 4) return `Struggling at ${wins}-${losses}. The margin is thin now.`;

  if (pct > 0.6) return `Positive shape at ${wins}-${losses}.`;
  if (pct < 0.4) return `Fighting uphill at ${wins}-${losses}.`;
  return `Even at ${wins}-${losses}.`;
}

export function describeMomentumStreak(streak: number): string {
  if (!Number.isFinite(streak)) return "Momentum unclear.";
  if (streak >= 5) return "On a roll — confidence radiates.";
  if (streak >= 3) return "Hot streak — the sumo looks sharp.";
  if (streak <= -5) return "In a spiral — needs a reset.";
  if (streak <= -3) return "Cold streak — timing is off.";
  return "Momentum is neutral.";
}

/** =========================
 *  Composite profile blurb
 *  ========================= */

export function describeRikishiProfile(input: {
  shikona: string;
  style?: StyleKey;
  archetype?: ArchetypeKey;
  careerPhase?: CareerPhase;
  highlights?: Partial<Record<AttributeKey, number>>;
}): string[] {
  const lines: string[] = [];

  const style = input.style ?? "hybrid";
  const archetype = input.archetype ?? "all_rounder";
  const phase = input.careerPhase ?? "prime";

  lines.push(`${input.shikona}: ${describeStyle(style).label} — ${describeArchetype(archetype).label}.`);
  lines.push(...describeCareerPhase(phase).lines.slice(0, 1));

  const hi = input.highlights ?? {};
  const keys: AttributeKey[] = Object.keys(hi) as any;

  if (keys.length) {
    // pick top 2 stats
    const sorted = keys
      .map((k) => ({ k, v: hi[k] ?? 0 }))
      .sort((a, b) => (b.v ?? 0) - (a.v ?? 0))
      .slice(0, 2);

    for (const s of sorted) {
      const d = describeAttribute(s.k, s.v ?? 0);
      lines.push(`${titleCase(s.k)}: ${d.label}. ${d.line}`);
    }
  }

  return lines;
}
