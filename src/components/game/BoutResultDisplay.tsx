// Bout Result display - shows outcome with kimarite

import { cn } from "@/lib/utils";
import type { BoutResult } from "@/engine/types";
import type { Rikishi } from "@/engine/types";
import { Badge } from "@/components/ui/badge";
import { getKimarite } from "@/engine/kimarite";

interface BoutResultDisplayProps {
  result: BoutResult;
  eastRikishi: Rikishi;
  westRikishi: Rikishi;
  className?: string;
}

export function BoutResultDisplay({ 
  result, 
  eastRikishi, 
  westRikishi,
  className 
}: BoutResultDisplayProps) {
  const winner = result.winner === "east" ? eastRikishi : westRikishi;
  const loser = result.winner === "east" ? westRikishi : eastRikishi;
  const kimariteDetails = getKimarite(result.kimarite);

  return (
    <div className={cn("paper p-6 text-center", className)}>
      {/* Winner announcement */}
      <div className="mb-4">
        {result.upset && (
          <Badge variant="destructive" className="mb-2 animate-scale-in">
            🎊 UPSET!
          </Badge>
        )}
        
        <h2 className="font-display text-3xl font-bold text-foreground mb-1 animate-fade-in">
          {winner.shikona}
        </h2>
        
        <p className="text-muted-foreground">
          defeats <span className="font-medium">{loser.shikona}</span>
        </p>
      </div>

      {/* Kimarite */}
      <div className="bg-secondary/50 rounded-lg p-4 mb-4">
        <p className="text-sm text-muted-foreground uppercase tracking-wide mb-1">
          Winning Technique
        </p>
        <p className="font-display text-2xl font-semibold text-foreground">
          {result.kimariteName}
        </p>
        {kimariteDetails?.nameJa && (
          <p className="text-lg text-muted-foreground">
            {kimariteDetails.nameJa}
          </p>
        )}
        {kimariteDetails?.description && (
          <p className="text-sm text-muted-foreground mt-2">
            {kimariteDetails.description}
          </p>
        )}
        {kimariteDetails && (
          <Badge 
            variant="outline" 
            className={cn(
              "mt-2",
              kimariteDetails.rarity === "legendary" && "border-gold text-gold",
              kimariteDetails.rarity === "rare" && "border-accent text-accent",
              kimariteDetails.rarity === "uncommon" && "border-primary text-primary"
            )}
          >
            {kimariteDetails.rarity}
          </Badge>
        )}
      </div>

      {/* Match details */}
      <div className="grid grid-cols-3 gap-4 text-sm">
        <div>
          <p className="text-muted-foreground">Tachiai</p>
          <p className={cn(
            "font-medium",
            result.tachiaiWinner === "east" ? "text-east" : "text-west"
          )}>
            {result.tachiaiWinner === "east" ? eastRikishi.shikona : westRikishi.shikona}
          </p>
        </div>
        <div>
          <p className="text-muted-foreground">Stance</p>
          <p className="font-medium text-foreground capitalize">
            {result.stance.replace("-", " ")}
          </p>
        </div>
        <div>
          <p className="text-muted-foreground">Duration</p>
          <p className="font-medium text-foreground">
            {result.duration} ticks
          </p>
        </div>
      </div>
    </div>
  );
}
