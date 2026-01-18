// Banzuke Page - Rankings display with clickable rikishi and fog of war

import { Helmet } from "react-helmet";
import { useNavigate } from "react-router-dom";
import { useGame } from "@/contexts/GameContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RANK_HIERARCHY } from "@/engine/banzuke";
import { Star, Search } from "lucide-react";
import type { Rank, Rikishi, Side } from "@/engine/types";

// Optional scouting imports (graceful fallback if your scouting module changes)
let RANK_NAMES: any = null;
let SIDE_NAMES: any = null;
let createScoutedView: any = null;
let describeScoutingLevel: any = null;

try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const scouting = require("@/engine/scouting");
  RANK_NAMES = scouting.RANK_NAMES;
  SIDE_NAMES = scouting.SIDE_NAMES;
  createScoutedView = scouting.createScoutedView;
  describeScoutingLevel = scouting.describeScoutingLevel;
} catch {
  // No-op: fallbacks below will be used.
}

const DISPLAY_RANKS: Rank[] = ["yokozuna", "ozeki", "sekiwake", "komusubi", "maegashira", "juryo"];

const FALLBACK_RANK_LABELS: Record<Rank, { ja: string; en: string }> = {
  yokozuna: { ja: "横綱", en: "Yokozuna" },
  ozeki: { ja: "大関", en: "Ōzeki" },
  sekiwake: { ja: "関脇", en: "Sekiwake" },
  komusubi: { ja: "小結", en: "Komusubi" },
  maegashira: { ja: "前頭", en: "Maegashira" },
  juryo: { ja: "十両", en: "Jūryō" },
  makushita: { ja: "幕下", en: "Makushita" },
  sandanme: { ja: "三段目", en: "Sandanme" },
  jonidan: { ja: "序二段", en: "Jonidan" },
  jonokuchi: { ja: "序ノ口", en: "Jonokuchi" }
};

const FALLBACK_SIDE_LABELS: Record<Side, { ja: string; en: string }> = {
  east: { ja: "東", en: "East" },
  west: { ja: "西", en: "West" }
};

function getRankNames(rank: Rank): { ja: string; en: string } {
  if (RANK_NAMES && RANK_NAMES[rank]) return RANK_NAMES[rank];
  return FALLBACK_RANK_LABELS[rank];
}

function getSideNames(side: Side): { ja: string; en: string } {
  if (SIDE_NAMES && SIDE_NAMES[side]) return SIDE_NAMES[side];
  return FALLBACK_SIDE_LABELS[side];
}

function safeScoutBadge(args: { rikishi: Rikishi; playerHeyaId?: string; isOwned: boolean }) {
  if (args.isOwned) {
    return (
      <Badge variant="secondary" className="text-xs">
        Your Stable
      </Badge>
    );
  }

  // If scouting helpers exist, use them
  if (typeof createScoutedView === "function" && typeof describeScoutingLevel === "function") {
    const scouted = createScoutedView(args.rikishi, args.playerHeyaId, 5);
    const info = describeScoutingLevel(scouted.scoutingLevel);
    return (
      <span className={`flex items-center gap-1 text-xs ${info.color}`} title={info.description}>
        <Search className="h-3 w-3" />
        {Math.round(scouted.scoutingLevel)}%
      </span>
    );
  }

  // Fallback: always show “Limited” (or omit entirely if you prefer)
  return (
    <span className="flex items-center gap-1 text-xs text-muted-foreground" title="Limited intel">
      <Search className="h-3 w-3" />
      ?
    </span>
  );
}

