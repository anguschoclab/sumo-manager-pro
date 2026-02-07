/* Duelmasters — Sprint 5A delta */
import React from "react";
import { LoreArchive } from "./LoreArchive";

const Row: React.FC<{ title: string; right?: string; children?: React.ReactNode }> = ({ title, right, children }) => (
  <div className="rounded border border-gray-200 p-3 bg-white shadow-sm">
    <div className="flex items-center justify-between">
      <div className="font-semibold">{title}</div>
      {right && <div className="text-xs text-gray-500">{right}</div>}
    </div>
    {children}
  </div>
);

export const HallOfFights: React.FC = () => {
  const hall = LoreArchive.allHall().slice().reverse();
  const fights = new Map(LoreArchive.allFights().map(f => [f.id, f]));
  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Hall of Fights</h1>
      <p className="text-sm text-gray-600 mb-6">Crowd-remembered epics of the arena.</p>
      <div className="space-y-3">
        {hall.map(h => {
          const f = fights.get(h.fightId);
          if (!f) return null;
          const title = f.title || `${f.a} vs. ${f.d}`;
          const by = f.by ? ` (${f.by})` : "";
          return (
            <Row key={h.fightId} title={`${h.label} — Week ${h.week}`} right={new Date(f.createdAt).toLocaleString()}>
              <div className="mt-1 text-sm">{title}{by}</div>
              {f.flashyTags && f.flashyTags.length>0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {f.flashyTags.map(t => <span key={t} className="text-[10px] px-2 py-0.5 rounded bg-gray-100 text-gray-700 border border-gray-200">{t}</span>)}
                </div>
              )}
            </Row>
          );
        })}
      </div>
    </div>
  );
};

export default HallOfFights;
