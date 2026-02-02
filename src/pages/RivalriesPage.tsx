// Rivalries Page - Display rivalries between rikishi with narrative descriptions
// Per Rivalries System v1.0: heat bands, tone descriptions, head-to-head records

import { Helmet } from "react-helmet";
import { useMemo } from "react";
import { useGame } from "@/contexts/GameContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { RikishiName, StableName } from "@/components/ClickableName";
import { Flame, Swords, Users, Trophy, TrendingUp } from "lucide-react";
import {
  type RivalryPairState,
  type RivalryHeatBand,
  type RivalryTone,
  type RivalryTrigger,
  createDefaultRivalriesState,
} from "@/engine/rivalries";

// Heat band display configuration
const HEAT_BAND_CONFIG: Record<
  RivalryHeatBand,
  { label: string; color: string; bgColor: string; description: string }
> = {
  inferno: {
    label: "Inferno",
    color: "text-red-400",
    bgColor: "bg-red-500/20 border-red-500/30",
    description: "Blood feud - every bout is a war"
  },
  hot: {
    label: "Hot",
    color: "text-orange-400",
    bgColor: "bg-orange-500/20 border-orange-500/30",
    description: "Active rivalry with real stakes"
  },
  warm: {
    label: "Warm",
    color: "text-yellow-400",
    bgColor: "bg-yellow-500/20 border-yellow-500/30",
    description: "Developing tension and interest"
  },
  cold: {
    label: "Cold",
    color: "text-muted-foreground",
    bgColor: "bg-secondary/50",
    description: "Dormant or historical rivalry"
  }
};

// Tone narrative descriptions
const TONE_DESCRIPTIONS: Record<RivalryTone, { label: string; description: string; icon: typeof Swords }> = {
  respect: {
    label: "Mutual Respect",
    description: "A rivalry built on mutual admiration and competitive spirit",
    icon: Trophy
  },
  grudge: {
    label: "Grudge",
    description: "Bad blood simmers beneath the surface",
    icon: Flame
  },
  bad_blood: {
    label: "Bad Blood",
    description: "Open hostility between these two",
    icon: Swords
  },
  mentor_student: {
    label: "Mentor vs Student",
    description: "A passing of the torch - student seeks to surpass master",
    icon: Users
  },
  unstable: {
    label: "Unstable",
    description: "Unpredictable clashes with volatile outcomes",
    icon: TrendingUp
  },
  public_hype: {
    label: "Fan Favorite",
    description: "The crowd loves this matchup",
    icon: Users
  }
};

// Trigger descriptions
const TRIGGER_LABELS: Record<RivalryTrigger, string> = {
  repeat_matches: "Frequent meetings",
  close_finish: "Close finishes",
  upset: "Upsets",
  kinboshi: "Gold star victories",
  title_stakes: "Title implications",
  injury_incident: "Injury incident",
  personal_history: "Personal history",
  heya_feud: "Stable rivalry"
};

function getHeatBand(heat: number): RivalryHeatBand {
  if (heat >= 80) return "inferno";
  if (heat >= 55) return "hot";
  if (heat >= 30) return "warm";
  return "cold";
}

interface RivalryCardProps {
  pair: RivalryPairState;
  world: NonNullable<ReturnType<typeof useGame>["state"]["world"]>;
  isPlayerRivalry?: boolean;
}

