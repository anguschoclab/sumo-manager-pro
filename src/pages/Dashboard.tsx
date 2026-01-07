// Dashboard - Main hub between basho
// Overview of stable, upcoming basho, and recent news

import { Helmet } from "react-helmet";
import { useNavigate } from "react-router-dom";
import { useGame } from "@/contexts/GameContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BASHO_CALENDAR, getSeasonalFlavor } from "@/engine/calendar";
import { RANK_HIERARCHY, formatRank } from "@/engine/banzuke";
import { 
  Swords, 
  Users, 
  Trophy, 
  TrendingUp, 
  TrendingDown,
  Calendar,
  MapPin,
  Wallet
} from "lucide-react";

export default function Dashboard() {
  const navigate = useNavigate();
  const { state, startBasho, setPhase } = useGame();
  const { world } = state;

  if (!world) {
    navigate("/menu");
    return null;
  }

  const currentBasho = world.currentBashoName 
    ? BASHO_CALENDAR[world.currentBashoName] 
    : null;

  const playerHeya = state.playerHeyaId 
    ? world.heyas.get(state.playerHeyaId) 
    : null;

  // Get player's rikishi sorted by rank
  const playerRikishi = playerHeya
    ? playerHeya.rikishiIds
        .map(id => world.rikishi.get(id))
        .filter(Boolean)
        .sort((a, b) => {
          const tierA = RANK_HIERARCHY[a!.rank].tier;
          const tierB = RANK_HIERARCHY[b!.rank].tier;
          return tierA - tierB;
        })
    : [];

  const sekitori = playerRikishi.filter(r => r && RANK_HIERARCHY[r.rank].isSekitori);
  const topRanked = sekitori[0];

  // Get last basho results
  const lastBasho = world.history[world.history.length - 1];
  const lastYushoWinner = lastBasho ? world.rikishi.get(lastBasho.yusho) : null;

  const handleStartBasho = () => {
    startBasho();
    navigate("/basho");
  };

  return (
    <>
      <Helmet>
        <title>Dashboard - Stable Lords</title>
      </Helmet>

      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Welcome Header */}
        <div className="space-y-1">
          <h1 className="font-display text-3xl font-bold">
            {playerHeya?.name || "Your Stable"}
          </h1>
          <p className="text-muted-foreground">
            {currentBasho && getSeasonalFlavor(currentBasho.season)}
          </p>
        </div>

        {/* Main Actions */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Next Basho Card */}
          {currentBasho && (
            <Card className="paper col-span-full lg:col-span-2">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="font-display text-2xl flex items-center gap-2">
                      {currentBasho.nameJa}
                      <Badge variant="secondary" className="font-sans text-xs">
                        {currentBasho.nameEn}
                      </Badge>
                    </CardTitle>
                    <CardDescription className="flex items-center gap-4 mt-2">
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {currentBasho.location}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {world.year}年{currentBasho.month}月
                      </span>
                    </CardDescription>
                  </div>
                  <Swords className="h-8 w-8 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  {currentBasho.description}
                </p>
                <div className="flex items-center gap-3">
                  <Button size="lg" className="gap-2" onClick={handleStartBasho}>
                    <Swords className="h-4 w-4" />
                    Begin Tournament
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => navigate("/banzuke")}
                  >
                    View Banzuke
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Stable Summary */}
          <Card className="paper">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Stable Overview
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 rounded-lg bg-secondary/50">
                  <div className="text-2xl font-bold">{sekitori.length}</div>
                  <div className="text-xs text-muted-foreground">Sekitori</div>
                </div>
                <div className="text-center p-3 rounded-lg bg-secondary/50">
                  <div className="text-2xl font-bold">{playerRikishi.length}</div>
                  <div className="text-xs text-muted-foreground">Total</div>
                </div>
              </div>
              
              {topRanked && (
                <div className="pt-2 border-t">
                  <div className="text-xs text-muted-foreground mb-1">Top Ranked</div>
                  <div className="flex items-center justify-between">
                    <span className="font-display font-medium">{topRanked.shikona}</span>
                    <Badge className={`rank-${topRanked.rank}`}>
                      {RANK_HIERARCHY[topRanked.rank].nameJa}
                    </Badge>
                  </div>
                </div>
              )}

              {playerHeya && (
                <div className="pt-2 border-t">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-1 text-muted-foreground">
                      <Wallet className="h-3 w-3" />
                      Funds
                    </span>
                    <span className="font-medium">
                      ¥{(playerHeya.funds / 1_000_000).toFixed(1)}M
                    </span>
                  </div>
                </div>
              )}

              <Button 
                variant="outline" 
                className="w-full" 
                onClick={() => navigate("/stable")}
              >
                Manage Stable
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Sekitori List */}
        {sekitori.length > 0 && (
          <Card className="paper">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5" />
                Your Sekitori
              </CardTitle>
              <CardDescription>
                Salaried wrestlers in Makuuchi and Juryo divisions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {sekitori.map(rikishi => rikishi && (
                  <div 
                    key={rikishi.id}
                    className="flex items-center gap-3 p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 cursor-pointer transition-colors"
                    onClick={() => navigate(`/rikishi/${rikishi.id}`)}
                  >
                    <div className={`w-1 h-12 rounded-full ${rikishi.side === "east" ? "bg-east" : "bg-west"}`} />
                    <div className="flex-1 min-w-0">
                      <div className="font-display font-medium truncate">
                        {rikishi.shikona}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {RANK_HIERARCHY[rikishi.rank].nameJa}
                        {rikishi.rankNumber && ` ${rikishi.rankNumber}枚目`}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-sm">
                      {rikishi.momentum > 0 ? (
                        <TrendingUp className="h-4 w-4 text-success" />
                      ) : rikishi.momentum < 0 ? (
                        <TrendingDown className="h-4 w-4 text-destructive" />
                      ) : null}
                      <span className="text-muted-foreground">
                        {rikishi.careerWins}-{rikishi.careerLosses}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Last Basho Results */}
        {lastBasho && lastYushoWinner && (
          <Card className="paper">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-gold" />
                Previous Champion
              </CardTitle>
              <CardDescription>
                {BASHO_CALENDAR[lastBasho.bashoName].nameEn} {lastBasho.year}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <div className="font-display text-xl font-semibold">
                    {lastYushoWinner.shikona}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {RANK_HIERARCHY[lastYushoWinner.rank].nameJa} • {lastYushoWinner.heyaId}
                  </div>
                </div>
                <Button variant="outline" onClick={() => navigate("/history")}>
                  View History
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}
