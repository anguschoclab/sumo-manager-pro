import { GameState, Basho } from "./types";
import { generateH2HCommentary } from "./h2h";

export interface DigestItem {
  id: string;
  type: "matchup" | "news" | "stat";
  title: string;
  description: string;
  icon?: string; // e.g., "sword", "trophy", "skull", "fire", "bandage", "star", "calendar"
}

export function generateWeeklyDigest(state: GameState): DigestItem[] {
  const digest: DigestItem[] = [];
  const basho = state.currentBasho;

  if (!basho || !basho.isActive) {
    // OFF-SEASON / PRE-BASHO DIGEST
    digest.push({
      id: "season-status",
      type: "news",
      title: "Tournament Status",
      description: "No active tournament. Wrestlers are training for the next basho.",
      icon: "calendar",
    });
    return digest;
  }

  // --- 1. KEY MATCHUPS (Based on H2H) ---
  const today = basho.currentDay;
  const todaysBouts = basho.schedule[today - 1] || [];

  todaysBouts.forEach((bout) => {
    const east = state.rikishi.find((r) => r.id === bout.rikishiEastId);
    const west = state.rikishi.find((r) => r.id === bout.rikishiWestId);

    if (east && west) {
      if (!east.h2h) east.h2h = {};
      
      const h2h = east.h2h[west.id];
      if (h2h) {
        const total = h2h.wins + h2h.losses;
        // Highlight Deep Rivalries (lots of history)
        if (total > 5 && Math.abs(h2h.wins - h2h.losses) <= 2) {
          digest.push({
            id: `rivalry-${bout.id}`,
            type: "matchup",
            title: `Rivalry Alert: ${east.shikona} vs ${west.shikona}`,
            description: `These two have a fierce history (${h2h.wins}-${h2h.losses}). ${generateH2HCommentary(east, west)}`,
            icon: "fire",
          });
        }
        // Highlight Streak Breakers
        else if (h2h.streak >= 4) {
          digest.push({
            id: `streak-${bout.id}`,
            type: "matchup",
            title: `Dominance: ${east.shikona} vs ${west.shikona}`,
            description: `${east.shikona} has won the last ${h2h.streak} meetings. Can ${west.shikona} survive?`,
            icon: "sword",
          });
        }
      }
    }
  });

  // --- 2. INJURY REPORTS ---
  const recentInjuries = state.rikishi.filter(
    (r) => r.injuryStatus.isInjured && r.injuryStatus.weeksToHeal > 0
  );
  
  recentInjuries.slice(0, 3).forEach((r) => {
    digest.push({
      id: `injury-${r.id}`,
      type: "news",
      title: `Injury Report: ${r.shikona}`,
      description: `${r.shikona} is suffering from injury (${r.injuryStatus.location}). Performance may be degraded.`,
      icon: "bandage",
    });
  });

  // --- 3. ROOKIE WATCH ---
  // Identify new wrestlers (low career bouts) performing well
  const rookies = state.rikishi.filter(
    (r) => (r.careerRecord.wins + r.careerRecord.losses) < 15 && r.currentBashoRecord.wins > r.currentBashoRecord.losses
  );

  rookies.forEach((r) => {
    digest.push({
      id: `rookie-${r.id}`,
      type: "stat",
      title: `Rising Star: ${r.shikona}`,
      description: `The rookie from ${r.origin} (${r.archetype}) is turning heads with a ${r.currentBashoRecord.wins}-${r.currentBashoRecord.losses} start!`,
      icon: "star",
    });
  });

  // Fill with generic if empty
  if (digest.length === 0) {
    digest.push({
      id: "quiet-day",
      type: "news",
      title: `Day ${today} of ${basho.name}`,
      description: "The wrestlers are preparing for today's bouts. Check the schedule for details.",
      icon: "calendar",
    });
  }

  return digest;
}
