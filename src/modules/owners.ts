/**
 * Owners module: scoring owners by Fame / Renown / Titles.
 * This is a tiny API surface so the app can render Hall of Owners.
 */

export type OwnerId = string;

export type OwnerRecord = {
  id: OwnerId;
  name: string;
  stableName: string;
  fame: number;     // long-term prestige
  renown: number;   // recent spotlight
  titles: number;   // tournament wins
  personality?: 'Aggressive' | 'Methodical' | 'Showman' | 'Pragmatic' | 'Tactician';
};

export type OwnerScore = {
  id: OwnerId;
  score: number;
  rank: number;
};

export function computeOwnerScore(o: OwnerRecord): number {
  // Weighted blend — can be tuned later.
  return o.fame * 1.25 + o.renown * 1.0 + o.titles * 10;
}

export function rankOwners(owners: OwnerRecord[]): OwnerScore[] {
  const scored = owners.map(o => ({ id: o.id, score: computeOwnerScore(o)}));
  scored.sort((a,b) => b.score - a.score);
  return scored.map((s, i) => ({ ...s, rank: i + 1 }));
}