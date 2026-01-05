// Rikishi card component - displays wrestler info

import { cn } from "@/lib/utils";
import type { Rikishi } from "@/engine/types";
import { Badge } from "@/components/ui/badge";

interface RikishiCardProps {
  rikishi: Rikishi;
  side?: "east" | "west";
  isWinner?: boolean;
  compact?: boolean;
  className?: string;
}

const rankLabels: Record<string, string> = {
  yokozuna: "横綱",
  ozeki: "大関",
  sekiwake: "関脇",
  komusubi: "小結",
  maegashira: "前頭",
  juryo: "十両",
};

const styleLabels: Record<string, string> = {
  oshi: "Pusher",
  yotsu: "Grappler",
  hybrid: "Technical",
};

export function RikishiCard({ 
  rikishi, 
  side, 
  isWinner,
  compact = false,
  className 
}: RikishiCardProps) {
  const rankLabel = rankLabels[rikishi.rank] || rikishi.rank;
  const rankWithNumber = rikishi.rankNumber 
    ? `${rankLabel} ${rikishi.rankNumber}` 
    : rankLabel;

  return (
    <div 
      className={cn(
        "paper p-4 transition-all duration-200",
        side === "east" && "side-east",
        side === "west" && "side-west",
        isWinner && "ring-2 ring-gold",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div>
          <h3 className="font-display text-xl font-semibold text-foreground">
            {rikishi.shikona}
          </h3>
          {!compact && rikishi.realName && (
            <p className="text-sm text-muted-foreground">{rikishi.realName}</p>
          )}
        </div>
        
        <Badge 
          variant="secondary"
          className={cn(
            "font-display text-xs",
            rikishi.rank === "yokozuna" && "rank-yokozuna text-foreground",
            rikishi.rank === "ozeki" && "rank-ozeki text-foreground",
            (rikishi.rank === "sekiwake" || rikishi.rank === "komusubi") && "rank-sekiwake text-foreground"
          )}
        >
          {rankWithNumber}
        </Badge>
      </div>

      {!compact && (
        <>
          {/* Physical stats */}
          <div className="flex gap-4 mb-3 text-sm text-muted-foreground">
            <span>{rikishi.height}cm</span>
            <span>{rikishi.weight}kg</span>
            <span>{rikishi.nationality}</span>
          </div>

          {/* Style */}
          <div className="flex items-center gap-2 mb-3">
            <Badge variant="outline" className="text-xs">
              {styleLabels[rikishi.style]}
            </Badge>
            {rikishi.momentum !== 0 && (
              <Badge 
                variant={rikishi.momentum > 0 ? "default" : "destructive"}
                className="text-xs"
              >
                {rikishi.momentum > 0 ? "+" : ""}{rikishi.momentum} Form
              </Badge>
            )}
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-3 gap-2 text-xs">
            <StatBar label="PWR" value={rikishi.power} />
            <StatBar label="SPD" value={rikishi.speed} />
            <StatBar label="BAL" value={rikishi.balance} />
            <StatBar label="TEC" value={rikishi.technique} />
            <StatBar label="AGG" value={rikishi.aggression} />
            <StatBar label="EXP" value={rikishi.experience} />
          </div>
        </>
      )}

      {compact && (
        <div className="flex gap-2 text-xs text-muted-foreground">
          <span>{styleLabels[rikishi.style]}</span>
          <span>•</span>
          <span>{rikishi.weight}kg</span>
        </div>
      )}
    </div>
  );
}

function StatBar({ label, value }: { label: string; value: number }) {
  const percentage = Math.min(100, Math.max(0, value));
  
  return (
    <div className="space-y-1">
      <div className="flex justify-between">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium text-foreground">{value}</span>
      </div>
      <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
        <div 
          className={cn(
            "h-full rounded-full transition-all duration-300",
            value >= 90 && "bg-gold",
            value >= 75 && value < 90 && "bg-primary",
            value >= 50 && value < 75 && "bg-muted-foreground",
            value < 50 && "bg-destructive"
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
