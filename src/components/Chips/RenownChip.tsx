import * as React from 'react';

function tone(r: number) {
  if (r >= 60) return 'bg-amber-600 text-white';
  if (r >= 30) return 'bg-amber-500/80 text-white';
  if (r >= 10) return 'bg-amber-400/70 text-white';
  return 'bg-zinc-600/60 text-white';
}

export function RenownChip({ value }: { value: number }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 text-xs rounded-full ${tone(value)}`}>
      Renown {Math.round(value)}
    </span>
  );
}