// Stable Management Page - Training, roster, and facilities (Narrative-First per Master Context v1.4)
import { Helmet } from "react-helmet";
import { useNavigate } from "react-router-dom";
import { useGame } from "@/contexts/GameContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RANK_HIERARCHY } from "@/engine/banzuke";
import { 
  INTENSITY_EFFECTS, 
  FOCUS_EFFECTS, 
  RECOVERY_EFFECTS,
  getIntensityLabel,
  getFocusLabel,
  getRecoveryLabel,
  getFocusModeLabel,
  getCareerPhase,
  type TrainingIntensity,
  type TrainingFocus,
  type RecoveryEmphasis,
  type BeyaTrainingState,
  createDefaultTrainingState
} from "@/engine/training";
import {
  describeReputationVerbose,
  describeFacilityVerbose,
  describeTrainingEffect,
  describeMomentumVerbose
} from "@/engine/narrativeDescriptions";
import { 
  Users, 
  Dumbbell, 
  Activity, 
  TrendingUp,
  TrendingDown,
  Heart,
  Zap,
  Target,
  Building,
  ChefHat,
  Bed
} from "lucide-react";
import { useState } from "react";

export default function StablePage() {
  const navigate = useNavigate();
  const { state } = useGame();
  const { world, playerHeyaId } = state;

  // Local training state (would be persisted in real implementation)
  const [trainingState, setTrainingState] = useState<BeyaTrainingState>(
    createDefaultTrainingState(3)
  );

  if (!world || !playerHeyaId) {
    navigate("/");
    return null;
  }

  const heya = world.heyas.get(playerHeyaId);
  if (!heya) {
    navigate("/");
    return null;
  }

  const rikishiList = heya.rikishiIds
    .map(id => world.rikishi.get(id))
    .filter(Boolean)
    .sort((a, b) => {
      const tierA = RANK_HIERARCHY[a!.rank].tier;
      const tierB = RANK_HIERARCHY[b!.rank].tier;
      return tierA - tierB;
    });

  const sekitori = rikishiList.filter(r => r && RANK_HIERARCHY[r.rank].isSekitori);

  const handleIntensityChange = (intensity: TrainingIntensity) => {
    setTrainingState(prev => ({
      ...prev,
      profile: { ...prev.profile, intensity }
    }));
  };

  const handleFocusChange = (focus: TrainingFocus) => {
    setTrainingState(prev => ({
      ...prev,
      profile: { ...prev.profile, focus }
    }));
  };

  const handleRecoveryChange = (recovery: RecoveryEmphasis) => {
    setTrainingState(prev => ({
      ...prev,
      profile: { ...prev.profile, recovery }
    }));
  };

  const intensityEffect = INTENSITY_EFFECTS[trainingState.profile.intensity];
  const focusEffect = FOCUS_EFFECTS[trainingState.profile.focus];
  const recoveryEffect = RECOVERY_EFFECTS[trainingState.profile.recovery];

  return (
    <>
      <Helmet>
        <title>{heya.name} - Stable Management</title>
      </Helmet>

      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-3xl font-bold">{heya.name}</h1>
            <p className="text-muted-foreground">
              {rikishiList.length} wrestlers • {sekitori.length} sekitori
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Standing</p>
            <p className="text-sm font-medium">{describeReputationVerbose(heya.reputation)}</p>
          </div>
        </div>

        <Tabs defaultValue="training" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="training">Training</TabsTrigger>
            <TabsTrigger value="roster">Roster</TabsTrigger>
            <TabsTrigger value="facilities">Facilities</TabsTrigger>
          </TabsList>

          {/* Training Tab */}
          <TabsContent value="training" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Intensity */}
              <Card className="paper">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Dumbbell className="h-5 w-5" />
                    Training Intensity
                  </CardTitle>
                  <CardDescription>
                    {intensityEffect.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {(Object.keys(INTENSITY_EFFECTS) as TrainingIntensity[]).map(intensity => {
                    const label = getIntensityLabel(intensity);
                    const effect = INTENSITY_EFFECTS[intensity];
                    const isActive = trainingState.profile.intensity === intensity;
                    
                    return (
                      <button
                        key={intensity}
                        onClick={() => handleIntensityChange(intensity)}
                        className={`w-full p-3 rounded-lg text-left transition-colors ${
                          isActive 
                            ? "bg-primary text-primary-foreground" 
                            : "bg-secondary/50 hover:bg-secondary"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-display font-medium">
                            {label.ja} <span className="text-sm opacity-80">({label.en})</span>
                          </span>
                          <div className="flex gap-3 text-xs">
                            <span className={effect.growthMult > 1 ? (isActive ? "" : "text-success") : effect.growthMult < 1 ? (isActive ? "" : "text-destructive") : ""}>
                              Growth: {describeTrainingEffect(effect.growthMult)}
                            </span>
                          </div>
                        </div>
                        <p className="text-xs mt-1 opacity-70">
                          {effect.injuryRisk > 1.2 ? "Higher injury risk" : effect.injuryRisk < 0.9 ? "Lower injury risk" : "Standard injury risk"}
                        </p>
                      </button>
                    );
                  })}
                </CardContent>
              </Card>

              {/* Focus */}
              <Card className="paper">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Training Focus
                  </CardTitle>
                  <CardDescription>
                    {focusEffect.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {(Object.keys(FOCUS_EFFECTS) as TrainingFocus[]).map(focus => {
                    const label = getFocusLabel(focus);
                    const effect = FOCUS_EFFECTS[focus];
                    const isActive = trainingState.profile.focus === focus;
                    
                    // Determine emphasis description
                    const emphases: string[] = [];
                    if (effect.power > 1) emphases.push("power");
                    if (effect.speed > 1) emphases.push("speed");
                    if (effect.technique > 1) emphases.push("technique");
                    if (effect.balance > 1) emphases.push("balance");
                    
                    const emphasisText = emphases.length > 0 
                      ? `Emphasizes ${emphases.join(" and ")}`
                      : "Balanced development";
                    
                    return (
                      <button
                        key={focus}
                        onClick={() => handleFocusChange(focus)}
                        className={`w-full p-3 rounded-lg text-left transition-colors ${
                          isActive 
                            ? "bg-primary text-primary-foreground" 
                            : "bg-secondary/50 hover:bg-secondary"
                        }`}
                      >
                        <div className="font-display font-medium">
                          {label.ja} <span className="text-sm opacity-80">({label.en})</span>
                        </div>
                        <p className="text-xs mt-1 opacity-70">{emphasisText}</p>
                      </button>
                    );
                  })}
                </CardContent>
              </Card>

              {/* Recovery */}
              <Card className="paper lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Heart className="h-5 w-5" />
                    Recovery Emphasis
                  </CardTitle>
                  <CardDescription>
                    {recoveryEffect.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-3">
                    {(Object.keys(RECOVERY_EFFECTS) as RecoveryEmphasis[]).map(recovery => {
                      const label = getRecoveryLabel(recovery);
                      const effect = RECOVERY_EFFECTS[recovery];
                      const isActive = trainingState.profile.recovery === recovery;
                      
                      // Narrative description
                      let narrative = "Standard recovery protocols";
                      if (effect.fatigueDecay > 1.2) narrative = "Prioritizes rest and rejuvenation";
                      else if (effect.fatigueDecay < 0.9) narrative = "Minimal rest periods";
                      
                      return (
                        <button
                          key={recovery}
                          onClick={() => handleRecoveryChange(recovery)}
                          className={`flex-1 p-4 rounded-lg text-center transition-colors ${
                            isActive 
                              ? "bg-primary text-primary-foreground" 
                              : "bg-secondary/50 hover:bg-secondary"
                          }`}
                        >
                          <div className="font-display font-medium text-lg">
                            {label.ja}
                          </div>
                          <div className="text-sm opacity-80">{label.en}</div>
                          <p className="mt-2 text-xs opacity-70">{narrative}</p>
                        </button>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Focus Slots */}
            <Card className="paper">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Individual Focus ({trainingState.focusSlots.length}/{trainingState.maxFocusSlots} slots)
                </CardTitle>
                <CardDescription>
                  Assign specific training programs to key wrestlers
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                  {sekitori.slice(0, 6).map(rikishi => {
                    if (!rikishi) return null;
                    const focus = trainingState.focusSlots.find(f => f.rikishiId === rikishi.id);
                    const phase = getCareerPhase(rikishi.experience);
                    
                    return (
                      <div 
                        key={rikishi.id}
                        className="p-4 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors cursor-pointer"
                        onClick={() => navigate(`/rikishi/${rikishi.id}`)}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-display font-medium">{rikishi.shikona}</span>
                          <Badge variant="outline" className="text-xs">
                            {RANK_HIERARCHY[rikishi.rank].nameJa}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span className="capitalize">{phase} phase</span>
                          {focus && (
                            <Badge variant="secondary" className="text-xs">
                              {getFocusModeLabel(focus.mode).en}
                            </Badge>
                          )}
                        </div>
                        <div className="mt-2 flex gap-1 items-center">
                          {rikishi.momentum !== 0 && (
                            <>
                              {rikishi.momentum > 0 ? <TrendingUp className="h-3 w-3 text-success" /> : <TrendingDown className="h-3 w-3 text-destructive" />}
                              <span className="text-xs text-muted-foreground">
                                {rikishi.momentum > 0 ? "Rising form" : "Struggling"}
                              </span>
                            </>
                          )}
                          {rikishi.injured && (
                            <>
                              <Activity className="h-3 w-3 text-destructive" />
                              <span className="text-xs text-destructive">Injured</span>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Roster Tab */}
          <TabsContent value="roster" className="space-y-4">
            <Card className="paper">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Full Roster
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {rikishiList.map(rikishi => {
                    if (!rikishi) return null;
                    const rankInfo = RANK_HIERARCHY[rikishi.rank];
                    
                    return (
                      <div 
                        key={rikishi.id}
                        className="flex items-center gap-4 p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors cursor-pointer"
                        onClick={() => navigate(`/rikishi/${rikishi.id}`)}
                      >
                        <div className={`w-1 h-10 rounded-full ${rikishi.side === "east" ? "bg-east" : "bg-west"}`} />
                        <div className="flex-1 min-w-0">
                          <div className="font-display font-medium">{rikishi.shikona}</div>
                          <div className="text-sm text-muted-foreground">
                            {rankInfo.nameJa}
                            {rikishi.rankNumber && ` ${rikishi.rankNumber}枚目`}
                          </div>
                        </div>
                        <div className="text-right">
                          {/* Win/Loss records are allowed per doc */}
                          <div className="text-sm font-mono">
                            {rikishi.currentBashoWins}-{rikishi.currentBashoLosses}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Career: {rikishi.careerWins}-{rikishi.careerLosses}
                          </div>
                        </div>
                        <div className="flex gap-2 items-center">
                          {rikishi.momentum !== 0 && (
                            rikishi.momentum > 0 ? (
                              <span className="text-xs text-success flex items-center gap-1">
                                <TrendingUp className="h-3 w-3" /> Hot
                              </span>
                            ) : (
                              <span className="text-xs text-destructive flex items-center gap-1">
                                <TrendingDown className="h-3 w-3" /> Cold
                              </span>
                            )
                          )}
                          {rikishi.injured && (
                            <span className="text-xs text-destructive flex items-center gap-1">
                              <Activity className="h-3 w-3" /> Injured
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Facilities Tab */}
          <TabsContent value="facilities" className="space-y-4">
            <div className="grid gap-6 md:grid-cols-3">
              <Card className="paper">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building className="h-5 w-5" />
                    Training Facilities
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    {describeFacilityVerbose("training", heya.facilities.training)}
                  </p>
                </CardContent>
              </Card>

              <Card className="paper">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bed className="h-5 w-5" />
                    Recovery Center
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    {describeFacilityVerbose("recovery", heya.facilities.recovery)}
                  </p>
                </CardContent>
              </Card>

              <Card className="paper">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ChefHat className="h-5 w-5" />
                    Kitchen & Nutrition
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    {describeFacilityVerbose("nutrition", heya.facilities.nutrition)}
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card className="paper">
              <CardHeader>
                <CardTitle>About Facilities</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  The quality of a stable's facilities directly impacts wrestler development. 
                  Better training equipment produces faster growth. Superior recovery centers 
                  speed healing and reduce fatigue. And excellent nutrition keeps wrestlers 
                  healthy and at fighting weight throughout the grueling basho schedule.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
