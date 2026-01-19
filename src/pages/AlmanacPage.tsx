// Almanac Page - Historical records, career summaries, and deep links
// Per Constitution §8: "The Almanac is the memory of the world."

import { useState, useMemo } from "react";
import { Helmet } from "react-helmet";
import { Link, useNavigate } from "react-router-dom";
import { useGame } from "@/contexts/GameContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { RANK_HIERARCHY } from "@/engine/banzuke";
import type { Rikishi, Heya } from "@/engine/types";
import { RikishiName, StableName } from "@/components/ClickableName";
import {
  Trophy,
  Search,
  Users,
  Crown,
  Medal,
  TrendingUp,
  Building2,
  Scroll,
  Star,
  ChevronRight
} from "lucide-react";

// Compute career stats for almanac display
function computeCareerStats(rikishi: Rikishi) {
  const totalBouts = (rikishi.careerWins || 0) + (rikishi.careerLosses || 0);
  const winRate =
    totalBouts > 0 ? (((rikishi.careerWins || 0) / totalBouts) * 100).toFixed(1) : "0.0";
  const estimatedBasho = Math.floor(totalBouts / 15);
  return { winRate, totalBouts, estimatedBasho };
}

// Get stable tier color
function getStableTierColor(statureBand: string): string {
  const colors: Record<string, string> = {
    legendary: "text-amber-400",
    powerful: "text-purple-400",
    established: "text-blue-400",
    rebuilding: "text-orange-400",
    fragile: "text-red-400",
    new: "text-emerald-400"
  };
  return colors[statureBand] || "text-muted-foreground";
}

