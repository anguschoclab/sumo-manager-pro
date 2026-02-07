import { simulateFight } from './simulate';
import { dmSignalFightResult } from './signals';
import type { MinutePlan, FightOutcome } from './types';

export function simulateFightAndSignal(planA: MinutePlan, planD: MinutePlan): FightOutcome {
  const out = simulateFight(planA, planD);
  dmSignalFightResult(out);
  return out;
}