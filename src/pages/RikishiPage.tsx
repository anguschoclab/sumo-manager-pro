// Rikishi Profile Page - Individual wrestler details with fog of war
// Per Scouting Doc: "You never know the truth — only what the ring has allowed you to see."
import { Helmet } from "react-helmet";
import { useNavigate, useParams } from "react-router-dom";
import { useGame } from "@/contexts/GameContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { RANK_HIERARCHY } from "@/engine/banzuke";
import { KIMARITE_REGISTRY } from "@/engine/kimarite";
import { getCareerPhase } from "@/engine/training";
import {
  describeAttributeVerbose,
  describeAggressionVerbose,
  describeExperienceVerbose,
  describeStaminaVerbose,
  describeMomentumVerbose,
  describeCareerPhaseVerbose,
  describeArchetypeVerbose,
  describeStyleVerbose,
  describeInjuryVerbose
} from "@/engine/narrativeDescriptions";
import {
  RANK_NAMES,
  STYLE_NAMES,
  ARCHETYPE_NAMES,
  createScoutedView,
  getScoutedAttributes,
  describeScoutingLevel,
  getConfidenceLevel
} from "@/engine/scouting";
import { 
  ArrowLeft,
  Ruler,
  Scale,
  Swords,
  Activity,
  Flame,
  Zap,
  Shield,
  Target,
  Search,
  Eye,
  EyeOff,
  HelpCircle
} from "lucide-react";

