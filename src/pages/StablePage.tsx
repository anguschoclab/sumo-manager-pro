// Stable Management Page - Training, roster, and facilities 
// Narrative-First per Master Context v2.2 - No raw numbers for hidden attributes
import { Helmet } from "react-helmet";
import { useNavigate } from "react-router-dom";
import { useGame } from "@/contexts/GameContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RANK_HIERARCHY } from "@/engine/banzuke";
import type { StatureBand, PrestigeBand, RunwayBand, KoenkaiBand, FacilitiesBand } from "@/engine/types";
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
  describeTrainingEffect
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
  Bed,
  Star,
  Coins,
  Users2,
  AlertTriangle,
  Shield,
  Sparkles
} from "lucide-react";
import { useState } from "react";

// Narrative band displays (no raw numbers)
const STATURE_DISPLAY: Record<StatureBand, { label: string; labelJa: string; color: string }> = {
  legendary: { label: "Legendary", labelJa: "伝説", color: "bg-amber-500/20 text-amber-400 border-amber-500/30" },
  powerful: { label: "Powerful", labelJa: "強豪", color: "bg-purple-500/20 text-purple-400 border-purple-500/30" },
  established: { label: "Established", labelJa: "安定", color: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
  rebuilding: { label: "Rebuilding", labelJa: "再建中", color: "bg-orange-500/20 text-orange-400 border-orange-500/30" },
  fragile: { label: "Fragile", labelJa: "危機", color: "bg-red-500/20 text-red-400 border-red-500/30" },
  new: { label: "New", labelJa: "新規", color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" },
};

const PRESTIGE_NARRATIVE: Record<PrestigeBand, { label: string; description: string }> = {
  elite: { label: "Elite", description: "Commands respect throughout the sumo world. Recruits seek you out." },
  respected: { label: "Respected", description: "A name that carries weight in sumo circles." },
  modest: { label: "Modest", description: "Solid reputation, neither celebrated nor overlooked." },
  struggling: { label: "Struggling", description: "Fighting to maintain relevance in a competitive world." },
  unknown: { label: "Unknown", description: "Few outside the community know this name." },
};

const RUNWAY_NARRATIVE: Record<RunwayBand, { label: string; color: string; description: string }> = {
  secure: { label: "Secure", color: "text-success", description: "Comfortable reserves for the foreseeable future." },
  comfortable: { label: "Comfortable", color: "text-success", description: "No immediate concerns, room for investment." },
  tight: { label: "Tight", color: "text-warning", description: "Careful spending required, limited flexibility." },
  critical: { label: "Critical", color: "text-destructive", description: "Urgent attention needed, difficult decisions ahead." },
  desperate: { label: "Desperate", color: "text-destructive", description: "Every yen matters. Survival mode." },
};

const KOENKAI_NARRATIVE: Record<KoenkaiBand, { label: string; description: string }> = {
  powerful: { label: "Powerful", description: "Influential patrons provide substantial monthly support." },
  strong: { label: "Strong", description: "Reliable supporter base with steady contributions." },
  moderate: { label: "Moderate", description: "A modest group of dedicated supporters." },
  weak: { label: "Weak", description: "Few patrons, minimal financial cushion from supporters." },
  none: { label: "None", description: "No established supporter network. You stand alone." },
};

const FACILITIES_NARRATIVE: Record<FacilitiesBand, { label: string; description: string }> = {
  world_class: { label: "World-Class", description: "State-of-the-art equipment rivals professional sports facilities." },
  excellent: { label: "Excellent", description: "Superior training environment attracts talent." },
  adequate: { label: "Adequate", description: "Functional equipment meets basic professional standards." },
  basic: { label: "Basic", description: "Humble facilities require creative training methods." },
  minimal: { label: "Minimal", description: "Bare essentials only. Character builds where equipment cannot." },
};

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
        {/* Header with Narrative Bands */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="font-display text-3xl font-bold">{heya.name}</h1>
              {heya.nameJa && (
                <span className="text-muted-foreground font-display">{heya.nameJa}</span>
              )}
              <Badge className={`${STATURE_DISPLAY[heya.statureBand].color} border`}>
                {STATURE_DISPLAY[heya.statureBand].labelJa} ({STATURE_DISPLAY[heya.statureBand].label})
              </Badge>
            </div>
            <p className="text-muted-foreground">
              {rikishiList.length} wrestlers • {sekitori.length} sekitori
            </p>
            {heya.descriptor && (
              <p className="text-sm text-muted-foreground italic mt-1">{heya.descriptor}</p>
            )}
          </div>
          
          {/* Risk Indicators */}
          <div className="flex flex-col gap-2 items-end">
            {heya.riskIndicators?.financial && (
              <Badge variant="outline" className="bg-red-500/10 text-red-400 border-red-500/30">
                <AlertTriangle className="w-3 h-3 mr-1" />
                Financial Pressure
              </Badge>
            )}
            {heya.riskIndicators?.governance && (
              <Badge variant="outline" className="bg-yellow-500/10 text-yellow-400 border-yellow-500/30">
                <Shield className="w-3 h-3 mr-1" />
                Governance Watch
              </Badge>
            )}
            {heya.riskIndicators?.rivalry && (
              <Badge variant="outline" className="bg-purple-500/10 text-purple-400 border-purple-500/30">
                <Sparkles className="w-3 h-3 mr-1" />
                Active Rivalry
              </Badge>
            )}
          </div>
        </div>

        {/* Stable Status Overview - Narrative Bands */}
        <Card className="paper">
          <CardContent className="pt-4">
            <div className="grid gap-4 md:grid-cols-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Star className="h-4 w-4" />
                  Standing
                </div>
                <p className="font-medium">{PRESTIGE_NARRATIVE[heya.prestigeBand].label}</p>
                <p className="text-xs text-muted-foreground">{PRESTIGE_NARRATIVE[heya.prestigeBand].description}</p>
              </div>
              
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Coins className="h-4 w-4" />
                  Finances
                </div>
                <p className={`font-medium ${RUNWAY_NARRATIVE[heya.runwayBand].color}`}>
                  {RUNWAY_NARRATIVE[heya.runwayBand].label}
                </p>
                <p className="text-xs text-muted-foreground">{RUNWAY_NARRATIVE[heya.runwayBand].description}</p>
              </div>
              
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Users2 className="h-4 w-4" />
                  Supporters
                </div>
                <p className="font-medium">{KOENKAI_NARRATIVE[heya.koenkaiBand].label}</p>
                <p className="text-xs text-muted-foreground">{KOENKAI_NARRATIVE[heya.koenkaiBand].description}</p>
              </div>
              
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Building className="h-4 w-4" />
                  Facilities
                </div>
                <p className="font-medium">{FACILITIES_NARRATIVE[heya.facilitiesBand].label}</p>
                <p className="text-xs text-muted-foreground">{FACILITIES_NARRATIVE[heya.facilitiesBand].description}</p>
              </div>
            </div>
          </CardContent>
        </Card>

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

          {/* Facilities Tab - Using narrative bands instead of raw numbers */}
          <TabsContent value="facilities" className="space-y-4">
            {/* Main facilities overview already shown at top, this provides detail */}
            <Card className="paper">
              <CardHeader>
                <CardTitle>Facility Details</CardTitle>
                <CardDescription>
                  Your stable's infrastructure shapes wrestler development
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6 md:grid-cols-3">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Building className="h-5 w-5 text-muted-foreground" />
                      <span className="font-medium">Training Dohyo</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {heya.facilities.training >= 80 
                        ? "Professional-grade training ring with superior traction and proper drainage. Mirrors and video equipment for form analysis."
                        : heya.facilities.training >= 60
                        ? "Well-maintained dohyo meeting professional standards. Adequate space for group practice."
                        : heya.facilities.training >= 40
                        ? "Functional training area. The basics are covered, though improvements would help."
                        : "Humble training space. Your wrestlers build character where equipment falls short."}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Bed className="h-5 w-5 text-muted-foreground" />
                      <span className="font-medium">Recovery Center</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {heya.facilities.recovery >= 80 
                        ? "Fully-equipped recovery suite with ice baths, massage stations, and physiotherapy equipment."
                        : heya.facilities.recovery >= 60
                        ? "Solid recovery facilities including basic hydrotherapy and rest areas."
                        : heya.facilities.recovery >= 40
                        ? "Basic recovery amenities. Wrestlers manage with traditional methods."
                        : "Minimal recovery resources. Rest and time are your primary healers."}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <ChefHat className="h-5 w-5 text-muted-foreground" />
                      <span className="font-medium">Kitchen & Chanko</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {heya.facilities.nutrition >= 80 
                        ? "Professional kitchen with nutritionist oversight. Custom meal planning for each wrestler."
                        : heya.facilities.nutrition >= 60
                        ? "Well-equipped kitchen producing quality chanko. Good variety in diet."
                        : heya.facilities.nutrition >= 40
                        ? "Adequate cooking facilities. Traditional chanko keeps wrestlers fed."
                        : "Simple kitchen setup. Filling meals, but limited variety and planning."}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

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
