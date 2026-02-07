export enum FightingStyle {
  BashingAttack = "BASHING ATTACK",
  ParryLunge = "PARRY-LUNGE",
  ParryRiposte = "PARRY RIPOSTE",
  LungingAttack = "LUNGING ATTACK",
  TotalParry = "TOTAL PARRY",
  StrikingAttack = "STRIKING ATTACK",
  SlashingAttack = "SLASHING ATTACK",
  ParryStrike = "PARRY-STRIKE",
  WallOfSteel = "WALL OF STEEL",
  AimedBlow = "AIMED BLOW"
}
export type WarriorMeta = {
  name: string; style: FightingStyle;
  ST:number; CN:number; SZ:number; WT:number; WL:number; SP:number; DF:number;
};
export type MinutePlan = { style: FightingStyle; OE:number; AL:number; killDesire?:number; self?: WarriorMeta };
export type MinuteEvent = { minute: number; text: string };
export type FightOutcome = { winner: "A"|"D"|null; by: "Kill"|"KO"|"Stoppage"|"Draw"|null; minutes:number; log:MinuteEvent[] };
export function defaultPlanForWarrior(w:WarriorMeta): MinutePlan { return { style:w.style, OE:7, AL:6, killDesire:5, self:w }; }
export function simulateFight(planA:MinutePlan, planD:MinutePlan): FightOutcome {
  const log: MinuteEvent[] = [];
  log.push({ minute: 1, text: "The audience falls silent as the dueling begins." });
  log.push({ minute: 1, text: "Both warriors test the measure of their foe." });
  log.push({ minute: 2, text: "Steel flashes; parries ring; no decisive blow." });
  log.push({ minute: 3, text: "Time! The Arenamaster signals a draw for this exhibition." });
  return { winner:null, by:"Draw", minutes:3, log };
}
