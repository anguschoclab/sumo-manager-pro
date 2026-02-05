<<<<<<< HEAD
// uiDigest.ts
// =======================================================
// UI Digest — transforms engine/world state into a compact weekly report.
//
// IMPORTANT:
// - World uses Maps at runtime (IdMapRuntime), so iterate with .values()
//   and Array.from(...) to avoid Map iterator pitfalls in UI code.
// =======================================================

import type { WorldState, Rikishi, Heya } from "./types";
=======
 import type { WorldState, BashoState, Rikishi } from "./types";
>>>>>>> 5d0ed87c25a38491e219371f91ad67dcb9bdb4ed
import { generateH2HCommentary } from "./h2h";

export type DigestKind =
  | "training"
  | "injury"
  | "recovery"
  | "salary"
  | "koenkai"
  | "expense"
  | "economy"
  | "scouting"
  | "generic";

export interface DigestItem {
  id: string;
  kind: DigestKind;
  title: string;
<<<<<<< HEAD
  detail?: string;
  rikishiId?: string;
  heyaId?: string;
}

export interface DigestSection {
  id: string;
  title: string;
  items: DigestItem[];
}
=======
  description: string;
  icon?: string; // e.g., "sword", "trophy", "skull", "fire", "bandage", "star", "calendar"
   kind?: string;
   rikishiId?: string;
   heyaId?: string;
   detail?: string;
 }
 
 export interface DigestSection {
   id: string;
   title: string;
   items: DigestItem[];
 }
 
 export interface UIDigest {
   scope: "week" | "basho";
   privacyMode: "player" | "world";
   time: {
     year: number;
     label?: string;
   };
   headline?: string;
   sections: DigestSection[];
   counts: {
     totalItems: number;
     trainingEvents: number;
     injuries: number;
     salaries: number;
     koenkai: number;
     expenses: number;
   };
}

 export function generateWeeklyDigest(state: WorldState): DigestItem[] {
  const digest: DigestItem[] = [];
   const basho = state.currentBasho as BashoState | undefined;
>>>>>>> 5d0ed87c25a38491e219371f91ad67dcb9bdb4ed

export interface UIDigest {
  time: { label: string };
  headline: string;
  counts: {
    trainingEvents: number;
    injuries: number;
    recoveries: number;
    economy: number;
    scouting: number;
  };
  sections: DigestSection[];
}

function labelForWorld(world: WorldState): string {
  const year = world.year ?? 2024;
  const week = world.week ?? 0;
  const phase = world.cyclePhase ?? "interim";
  return `${year} — Week ${week} (${phase})`;
}

export function buildWeeklyDigest(world: WorldState | null): UIDigest | null {
  if (!world) return null;

  const rikishiList = Array.from(world.rikishi.values());
  const heyaList = Array.from(world.heyas.values());

  const sections: DigestSection[] = [];

  // --- Injuries ---
  const injuryItems: DigestItem[] = [];
  for (const r of rikishiList) {
    const injury = (r as any).injury;
    if (injury?.isInjured) {
      injuryItems.push({
        id: `injury::${r.id}`,
        kind: "injury",
        title: `${r.shikona ?? r.name ?? r.id} injured`,
        detail: `${injury.severity ?? "unknown"} — ${injury.weeksRemaining ?? "?"}w remaining`,
        rikishiId: r.id,
      });
    }
  }
  if (injuryItems.length) {
    sections.push({ id: "injuries", title: "Injuries", items: injuryItems });
  }

  // --- Key matchup (during basho) ---
  const matchupItems: DigestItem[] = [];
  const basho = world.currentBasho;
  if (basho?.isActive) {
    const day = basho.day ?? basho.currentDay ?? 1;
    const todays = basho.matches?.[day - 1] ?? basho.schedule?.[day - 1] ?? [];
    for (const bout of todays.slice(0, 3)) {
      const eastId = (bout as any).rikishiEastId ?? (bout as any).eastId;
      const westId = (bout as any).rikishiWestId ?? (bout as any).westId;
      if (!eastId || !westId) continue;

      const east = world.rikishi.get(eastId);
      const west = world.rikishi.get(westId);
      if (!east || !west) continue;

      matchupItems.push({
        id: `matchup::${east.id}::${west.id}::d${day}`,
        kind: "generic",
        title: `${east.shikona ?? east.name} vs ${west.shikona ?? west.name}`,
        detail: generateH2HCommentary(east, west),
        rikishiId: east.id,
      });
    }
    if (matchupItems.length) {
      sections.unshift({ id: "matchups", title: "Key Matchups", items: matchupItems });
    }
  }

  const counts = {
    trainingEvents: 0,
    injuries: injuryItems.length,
    recoveries: 0,
    economy: 0,
    scouting: 0,
  };

  const headline =
    basho?.isActive
      ? `Basho Day ${basho.day ?? basho.currentDay ?? 1}: ${matchupItems.length ? "Key matchups highlighted." : "Tournament in progress."}`
      : injuryItems.length
        ? `${injuryItems.length} injury update${injuryItems.length === 1 ? "" : "s"} this week.`
        : "No major events recorded this week.";

  return {
    time: { label: labelForWorld(world) },
    headline,
    counts,
    sections,
  };
}
