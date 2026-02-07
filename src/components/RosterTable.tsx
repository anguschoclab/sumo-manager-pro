import * as React from "react";
import { FlairChip } from "./ResultChips";
import { Link } from "react-router-dom";

type Row = {
  id: string;
  name: string;
  style: string;
  fame: number;
  popularity: number;
  wins: number; losses: number; kills: number;
  flair?: string|null;
};

export const RosterTable: React.FC<{ rows: Row[] }> = ({ rows }) => {
  return (
    <div className="overflow-auto rounded-xl ring-1 ring-slate-700/50">
      <table className="min-w-full text-sm">
        <thead className="bg-slate-800/60 sticky top-0">
          <tr className="text-left">
            <th className="px-3 py-2">Warrior</th>
            <th className="px-3 py-2">Style</th>
            <th className="px-3 py-2">Record</th>
            <th className="px-3 py-2">Fame</th>
            <th className="px-3 py-2">Popularity</th>
            <th className="px-3 py-2">Flair</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(r => (
            <tr key={r.id} className="border-t border-slate-700/40 hover:bg-slate-800/40">
              <td className="px-3 py-2">
                <Link to={"/character/"+r.id} className="text-sky-300 hover:underline">{r.name}</Link>
              </td>
              <td className="px-3 py-2">{r.style}</td>
              <td className="px-3 py-2">{r.wins}-{r.losses}-{r.kills}</td>
              <td className="px-3 py-2"><span className={"px-2 py-1 rounded-md text-xs " + fameCls(r.fame)}>{r.fame}</span></td>
              <td className="px-3 py-2"><span className={"px-2 py-1 rounded-md text-xs " + popCls(r.popularity)}>{r.popularity}</span></td>
              <td className="px-3 py-2"><FlairChip flair={r.flair} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

function fameCls(v:number) {
  if (v >= 20) return "bg-amber-600/30 text-amber-200 ring-1 ring-amber-500/20";
  if (v >= 10) return "bg-emerald-600/30 text-emerald-200 ring-1 ring-emerald-500/20";
  return "bg-slate-600/30 text-slate-200 ring-1 ring-slate-500/20";
}
function popCls(v:number) {
  if (v >= 20) return "bg-pink-600/30 text-pink-200 ring-1 ring-pink-500/20";
  if (v >= 10) return "bg-sky-600/30 text-sky-200 ring-1 ring-sky-500/20";
  return "bg-slate-600/30 text-slate-200 ring-1 ring-slate-500/20";
}
