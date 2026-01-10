// Basho Page - Tournament gameplay with clickable narrative bouts
import { useState, useMemo, useEffect } from "react";
import { Helmet } from "react-helmet";
import { useNavigate } from "react-router-dom";
import { useGame } from "@/contexts/GameContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BASHO_CALENDAR, getDayName } from "@/engine/calendar";
import { RANK_NAMES, SIDE_NAMES } from "@/engine/scouting";
import { BoutNarrativeModal } from "@/components/game/BoutNarrativeModal";
import { Play, FastForward, ChevronRight, Trophy, Star, Eye } from "lucide-react";
import type { Rikishi, BoutResult, BashoName } from "@/engine/types";

interface SelectedBout {
  east: Rikishi;
  west: Rikishi;
  result: BoutResult;
  isPlayerBout: boolean;
}

export default function BashoPage() {
  const navigate = useNavigate();
  const { state, simulateBout, simulateAllBouts, advanceDay, endBasho, getCurrentDayMatches, getStandings } = useGame();
  const { world, currentBoutIndex, playerHeyaId } = state;
  const [selectedBout, setSelectedBout] = useState<SelectedBout | null>(null);
  const [autoShowPlayerBout, setAutoShowPlayerBout] = useState<SelectedBout | null>(null);

  if (!world?.currentBasho) {
    navigate("/");
    return null;
  }

  const basho = world.currentBasho;
  const bashoInfo = BASHO_CALENDAR[basho.bashoName];
  const dayInfo = getDayName(basho.day);
  const matches = getCurrentDayMatches();
  const standings = getStandings().slice(0, 10);

  // Identify player stable rikishi
  const playerRikishiIds = useMemo(() => {
    if (!playerHeyaId || !world) return new Set<string>();
    const heya = world.heyas.get(playerHeyaId);
    return new Set(heya?.rikishiIds || []);
  }, [playerHeyaId, world]);

  // Sort matches: player bouts first, then by completion status
  const sortedMatches = useMemo(() => {
    return [...matches].sort((a, b) => {
      const aIsPlayer = playerRikishiIds.has(a.eastRikishiId) || playerRikishiIds.has(a.westRikishiId);
      const bIsPlayer = playerRikishiIds.has(b.eastRikishiId) || playerRikishiIds.has(b.westRikishiId);
      
      if (aIsPlayer !== bIsPlayer) return aIsPlayer ? -1 : 1;
      if (a.result && !b.result) return 1;
      if (!a.result && b.result) return -1;
      return 0;
    });
  }, [matches, playerRikishiIds]);

  // Find next unplayed bout index in original matches array
  const nextBoutIndex = useMemo(() => {
    return matches.findIndex(m => !m.result);
  }, [matches]);

  const completedBouts = matches.filter(m => m.result).length;
  const remainingBouts = matches.length - completedBouts;

  // When a bout is simulated, auto-show if it's a player bout
  useEffect(() => {
    if (state.lastBoutResult && currentBoutIndex > 0) {
      const justSimulated = matches[currentBoutIndex - 1];
      if (justSimulated?.result && justSimulated.east && justSimulated.west) {
        const isPlayerBout = playerRikishiIds.has(justSimulated.eastRikishiId) || 
                             playerRikishiIds.has(justSimulated.westRikishiId);
        if (isPlayerBout) {
          setAutoShowPlayerBout({
            east: justSimulated.east,
            west: justSimulated.west,
            result: justSimulated.result,
            isPlayerBout: true
          });
        }
      }
    }
  }, [currentBoutIndex, state.lastBoutResult]);

  const handleSimulateNext = () => {
    if (nextBoutIndex >= 0) {
      simulateBout(nextBoutIndex);
    }
  };

  const handleSimulateAll = () => {
    simulateAllBouts();
  };

  const handleNextDay = () => {
    if (basho.day >= 15) {
      endBasho();
      navigate("/");
    } else {
      advanceDay();
    }
  };

  const handleBoutClick = (match: typeof matches[0]) => {
    if (!match.result || !match.east || !match.west) return;
    
    const isPlayerBout = playerRikishiIds.has(match.eastRikishiId) || 
                         playerRikishiIds.has(match.westRikishiId);
    
    setSelectedBout({
      east: match.east,
      west: match.west,
      result: match.result,
      isPlayerBout
    });
  };

  const isPlayerBout = (match: typeof matches[0]) => {
    return playerRikishiIds.has(match.eastRikishiId) || playerRikishiIds.has(match.westRikishiId);
  };

  return (
    <>
      <Helmet>
        <title>{`${bashoInfo?.nameEn || "Tournament"} Day ${basho.day} - Stable Lords`}</title>
      </Helmet>

      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-3xl font-bold">{bashoInfo.nameJa}</h1>
            <p className="text-muted-foreground">{dayInfo.dayJa} • {bashoInfo.location}</p>
          </div>
          <Badge variant="outline" className="text-lg px-4 py-2">
            Day {basho.day}/15
          </Badge>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Matches */}
          <Card className="paper lg:col-span-2">
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle>Today&apos;s Bouts ({completedBouts}/{matches.length})</CardTitle>
              <div className="flex gap-2">
                <Button size="sm" onClick={handleSimulateNext} disabled={remainingBouts === 0}>
                  <Play className="h-4 w-4 mr-1" /> Next
                </Button>
                <Button size="sm" variant="secondary" onClick={handleSimulateAll} disabled={remainingBouts === 0}>
                  <FastForward className="h-4 w-4 mr-1" /> All
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-2 max-h-[500px] overflow-auto">
              {sortedMatches.map((match, idx) => {
                const isPlayer = isPlayerBout(match);
                const hasResult = !!match.result;
                
                return (
                  <div 
                    key={`${match.eastRikishiId}-${match.westRikishiId}`}
                    onClick={() => handleBoutClick(match)}
                    className={`flex items-center gap-3 p-3 rounded-lg transition-all ${
                      hasResult 
                        ? "bg-secondary/30 cursor-pointer hover:bg-secondary/50" 
                        : "bg-muted/50"
                    } ${
                      isPlayer ? "ring-2 ring-primary/50 ring-offset-1 ring-offset-background" : ""
                    }`}
                  >
                    {/* Player indicator */}
                    {isPlayer && (
                      <Star className="h-4 w-4 text-primary shrink-0" fill="currentColor" />
                    )}
                    
                    <div className="flex-1 text-right">
                      <span className={`font-display ${match.result?.winner === "east" ? "font-bold text-success" : ""}`}>
                        {match.east?.shikona}
                      </span>
                      <div className="text-xs text-muted-foreground">
                        {match.east && RANK_NAMES[match.east.rank]?.ja} {match.east && RANK_NAMES[match.east.rank]?.en}
                      </div>
                    </div>
                    
                    <div className="w-12 text-center text-xs text-muted-foreground">vs</div>
                    
                    <div className="flex-1">
                      <span className={`font-display ${match.result?.winner === "west" ? "font-bold text-success" : ""}`}>
                        {match.west?.shikona}
                      </span>
                      <div className="text-xs text-muted-foreground">
                        {match.west && RANK_NAMES[match.west.rank]?.ja} {match.west && RANK_NAMES[match.west.rank]?.en}
                      </div>
                    </div>
                    
                    {hasResult && (
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {match.result?.kimariteName}
                        </Badge>
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* Standings */}
          <Card className="paper">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5" /> Leaders
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {standings.map((entry, idx) => {
                const isPlayer = playerRikishiIds.has(entry.rikishi.id);
                return (
                  <div 
                    key={entry.rikishi.id} 
                    className={`flex items-center gap-2 text-sm ${isPlayer ? "font-semibold text-primary" : ""}`}
                  >
                    <span className="w-5 text-muted-foreground">{idx + 1}.</span>
                    {isPlayer && <Star className="h-3 w-3" fill="currentColor" />}
                    <span className="flex-1 font-display truncate">{entry.rikishi.shikona}</span>
                    <span className="font-mono">{entry.wins}-{entry.losses}</span>
                  </div>
                );
              })}

              {remainingBouts === 0 && (
                <Button className="w-full mt-4" onClick={handleNextDay}>
                  {basho.day >= 15 ? "End Basho" : "Next Day"} <ChevronRight className="h-4 w-4" />
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Narrative Modal - User clicked */}
      {selectedBout && (
        <BoutNarrativeModal
          open={!!selectedBout}
          onOpenChange={(open) => !open && setSelectedBout(null)}
          east={selectedBout.east}
          west={selectedBout.west}
          result={selectedBout.result}
          bashoName={basho.bashoName}
          day={basho.day}
          isPlayerBout={selectedBout.isPlayerBout}
        />
      )}

      {/* Auto-show modal for player bouts */}
      {autoShowPlayerBout && !selectedBout && (
        <BoutNarrativeModal
          open={!!autoShowPlayerBout}
          onOpenChange={(open) => !open && setAutoShowPlayerBout(null)}
          east={autoShowPlayerBout.east}
          west={autoShowPlayerBout.west}
          result={autoShowPlayerBout.result}
          bashoName={basho.bashoName}
          day={basho.day}
          isPlayerBout={true}
        />
      )}
    </>
  );
}
