import * as React from "react";
import { useDMToast } from "../components/Toasts";
import { sendSignal, onSignal } from "../engine/signals";
import { fameFromTags } from "../engine/fame";

// Minimal stub: host app should pass in simulateRound() and roster access.
export const RunRoundPanel: React.FC<{ simulate: () => { tagsA: string[]; tagsD: string[]; winnerSide: "A"|"D"|null; by: "Kill"|"KO"|"Exhaustion"|"Stoppage"|"Draw"|null; minutes:number; }; }> = ({ simulate }) => {
  const toast = useDMToast();
  React.useEffect(()=>{
    const off = onSignal(e => {
      if (e.type === "fight:result") {
        const { fameDeltaA, fameDeltaD, popDeltaA, popDeltaD } = e.payload;
        const text = [
          fameDeltaA || popDeltaA ? "Your fighter won the crowd." : "",
          fameDeltaD || popDeltaD ? "Opponent's fame shifts too." : "",
        ].filter(Boolean).join(" ");
        if (text) toast({ title: "The arena roars!", description: text });
      }
    });
    return () => off();
  }, [toast]);

  const onRun = () => {
    const r = simulate();
    const fpA = fameFromTags(r.tagsA);
    const fpD = fameFromTags(r.tagsD);

    sendSignal({ type: "fight:result", payload: { winnerSide: r.winnerSide, by: r.by, minutes: r.minutes, tags: [...r.tagsA, ...r.tagsD], fameDeltaA: fpA.fame, popDeltaA: fpA.pop, fameDeltaD: fpD.fame, popDeltaD: fpD.pop } });
  };

  return (
    <div className="p-4 bg-slate-800/60 rounded-xl space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold tracking-tight">Run Round</h2>
        <button onClick={onRun} className="px-3 py-1.5 rounded-md bg-emerald-600 text-white hover:bg-emerald-500">Simulate</button>
      </div>
      <p className="text-sm text-slate-300">Runs one round and emits arena signals. Fame/Popularity are bumped via tags (KO, Kill, Flashy, etc.).</p>
    </div>
  );
};
