/* Duelmasters — Sprint 5A delta */

export type FightSummary = {
  id: string;
  week: number;
  tournamentId?: string | null;
  title: string;
  a: string;
  d: string;
  winner: "A" | "D" | null;
  by: "Kill" | "KO" | "Exhaustion" | "Stoppage" | "Draw" | null;
  styleA: string;
  styleD: string;
  flashyTags?: string[];
  fameDeltaA?: number;
  fameDeltaD?: number;
  popularityDeltaA?: number;
  popularityDeltaD?: number;
  transcript?: string[];
  createdAt: string;
};

export type HallEntry = {
  week: number;
  label: "Fight of the Week" | "Fight of the Tournament";
  fightId: string;
};
