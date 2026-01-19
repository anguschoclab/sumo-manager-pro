// Dashboard - Main hub between basho
// Narrative-first display per Master Context v2.2

import { Helmet } from "react-helmet";
import { useNavigate } from "react-router-dom";
import { useGame } from "@/contexts/GameContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BASHO_CALENDAR, getBashoInfo, getSeasonalFlavor } from "@/engine/calendar";
import { RANK_HIERARCHY } from "@/engine/banzuke";
import type { StatureBand, PrestigeBand, RunwayBand, KoenkaiBandType, FacilitiesBand } from "@/engine/types";
import { StableName, RikishiName } from "@/components/ClickableName";
import {
  Swords,
  Trophy,
  TrendingUp,
  TrendingDown,
  Calendar,
  MapPin,
  Star,
  Sparkles,
  Building2,
  AlertTriangle,
  Shield,
  Coins,
  Users2
} from "lucide-react";

// Narrative descriptions for bands (UI never shows raw numbers per canon)
const STATURE_DISPLAY: Record<StatureBand, { label: string; labelJa: string; color: string }> = {
  legendary: { label: "Legendary", labelJa: "伝説", color: "bg-amber-500/20 text-amber-400 border-amber-500/30" },
  powerful: { label: "Powerful", labelJa: "強豪", color: "bg-purple-500/20 text-purple-400 border-purple-500/30" },
  established: { label: "Established", labelJa: "安定", color: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
  rebuilding: { label: "Rebuilding", labelJa: "再建中", color: "bg-orange-500/20 text-orange-400 border-orange-500/30" },
  fragile: { label: "Fragile", labelJa: "危機", color: "bg-red-500/20 text-red-400 border-red-500/30" },
  new: { label: "New", labelJa: "新規", color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" }
};

const PRESTIGE_DISPLAY: Record<PrestigeBand, string> = {
  elite: "Elite standing in the sumo world",
  respected: "Widely respected institution",
  modest: "Modest but solid reputation",
  struggling: "Struggling to maintain relevance",
  unknown: "Little known outside the community"
};

const RUNWAY_DISPLAY: Record<RunwayBand, { label: string; color: string }> = {
  secure: { label: "Financially Secure", color: "text-success" },
  comfortable: { label: "Comfortable Finances", color: "text-success" },
  tight: { label: "Tight Budget", color: "text-warning" },
  critical: { label: "Critical Finances", color: "text-destructive" },
  desperate: { label: "Desperate Situation", color: "text-destructive" }
};

const KOENKAI_DISPLAY: Record<KoenkaiBandType, string> = {
  powerful: "Powerful supporter network",
  strong: "Strong supporter base",
  moderate: "Modest supporter group",
  weak: "Few dedicated supporters",
  none: "No established support network"
};

const FACILITIES_DISPLAY: Record<FacilitiesBand, string> = {
  world_class: "World-class facilities",
  excellent: "Excellent training environment",
  adequate: "Adequate equipment and space",
  basic: "Basic but functional",
  minimal: "Minimal resources"
};

export default function Dashboard() {
  const navigate = useNavigate();
  const { state, startBasho } = useGame();
  const { world } = state;

  if (!world) {
    navigate("/menu");
    return null;
  }

  const currentBashoInfo = world.currentBashoName ? getBashoInfo(world.currentBashoName, world.year) : null;

  const playerHeya = state.playerHeyaId ? world.heyas.get(state.playerHeyaId) : null;

  // Get player's rikishi sorted by rank tier
  const playerRikishi = playerHeya
    ? playerHeya.rikishiIds
        .map((id) => world.rikishi.get(id))
        .filter(Boolean)
        .sort((a, b) => {
          const tierA = RANK_HIERARCHY[a!.rank].tier;
          const tierB = RANK_HIERARCHY[b!.rank].tier;
          return tierA - tierB;
        })
    : [];

  const sekitori = playerRikishi.filter((r) => r && RANK_HIERARCHY[r.rank].isSekitori);
  const topRanked = sekitori[0];

  // Get last basho results (safe)
  const lastBasho = world.history && world.history.length > 0 ? world.history[world.history.length - 1] : null;
  const lastYushoWinner = lastBasho ? world.rikishi.get(lastBasho.yusho) : null;

  const handleStartBasho = () => {
    startBasho();
    navigate("/basho");
  };

  const statureInfo = playerHeya ? STATURE_DISPLAY[playerHeya.statureBand] : null;
  const runwayInfo = playerHeya ? RUNWAY_DISPLAY[playerHeya.runwayBand] : null;

  // Deterministic flavor seed for the dashboard “seasonal line”
  const flavorSeed =
    world.currentBashoName != null
      ? `${world.seed}-flavor-${world.year}-${world.currentBashoName}-dashboard`
      : `${world.seed}-flavor-${world.year}-none-dashboard`;

  return (
    <>
      <Helmet>
        <title>Dashboard - Basho</title>
      </Helmet>

      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Welcome Header */}
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h1 className="font-display text-3xl font-bold">
                {playerHeya ? <StableName id={playerHeya.id} name={playerHeya.name} /> : "Your Stable"}
              </h1>
              {statureInfo && (
                <Badge className={`${statureInfo.color} border`}>
                  {statureInfo.labelJa} ({statureInfo.label})
                </Badge>
              )}
            </div>

            <p className="text-muted-foreground">
              {currentBashoInfo ? getSeasonalFlavor(currentBashoInfo.season, flavorSeed) : ""}
            </p>

            {playerHeya?.descriptor && (
              <p className="text-sm text-muted-foreground italic max-w-2xl">{playerHeya.descriptor}</p>
            )}
          </div>

          {/* Risk Indicators */}
          {playerHeya?.riskIndicators && (
            <div className="flex gap-2">
              {playerHeya.riskIndicators.financial && (
                <Badge variant="outline" className="bg-red-500/10 text-red-400 border-red-500/30">
                  <AlertTriangle className="w-3 h-3 mr-1" />
                  Financial Pressure
                </Badge>
              )}
              {playerHeya.riskIndicators.governance && (
                <Badge variant="outline" className="bg-yellow-500/10 text-yellow-400 border-yellow-500/30">
                  <Shield className="w-3 h-3 mr-1" />
                  Governance Watch
                </Badge>
              )}
              {playerHeya.riskIndicators.rivalry && (
                <Badge variant="outline" className="bg-purple-500/10 text-purple-400 border-purple-500/30">
                  <Sparkles className="w-3 h-3 mr-1" />
                  Active Rivalry
                </Badge>
              )}
            </div>
          )}
        </div>

        {/* FTUE Notice */}
        {world.ftue?.isActive && (
          <Card className="bg-blue-500/5 border-blue-500/20">
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <Shield className="h-5 w-5 text-blue-400" />
                <div>
                  <p className="text-sm font-medium text-blue-400">First Tournament Protection Active</p>
                  <p className="text-xs text-muted-foreground">
                    During your first basho, severe governance actions and closures are suspended. Use this time to learn
                    the systems.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Actions */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Next Basho Card */}
          {currentBashoInfo && (
            <Card className="paper col-span-full lg:col-span-2">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="font-display text-2xl flex items-center gap-2">
                      {currentBashoInfo.nameJa}
                      <Badge variant="secondary" className="font-sans text-xs">
                        {currentBashoInfo.nameEn}
                      </Badge>
                    </CardTitle>
                    <CardDescription className="flex items-center gap-4 mt-2">
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {currentBashoInfo.location}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {world.year}年{currentBashoInfo.month}月
                      </span>
                    </CardDescription>
                  </div>
                  <Swords className="h-8 w-8 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">{currentBashoInfo.description}</p>
                <div className="flex items-center gap-3">
                  <Button size="lg" className="gap-2" onClick={handleStartBasho}>
                    <Swords className="h-4 w-4" />
                    Begin Tournament
                  </Button>
                  <Button variant="outline" onClick={() => navigate("/banzuke")}>
                    View Banzuke
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Stable Summary - Narrative Version */}
          <Card className="paper">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Stable Overview
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Roster Summary */}
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 rounded-lg bg-secondary/50">
                  <div className="text-2xl font-bold">{sekitori.length}</div>
                  <div className="text-xs text-muted-foreground">Sekitori</div>
                </div>
                <div className="text-center p-3 rounded-lg bg-secondary/50">
                  <div className="text-2xl font-bold">{playerRikishi.length}</div>
                  <div className="text-xs text-muted-foreground">Total Wrestlers</div>
                </div>
              </div>

              {/* Top Ranked */}
              {topRanked && (
                <div className="pt-2 border-t">
                  <div className="text-xs text-muted-foreground mb-1">Top Ranked Wrestler</div>
                  <div className="flex items-center justify-between">
                    <span className="font-display font-medium">{topRanked.shikona}</span>
                    <Badge className={`rank-${topRanked.rank}`}>{RANK_HIERARCHY[topRanked.rank].nameJa}</Badge>
                  </div>
                </div>
              )}

              {/* Narrative Status Bands */}
              {playerHeya && (
                <div className="pt-2 border-t space-y-2">
                  {/* Prestige */}
                  <div className="flex items-center gap-2 text-sm">
                    <Star className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">{PRESTIGE_DISPLAY[playerHeya.prestigeBand]}</span>
                  </div>

                  {/* Financial Status */}
                  {runwayInfo && (
                    <div className="flex items-center gap-2 text-sm">
                      <Coins className="h-4 w-4 text-muted-foreground" />
                      <span className={runwayInfo.color}>{runwayInfo.label}</span>
                    </div>
                  )}

                  {/* Koenkai */}
                  <div className="flex items-center gap-2 text-sm">
                    <Users2 className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">{KOENKAI_DISPLAY[playerHeya.koenkaiBand]}</span>
                  </div>

                  {/* Facilities */}
                  <div className="flex items-center gap-2 text-sm">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">{FACILITIES_DISPLAY[playerHeya.facilitiesBand]}</span>
                  </div>
                </div>
              )}

              <Button variant="outline" className="w-full" onClick={() => navigate("/stable")}>
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
              <CardDescription>Salaried wrestlers competing in the top divisions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {sekitori.map(
                  (rikishi) =>
                    rikishi && (
                      <div
                        key={rikishi.id}
                        className="flex items-center gap-3 p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 cursor-pointer transition-colors"
                        onClick={() => navigate(`/rikishi/${rikishi.id}`)}
                      >
                        <div className={`w-1 h-12 rounded-full ${rikishi.side === "east" ? "bg-east" : "bg-west"}`} />
                        <div className="flex-1 min-w-0">
                          <div className="font-display font-medium truncate">
                            <RikishiName id={rikishi.id} name={rikishi.shikona} />
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {RANK_HIERARCHY[rikishi.rank].nameJa}
                            {rikishi.rankNumber && ` ${rikishi.rankNumber}枚目`}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 text-sm">
                          {rikishi.momentum > 0 ? (
                            <span className="flex items-center gap-1 text-success text-xs">
                              <TrendingUp className="h-4 w-4" />
                              Rising
                            </span>
                          ) : rikishi.momentum < 0 ? (
                            <span className="flex items-center gap-1 text-destructive text-xs">
                              <TrendingDown className="h-4 w-4" />
                              Struggling
                            </span>
                          ) : null}
                        </div>
                      </div>
                    )
                )}
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
                  <div className="font-display text-xl font-semibold">{lastYushoWinner.shikona}</div>
                  <div className="text-sm text-muted-foreground">
                    {RANK_HIERARCHY[lastYushoWinner.rank].nameJa} •{" "}
                    {world.heyas.get(lastYushoWinner.heyaId)?.name || lastYushoWinner.heyaId}
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