export default function AlmanacPage() {
  const navigate = useNavigate();
  const { state } = useGame();
  const { world } = state;

  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("rikishi");

  if (!world) {
    navigate("/");
    return null;
  }

  const getRikishiById = (id: string): Rikishi | null => {
    return world.rikishi.get(id) ?? null;
  };

  // Get all rikishi sorted by rank tier then career wins
  const allRikishi = useMemo(() => {
    return Array.from(world.rikishi.values()).sort((a, b) => {
      const tierA = RANK_HIERARCHY[a.rank]?.tier ?? 999;
      const tierB = RANK_HIERARCHY[b.rank]?.tier ?? 999;
      if (tierA !== tierB) return tierA - tierB;
      return (b.careerWins || 0) - (a.careerWins || 0);
    });
  }, [world.rikishi]);

  // Get all heya sorted by stature
  const allHeya = useMemo(() => {
    const statureOrder = ["legendary", "powerful", "established", "rebuilding", "fragile", "new"];
    return Array.from(world.heyas.values()).sort((a, b) => {
      const orderA = statureOrder.indexOf(a.statureBand);
      const orderB = statureOrder.indexOf(b.statureBand);
      return (orderA === -1 ? 999 : orderA) - (orderB === -1 ? 999 : orderB);
    });
  }, [world.heyas]);

  // Filter by search
  const filteredRikishi = useMemo(() => {
    if (!searchQuery) return allRikishi;
    const query = searchQuery.toLowerCase();
    return allRikishi.filter((r) => {
      const shikona = (r.shikona || "").toLowerCase();
      const nat = (r.nationality || "").toLowerCase();
      return shikona.includes(query) || nat.includes(query);
    });
  }, [allRikishi, searchQuery]);

  const filteredHeya = useMemo(() => {
    if (!searchQuery) return allHeya;
    const query = searchQuery.toLowerCase();
    return allHeya.filter((h) => {
      const name = (h.name || "").toLowerCase();
      const ja = h.nameJa || "";
      return name.includes(query) || ja.includes(searchQuery);
    });
  }, [allHeya, searchQuery]);

  // Career wins leaders
  const topChampions = useMemo(() => {
    return [...allRikishi].sort((a, b) => (b.careerWins || 0) - (a.careerWins || 0)).slice(0, 10);
  }, [allRikishi]);

  // Historical yusho winners from world.history
  const yushoWinners = useMemo(() => {
    const counts = new Map<string, number>();
    for (const record of world.history || []) {
      if (record?.yusho) counts.set(record.yusho, (counts.get(record.yusho) || 0) + 1);
    }
    return Array.from(counts.entries())
      .map(([id, count]) => ({ rikishi: getRikishiById(id), count }))
      .filter((e) => e.rikishi)
      .sort((a, b) => b.count - a.count);
  }, [world.history, world.rikishi]);

  return (
    <>
      <Helmet>
        <title>Almanac - Historical Records</title>
      </Helmet>

      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-3xl font-bold flex items-center gap-3">
              <Scroll className="h-8 w-8" />
              力士名鑑
            </h1>
            <p className="text-muted-foreground">Almanac - The Memory of the World</p>
          </div>
          <Badge variant="outline" className="text-lg px-4 py-2">
            Year {world.year}
          </Badge>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search rikishi or heya..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Quick Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="paper">
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <Users className="h-8 w-8 text-primary" />
                <div>
                  <div className="text-2xl font-bold">{allRikishi.length}</div>
                  <div className="text-sm text-muted-foreground">Active Rikishi</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="paper">
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <Building2 className="h-8 w-8 text-primary" />
                <div>
                  <div className="text-2xl font-bold">{allHeya.length}</div>
                  <div className="text-sm text-muted-foreground">Active Heya</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="paper">
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <Trophy className="h-8 w-8 text-amber-400" />
                <div>
                  <div className="text-2xl font-bold">{(world.history || []).length}</div>
                  <div className="text-sm text-muted-foreground">Basho Completed</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="paper">
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <Crown className="h-8 w-8 text-amber-400" />
                <div>
                  <div className="text-2xl font-bold">{allRikishi.filter((r) => r.rank === "yokozuna").length}</div>
                  <div className="text-sm text-muted-foreground">Active Yokozuna</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full max-w-lg grid-cols-4">
            <TabsTrigger value="rikishi">Rikishi</TabsTrigger>
            <TabsTrigger value="heya">Heya</TabsTrigger>
            <TabsTrigger value="champions">Champions</TabsTrigger>
            <TabsTrigger value="records">Records</TabsTrigger>
          </TabsList>

          {/* Rikishi Tab */}
          <TabsContent value="rikishi">
            <Card className="paper">
              <CardHeader>
                <CardTitle>力士一覧 - Rikishi Directory</CardTitle>
                <CardDescription>{filteredRikishi.length} wrestlers • Click to view profile</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[500px]">
                  <div className="space-y-2">
                    {filteredRikishi.map((rikishi) => {
                      const stats = computeCareerStats(rikishi);
                      const heya = world.heyas.get(rikishi.heyaId);
                      const rankJa = RANK_HIERARCHY[rikishi.rank]?.nameJa ?? rikishi.rank;

                      return (
                        <Link
                          key={rikishi.id}
                          to={`/rikishi/${rikishi.id}`}
                          className="flex items-center gap-4 p-3 rounded-lg bg-secondary/30 hover:bg-secondary/60 transition-colors group"
                        >
                          <div className={`w-1 h-12 rounded-full ${rikishi.side === "east" ? "bg-east" : "bg-west"}`} />

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-display font-bold truncate">{rikishi.shikona}</span>
                              <Badge variant="outline" className={`rank-${rikishi.rank} text-xs`}>
                                {rankJa}
                              </Badge>
                            </div>

                            <div className="text-xs text-muted-foreground flex items-center gap-2">
                              {heya ? <span className="hover:text-primary">{heya.name}</span> : <span>—</span>}
                              <span>•</span>
                              <span>{rikishi.nationality}</span>
                            </div>
                          </div>

                          <div className="text-right">
                            <div className="font-mono font-bold">
                              {rikishi.careerWins}-{rikishi.careerLosses}
                            </div>
                            <div className="text-xs text-muted-foreground">{stats.winRate}% win rate</div>
                          </div>

                          <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
                        </Link>
                      );
                    })}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Heya Tab */}
          <TabsContent value="heya">
            <Card className="paper">
              <CardHeader>
                <CardTitle>部屋一覧 - Stable Directory</CardTitle>
                <CardDescription>{filteredHeya.length} active stables • Click to view details</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[500px]">
                  <div className="space-y-2">
                    {filteredHeya.map((heya: Heya) => {
                      const rosterIds = heya.rikishiIds || [];
                      const rosterCount = rosterIds.length;
                      const sekitoriCount = rosterIds
                        .map((id) => world.rikishi.get(id))
                        .filter((r) => r && RANK_HIERARCHY[r.rank]?.isSekitori)
                        .length;

                      return (
                        <Link
                          key={heya.id}
                          to={`/stable/${heya.id}`}
                          className="flex items-center gap-4 p-3 rounded-lg bg-secondary/30 hover:bg-secondary/60 transition-colors group"
                        >
                          <Building2 className={`h-8 w-8 ${getStableTierColor(heya.statureBand)}`} />

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-display font-bold truncate">{heya.name}</span>
                              {heya.nameJa && <span className="text-muted-foreground text-sm">{heya.nameJa}</span>}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {heya.descriptor || `${heya.statureBand} stable`}
                            </div>
                          </div>

                          <div className="text-right">
                            <div className="font-bold">{rosterCount} wrestlers</div>
                            <div className="text-xs text-muted-foreground">{sekitoriCount} sekitori</div>
                          </div>

                          <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
                        </Link>
                      );
                    })}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Champions Tab */}
          <TabsContent value="champions">
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Yusho Winners */}
              <Card className="paper">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-amber-400" />
                    優勝回数 - Yusho Count
                  </CardTitle>
                  <CardDescription>Championship victories in recorded history</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {yushoWinners.length === 0 ? (
                      <p className="text-muted-foreground text-center py-8">No tournaments completed yet</p>
                    ) : (
                      yushoWinners.slice(0, 10).map((entry, idx) => (
                        <Link
                          key={entry.rikishi!.id}
                          to={`/rikishi/${entry.rikishi!.id}`}
                          className="flex items-center gap-3 p-2 rounded-lg hover:bg-secondary/50 transition-colors"
                        >
                          <span className="w-6 text-center font-bold text-muted-foreground">{idx + 1}</span>
                          {idx === 0 && <Crown className="h-4 w-4 text-amber-400" />}
                          {idx === 1 && <Medal className="h-4 w-4 text-gray-400" />}
                          {idx === 2 && <Medal className="h-4 w-4 text-amber-600" />}
                          <span className="flex-1 font-display">{entry.rikishi!.shikona}</span>
                          <span className="font-mono font-bold text-amber-400">{entry.count} 優勝</span>
                        </Link>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Career Wins Leaders */}
              <Card className="paper">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-success" />
                    通算勝利 - Career Wins
                  </CardTitle>
                  <CardDescription>Most career victories</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {topChampions.map((rikishi, idx) => (
                      <Link
                        key={rikishi.id}
                        to={`/rikishi/${rikishi.id}`}
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-secondary/50 transition-colors"
                      >
                        <span className="w-6 text-center font-bold text-muted-foreground">{idx + 1}</span>
                        {idx < 3 && <Star className="h-4 w-4 text-amber-400" fill="currentColor" />}
                        <span className="flex-1 font-display">{rikishi.shikona}</span>
                        <span className="font-mono font-bold">{rikishi.careerWins}勝</span>
                      </Link>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Records Tab */}
          <TabsContent value="records">
            <Card className="paper">
              <CardHeader>
                <CardTitle>記録 - Historical Records</CardTitle>
                <CardDescription>Notable achievements and milestones</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Best Win Rate */}
                  {allRikishi.length > 0 &&
                    (() => {
                      const candidates = [...allRikishi].filter((r) => (r.careerWins || 0) + (r.careerLosses || 0) >= 30);
                      const best =
                        candidates.sort((a, b) => {
                          const ra = (a.careerWins || 0) / Math.max(1, (a.careerWins || 0) + (a.careerLosses || 0));
                          const rb = (b.careerWins || 0) / Math.max(1, (b.careerWins || 0) + (b.careerLosses || 0));
                          return rb - ra;
                        })[0] ?? null;

                      if (!best) return null;

                      const denom = Math.max(1, (best.careerWins || 0) + (best.careerLosses || 0));
                      const rate = (((best.careerWins || 0) / denom) * 100).toFixed(1);

                      return (
                        <div className="p-4 rounded-lg bg-secondary/50">
                          <div className="text-sm text-muted-foreground">Best Career Win Rate (min 30 bouts)</div>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="font-display font-bold text-lg">
                              <RikishiName id={best.id} name={best.shikona} />
                            </span>
                            <span className="font-mono text-success">{rate}%</span>
                          </div>
                        </div>
                      );
                    })()}

                  {/* Most Experienced */}
                  {allRikishi.length > 0 &&
                    (() => {
                      const most = [...allRikishi].sort(
                        (a, b) =>
                          ((b.careerWins || 0) + (b.careerLosses || 0)) - ((a.careerWins || 0) + (a.careerLosses || 0))
                      )[0];

                      const bouts = (most.careerWins || 0) + (most.careerLosses || 0);

                      return (
                        <div className="p-4 rounded-lg bg-secondary/50">
                          <div className="text-sm text-muted-foreground">Most Career Bouts</div>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="font-display font-bold text-lg">
                              <RikishiName id={most.id} name={most.shikona} />
                            </span>
                            <span className="font-mono">{bouts} bouts</span>
                          </div>
                        </div>
                      );
                    })()}

                  {/* Largest Stable */}
                  {allHeya.length > 0 &&
                    (() => {
                      const largest = [...allHeya].sort((a, b) => (b.rikishiIds?.length || 0) - (a.rikishiIds?.length || 0))[0];

                      return (
                        <div className="p-4 rounded-lg bg-secondary/50">
                          <div className="text-sm text-muted-foreground">Largest Active Stable</div>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="font-display font-bold text-lg">
                              <StableName id={largest.id} name={largest.name} />
                            </span>
                            <span className="font-mono">{largest.rikishiIds?.length || 0} wrestlers</span>
                          </div>
                        </div>
                      );
                    })()}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