export default function RikishiPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { state } = useGame();
  const { world, playerHeyaId } = state;

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
  const rankNames = RANK_NAMES[rikishi.rank];
  const careerPhase = getCareerPhase(rikishi.experience);
  
  // Scouting - own stable wrestlers are fully scouted
  const isOwned = rikishi.heyaId === playerHeyaId;
  const scouted = createScoutedView(rikishi, playerHeyaId, isOwned ? 100 : 8);
  const scoutedAttrs = getScoutedAttributes(scouted);
  const scoutingInfo = describeScoutingLevel(scouted.scoutingLevel);
  const combatConfidence = getConfidenceLevel(scouted, "combat");

  // Get favored kimarite names
  const favoredMoves = rikishi.favoredKimarite
    .map(id => KIMARITE_REGISTRY.find(k => k.id === id))
    .filter(Boolean);

  // Attribute narratives with icons - respect fog of war
  const attributeNarratives = isOwned ? [
    { label: "Power", icon: Flame, color: "text-destructive", narrative: describeAttributeVerbose("power", rikishi.power) },
    { label: "Speed", icon: Zap, color: "text-warning", narrative: describeAttributeVerbose("speed", rikishi.speed) },
    { label: "Balance", icon: Shield, color: "text-success", narrative: describeAttributeVerbose("balance", rikishi.balance) },
    { label: "Technique", icon: Target, color: "text-primary", narrative: describeAttributeVerbose("technique", rikishi.technique) },
  ] : [
    { label: "Power", icon: Flame, color: "text-destructive", narrative: scoutedAttrs.power.narrative },
    { label: "Speed", icon: Zap, color: "text-warning", narrative: scoutedAttrs.speed.narrative },
    { label: "Balance", icon: Shield, color: "text-success", narrative: scoutedAttrs.balance.narrative },
    { label: "Technique", icon: Target, color: "text-primary", narrative: scoutedAttrs.technique.narrative },
  ];

  const archetypeInfo = ARCHETYPE_NAMES[rikishi.archetype] || { label: rikishi.archetype, labelJa: "", description: "" };
  const styleInfo = STYLE_NAMES[rikishi.style] || { label: rikishi.style, labelJa: "", description: "" };

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
                {rankNames.ja}
                {rikishi.rankNumber && ` ${rikishi.rankNumber}枚目`}
              </Badge>
              <span className="text-sm text-muted-foreground">
                {rankNames.en}{rikishi.rankNumber && ` ${rikishi.rankNumber}`}
              </span>
              <span className="text-muted-foreground">
                {rikishi.side === "east" ? "東 East" : "西 West"}
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
            {/* Win/Loss records are allowed per doc */}
            <div className="text-3xl font-mono font-bold">
              {rikishi.careerWins}-{rikishi.careerLosses}
            </div>
            <div className="text-sm text-muted-foreground">Career Record</div>
            {rikishi.momentum !== 0 && (
              <div className={`mt-2 text-sm ${
                rikishi.momentum > 0 ? "text-success" : "text-destructive"
              }`}>
                {describeMomentumVerbose(rikishi.momentum)}
              </div>
            )}
          </div>
        </div>

        {/* Scouting Level Indicator */}
        <Card className="paper">
          <CardContent className="pt-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Search className={`h-5 w-5 ${scoutingInfo.color}`} />
                <div>
                  <div className={`font-medium ${scoutingInfo.color}`}>
                    {scoutingInfo.label}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {scoutingInfo.description}
                  </div>
                </div>
              </div>
              <div className="flex-1">
                <Progress value={scouted.scoutingLevel} className="h-2" />
              </div>
              <div className="text-right">
                <div className="text-lg font-mono font-bold">
                  {Math.round(scouted.scoutingLevel)}%
                </div>
                <div className="text-xs text-muted-foreground">Intel</div>
              </div>
              {isOwned && (
                <Badge variant="default" className="ml-2">Your Stable</Badge>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Attributes - Narrative descriptions only */}
          <Card className="paper">
            <CardHeader>
              <CardTitle>Physical Profile</CardTitle>
              <CardDescription>Observations from training and competition</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {attributeNarratives.map(attr => (
                <div key={attr.label} className="space-y-1">
                  <div className="flex items-center gap-2">
                    <attr.icon className={`h-4 w-4 ${attr.color}`} />
                    <span className="font-medium text-sm">{attr.label}</span>
                  </div>
                  <p className="text-sm text-muted-foreground pl-6">
                    {attr.narrative}
                  </p>
                </div>
              ))}
              
              <div className="pt-4 border-t space-y-4">
                <div className="space-y-1">
                  <span className="text-sm font-medium">Temperament</span>
                  <p className="text-sm text-muted-foreground">
                    {describeAggressionVerbose(rikishi.aggression)}
                  </p>
                </div>
                <div className="space-y-1">
                  <span className="text-sm font-medium">Experience</span>
                  <p className="text-sm text-muted-foreground">
                    {describeExperienceVerbose(rikishi.experience)}
                  </p>
                </div>
                <div className="space-y-1">
                  <span className="text-sm font-medium">Conditioning</span>
                  <p className="text-sm text-muted-foreground">
                    {describeStaminaVerbose(rikishi.stamina)}
                  </p>
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
                  <div className="text-2xl font-display">{styleInfo.labelJa}</div>
                  <div className="text-sm text-muted-foreground">{styleInfo.label}</div>
                </div>
                <div className="p-4 rounded-lg bg-secondary/50 text-center">
                  <div className="text-2xl font-display">{archetypeInfo.labelJa}</div>
                  <div className="text-sm text-muted-foreground">{archetypeInfo.label}</div>
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  {describeStyleVerbose(rikishi.style)}
                </p>
                <p className="text-sm text-muted-foreground">
                  {describeArchetypeVerbose(rikishi.archetype)}
                </p>
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

          {/* Career Status */}
          <Card className="paper">
            <CardHeader>
              <CardTitle>Career Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 rounded-lg bg-secondary/50">
                <div className="text-lg font-display capitalize">{careerPhase} Phase</div>
                <p className="text-sm text-muted-foreground mt-1">
                  {describeCareerPhaseVerbose(careerPhase)}
                </p>
              </div>

              {rikishi.injured && (
                <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                  <div className="flex items-center gap-2 text-destructive">
                    <Activity className="h-4 w-4" />
                    <span className="font-medium">Injured</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {describeInjuryVerbose(rikishi.injuryWeeksRemaining)}
                  </p>
                </div>
              )}

              <div className="pt-4 border-t">
                <div className="text-sm font-medium mb-2">Current Basho</div>
                {/* Win/Loss records are allowed per doc */}
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
