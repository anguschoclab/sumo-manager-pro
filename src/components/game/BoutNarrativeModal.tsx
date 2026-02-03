// Bout Narrative Modal - Shows dramatic play-by-play
// Per PBP System v2.0: "Bouts are presented as one flowing narrative"
// Now enhanced with pbp.ts buildPbpFromBoutResult for richer commentary
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { generateNarrative } from "@/engine/narrative";
import { buildPbpFromBoutResult, type PbpLine } from "@/engine/pbp";
import { RANK_HIERARCHY } from "@/engine/banzuke";
import type { Rikishi, BoutResult, BashoName } from "@/engine/types";
import { Trophy, Mic2 } from "lucide-react";
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
  // Generate rich narrative using narrative.ts
  const narrative = generateNarrative(east, west, result, bashoName, day);
  const winner = result.winner === "east" ? east : west;

  // Generate PBP commentary for additional color
  const pbpLines: PbpLine[] = buildPbpFromBoutResult(result, {
    seed: `${bashoName}-${day}-${east.id}-${west.id}`,
    day,
    bashoName,
    east: {
      id: east.id,
      shikona: east.shikona,
      style: east.style,
      archetype: east.archetype,
      rankLabel: RANK_HIERARCHY[east.rank]?.nameJa || east.rank,
    },
    west: {
      id: west.id,
      shikona: west.shikona,
      style: west.style,
      archetype: west.archetype,
      rankLabel: RANK_HIERARCHY[west.rank]?.nameJa || west.rank,
    },
    isKinboshiBout: result.upset && RANK_HIERARCHY[east.rank]?.tier === 1 || RANK_HIERARCHY[west.rank]?.tier === 1,
  });

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

          {/* PBP Commentary Section */}
          {pbpLines.length > 0 && (
            <div className="mt-4 pt-4 border-t border-border/50">
              <div className="flex items-center gap-2 mb-3">
                <Mic2 className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Play-by-Play
                </span>
              </div>
              <div className="space-y-2">
                {pbpLines.map((line, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    <Badge variant="outline" className="text-[10px] shrink-0 capitalize">
                      {line.phase}
                    </Badge>
                    <p className={`text-sm ${
                      line.tags?.includes("crowd_roar") || line.tags?.includes("upset")
                        ? "text-foreground font-medium"
                        : "text-muted-foreground"
                    }`}>
                      {line.text}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
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
