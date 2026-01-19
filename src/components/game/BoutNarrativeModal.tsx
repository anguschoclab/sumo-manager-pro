// Bout Narrative Modal - Shows dramatic play-by-play
// Per PBP System v2.0: "Bouts are presented as one flowing narrative"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { generateNarrative } from "@/engine/narrative";
import { RANK_HIERARCHY } from "@/engine/banzuke";
import type { Rikishi, BoutResult, BashoName } from "@/engine/types";
import { Trophy } from "lucide-react";
import { RikishiName } from "@/components/ClickableName";

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

  // Identify special lines for styling
  const isExclamation = (line: string) => line.includes("!");
  const isDialogue = (line: string) => line.startsWith('"') || line.includes("—");
  const isClosing = (idx: number) => idx === narrative.length - 1;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl paper">
        <DialogHeader className="space-y-3">
          {isPlayerBout && (
            <Badge variant="default" className="w-fit text-xs">Your Stable</Badge>
          )}
          <div className="flex items-center justify-between">
            {/* East wrestler */}
            <div className={`text-center flex-1 ${result.winner === "east" ? "" : "opacity-60"}`}>
              <div className="text-xs text-east font-medium mb-1">東 East</div>
              <div className="font-display text-xl">
                <RikishiName id={east.id} name={east.shikona} />
              </div>
              <div className="text-xs text-muted-foreground">
                {RANK_HIERARCHY[east.rank]?.nameJa}
                {east.rankNumber && ` ${east.rankNumber}`}
              </div>
              {result.winner === "east" && (
                <Trophy className="h-4 w-4 mx-auto mt-2 text-yellow-500" />
              )}
            </div>

            <div className="text-2xl text-muted-foreground/50 font-display px-4">対</div>

            {/* West wrestler */}
            <div className={`text-center flex-1 ${result.winner === "west" ? "" : "opacity-60"}`}>
              <div className="text-xs text-west font-medium mb-1">西 West</div>
              <div className="font-display text-xl">
                <RikishiName id={west.id} name={west.shikona} />
              </div>
              <div className="text-xs text-muted-foreground">
                {RANK_HIERARCHY[west.rank]?.nameJa}
                {west.rankNumber && ` ${west.rankNumber}`}
              </div>
              {result.winner === "west" && (
                <Trophy className="h-4 w-4 mx-auto mt-2 text-yellow-500" />
              )}
            </div>
          </div>
        </DialogHeader>

        <Separator />

        {/* Narrative - flowing story format */}
        <ScrollArea className="h-[320px]">
          <div className="space-y-2 py-2 pr-4">
            {narrative.map((line, idx) => (
              <p
                key={idx}
                className={`leading-relaxed transition-colors ${
                  isClosing(idx)
                    ? "text-base font-display font-medium text-foreground mt-4 pt-3 border-t border-border/50 italic" 
                    : isExclamation(line)
                    ? "text-[15px] text-foreground font-medium"
                    : "text-[15px] text-muted-foreground"
                }`}
              >
                {line}
              </p>
            ))}
          </div>
        </ScrollArea>

        <Separator />

        {/* Result summary */}
        <div className="flex items-center justify-between text-sm">
          <Badge variant="outline" className="font-display">
            {result.kimariteName}
          </Badge>
          {result.upset && (
            <Badge variant="destructive">
              金星 Upset!
            </Badge>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