function RivalryCard({ pair, world, isPlayerRivalry }: RivalryCardProps) {
  const rikishiA = world.rikishi.get(pair.aId);
  const rikishiB = world.rikishi.get(pair.bId);
  
  if (!rikishiA || !rikishiB) return null;

  const heyaA = world.heyas.get(rikishiA.heyaId);
  const heyaB = world.heyas.get(rikishiB.heyaId);

  const heatBand = getHeatBand(pair.heat);
  const heatConfig = HEAT_BAND_CONFIG[heatBand];
  const toneInfo = TONE_DESCRIPTIONS[pair.tone];
  const ToneIcon = toneInfo.icon;

  // Get top triggers
  const topTriggers = Object.entries(pair.triggers)
    .sort((a, b) => (b[1] ?? 0) - (a[1] ?? 0))
    .slice(0, 3)
    .map(([t]) => t as RivalryTrigger);

  return (
    <Card className={`paper ${isPlayerRivalry ? "ring-1 ring-primary/30" : ""}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Badge className={`${heatConfig.bgColor} ${heatConfig.color} border`}>
              <Flame className="h-3 w-3 mr-1" />
              {heatConfig.label}
            </Badge>
            {isPlayerRivalry && (
              <Badge variant="default" className="text-xs">Your Stable</Badge>
            )}
          </div>
          <div className="text-right text-xs text-muted-foreground">
            {pair.meetings} bout{pair.meetings !== 1 ? "s" : ""}
          </div>
        </div>
        
        <CardTitle className="font-display text-lg mt-2">
          <span className="flex items-center gap-2 flex-wrap">
            <RikishiName id={rikishiA.id} name={rikishiA.shikona} />
            <span className="text-muted-foreground">vs</span>
            <RikishiName id={rikishiB.id} name={rikishiB.shikona} />
          </span>
        </CardTitle>
        
        <CardDescription className="flex items-center gap-4 flex-wrap">
          {heyaA && (
            <span>
              <StableName id={heyaA.id} name={heyaA.name} className="text-muted-foreground" />
            </span>
          )}
          <span className="text-muted-foreground">vs</span>
          {heyaB && (
            <span>
              <StableName id={heyaB.id} name={heyaB.name} className="text-muted-foreground" />
            </span>
          )}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Head-to-head record */}
        <div className="flex items-center justify-center gap-4 p-3 rounded-lg bg-secondary/30">
          <div className="text-center">
            <div className="font-display text-2xl font-bold">{pair.aWins}</div>
            <div className="text-xs text-muted-foreground">{rikishiA.shikona}</div>
          </div>
          <div className="text-muted-foreground font-display">-</div>
          <div className="text-center">
            <div className="font-display text-2xl font-bold">{pair.bWins}</div>
            <div className="text-xs text-muted-foreground">{rikishiB.shikona}</div>
          </div>
        </div>

        {/* Tone */}
        <div className="flex items-center gap-2">
          <ToneIcon className={`h-4 w-4 ${heatConfig.color}`} />
          <span className="font-medium text-sm">{toneInfo.label}</span>
        </div>
        <p className="text-sm text-muted-foreground">{toneInfo.description}</p>

        {/* Triggers */}
        {topTriggers.length > 0 && (
          <>
            <Separator />
            <div className="flex flex-wrap gap-2">
              {topTriggers.map((trigger) => (
                <Badge key={trigger} variant="outline" className="text-xs">
                  {TRIGGER_LABELS[trigger]}
                </Badge>
              ))}
            </div>
          </>
        )}

        {/* Heat meter */}
        <div className="pt-2">
          <div className="flex justify-between text-xs text-muted-foreground mb-1">
            <span>Rivalry Heat</span>
            <span>{Math.round(pair.heat)}%</span>
          </div>
          <div className="h-2 bg-secondary rounded-full overflow-hidden">
            <div
              className={`h-full transition-all ${
                heatBand === "inferno"
                  ? "bg-red-500"
                  : heatBand === "hot"
                  ? "bg-orange-500"
                  : heatBand === "warm"
                  ? "bg-yellow-500"
                  : "bg-muted-foreground"
              }`}
              style={{ width: `${pair.heat}%` }}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function RivalriesPage() {
  const { state } = useGame();
  const { world, playerHeyaId } = state;

  // Get rivalries state from world or create default
  const rivalriesState = useMemo(() => {
    if (!world) return createDefaultRivalriesState();
    return (world as any).rivalries ?? createDefaultRivalriesState();
  }, [world]);

  // Get player rikishi IDs
  const playerRikishiIds = useMemo(() => {
    if (!world || !playerHeyaId) return new Set<string>();
    const heya = world.heyas.get(playerHeyaId);
    return new Set(heya?.rikishiIds ?? []);
  }, [world, playerHeyaId]);

  // Separate player rivalries from others
  const { playerRivalries, hotRivalries, allRivalries } = useMemo(() => {
    const pairs = Object.values(rivalriesState.pairs) as RivalryPairState[];
    
    const player: RivalryPairState[] = [];
    const hot: RivalryPairState[] = [];
    
    for (const pair of pairs) {
      const isPlayer = playerRikishiIds.has(pair.aId) || playerRikishiIds.has(pair.bId);
      if (isPlayer) player.push(pair);
      if (pair.heat >= 55) hot.push(pair); // hot or inferno
    }
    
    // Sort by heat descending
    player.sort((a, b) => b.heat - a.heat);
    hot.sort((a, b) => b.heat - a.heat);
    pairs.sort((a, b) => b.heat - a.heat);
    
    return {
      playerRivalries: player,
      hotRivalries: hot.filter(p => !playerRikishiIds.has(p.aId) && !playerRikishiIds.has(p.bId)),
      allRivalries: pairs
    };
  }, [rivalriesState, playerRikishiIds]);

  if (!world) {
    return (
      <div className="p-6 text-center text-muted-foreground">
        No world loaded.
      </div>
    );
  }

  const hasRivalries = allRivalries.length > 0;

  return (
    <>
      <Helmet>
        <title>Rivalries & Feuds - Basho</title>
      </Helmet>

      <div className="p-6 max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="font-display text-3xl font-bold flex items-center gap-3">
            <Flame className="h-8 w-8 text-orange-400" />
            Rivalries & Feuds
          </h1>
          <p className="text-muted-foreground mt-1">
            The personal battles that define the sumo world
          </p>
        </div>

        {!hasRivalries ? (
          <Card className="paper">
            <CardContent className="p-12 text-center">
              <Swords className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-display text-xl font-semibold mb-2">No Rivalries Yet</h3>
              <p className="text-muted-foreground mb-4">
                Rivalries develop as rikishi face each other repeatedly. Complete some basho to see 
                relationships form between wrestlers.
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Player Stable Rivalries */}
            {playerRivalries.length > 0 && (
              <div className="space-y-4">
                <h2 className="font-display text-xl font-semibold flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Your Stable's Rivalries
                </h2>
                <div className="grid gap-4 md:grid-cols-2">
                  {playerRivalries.slice(0, 4).map((pair) => (
                    <RivalryCard
                      key={pair.key}
                      pair={pair}
                      world={world}
                      isPlayerRivalry
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Hot Rivalries Across Sumo */}
            {hotRivalries.length > 0 && (
              <div className="space-y-4">
                <h2 className="font-display text-xl font-semibold flex items-center gap-2">
                  <Flame className="h-5 w-5 text-orange-400" />
                  Hot Rivalries Across Sumo
                </h2>
                <div className="grid gap-4 md:grid-cols-2">
                  {hotRivalries.slice(0, 4).map((pair) => (
                    <RivalryCard
                      key={pair.key}
                      pair={pair}
                      world={world}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* All Rivalries */}
            {allRivalries.length > playerRivalries.length + hotRivalries.length && (
              <div className="space-y-4">
                <h2 className="font-display text-xl font-semibold flex items-center gap-2">
                  <Swords className="h-5 w-5" />
                  All Active Rivalries
                </h2>
                <div className="grid gap-4 md:grid-cols-2">
                  {allRivalries
                    .filter(
                      (p) =>
                        !playerRikishiIds.has(p.aId) &&
                        !playerRikishiIds.has(p.bId) &&
                        p.heat < 55
                    )
                    .slice(0, 6)
                    .map((pair) => (
                      <RivalryCard
                        key={pair.key}
                        pair={pair}
                        world={world}
                      />
                    ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* Legend */}
        <Card className="paper">
          <CardContent className="pt-4">
            <div className="text-sm font-medium mb-3">Heat Levels</div>
            <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
              {(Object.entries(HEAT_BAND_CONFIG) as [RivalryHeatBand, typeof HEAT_BAND_CONFIG["inferno"]][]).map(
                ([band, config]) => (
                  <div key={band} className="flex items-center gap-1.5">
                    <div className={`w-3 h-3 rounded-full ${config.bgColor} border`} />
                    <span className={config.color}>{config.label}</span>
                    <span>- {config.description}</span>
                  </div>
                )
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
