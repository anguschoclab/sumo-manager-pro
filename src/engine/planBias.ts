// Bias + style aware auto‑tune helpers for plans.
// Keep this API stable with your Plan type in engine.
export type Bias = 'head-hunt' | 'hamstring' | 'gut' | 'guard-break' | 'balanced';
export type Plan = {
  style: string;
  OE: number; AL: number; killDesire?: number;
  target?: 'Head'|'Chest'|'Abdomen'|'Arms'|'Legs'|'Any';
  offensiveTactic?: string; defensiveTactic?: string;
  gear?: { weapon: { name: string; twoHanded?: boolean }, shield: 'None'|'Small'|'Medium'|'Large', armor: string, helm: string };
};
export function autoTuneFromBias(plan: Plan, bias: Bias): Partial<Plan> {
  const tuned: Partial<Plan> = {};
  switch (bias) {
    case 'head-hunt': tuned.target = 'Head'; tuned.killDesire = Math.max(7, plan.killDesire ?? 7); break;
    case 'hamstring': tuned.target = 'Legs'; tuned.AL = Math.max(plan.AL, 7); break;
    case 'gut': tuned.target = 'Abdomen'; tuned.OE = Math.max(plan.OE, 7); break;
    case 'guard-break': tuned.target = 'Arms'; tuned.OE = Math.max(plan.OE, 8); break;
    default: tuned.target = 'Any';
  }
  // Style nudges
  if (/(LUNGE)/i.test(plan.style)) tuned.offensiveTactic = 'Lunge';
  if (/BASHING/.test(plan.style)) tuned.offensiveTactic = tuned.offensiveTactic || 'Bash';
  if (/PARRY\s*RIPOSTE/i.test(plan.style)) tuned.defensiveTactic = 'Riposte';
  if (/TOTAL\s*PARRY/i.test(plan.style)) tuned.defensiveTactic = 'Parry';
  return tuned;
}
export function reconcileGearTwoHanded(plan: Plan, draft: Partial<Plan>) {
  const next = { ...plan, ...draft };
  if (next.gear?.weapon?.twoHanded && next.gear?.shield && next.gear.shield !== 'None') {
    draft.gear = { ...next.gear, shield: 'None' };
  }
}
