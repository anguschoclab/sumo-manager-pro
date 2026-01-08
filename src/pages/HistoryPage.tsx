// History Page - Past basho results and records
import { Helmet } from "react-helmet";
import { useNavigate } from "react-router-dom";
import { useGame } from "@/contexts/GameContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BASHO_CALENDAR } from "@/engine/calendar";
import { RANK_HIERARCHY } from "@/engine/banzuke";
import { 
  Trophy,
  Medal,
  Award,
  Star,
  ArrowLeft,
  Calendar
} from "lucide-react";

export default function HistoryPage() {
  const navigate = useNavigate();
  const { state, getRikishi } = useGame();
  const { world } = state;

  if (!world) {
    navigate("/");
    return null;
  }

  const history = [...world.history].reverse();

  return (
    <>
      <Helmet>
        <title>History - Stable Lords</title>
      </Helmet>

      <div className="p-6 max-w-5xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate("/")}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Back
          </Button>
          <div>
            <h1 className="font-display text-3xl font-bold">Tournament History</h1>
            <p className="text-muted-foreground">
              {history.length} tournaments completed
            </p>
          </div>
        </div>

        {history.length === 0 ? (
          <Card className="paper">
            <CardContent className="p-12 text-center">
              <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-display text-xl font-semibold mb-2">No History Yet</h3>
              <p className="text-muted-foreground mb-4">
                Complete your first basho to see results here.
              </p>
              <Button onClick={() => navigate("/")}>
                Return to Dashboard
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {history.map((basho, idx) => {
              const bashoInfo = BASHO_CALENDAR[basho.bashoName];
              const yushoRikishi = getRikishi(basho.yusho);
              const yushoHeya = yushoRikishi ? world.heyas.get(yushoRikishi.heyaId) : null;

              return (
                <Card key={idx} className="paper">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="font-display text-2xl flex items-center gap-3">
                          {bashoInfo.nameJa}
                          <Badge variant="outline">{bashoInfo.nameEn}</Badge>
                        </CardTitle>
                        <CardDescription className="flex items-center gap-3 mt-1">
                          <span>{basho.year}年</span>
                          <span>{bashoInfo.location}</span>
                        </CardDescription>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-muted-foreground">Prize Money</div>
                        <div className="font-mono">¥{(basho.prizes.yushoAmount / 1_000_000).toFixed(0)}M</div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 md:grid-cols-2">
                      {/* Yusho Winner */}
                      {yushoRikishi && (
                        <div 
                          className="p-4 rounded-lg bg-gradient-to-br from-amber-100 to-amber-50 dark:from-amber-900/20 dark:to-amber-800/10 border border-amber-200 dark:border-amber-800 cursor-pointer hover:opacity-90 transition-opacity"
                          onClick={() => navigate(`/rikishi/${yushoRikishi.id}`)}
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <Trophy className="h-5 w-5 text-amber-600" />
                            <span className="text-sm font-medium text-amber-800 dark:text-amber-400">優勝 Yusho</span>
                          </div>
                          <div className="font-display text-xl font-bold">{yushoRikishi.shikona}</div>
                          <div className="text-sm text-muted-foreground">
                            {RANK_HIERARCHY[yushoRikishi.rank].nameJa} • {yushoHeya?.name}
                          </div>
                        </div>
                      )}

                      {/* Jun-Yusho */}
                      {basho.junYusho.length > 0 && (
                        <div className="p-4 rounded-lg bg-secondary/50">
                          <div className="flex items-center gap-2 mb-2">
                            <Medal className="h-5 w-5 text-muted-foreground" />
                            <span className="text-sm font-medium">準優勝 Jun-Yusho</span>
                          </div>
                          <div className="space-y-1">
                            {basho.junYusho.slice(0, 3).map(id => {
                              const rikishi = getRikishi(id);
                              return rikishi && (
                                <div 
                                  key={id}
                                  className="font-display cursor-pointer hover:text-primary"
                                  onClick={() => navigate(`/rikishi/${id}`)}
                                >
                                  {rikishi.shikona}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Special Prizes */}
                      <div className="md:col-span-2 grid grid-cols-3 gap-3">
                        {basho.shukunsho && (
                          <div className="p-3 rounded-lg bg-secondary/30 text-center">
                            <Award className="h-4 w-4 mx-auto mb-1 text-amber-500" />
                            <div className="text-xs text-muted-foreground">殊勲賞</div>
                            <div className="text-sm font-display">
                              {getRikishi(basho.shukunsho)?.shikona || "—"}
                            </div>
                          </div>
                        )}
                        {basho.kantosho && (
                          <div className="p-3 rounded-lg bg-secondary/30 text-center">
                            <Star className="h-4 w-4 mx-auto mb-1 text-rose-500" />
                            <div className="text-xs text-muted-foreground">敢闘賞</div>
                            <div className="text-sm font-display">
                              {getRikishi(basho.kantosho)?.shikona || "—"}
                            </div>
                          </div>
                        )}
                        {basho.ginoSho && (
                          <div className="p-3 rounded-lg bg-secondary/30 text-center">
                            <Medal className="h-4 w-4 mx-auto mb-1 text-sky-500" />
                            <div className="text-xs text-muted-foreground">技能賞</div>
                            <div className="text-sm font-display">
                              {getRikishi(basho.ginoSho)?.shikona || "—"}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
