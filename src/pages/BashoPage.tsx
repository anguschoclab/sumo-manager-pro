// Basho Page - Tournament gameplay with clickable narrative bouts
// DROP-IN FIXES:
// - Removes reliance on non-canonical match.east/match.west fields (which are often undefined)
// - Resolves rikishi objects via world.rikishi Map (safe + deterministic)
// - Auto-show player bout uses lastBoutResult + derived bout ids (no array index coupling)
// - Safer navigation when world/currentBasho missing
// - Keeps UI behavior: player bouts first, click-to-open narrative, Next/All sim controls

import { useState, useMemo, useEffect, useCallback } from "react";
import { Helmet } from "react-helmet";
import { useNavigate } from "react-router-dom";
import { useGame } from "@/contexts/GameContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BASHO_CALENDAR, getDayName } from "@/engine/calendar";
import { RANK_NAMES } from "@/engine/scouting";
import { BoutNarrativeModal } from "@/components/game/BoutNarrativeModal";
import { Play, FastForward, ChevronRight, Trophy, Star, Eye } from "lucide-react";
import type { Rikishi, BoutResult } from "@/engine/types";

type MatchLike = {
  day?: number;
  eastRikishiId: string;
  westRikishiId: string;
  result?: BoutResult;
};

interface SelectedBout {
  east: Rikishi;
  west: Rikishi;
  result: BoutResult;
  isPlayerBout: boolean;
}

