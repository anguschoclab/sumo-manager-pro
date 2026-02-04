import React, { useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useGame } from "@/contexts/GameContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertCircle, TrendingUp, Users, Trophy } from "lucide-react";
import { WeeklyDigest } from "@/components/game/WeeklyDigest";
import { TimeControls } from "@/components/game/TimeControls"; // NEW
import { NavLink } from "react-router-dom";

export default function Dashboard() {
  const { state, isLoaded, initializeGame } = useGame();

  useEffect(() => {
    if (isLoaded && !state) {
      initializeGame();
    }
  }, [isLoaded, state, initializeGame]);

  if (!isLoaded || !state) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-full">Loading...</div>
      </AppLayout>
    );
  }

  const playerHeya = state.playerHeyaId ? state.heyas.get(state.playerHeyaId) : null;
  const phase = state.cyclePhase || "active_basho";

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* HEADER SECTION */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Oyakata Dashboard</h1>
            <p className="text-muted-foreground">
              {state.year} {state.currentBashoName?.toUpperCase() || "PRE-SEASON"} | {playerHeya?.name || "No Stable"}
            </p>
          </div>
          {/* Phase Badge */}
          <Badge variant="outline" className="w-fit text-lg px-4 py-1 uppercase tracking-widest">
             {phase.replace("_", " ")}
          </Badge>
        </div>

        {/* TIME CONTROLS - PRIMARY ACTION AREA */}
        <TimeControls />

        {/* ALERTS & NOTIFICATIONS */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {/* Financial Status */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Stable Finances</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                <div className="text-2xl font-bold">
                    {playerHeya ? `¥${(playerHeya.funds / 1_000_000).toFixed(1)}M` : "—"}
                </div>
                <p className="text-xs text-muted-foreground">
                    {playerHeya?.riskIndicators.financial 
                    ? <span className="text-red-500 font-bold">High Insolvency Risk</span> 
                    : "Runway Secure"}
                </p>
                </CardContent>
            </Card>

            {/* Roster Status */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Roster</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                <div className="text-2xl font-bold">{playerHeya?.rikishiIds.length || 0} Rikishi</div>
                <p className="text-xs text-muted-foreground">
                    Avg Age: 24.5 | Injuries: {state.heyas.get(state.playerHeyaId!)?.rikishiIds.filter(id => state.rikishi.get(id)?.injured).length || 0}
                </p>
                </CardContent>
            </Card>

            {/* Basho Status */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Performance</CardTitle>
                <Trophy className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                <div className="text-2xl font-bold">
                    {state.currentBasho ? `Day ${state.currentBasho.day}` : "Off-Season"}
                </div>
                <p className="text-xs text-muted-foreground">
                    Leaders: {state.currentBasho?.standings ? "Data Avail" : "No Data"}
                </p>
                </CardContent>
            </Card>
        </div>
        
        {/* CONTEXTUAL CONTENT BASED ON PHASE */}
        {phase === "interim" ? (
             <div className="grid gap-6 md:grid-cols-2">
                <Card className="col-span-1">
                    <CardHeader>
                        <CardTitle>Training Focus</CardTitle>
                        <CardDescription>Adjust intensity for the off-season.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button asChild className="w-full">
                            <NavLink to="/stable">Manage Training</NavLink>
                        </Button>
                    </CardContent>
                </Card>
                 <Card className="col-span-1">
                    <CardHeader>
                        <CardTitle>Scouting Report</CardTitle>
                        <CardDescription>New recruits available.</CardDescription>
                    </CardHeader>
                     <CardContent>
                         <div className="text-sm text-muted-foreground mb-4">
                             The interim period is the best time to scout new talent.
                         </div>
                    </CardContent>
                </Card>
             </div>
        ) : (
            <WeeklyDigest />
        )}
      </div>
    </AppLayout>
  );
}
