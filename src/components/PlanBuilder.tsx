import * as React from 'react';
import TargetingModal from './TargetingModal';
import { getOffensivePenalty, getDefensivePenalty } from '../engine/antiSynergy';
import type { Plan } from '../engine/planBias';

type Props = {
  plan: Plan; onPlanChange: (p: Plan)=>void;
};
export default function PlanBuilder({ plan, onPlanChange }: Props) {
  const [open, setOpen] = React.useState(false);
  return (
    <div className="rounded-xl border p-3 bg-white/70">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Plan</h3>
        <button className="dm-btn-sm" onClick={()=>setOpen(true)}>Targeting…</button>
      </div>
      <div className="text-xs text-gray-600 mt-1">Style: {plan.style} · OE {plan.OE} · AL {plan.AL} · Target {plan.target ?? 'Any'}</div>
      <TargetingModal
        open={open}
        onOpenChange={setOpen}
        plan={plan}
        antiSynergy={{ getOffensivePenalty, getDefensivePenalty }}
        onApply={(patch)=>onPlanChange({ ...plan, ...patch })}
      />
    </div>
  );
}