export default function BashoPage() {
  const navigate = useNavigate();
  const {
    state,
    simulateBout,
    simulateAllBouts,
    advanceDay,
    endBasho,
    getCurrentDayMatches,
    getStandings
  } = useGame();

  const { world, playerHeyaId } = state;

  const [selectedBout, setSelectedBout] = useState<SelectedBout | null>(null);
  const [autoShowPlayerBout, setAutoShowPlayerBout] = useState<SelectedBout | null>(null);

  // Guard: no world / no current basho => go home
  useEffect(() => {
    if (!world?.currentBasho) navigate("/");
  }, [world, navigate]);

  if (!world?.currentBasho) return null;

  const basho = world.currentBasho;
  const bashoInfo = BASHO_CALENDAR[basho.bashoName];
  const dayInfo = getDayName(basho.day);

  const matches = (getCurrentDayMatches() as unknown as MatchLike[]) ?? [];
  const standings = (getStandings?.() ?? []).slice(0, 10);

  // Identify player stable rikishi
  const playerRikishiIds = useMemo(() => {
    if (!playerHeyaId) return new Set<string>();
    const heya = world.heyas.get(playerHeyaId);
    return new Set(heya?.rikishiIds ?? []);
  }, [playerHeyaId, world.heyas]);

  const resolveRikishi = useCallback(
    (id: string): Rikishi | null => {
      const r = world.rikishi.get(id);
      return r ?? null;
    },
    [world.rikishi]
  );

  const isPlayerBout = useCallback(
    (m: MatchLike) => playerRikishiIds.has(m.eastRikishiId) || playerRikishiIds.has(m.westRikishiId),
    [playerRikishiIds]
  );

  // Sort matches: player bouts first, then by completion status
  const sortedMatches = useMemo(() => {
    return [...matches].sort((a, b) => {
      const aIsPlayer = isPlayerBout(a);
      const bIsPlayer = isPlayerBout(b);

      if (aIsPlayer !== bIsPlayer) return aIsPlayer ? -1 : 1;
      if (a.result && !b.result) return 1;
      if (!a.result && b.result) return -1;
      return 0;
    });
  }, [matches, isPlayerBout]);

  // Find next unplayed bout index in original matches array
  const nextBoutIndex = useMemo(() => matches.findIndex((m) => !m.result), [matches]);

  const completedBouts = useMemo(() => matches.filter((m) => !!m.result).length, [matches]);
  const remainingBouts = matches.length - completedBouts;

  const handleSimulateNext = () => {
    if (nextBoutIndex >= 0) simulateBout(nextBoutIndex);
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

  const handleBoutClick = (match: MatchLike) => {
    if (!match.result) return;

    const east = resolveRikishi(match.eastRikishiId);
    const west = resolveRikishi(match.westRikishiId);
    if (!east || !west) return;

    setSelectedBout({
      east,
      west,
      result: match.result,
      isPlayerBout: isPlayerBout(match)
    });
  };

  // Auto-show modal for last simulated player bout (no dependence on match.east/match.west)
  useEffect(() => {
    const last = (state as any).lastBoutResult as BoutResult | undefined;
    if (!last) return;

    // BoutResult has winner/loser IDs; we can always reconstruct both rikishi.
    const winner = resolveRikishi(last.winnerRikishiId);
    const loser = resolveRikishi(last.loserRikishiId);
    if (!winner || !loser) return;

    // Determine which side was east/west for the modal.
    // We prefer to infer from today's match list; fallback to winner/loser orientation.
    let east: Rikishi | null = null;
    let west: Rikishi | null = null;

    const matchToday = matches.find(
      (m) =>
        (m.eastRikishiId === winner.id && m.westRikishiId === loser.id) ||
        (m.eastRikishiId === loser.id && m.westRikishiId === winner.id)
    );

    if (matchToday) {
      east = resolveRikishi(matchToday.eastRikishiId);
      west = resolveRikishi(matchToday.westRikishiId);
    }

    // Fallback if not found in today's list (should be rare)
    if (!east || !west) {
      // Use BoutResult.winner as "east" only as a last resort; modal still works.
      east = winner;
      west = loser;
    }

    const playerInBout = playerRikishiIds.has(winner.id) || playerRikishiIds.has(loser.id);
    if (!playerInBout) return;

    // Don't override a user-open modal
    if (selectedBout) return;

    setAutoShowPlayerBout({
      east,
      west,
      result: last,
      isPlayerBout: true
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    (state as any).lastBoutResult,
    matches,
    playerRikishiIds,
    resolveRikishi,
    selectedBout
  ]);

  return (
    <>
      <Helmet>
        <title>{`${bashoInfo?.nameEn || "Tournament"} Day ${basho.day} - Basho`}</title>
      </Helmet>

      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Header with Controls at Top */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-3xl font-bold">{bashoInfo.nameJa}</h1>
            <p className="text-muted-foreground">
              {dayInfo.dayJa} • {bashoInfo.location}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="text-lg px-4 py-2">
              Day {basho.day}/15
            </Badge>
            {remainingBouts === 0 && (
              <Button onClick={handleNextDay} className="gap-2">
                {basho.day >= 15 ? "End Basho" : "Next Day"} <ChevronRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Current Basho Records */}
        <Card className="paper">
          <CardContent className="pt-4">
            <div className="flex items-center gap-6 overflow-x-auto">
              <div className="text-sm text-muted-foreground shrink-0">Basho Standings:</div>
              {standings.slice(0, 8).map((entry: any, idx: number) => {
                const isPlayer = playerRikishiIds.has(entry.rikishi.id);
                return (
                  <div
                    key={entry.rikishi.id}
                    className={`flex items-center gap-2 shrink-0 ${isPlayer ? "text-primary font-semibold" : ""}`}
                  >
                    {idx === 0 && <Trophy className="h-4 w-4 text-amber-400" />}
                    {isPlayer && <Star className="h-3 w-3" fill="currentColor" />}
                    <span className="font-display">{entry.rikishi.shikona}</span>
                    <span className="font-mono text-sm">
                      {entry.wins}-{entry.losses}
                    </span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Matches */}
          <Card className="paper lg:col-span-2">
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle>
                Today&apos;s Bouts ({completedBouts}/{matches.length})
              </CardTitle>
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
              {sortedMatches.map((match) => {
                const hasResult = !!match.result;
                const isPlayer = isPlayerBout(match);

                const east = resolveRikishi(match.eastRikishiId);
                const west = resolveRikishi(match.westRikishiId);

                // If either rikishi missing, render safely (shouldn't happen, but prevents crashes)
                const eastName = east?.shikona ?? match.eastRikishiId;
                const westName = west?.shikona ?? match.westRikishiId;

                const eastRank = east ? RANK_NAMES[east.rank] : null;
                const westRank = west ? RANK_NAMES[west.rank] : null;

                return (
                  <div
                    key={`${match.eastRikishiId}-${match.westRikishiId}`}
                    onClick={() => (hasResult ? handleBoutClick(match) : undefined)}
                    className={`flex items-center gap-3 p-3 rounded-lg transition-all ${
                      hasResult ? "bg-secondary/30 cursor-pointer hover:bg-secondary/50" : "bg-muted/50"
                    } ${isPlayer ? "ring-2 ring-primary/50 ring-offset-1 ring-offset-background" : ""}`}
                  >
                    {isPlayer && <Star className="h-4 w-4 text-primary shrink-0" fill="currentColor" />}

                    <div className="flex-1 text-right">
                      <span className={`font-display ${match.result?.winner === "east" ? "font-bold text-success" : ""}`}>
                        {eastName}
                      </span>
                      <div className="text-xs text-muted-foreground">
                        {eastRank?.ja} {eastRank?.en}
                      </div>
                    </div>

                    <div className="w-12 text-center text-xs text-muted-foreground">vs</div>

                    <div className="flex-1">
                      <span className={`font-display ${match.result?.winner === "west" ? "font-bold text-success" : ""}`}>
                        {westName}
                      </span>
                      <div className="text-xs text-muted-foreground">
                        {westRank?.ja} {westRank?.en}
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
              {standings.map((entry: any, idx: number) => {
                const isPlayer = playerRikishiIds.has(entry.rikishi.id);
                return (
                  <div
                    key={entry.rikishi.id}
                    className={`flex items-center gap-2 text-sm ${isPlayer ? "font-semibold text-primary" : ""}`}
                  >
                    <span className="w-5 text-muted-foreground">{idx + 1}.</span>
                    {isPlayer && <Star className="h-3 w-3" fill="currentColor" />}
                    <span className="flex-1 font-display truncate">{entry.rikishi.shikona}</span>
                    <span className="font-mono">
                      {entry.wins}-{entry.losses}
                    </span>
                  </div>
                );
              })}
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