export default function BanzukePage() {
  const navigate = useNavigate();
  const { state, selectRikishi } = useGame();
  const { world, playerHeyaId } = state;

  if (!world) return null;

  const rikishiList = Array.from(world.rikishi.values());

  const playerRikishiIds = new Set<string>(
    playerHeyaId ? world.heyas.get(playerHeyaId)?.rikishiIds ?? [] : []
  );

  const rikishiByRank = new Map<Rank, Rikishi[]>();

  for (const rank of DISPLAY_RANKS) {
    const wrestlers = rikishiList
      .filter((r) => r.rank === rank)
      .sort((a, b) => {
        // Primary sort: rankNumber (numbered ranks only)
        const an = typeof a.rankNumber === "number" ? a.rankNumber : 0;
        const bn = typeof b.rankNumber === "number" ? b.rankNumber : 0;
        if (an !== bn) return an - bn;

        // Secondary sort: east before west
        if (a.side !== b.side) return a.side === "east" ? -1 : 1;

        // Tertiary stable sort: shikona
        return a.shikona.localeCompare(b.shikona);
      });

    rikishiByRank.set(rank, wrestlers);
  }

  const handleRikishiClick = (rikishiId: string) => {
    if (typeof selectRikishi === "function") selectRikishi(rikishiId);
    navigate(`/rikishi/${rikishiId}`);
  };

  return (
    <>
      <Helmet>
        <title>番付 Banzuke (Rankings) - Basho</title>
      </Helmet>

      <div className="p-6 max-w-5xl mx-auto space-y-6">
        <div>
          <h1 className="font-display text-3xl font-bold">番付 Banzuke</h1>
          <p className="text-muted-foreground">Official Rankings</p>
        </div>

        {DISPLAY_RANKS.map((rank) => {
          const wrestlers = rikishiByRank.get(rank) || [];
          if (wrestlers.length === 0) return null;

          const info = RANK_HIERARCHY[rank];
          const rankNames = getRankNames(rank);

          const eastLabel = getSideNames("east");
          const westLabel = getSideNames("west");

          return (
            <Card key={rank} className="paper">
              <CardHeader className="pb-2">
                <CardTitle className="font-display flex items-center gap-2">
                  {rankNames.ja}
                  <span className="text-muted-foreground font-normal text-base">{rankNames.en}</span>
                  <Badge variant="outline" className="ml-auto">
                    {wrestlers.length}
                  </Badge>
                </CardTitle>
                {/* (Optional) rank meta */}
                <div className="text-xs text-muted-foreground">
                  {info?.division ? `Division: ${info.division}` : null}
                </div>
              </CardHeader>

              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  {/* East Side */}
                  <div className="space-y-2">
                    <div className="text-xs text-muted-foreground font-medium">
                      {eastLabel.ja} {eastLabel.en}
                    </div>

                    {wrestlers
                      .filter((r) => r.side === "east")
                      .map((r) => {
                        const isPlayer = playerRikishiIds.has(r.id);
                        return (
                          <div
                            key={r.id}
                            onClick={() => handleRikishiClick(r.id)}
                            className={`flex items-center gap-2 p-3 rounded cursor-pointer transition-all hover:bg-secondary/50 ${
                              isPlayer ? "bg-primary/10 ring-1 ring-primary/30" : "bg-secondary/30"
                            }`}
                          >
                            {isPlayer && <Star className="h-4 w-4 text-primary shrink-0" fill="currentColor" />}

                            <div className="flex-1 min-w-0">
                              <span className="font-display block truncate">{r.shikona}</span>
                              {typeof r.rankNumber === "number" && r.rankNumber > 0 && (
                                <span className="text-xs text-muted-foreground">#{r.rankNumber}</span>
                              )}
                            </div>

                            <div className="flex items-center gap-2">
                              {safeScoutBadge({ rikishi: r, playerHeyaId, isOwned: isPlayer })}
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
                      {westLabel.ja} {westLabel.en}
                    </div>

                    {wrestlers
                      .filter((r) => r.side === "west")
                      .map((r) => {
                        const isPlayer = playerRikishiIds.has(r.id);
                        return (
                          <div
                            key={r.id}
                            onClick={() => handleRikishiClick(r.id)}
                            className={`flex items-center gap-2 p-3 rounded cursor-pointer transition-all hover:bg-secondary/50 ${
                              isPlayer ? "bg-primary/10 ring-1 ring-primary/30" : "bg-secondary/30"
                            }`}
                          >
                            {isPlayer && <Star className="h-4 w-4 text-primary shrink-0" fill="currentColor" />}

                            <div className="flex-1 min-w-0">
                              <span className="font-display block truncate">{r.shikona}</span>
                              {typeof r.rankNumber === "number" && r.rankNumber > 0 && (
                                <span className="text-xs text-muted-foreground">#{r.rankNumber}</span>
                              )}
                            </div>

                            <div className="flex items-center gap-2">
                              {safeScoutBadge({ rikishi: r, playerHeyaId, isOwned: isPlayer })}
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
                <span>40–69% Moderate intel</span>
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
