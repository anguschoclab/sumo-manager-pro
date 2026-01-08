// Bout Narrative Modal - Shows dramatic play-by-play
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { generateNarrative } from "@/engine/narrative";
import { RANK_HIERARCHY } from "@/engine/banzuke";
import type { Rikishi, BoutResult, BashoName } from "@/engine/types";
import { Trophy, Swords } from "lucide-react";

interface BoutNarrativeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  east: Rikishi;
  west: Rikishi;
  result: BoutResult;
  bashoName: BashoName;
  day: number;
  isPlayerBout?: boolean;
}

export function BoutNarrativeModal({
  open,
  onOpenChange,
  east,
  west,
  result,
  bashoName,
  day,
  isPlayerBout
}: BoutNarrativeModalProps) {
  const narrative = generateNarrative(east, west, result, bashoName, day);
  const winner = result.winner === "east" ? east : west;
  const loser = result.winner === "east" ? west : east;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl paper">
        <DialogHeader>
          <DialogTitle className="font-display text-xl flex items-center gap-2">
            <Swords className="h-5 w-5" />
            {isPlayerBout && <Badge variant="default" className="text-xs">Your Stable</Badge>}
            Bout Narrative
          </DialogTitle>
        </DialogHeader>

        {/* Matchup Header */}
        <div className="flex items-center justify-between p-4 bg-secondary/30 rounded-lg">
          <div className={`text-center flex-1 ${result.winner === "east" ? "font-bold" : "opacity-70"}`}>
            <div className="text-xs text-east mb-1">東 East</div>
            <div className="font-display text-lg">{east.shikona}</div>
            <div className="text-xs text-muted-foreground">
              {RANK_HIERARCHY[east.rank]?.nameJa}
            </div>
            {result.winner === "east" && (
              <Trophy className="h-4 w-4 mx-auto mt-1 text-yellow-500" />
            )}
          </div>

          <div className="text-2xl text-muted-foreground font-display">vs</div>

          <div className={`text-center flex-1 ${result.winner === "west" ? "font-bold" : "opacity-70"}`}>
            <div className="text-xs text-west mb-1">西 West</div>
            <div className="font-display text-lg">{west.shikona}</div>
            <div className="text-xs text-muted-foreground">
              {RANK_HIERARCHY[west.rank]?.nameJa}
            </div>
            {result.winner === "west" && (
              <Trophy className="h-4 w-4 mx-auto mt-1 text-yellow-500" />
            )}
          </div>
        </div>

        {/* Kimarite Badge */}
        <div className="flex justify-center gap-2">
          <Badge variant="outline" className="text-sm px-3 py-1">
            {result.kimariteName}
          </Badge>
          {result.upset && (
            <Badge variant="destructive" className="text-sm">
              Upset!
            </Badge>
          )}
        </div>

        {/* Narrative */}
        <ScrollArea className="h-[300px] pr-4">
          <div className="space-y-3 py-2">
            {narrative.map((line, idx) => (
              <p
                key={idx}
                className={`text-sm leading-relaxed ${
                  idx === narrative.length - 1 
                    ? "font-semibold text-foreground" 
                    : "text-muted-foreground"
                } ${
                  line.includes("!") ? "text-foreground" : ""
                }`}
              >
                {line}
              </p>
            ))}
          </div>
        </ScrollArea>

        {/* Result Summary */}
        <div className="border-t pt-4 text-center">
          <p className="text-sm text-muted-foreground">
            <span className="font-display font-semibold text-foreground">{winner.shikona}</span>
            {" "}defeats{" "}
            <span className="text-foreground">{loser.shikona}</span>
            {" "}by{" "}
            <span className="font-medium">{result.kimariteName}</span>
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
