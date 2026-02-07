// simulateFightAndSignal: wraps your simulateFight and emits signals/toasts.
export type SimDeps = {
  simulateFight: (a: any, d: any) => any;
  dmSignalFightResult: (outcome: any) => void;
};
export function simulateFightAndSignal(deps: SimDeps, planA: any, planD: any) {
  const out = deps.simulateFight(planA, planD);
  try { deps.dmSignalFightResult(out); } catch {}
  return out;
}
