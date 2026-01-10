// Banzuke Page - Rankings display with clickable rikishi and fog of war
import { Helmet } from "react-helmet";
import { useNavigate } from "react-router-dom";
import { useGame } from "@/contexts/GameContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RANK_HIERARCHY } from "@/engine/banzuke";
import { RANK_NAMES, SIDE_NAMES, createScoutedView, describeScoutingLevel } from "@/engine/scouting";
import { Star, Search } from "lucide-react";
import type { Rank, Rikishi } from "@/engine/types";

const DISPLAY_RANKS: Rank[] = ["yokozuna", "ozeki", "sekiwake", "komusubi", "maegashira", "juryo"];

export default function BanzukePage() {
  const navigate = useNavigate();
  const { state, selectRikishi } = useGame();
  const { world, playerHeyaId } = state;

  if (!world) return null;

  const rikishiByRank = new Map<Rank, Rikishi[]>();
  const rikishiList = Array.from(world.rikishi.values());

  // Get player's rikishi IDs for highlighting
  const playerRikishiIds = new Set(
    world.heyas.get(playerHeyaId || "")?.rikishiIds || []
  );

  for (const rank of DISPLAY_RANKS) {
    const wrestlers = rikishiList
      .filter(r => r.rank === rank)
      .sort((a, b) => {
        if (a.side !== b.side) return a.side === "east" ? -1 : 1;
        return (a.rankNumber || 0) - (b.rankNumber || 0);
      });
    rikishiByRank.set(rank, wrestlers);
  }

  const handleRikishiClick = (rikishiId: string) => {
    selectRikishi(rikishiId);
    navigate(`/rikishi/${rikishiId}`);
  };

  const getScoutingBadge = (rikishi: Rikishi) => {
    const isOwned = playerRikishiIds.has(rikishi.id);
    const scouted = createScoutedView(rikishi, playerHeyaId, isOwned ? 100 : 5);
    const info = describeScoutingLevel(scouted.scoutingLevel);
    
    if (isOwned) {
      return <Badge variant="secondary" className="text-xs">Your Stable</Badge>;
    }
    
    return (
      <span className={`flex items-center gap-1 text-xs ${info.color}`} title={info.description}>
        <Search className="h-3 w-3" />
        {Math.round(scouted.scoutingLevel)}%
      </span>
    );
  };

  return (
    <>
      <Helmet><title>番付 Banzuke (Rankings) - Stable Lords</title></Helmet>
      <div className="p-6 max-w-5xl mx-auto space-y-6">
        <div>
          <h1 className="font-display text-3xl font-bold">番付 Banzuke</h1>
          <p className="text-muted-foreground">Official Rankings</p>
        </div>
        
        {DISPLAY_RANKS.map(rank => {
          const wrestlers = rikishiByRank.get(rank) || [];
          if (wrestlers.length === 0) return null;
          const info = RANK_HIERARCHY[rank];
          const rankNames = RANK_NAMES[rank];
          
          return (
            <Card key={rank} className="paper">
              <CardHeader className="pb-2">
                <CardTitle className="font-display flex items-center gap-2">
                  {rankNames.ja}
                  <span className="text-muted-foreground font-normal text-base">
                    {rankNames.en}
                  </span>
                  <Badge variant="outline" className="ml-auto">{wrestlers.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  {/* East Side */}
                  <div className="space-y-2">
                    <div className="text-xs text-muted-foreground font-medium">
                      {SIDE_NAMES.east.ja} {SIDE_NAMES.east.en}
                    </div>
                    {wrestlers.filter(r => r.side === "east").map(r => {
                      const isPlayer = playerRikishiIds.has(r.id);
                      return (
                        <div 
                          key={r.id} 
                          onClick={() => handleRikishiClick(r.id)}
                          className={`flex items-center gap-2 p-3 rounded cursor-pointer transition-all hover:bg-secondary/50 ${
                            isPlayer 
                              ? "bg-primary/10 ring-1 ring-primary/30" 
                              : "bg-secondary/30"
                          }`}
                        >
                          {isPlayer && <Star className="h-4 w-4 text-primary shrink-0" fill="currentColor" />}
                          <div className="flex-1 min-w-0">
                            <span className="font-display block truncate">{r.shikona}</span>
                            {r.rankNumber && (
                              <span className="text-xs text-muted-foreground">
                                #{r.rankNumber}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            {getScoutingBadge(r)}
                            <span className="text-xs text-muted-foreground font-mono">
                              {r.careerWins}-{r.careerLosses}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  {/* West Side */}
                  <div className="space-y-2">
                    <div className="text-xs text-muted-foreground font-medium">
                      {SIDE_NAMES.west.ja} {SIDE_NAMES.west.en}
                    </div>
                    {wrestlers.filter(r => r.side === "west").map(r => {
                      const isPlayer = playerRikishiIds.has(r.id);
                      return (
                        <div 
                          key={r.id} 
                          onClick={() => handleRikishiClick(r.id)}
                          className={`flex items-center gap-2 p-3 rounded cursor-pointer transition-all hover:bg-secondary/50 ${
                            isPlayer 
                              ? "bg-primary/10 ring-1 ring-primary/30" 
                              : "bg-secondary/30"
                          }`}
                        >
                          {isPlayer && <Star className="h-4 w-4 text-primary shrink-0" fill="currentColor" />}
                          <div className="flex-1 min-w-0">
                            <span className="font-display block truncate">{r.shikona}</span>
                            {r.rankNumber && (
                              <span className="text-xs text-muted-foreground">
                                #{r.rankNumber}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            {getScoutingBadge(r)}
                            <span className="text-xs text-muted-foreground font-mono">
                              {r.careerWins}-{r.careerLosses}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}

        {/* Legend */}
        <Card className="paper">
          <CardContent className="pt-4">
            <div className="flex flex-wrap gap-6 text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <Star className="h-3.5 w-3.5 text-primary" fill="currentColor" />
                <span>Your stable (100% intel)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Search className="h-3.5 w-3.5 text-success" />
                <span>70%+ Well scouted</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Search className="h-3.5 w-3.5 text-warning" />
                <span>40-69% Moderate intel</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Search className="h-3.5 w-3.5 text-muted-foreground" />
                <span>&lt;40% Limited data</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
