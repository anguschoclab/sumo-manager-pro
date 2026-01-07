// Banzuke Page - Rankings display
import { Helmet } from "react-helmet";
import { useGame } from "@/contexts/GameContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RANK_HIERARCHY } from "@/engine/banzuke";
import type { Rank } from "@/engine/types";

const DISPLAY_RANKS: Rank[] = ["yokozuna", "ozeki", "sekiwake", "komusubi", "maegashira", "juryo"];

export default function BanzukePage() {
  const { state } = useGame();
  const { world } = state;

  if (!world) return null;

  const rikishiByRank = new Map<Rank, typeof rikishiList>();
  const rikishiList = Array.from(world.rikishi.values());

  for (const rank of DISPLAY_RANKS) {
    const wrestlers = rikishiList
      .filter(r => r.rank === rank)
      .sort((a, b) => {
        if (a.side !== b.side) return a.side === "east" ? -1 : 1;
        return (a.rankNumber || 0) - (b.rankNumber || 0);
      });
    rikishiByRank.set(rank, wrestlers);
  }

  return (
    <>
      <Helmet><title>Banzuke - Stable Lords</title></Helmet>
      <div className="p-6 max-w-5xl mx-auto space-y-6">
        <h1 className="font-display text-3xl font-bold">番付 Banzuke</h1>
        
        {DISPLAY_RANKS.map(rank => {
          const wrestlers = rikishiByRank.get(rank) || [];
          if (wrestlers.length === 0) return null;
          const info = RANK_HIERARCHY[rank];
          
          return (
            <Card key={rank} className="paper">
              <CardHeader className="pb-2">
                <CardTitle className="font-display flex items-center gap-2">
                  {info.nameJa}
                  <Badge variant="outline">{wrestlers.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  {/* East */}
                  <div className="space-y-2">
                    <div className="text-xs text-muted-foreground font-medium text-east">東 East</div>
                    {wrestlers.filter(r => r.side === "east").map(r => (
                      <div key={r.id} className="flex items-center gap-2 p-2 rounded bg-secondary/30 side-east">
                        <span className="font-display flex-1">{r.shikona}</span>
                        <span className="text-xs text-muted-foreground">{r.careerWins}-{r.careerLosses}</span>
                      </div>
                    ))}
                  </div>
                  {/* West */}
                  <div className="space-y-2">
                    <div className="text-xs text-muted-foreground font-medium text-west">西 West</div>
                    {wrestlers.filter(r => r.side === "west").map(r => (
                      <div key={r.id} className="flex items-center gap-2 p-2 rounded bg-secondary/30 side-west">
                        <span className="font-display flex-1">{r.shikona}</span>
                        <span className="text-xs text-muted-foreground">{r.careerWins}-{r.careerLosses}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </>
  );
}
