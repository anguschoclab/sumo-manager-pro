import * as React from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { autoTuneFromBias, reconcileGearTwoHanded, type Bias, type Plan } from '../engine/planBias';
import { loadUIPrefs, saveUIPrefs } from '../state/uiPrefs';

type Props = {
  open: boolean; onOpenChange: (v: boolean) => void;
  plan: Plan; onApply: (patch: Partial<Plan>) => void;
  antiSynergy?: { getOffensivePenalty(style: string, tactic?: string): number; getDefensivePenalty(style: string, tactic?: string): number };
};
export default function TargetingModal({ open, onOpenChange, plan, onApply, antiSynergy }: Props) {
  const [bias, setBias] = React.useState<Bias>('balanced');
  const [prefs, setPrefs] = React.useState(loadUIPrefs());
  const [local, setLocal] = React.useState<Partial<Plan>>({});
  React.useEffect(()=>setLocal({}),[plan.style]);

  const penalty = React.useMemo(()=>{
    const getOff = antiSynergy?.getOffensivePenalty; const getDef = antiSynergy?.getDefensivePenalty;
    return {
      off: getOff ? getOff(plan.style, local.offensiveTactic || plan.offensiveTactic) : 1,
      def: getDef ? getDef(plan.style, local.defensiveTactic || plan.defensiveTactic) : 1,
    };
  },[antiSynergy, plan.style, plan.offensiveTactic, plan.defensiveTactic, local.offensiveTactic, local.defensiveTactic]);

  const apply = () => {
    let patch = { ...local };
    if (prefs.autoTunePlan) {
      const tuned = autoTuneFromBias({ ...plan, ...patch } as Plan, bias);
      patch = { ...patch, ...tuned };
      reconcileGearTwoHanded(plan, patch);
    }
    onApply(patch);
    saveUIPrefs(prefs);
    onOpenChange(false);
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/40" />
        <Dialog.Content className="fixed left-1/2 top-1/2 w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-xl bg-white p-5 shadow-xl">
          <Dialog.Title className="text-xl font-semibold mb-2">Targeting & Auto‑Tune</Dialog.Title>
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <label className="w-36 text-sm">Bias</label>
              <select className="dm-select" value={bias} onChange={e=>setBias(e.target.value as Bias)}>
                <option value="balanced">Balanced</option>
                <option value="head-hunt">Head‑hunt</option>
                <option value="hamstring">Hamstring</option>
                <option value="gut">Gut shots</option>
                <option value="guard-break">Guard‑break (arms)</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-500">Offensive tactic</label>
                <select className="dm-select w-full" value={local.offensiveTactic ?? plan.offensiveTactic ?? ''} onChange={e=>setLocal(l=>({ ...l, offensiveTactic: e.target.value || undefined }))}>
                  <option value="">(none)</option>
                  <option>Bash</option><option>Slash</option><option>Lunge</option><option>Aim</option><option>Decisiveness</option>
                </select>
                {penalty.off < 1 && <p className="mt-1 text-xs text-amber-600">Anti‑synergy penalty: {(Math.round((1-penalty.off)*100))}%</p>}
              </div>
              <div>
                <label className="text-xs text-gray-500">Defensive tactic</label>
                <select className="dm-select w-full" value={local.defensiveTactic ?? plan.defensiveTactic ?? ''} onChange={e=>setLocal(l=>({ ...l, defensiveTactic: e.target.value || undefined }))}>
                  <option value="">(none)</option>
                  <option>Parry</option><option>Dodge</option><option>Responsiveness</option><option>Riposte</option>
                </select>
                {penalty.def < 1 && <p className="mt-1 text-xs text-amber-600">Anti‑synergy penalty: {(Math.round((1-penalty.def)*100))}%</p>}
              </div>
              <div>
                <label className="text-xs text-gray-500">Target</label>
                <select className="dm-select w-full" value={local.target ?? plan.target ?? 'Any'} onChange={e=>setLocal(l=>({ ...l, target: e.target.value as any }))}>
                  <option>Any</option><option>Head</option><option>Chest</option><option>Abdomen</option><option>Arms</option><option>Legs</option>
                </select>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div><label className="text-xs">OE</label><input type="number" min={1} max={10} className="dm-input w-full" value={local.OE ?? plan.OE} onChange={e=>setLocal(l=>({ ...l, OE: Number(e.target.value) }))} /></div>
                <div><label className="text-xs">AL</label><input type="number" min={1} max={10} className="dm-input w-full" value={local.AL ?? plan.AL} onChange={e=>setLocal(l=>({ ...l, AL: Number(e.target.value) }))} /></div>
                <div><label className="text-xs">Kill</label><input type="number" min={1} max={10} className="dm-input w-full" value={local.killDesire ?? (plan.killDesire ?? 5)} onChange={e=>setLocal(l=>({ ...l, killDesire: Number(e.target.value) }))} /></div>
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm mt-2">
              <input type="checkbox" checked={prefs.autoTunePlan} onChange={e=>setPrefs({ ...prefs, autoTunePlan: e.target.checked })} />
              Auto‑tune plan from bias & style
            </label>
          </div>
          <div className="mt-5 flex justify-end gap-2">
            <Dialog.Close className="dm-btn-secondary">Cancel</Dialog.Close>
            <button className="dm-btn" onClick={apply}>Apply</button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
