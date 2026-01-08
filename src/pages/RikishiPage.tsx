// Rikishi Profile Page - Individual wrestler details
import { Helmet } from "react-helmet";
import { useNavigate, useParams } from "react-router-dom";
import { useGame } from "@/contexts/GameContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { RANK_HIERARCHY } from "@/engine/banzuke";
import { ARCHETYPE_PROFILES } from "@/engine/types";
import { getCareerPhase, PHASE_EFFECTS } from "@/engine/training";
import { KIMARITE_REGISTRY } from "@/engine/kimarite";
import { 
  ArrowLeft,
  Ruler,
  Scale,
  Swords,
  Trophy,
  TrendingUp,
  TrendingDown,
  Activity,
  Zap,
  Shield,
  Target,
  Flame
} from "lucide-react";

export default function RikishiPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { state } = useGame();
  const { world } = state;

  if (!world || !id) {
    navigate("/");
    return null;
  }

  const rikishi = world.rikishi.get(id);
  if (!rikishi) {
    navigate("/");
    return null;
  }

  const heya = world.heyas.get(rikishi.heyaId);
  const rankInfo = RANK_HIERARCHY[rikishi.rank];
  const archetypeProfile = ARCHETYPE_PROFILES[rikishi.archetype];
  const careerPhase = getCareerPhase(rikishi.experience);
  const phaseInfo = PHASE_EFFECTS[careerPhase];

  // Get favored kimarite names
  const favoredMoves = rikishi.favoredKimarite
    .map(id => KIMARITE_REGISTRY.find(k => k.id === id))
    .filter(Boolean);

  // Stats for display
  const stats = [
    { label: "Power", value: rikishi.power, icon: Flame, color: "text-destructive" },
    { label: "Speed", value: rikishi.speed, icon: Zap, color: "text-warning" },
    { label: "Balance", value: rikishi.balance, icon: Shield, color: "text-success" },
    { label: "Technique", value: rikishi.technique, icon: Target, color: "text-primary" },
  ];

  const archetypeLabels: Record<string, { ja: string; en: string }> = {
    oshi_specialist: { ja: "押し相撲", en: "Pusher/Thruster" },
    yotsu_specialist: { ja: "四つ相撲", en: "Belt Fighter" },
    speedster: { ja: "速攻", en: "Speedster" },
    trickster: { ja: "技師", en: "Technician" },
    all_rounder: { ja: "万能", en: "All-Rounder" }
  };

  const styleLabels: Record<string, { ja: string; en: string }> = {
    oshi: { ja: "押し", en: "Pushing" },
    yotsu: { ja: "四つ", en: "Belt" },
    hybrid: { ja: "万能", en: "Hybrid" }
  };

  return (
    <>
      <Helmet>
        <title>{rikishi.shikona} - Rikishi Profile</title>
      </Helmet>

      <div className="p-6 max-w-5xl mx-auto space-y-6">
        {/* Back button */}
        <Button variant="ghost" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Back
        </Button>

        {/* Header */}
        <div className="flex items-start gap-6">
          <div className={`w-2 h-24 rounded-full ${rikishi.side === "east" ? "bg-east" : "bg-west"}`} />
          <div className="flex-1">
            <h1 className="font-display text-4xl font-bold">{rikishi.shikona}</h1>
            <div className="flex items-center gap-3 mt-2">
              <Badge className={`rank-${rikishi.rank}`}>
                {rankInfo.nameJa}
                {rikishi.rankNumber && ` ${rikishi.rankNumber}枚目`}
              </Badge>
              <span className="text-muted-foreground">
                {rikishi.side === "east" ? "東" : "西"}
              </span>
              {heya && (
                <span className="text-muted-foreground">• {heya.name}</span>
              )}
            </div>
            <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Ruler className="h-4 w-4" />
                {rikishi.height}cm
              </span>
              <span className="flex items-center gap-1">
                <Scale className="h-4 w-4" />
                {rikishi.weight}kg
              </span>
              <span>{rikishi.nationality}</span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-3xl font-mono font-bold">
              {rikishi.careerWins}-{rikishi.careerLosses}
            </div>
            <div className="text-sm text-muted-foreground">Career Record</div>
            {rikishi.momentum !== 0 && (
              <div className={`flex items-center justify-end gap-1 mt-2 ${
                rikishi.momentum > 0 ? "text-success" : "text-destructive"
              }`}>
                {rikishi.momentum > 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                <span>{rikishi.momentum > 0 ? "Hot" : "Cold"} streak</span>
              </div>
            )}
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Stats */}
          <Card className="paper">
            <CardHeader>
              <CardTitle>Attributes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {stats.map(stat => (
                <div key={stat.label}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="flex items-center gap-2 text-sm">
                      <stat.icon className={`h-4 w-4 ${stat.color}`} />
                      {stat.label}
                    </span>
                    <span className="font-mono">{stat.value}</span>
                  </div>
                  <Progress value={stat.value} className="h-2" />
                </div>
              ))}
              
              <div className="pt-4 border-t space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Aggression</span>
                  <span className="font-mono">{rikishi.aggression}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Experience</span>
                  <span className="font-mono">{rikishi.experience}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Stamina</span>
                  <span className="font-mono">{rikishi.stamina}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Style & Archetype */}
          <Card className="paper">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Swords className="h-5 w-5" />
                Fighting Style
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-secondary/50 text-center">
                  <div className="text-2xl font-display">{styleLabels[rikishi.style].ja}</div>
                  <div className="text-sm text-muted-foreground">{styleLabels[rikishi.style].en}</div>
                </div>
                <div className="p-4 rounded-lg bg-secondary/50 text-center">
                  <div className="text-2xl font-display">{archetypeLabels[rikishi.archetype].ja}</div>
                  <div className="text-sm text-muted-foreground">{archetypeLabels[rikishi.archetype].en}</div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-sm font-medium">Archetype Traits</div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tachiai Bonus</span>
                    <span className={archetypeProfile.tachiaiBonus > 0 ? "text-success" : archetypeProfile.tachiaiBonus < 0 ? "text-destructive" : ""}>
                      {archetypeProfile.tachiaiBonus > 0 ? "+" : ""}{archetypeProfile.tachiaiBonus}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Grip Preference</span>
                    <span>{archetypeProfile.gripPreference > 0 ? "Belt" : archetypeProfile.gripPreference < 0 ? "Push" : "Neutral"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Volatility</span>
                    <span>{Math.round(archetypeProfile.volatility * 100)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Counter Bonus</span>
                    <span>{archetypeProfile.counterBonus > 0 ? "+" : ""}{archetypeProfile.counterBonus}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Favored Kimarite */}
          <Card className="paper">
            <CardHeader>
              <CardTitle>Signature Moves</CardTitle>
              <CardDescription>Preferred finishing techniques</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {favoredMoves.map(move => move && (
                  <div key={move.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/30">
                    <div>
                      <div className="font-display font-medium">{move.name}</div>
                      <div className="text-sm text-muted-foreground">{move.nameJa}</div>
                    </div>
                    <Badge variant="outline" className="capitalize">
                      {move.rarity}
                    </Badge>
                  </div>
                ))}
                {favoredMoves.length === 0 && (
                  <p className="text-sm text-muted-foreground">No signature moves developed yet.</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Career Phase */}
          <Card className="paper">
            <CardHeader>
              <CardTitle>Career Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 rounded-lg bg-secondary/50">
                <div className="text-lg font-display capitalize">{careerPhase} Phase</div>
                <div className="text-sm text-muted-foreground">{phaseInfo.description}</div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Growth Rate</span>
                  <div className={`font-mono ${phaseInfo.growthMod > 1 ? "text-success" : phaseInfo.growthMod < 1 ? "text-destructive" : ""}`}>
                    {Math.round(phaseInfo.growthMod * 100)}%
                  </div>
                </div>
                <div>
                  <span className="text-muted-foreground">Injury Risk</span>
                  <div className={`font-mono ${phaseInfo.injurySensitivity < 1 ? "text-success" : phaseInfo.injurySensitivity > 1 ? "text-destructive" : ""}`}>
                    {Math.round(phaseInfo.injurySensitivity * 100)}%
                  </div>
                </div>
              </div>

              {rikishi.injured && (
                <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                  <div className="flex items-center gap-2 text-destructive">
                    <Activity className="h-4 w-4" />
                    <span className="font-medium">Injured</span>
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    {rikishi.injuryWeeksRemaining} weeks remaining
                  </div>
                </div>
              )}

              <div className="pt-4 border-t">
                <div className="text-sm font-medium mb-2">Current Basho</div>
                <div className="text-2xl font-mono">
                  {rikishi.currentBashoWins}-{rikishi.currentBashoLosses}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
