import * as React from 'react';
import { loadOwners } from '../../state/save.owners';
import { rankOwners } from '../../modules/owners';
import { FameChip } from '../Chips/FameChip';
import { RenownChip } from '../Chips/RenownChip';
import { PersonalityBadge } from '../Badges/PersonalityBadge';

export default function HallOfOwnersPage() {
  const [owners, setOwners] = React.useState(loadOwners());
  React.useEffect(() => {
    setOwners(loadOwners());
  }, []);

  const ranks = rankOwners(owners);

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight">Hall of Owners</h1>
      <p className="text-sm text-zinc-400">Ranking owners by Fame, Renown, and Titles.</p>
      <div className="overflow-x-auto rounded-xl border border-zinc-800">
        <table className="min-w-full text-sm">
          <thead className="bg-zinc-900/70">
            <tr>
              <th className="text-left px-3 py-2">Rank</th>
              <th className="text-left px-3 py-2">Owner</th>
              <th className="text-left px-3 py-2">Stable</th>
              <th className="text-left px-3 py-2">Badges</th>
              <th className="text-left px-3 py-2">Fame</th>
              <th className="text-left px-3 py-2">Renown</th>
              <th className="text-left px-3 py-2">Titles</th>
              <th className="text-left px-3 py-2">Score</th>
            </tr>
          </thead>
          <tbody>
            {ranks.map(r => {
              const o = owners.find(x => x.id === r.id)!;
              return (
                <tr key={r.id} className="border-t border-zinc-800 hover:bg-zinc-900/40">
                  <td className="px-3 py-2 font-medium">{r.rank}</td>
                  <td className="px-3 py-2">{o.name}</td>
                  <td className="px-3 py-2">{o.stableName}</td>
                  <td className="px-3 py-2"><PersonalityBadge personality={o.personality} /></td>
                  <td className="px-3 py-2"><FameChip value={o.fame || 0} /></td>
                  <td className="px-3 py-2"><RenownChip value={o.renown || 0} /></td>
                  <td className="px-3 py-2">{o.titles || 0}</td>
                  <td className="px-3 py-2">{Math.round(r.score)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}