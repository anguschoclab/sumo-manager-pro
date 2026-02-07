import * as React from 'react';

type P = { personality?: 'Aggressive' | 'Methodical' | 'Showman' | 'Pragmatic' | 'Tactician' };

const tone: Record<NonNullable<P['personality']>, string> = {
  Aggressive: 'bg-red-600 text-white',
  Methodical: 'bg-blue-600 text-white',
  Showman: 'bg-pink-600 text-white',
  Pragmatic: 'bg-green-600 text-white',
  Tactician: 'bg-indigo-600 text-white',
};

export function PersonalityBadge({ personality }: P) {
  if (!personality) return null;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 text-xs rounded-md ${tone[personality]}`}>
      {personality}
    </span>
  );
}