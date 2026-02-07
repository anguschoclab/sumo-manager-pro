import React, { useState } from 'react';
import { useToasts } from '../ui/Toasts';
import { LoreArchive, toLoreSummary } from '../lore/LoreArchive';
import { StyleMeter } from '../lore/StyleMeter';
import { simulateFightAndSignal } from '../engine/simWrapper';
import { pickWeeklyMatchups } from '../engine/matchmaking';
import type { FightOutcome, MinutePlan, WarriorMeta } from '../engine/types';

export default function RunRoundPanel() {
  const { push } = useToasts();
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState<FightOutcome[]>([]);

  const runWeek = async () => {
    if (running) return;
    setRunning(true);
    try {
      const matchups = pickWeeklyMatchups(); // already prevents stablemates in regular weeks
      const weekResults: FightOutcome[] = [];

      for (const m of matchups) {
        const res = simulateFightAndSignal(m.planA, m.planD);
        weekResults.push(res);

        // 1) Persist to lore & styles
        LoreArchive.signalFight(toLoreSummary(res));
        StyleMeter.recordFight({
          styleA: m.planA.style, styleD: m.planD.style,
          winner: res.winner, by: res.by, isTournament: false
        });

        // 2) Narrative toast
        const line = res.by === 'Kill'
          ? 'A brutal finish — the arena gasps! Fame surges.'
          : res.by === 'KO'
          ? 'What a knockout! The crowd erupts — reputation grows.'
          : 'A hard-fought decision. Respect in the stands climbs.';
        push({ text: line, tone: 'good' });
      }

      setResults(weekResults);
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <button
          className="rounded-lg bg-emerald-500 px-4 py-2 text-neutral-900 hover:bg-emerald-400 disabled:opacity-50"
          onClick={runWeek}
          disabled={running}
        >
          {running ? 'Running…' : 'Run Round'}
        </button>
      </div>

      {/* Minimal results list (actual app may render newsletter) */}
      <div className="space-y-2">
        {results.map((r, i) => (
          <div key={i} className="rounded border border-neutral-800 p-3">
            <div className="text-sm opacity-80">
              Result: {r.winner ? (r.winner === 'A' ? 'Challenger' : 'Defender') : 'Draw'} — {r.by || 'Decision'}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}