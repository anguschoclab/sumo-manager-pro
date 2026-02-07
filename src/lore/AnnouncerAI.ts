/* Duelmasters — Sprint 5A delta */

const exclaim = ["Great heavens!", "By the gods!", "Mercy!", "Hark!", "Witness!", "What a clash!"];
const flourish = ["in a blur", "with a deft twist", "after a feint", "despite the odds", "to the crowd's delight"];
const finishers = ["drops the guard", "finds the opening", "presses the advantage", "seals the bout", "drives the point home"];

export type AnnounceTone = "neutral" | "hype" | "grim";

export function blurb(opts: { tone?: AnnounceTone; winner?: string; loser?: string; by?: string; }): string {
  const t = opts.tone || "neutral";
  const w = opts.winner || "The victor";
  const l = opts.loser || "his foe";
  const by = opts.by ? ` by ${opts.by.toLowerCase()}` : "";
  if (t === "hype") return `${exclaim[Math.floor(Math.random()*exclaim.length)]} ${w} ${finishers[Math.floor(Math.random()*finishers.length)]} ${flourish[Math.floor(Math.random()*flourish.length)]}!`;
  if (t === "grim") return `${w} overcomes ${l}${by}, the arena falls hushed.`;
  return `${w} bests ${l}${by}.`;
}
