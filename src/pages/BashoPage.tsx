// Basho Page - Tournament gameplay
import { Helmet } from "react-helmet";
import { useNavigate } from "react-router-dom";
import { useGame } from "@/contexts/GameContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BASHO_CALENDAR, getDayName } from "@/engine/calendar";
import { RANK_HIERARCHY } from "@/engine/banzuke";
import { Play, FastForward, ChevronRight, Trophy } from "lucide-react";

export default function BashoPage() {
  const navigate = useNavigate();
  const { state, simulateBout, simulateAllBouts, advanceDay, endBasho, getCurrentDayMatches, getStandings } = useGame();
  const { world, currentBoutIndex, lastBoutResult } = state;

  if (!world?.currentBasho) {
    navigate("/");
    return null;
  }

  const basho = world.currentBasho;
  const bashoInfo = BASHO_CALENDAR[basho.bashoName];
  const dayInfo = getDayName(basho.day);
  const matches = getCurrentDayMatches();
  const standings = getStandings().slice(0, 10);

  const completedBouts = matches.filter(m => m.result).length;
  const remainingBouts = matches.length - completedBouts;

  const handleSimulateNext = () => {
    if (currentBoutIndex < matches.length) {
      simulateBout(currentBoutIndex);
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

  return (
    <>
      <Helmet>
        <title>{`${bashoInfo?.nameEn || 'Tournament'} Day ${basho.day} - Stable Lords`}</title>
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
              <CardTitle>Today's Bouts ({completedBouts}/{matches.length})</CardTitle>
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
              {matches.map((match, idx) => (
                <div 
                  key={idx} 
                  className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                    match.result ? "bg-secondary/30" : "bg-muted/50"
                  }`}
                >
                  <div className="flex-1 text-right">
                    <span className={`font-display ${match.result?.winner === "east" ? "font-bold text-success" : ""}`}>
                      {match.east?.shikona}
                    </span>
                    <div className="text-xs text-muted-foreground">
                      {match.east && RANK_HIERARCHY[match.east.rank].nameJa}
                    </div>
                  </div>
                  <div className="w-12 text-center text-xs text-muted-foreground">vs</div>
                  <div className="flex-1">
                    <span className={`font-display ${match.result?.winner === "west" ? "font-bold text-success" : ""}`}>
                      {match.west?.shikona}
                    </span>
                    <div className="text-xs text-muted-foreground">
                      {match.west && RANK_HIERARCHY[match.west.rank].nameJa}
                    </div>
                  </div>
                  {match.result && (
                    <Badge variant="outline" className="text-xs">
                      {match.result.kimariteName}
                    </Badge>
                  )}
                </div>
              ))}
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
              {standings.map((entry, idx) => (
                <div key={entry.rikishi.id} className="flex items-center gap-2 text-sm">
                  <span className="w-5 text-muted-foreground">{idx + 1}.</span>
                  <span className="flex-1 font-display truncate">{entry.rikishi.shikona}</span>
                  <span className="font-mono">{entry.wins}-{entry.losses}</span>
                </div>
              ))}

              {remainingBouts === 0 && (
                <Button className="w-full mt-4" onClick={handleNextDay}>
                  {basho.day >= 15 ? "End Basho" : "Next Day"} <ChevronRight className="h-4 w-4" />
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
