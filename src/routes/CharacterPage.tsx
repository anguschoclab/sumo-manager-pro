import * as React from "react";
import { FlairChip } from "../components/ResultChips";

type Injury = { name: string; week: number };
type Title = { name: string; season: string };

export type CharacterRecord = {
  id: string;
  name: string;
  stableId: string;
  style: string;
  fame: number;
  popularity: number;
  wins: number; losses: number; kills: number;
  injuries?: Injury[];
  titles?: Title[];
  trainerStatus?: { isTrainer: boolean; specialty?: string } | null;
  flair?: string|null;
};

export const CharacterPage: React.FC<{ char: CharacterRecord }> = ({ char }) => {
  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{char.name}</h1>
          <p className="text-sm text-slate-400">{char.style} • {char.wins}-{char.losses}-{char.kills} • Fame {char.fame} • Pop {char.popularity}</p>
        </div>
        <FlairChip flair={char.flair} />
      </div>

      <section className="grid md:grid-cols-3 gap-4">
        <div className="bg-slate-800/60 rounded-xl p-4">
          <h2 className="text-sm font-semibold mb-2">Career Stats</h2>
          <ul className="text-sm text-slate-300 space-y-1">
            <li>Wins: {char.wins}</li>
            <li>Losses: {char.losses}</li>
            <li>Kills: {char.kills}</li>
            <li>Fame: {char.fame}</li>
            <li>Popularity: {char.popularity}</li>
          </ul>
        </div>
        <div className="bg-slate-800/60 rounded-xl p-4">
          <h2 className="text-sm font-semibold mb-2">Injury History</h2>
          <ul className="text-sm text-slate-300 space-y-1">
            {(char.injuries?.length ? char.injuries : []).map((i,idx)=>(<li key={idx}>{i.name} (Week {i.week})</li>))}
            {!(char.injuries?.length) && <li>None</li>}
          </ul>
        </div>
        <div className="bg-slate-800/60 rounded-xl p-4">
          <h2 className="text-sm font-semibold mb-2">Titles</h2>
          <ul className="text-sm text-slate-300 space-y-1">
            {(char.titles?.length ? char.titles : []).map((t,idx)=>(<li key={idx}>{t.name} — {t.season}</li>))}
            {!(char.titles?.length) && <li>None yet</li>}
          </ul>
        </div>
      </section>

      {char.trainerStatus?.isTrainer && (
        <section className="bg-slate-800/60 rounded-xl p-4">
          <h2 className="text-sm font-semibold mb-2">Trainer</h2>
          <p className="text-sm text-slate-300">Specialty: {char.trainerStatus?.specialty || "Generalist"}</p>
        </section>
      )}
    </div>
  );
};
