// Bout Log display - shows simulation phases

import { cn } from "@/lib/utils";
import type { BoutLogEntry } from "@/engine/types";

interface BoutLogProps {
  log: BoutLogEntry[];
  className?: string;
}

const phaseLabels: Record<string, string> = {
  tachiai: "Tachiai",
  clinch: "Clinch",
  momentum: "Struggle",
  finish: "Finish",
};

const phaseColors: Record<string, string> = {
  tachiai: "phase-tachiai",
  clinch: "phase-clinch", 
  momentum: "phase-momentum",
  finish: "phase-finish",
};

export function BoutLog({ log, className }: BoutLogProps) {
  return (
    <div className={cn("space-y-2", className)}>
      <h4 className="font-display text-sm font-semibold text-muted-foreground uppercase tracking-wide">
        Bout Log
      </h4>
      
      <div className="space-y-1.5">
        {log.map((entry, index) => (
          <div 
            key={index}
            className="flex items-start gap-2 text-sm animate-slide-up"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <span 
              className={cn(
                "px-2 py-0.5 rounded text-xs font-medium shrink-0",
                phaseColors[entry.phase]
              )}
            >
              {phaseLabels[entry.phase]}
            </span>
            <span className="text-foreground">
              {entry.description}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
