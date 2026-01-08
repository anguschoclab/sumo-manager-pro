// Stable Management Page - Training, roster, and facilities
import { Helmet } from "react-helmet";
import { useNavigate } from "react-router-dom";
import { useGame } from "@/contexts/GameContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RANK_HIERARCHY } from "@/engine/banzuke";
import { 
  INTENSITY_EFFECTS, 
  FOCUS_EFFECTS, 
  RECOVERY_EFFECTS,
  FOCUS_MODE_EFFECTS,
  getIntensityLabel,
  getFocusLabel,
  getStyleBiasLabel,
  getRecoveryLabel,
  getFocusModeLabel,
  getCareerPhase,
  type TrainingIntensity,
  type TrainingFocus,
  type StyleBias,
  type RecoveryEmphasis,
  type FocusMode,
  type BeyaTrainingState,
  createDefaultTrainingState
} from "@/engine/training";
import { 
  Users, 
  Dumbbell, 
  Activity, 
  TrendingUp,
  TrendingDown,
  Heart,
  Zap,
  Shield,
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
          <Badge variant="outline" className="text-lg px-4 py-2">
            Reputation: {heya.reputation}
          </Badge>
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
                          <div className="flex gap-2 text-xs">
                            <span className={effect.growthMult > 1 ? "text-success" : effect.growthMult < 1 ? "text-destructive" : ""}>
                              Growth: {Math.round(effect.growthMult * 100)}%
                            </span>
                            <span className={effect.injuryRisk > 1 ? "text-destructive" : effect.injuryRisk < 1 ? "text-success" : ""}>
                              Risk: {Math.round(effect.injuryRisk * 100)}%
                            </span>
                          </div>
                        </div>
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
                        <div className="flex items-center justify-between">
                          <span className="font-display font-medium">
                            {label.ja} <span className="text-sm opacity-80">({label.en})</span>
                          </span>
                          <div className="flex gap-3 text-xs">
                            <span className={effect.power > 1 ? "text-success" : effect.power < 1 ? "text-destructive" : ""}>
                              力{Math.round(effect.power * 100)}%
                            </span>
                            <span className={effect.speed > 1 ? "text-success" : effect.speed < 1 ? "text-destructive" : ""}>
                              速{Math.round(effect.speed * 100)}%
                            </span>
                            <span className={effect.technique > 1 ? "text-success" : effect.technique < 1 ? "text-destructive" : ""}>
                              技{Math.round(effect.technique * 100)}%
                            </span>
                          </div>
                        </div>
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
                          <div className="mt-2 text-xs">
                            <div className={effect.fatigueDecay > 1 ? "text-success" : effect.fatigueDecay < 1 ? "text-destructive" : ""}>
                              Fatigue Recovery: {Math.round(effect.fatigueDecay * 100)}%
                            </div>
                            <div className={effect.injuryRecovery > 1 ? "text-success" : effect.injuryRecovery < 1 ? "text-destructive" : ""}>
                              Injury Healing: {Math.round(effect.injuryRecovery * 100)}%
                            </div>
                          </div>
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
                          <span className="capitalize">{phase}</span>
                          {focus && (
                            <Badge variant="secondary" className="text-xs">
                              {getFocusModeLabel(focus.mode).en}
                            </Badge>
                          )}
                        </div>
                        <div className="mt-2 flex gap-1">
                          {rikishi.momentum > 0 && <TrendingUp className="h-3 w-3 text-success" />}
                          {rikishi.momentum < 0 && <TrendingDown className="h-3 w-3 text-destructive" />}
                          {rikishi.injured && <Activity className="h-3 w-3 text-destructive" />}
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
                          <div className="text-sm font-mono">
                            {rikishi.currentBashoWins}-{rikishi.currentBashoLosses}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Career: {rikishi.careerWins}-{rikishi.careerLosses}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          {rikishi.momentum > 0 && <TrendingUp className="h-4 w-4 text-success" />}
                          {rikishi.momentum < 0 && <TrendingDown className="h-4 w-4 text-destructive" />}
                          {rikishi.injured && <Activity className="h-4 w-4 text-destructive" />}
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
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Quality</span>
                      <span>{heya.facilities.training}/100</span>
                    </div>
                    <Progress value={heya.facilities.training} />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Better facilities improve training effectiveness and reduce injury risk.
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
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Quality</span>
                      <span>{heya.facilities.recovery}/100</span>
                    </div>
                    <Progress value={heya.facilities.recovery} />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Improved recovery facilities help wrestlers heal faster and manage fatigue.
                  </p>
                </CardContent>
              </Card>

              <Card className="paper">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ChefHat className="h-5 w-5" />
                    Nutrition Program
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Quality</span>
                      <span>{heya.facilities.nutrition}/100</span>
                    </div>
                    <Progress value={heya.facilities.nutrition} />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Quality nutrition supports optimal weight management and stamina.
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card className="paper">
              <CardHeader>
                <CardTitle>Stable Finances</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="p-4 rounded-lg bg-secondary/50">
                    <div className="text-sm text-muted-foreground">Available Funds</div>
                    <div className="text-2xl font-bold font-display">
                      ¥{(heya.funds / 1_000_000).toFixed(1)}M
                    </div>
                  </div>
                  <div className="p-4 rounded-lg bg-secondary/50">
                    <div className="text-sm text-muted-foreground">Monthly Expenses</div>
                    <div className="text-2xl font-bold font-display">
                      ¥{(sekitori.length * 1.5).toFixed(1)}M
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
