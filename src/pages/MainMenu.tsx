// Main Menu - Unified FTUE stable selection flow
// Follows Foundations Canon v2.0: World Entry & Stable Selection

import { useState, useMemo, useEffect } from "react";
import { Helmet } from "react-helmet";
import { useNavigate } from "react-router-dom";
import { useGame } from "@/contexts/GameContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  CircleDot, Dices, ArrowRight, Building2, Star, Sparkles,
  AlertTriangle, TrendingDown, Shield, Plus, RefreshCw
} from "lucide-react";
import type { Heya, StatureBand } from "@/engine/types";

// Stature display configuration
const STATURE_CONFIG: Record<StatureBand, { 
  label: string; 
  labelJa: string;
  difficulty: string; 
  color: string;
  icon: typeof Star;
}> = {
  legendary: { 
    label: "Legendary", 
    labelJa: "伝説", 
    difficulty: "Very Easy", 
    color: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    icon: Star,
  },
  powerful: { 
    label: "Powerful", 
    labelJa: "強豪", 
    difficulty: "Easy", 
    color: "bg-purple-500/20 text-purple-400 border-purple-500/30",
    icon: Sparkles,
  },
  established: { 
    label: "Established", 
    labelJa: "安定", 
    difficulty: "Normal", 
    color: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    icon: Building2,
  },
  rebuilding: { 
    label: "Rebuilding", 
    labelJa: "再建中", 
    difficulty: "Hard", 
    color: "bg-orange-500/20 text-orange-400 border-orange-500/30",
    icon: TrendingDown,
  },
  fragile: { 
    label: "Fragile", 
    labelJa: "危機", 
    difficulty: "Very Hard", 
    color: "bg-red-500/20 text-red-400 border-red-500/30",
    icon: AlertTriangle,
  },
  new: { 
    label: "New", 
    labelJa: "新規", 
    difficulty: "Extreme", 
    color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    icon: Plus,
  },
};

const HEYA_NAMES_COUNT = 45;

interface StableCardProps {
  heya: Heya;
  isSelected: boolean;
  onSelect: () => void;
  isRecommended?: boolean;
}

function StableCard({ heya, isSelected, onSelect, isRecommended }: StableCardProps) {
  const config = STATURE_CONFIG[heya.statureBand];
  const Icon = config.icon;
  
  return (
    <Card 
      className={`cursor-pointer transition-all hover:border-primary/50 ${
        isSelected ? "border-primary ring-2 ring-primary/30" : ""
      }`}
      onClick={onSelect}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              {heya.name}
              {isRecommended && (
                <Badge variant="secondary" className="text-xs">
                  Recommended
                </Badge>
              )}
            </CardTitle>
            <p className="text-sm text-muted-foreground font-display">{heya.nameJa}</p>
          </div>
          <Badge className={`${config.color} border`}>
            <Icon className="w-3 h-3 mr-1" />
            {config.label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        <p className="text-sm text-muted-foreground italic">
          {heya.descriptor}
        </p>
        
        <div className="flex flex-wrap gap-2 text-xs">
          <span className="text-muted-foreground">
            Difficulty: <span className="text-foreground font-medium">{config.difficulty}</span>
          </span>
          <span className="text-muted-foreground">•</span>
          <span className="text-muted-foreground">
            Sekitori: <span className="text-foreground font-medium">
              {heya.rikishiIds.length > 0 ? "Yes" : "None"}
            </span>
          </span>
        </div>
        
        {/* Risk indicators */}
        {(heya.riskIndicators.financial || heya.riskIndicators.governance || heya.riskIndicators.rivalry) && (
          <div className="flex gap-1 pt-1 flex-wrap">
            {heya.riskIndicators.financial && (
              <Badge variant="outline" className="text-xs bg-red-500/10 text-red-400 border-red-500/30">
                💴 Financial Risk
              </Badge>
            )}
            {heya.riskIndicators.governance && (
              <Badge variant="outline" className="text-xs bg-yellow-500/10 text-yellow-400 border-yellow-500/30">
                ⚖️ Governance Watch
              </Badge>
            )}
            {heya.riskIndicators.rivalry && (
              <Badge variant="outline" className="text-xs bg-purple-500/10 text-purple-400 border-purple-500/30">
                🔥 Active Rivalry
              </Badge>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function MainMenu() {
  const navigate = useNavigate();
  const { createWorld, state } = useGame();
  const [seed, setSeed] = useState("");
  const [showSeedInput, setShowSeedInput] = useState(false);
  const [selectionMode, setSelectionMode] = useState<"found_new" | "take_over" | "recommended">("recommended");
  const [newStableName, setNewStableName] = useState("");
  const [selectedHeyaId, setSelectedHeyaId] = useState<string | null>(null);

  // Auto-generate world on mount if none exists
  useEffect(() => {
    if (!state.world) {
      const worldSeed = `world-${Date.now()}`;
      setSeed(worldSeed);
      createWorld(worldSeed);
    }
  }, []);

  // Get stables from world state
  const stables = useMemo(() => {
    if (!state.world) return [];
    return Array.from(state.world.heyas.values());
  }, [state.world]);

  // Get recommended stables (established tier, good balance)
  const recommendedStables = useMemo(() => {
    return stables
      .filter(h => h.statureBand === "established" || h.statureBand === "powerful")
      .sort((a, b) => b.reputation - a.reputation)
      .slice(0, 5);
  }, [stables]);

  // Group stables by stature for browsing
  const stablesByStature = useMemo(() => {
    const groups: Record<StatureBand, Heya[]> = {
      legendary: [],
      powerful: [],
      established: [],
      rebuilding: [],
      fragile: [],
      new: [],
    };
    stables.forEach(h => {
      groups[h.statureBand].push(h);
    });
    return groups;
  }, [stables]);

  const handleRerollWorld = () => {
    const newSeed = seed || `world-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    setSeed(newSeed);
    setSelectedHeyaId(null);
    createWorld(newSeed);
  };

  const handleSetSeed = () => {
    if (seed.trim()) {
      setSelectedHeyaId(null);
      createWorld(seed.trim());
      setShowSeedInput(false);
    }
  };

  const handleConfirmStable = () => {
    if (!state.world) return;
    
    if (selectionMode === "found_new") {
      // Create new stable - extreme difficulty
      // For now, just pick a random fragile stable to simulate
      const fragileStables = stables.filter(h => h.statureBand === "fragile");
      const selected = fragileStables[0] || stables[0];
      if (selected) {
        createWorld(state.world.seed, selected.id);
      }
    } else if (selectedHeyaId) {
      createWorld(state.world.seed, selectedHeyaId);
    }
    
    navigate("/");
  };

  const canConfirm = selectionMode === "found_new" 
    ? newStableName.trim().length > 0 
    : selectedHeyaId !== null;

  // Show loading state while world is being generated
  if (!state.world) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary shadow-lg mb-6 animate-pulse">
          <CircleDot className="h-10 w-10 text-primary-foreground" />
        </div>
        <p className="text-muted-foreground">Generating sumo world...</p>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Stable Lords - Sumo Management Simulation</title>
        <meta name="description" content="Take control of a sumo stable. Train rikishi, compete in tournaments, and build a legacy in the world of professional sumo." />
      </Helmet>

      <div className="min-h-screen bg-background p-6">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary shadow-lg">
                <CircleDot className="h-8 w-8 text-primary-foreground" />
              </div>
            </div>
            
            <h1 className="font-display text-4xl font-bold tracking-tight mb-2">
              Stable Lords
            </h1>
            <p className="font-display text-xl text-muted-foreground mb-2">
              相撲経営シミュレーション
            </p>
            <p className="text-muted-foreground max-w-md mx-auto mb-4">
              Build your stable. Train your rikishi. Compete for glory on the dohyo.
            </p>
            
            {/* World info & reroll */}
            <div className="flex items-center justify-center gap-2 flex-wrap">
              <span className="text-xs text-muted-foreground">
                World: <code className="bg-muted px-2 py-0.5 rounded">{state.world.seed.substring(0, 12)}...</code>
              </span>
              <span className="text-xs text-muted-foreground">•</span>
              <span className="text-xs text-muted-foreground">{stables.length} Stables</span>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-7 text-xs gap-1"
                onClick={handleRerollWorld}
              >
                <RefreshCw className="w-3 h-3" />
                Reroll World
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-7 text-xs gap-1"
                onClick={() => setShowSeedInput(!showSeedInput)}
              >
                <Dices className="w-3 h-3" />
                {showSeedInput ? "Hide Seed" : "Enter Seed"}
              </Button>
            </div>
            
            {/* Seed input (collapsible) */}
            {showSeedInput && (
              <div className="mt-4 flex items-center justify-center gap-2 max-w-md mx-auto">
                <Input
                  placeholder="Enter world seed..."
                  value={seed}
                  onChange={(e) => setSeed(e.target.value)}
                  className="text-sm"
                />
                <Button size="sm" onClick={handleSetSeed}>
                  Apply
                </Button>
              </div>
            )}
          </div>

          {/* Selection Mode Tabs */}
          <Tabs value={selectionMode} onValueChange={(v) => setSelectionMode(v as typeof selectionMode)} className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger value="recommended" className="gap-2">
                <Star className="w-4 h-4" />
                Recommended
              </TabsTrigger>
              <TabsTrigger value="take_over" className="gap-2">
                <Building2 className="w-4 h-4" />
                Take Over
              </TabsTrigger>
              <TabsTrigger value="found_new" className="gap-2">
                <Plus className="w-4 h-4" />
                Found New
              </TabsTrigger>
            </TabsList>

            {/* Recommended Start */}
            <TabsContent value="recommended" className="space-y-4">
              <Card className="bg-muted/30">
                <CardContent className="pt-4">
                  <p className="text-sm text-muted-foreground">
                    <Shield className="inline w-4 h-4 mr-1" />
                    These stables offer a balanced start with room to grow. Good for learning the systems.
                  </p>
                </CardContent>
              </Card>
              
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {recommendedStables.map((heya) => (
                  <StableCard
                    key={heya.id}
                    heya={heya}
                    isSelected={selectedHeyaId === heya.id}
                    onSelect={() => setSelectedHeyaId(heya.id)}
                    isRecommended
                  />
                ))}
              </div>
            </TabsContent>

            {/* Take Over Existing */}
            <TabsContent value="take_over" className="space-y-4">
              <Card className="bg-muted/30">
                <CardContent className="pt-4">
                  <p className="text-sm text-muted-foreground">
                    <Building2 className="inline w-4 h-4 mr-1" />
                    Inherit an existing stable with all its history, rivalries, and challenges. Difficulty varies by stature.
                  </p>
                </CardContent>
              </Card>
              
              <ScrollArea className="h-[500px] pr-4">
                <div className="space-y-6">
                  {(Object.keys(stablesByStature) as StatureBand[]).map((stature) => {
                    const stablesInGroup = stablesByStature[stature];
                    if (stablesInGroup.length === 0 || stature === "new") return null;
                    
                    const config = STATURE_CONFIG[stature];
                    return (
                      <div key={stature}>
                        <h3 className="font-display text-lg font-semibold mb-3 flex items-center gap-2">
                          <config.icon className="w-5 h-5" />
                          {config.label} ({config.difficulty})
                          <span className="text-muted-foreground font-normal text-sm">
                            — {stablesInGroup.length} stables
                          </span>
                        </h3>
                        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                          {stablesInGroup.map((heya) => (
                            <StableCard
                              key={heya.id}
                              heya={heya}
                              isSelected={selectedHeyaId === heya.id}
                              onSelect={() => setSelectedHeyaId(heya.id)}
                            />
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            </TabsContent>

            {/* Found New Stable */}
            <TabsContent value="found_new" className="space-y-4">
              <Card className="bg-red-500/5 border-red-500/20">
                <CardContent className="pt-4">
                  <p className="text-sm text-red-400">
                    <AlertTriangle className="inline w-4 h-4 mr-1" />
                    <strong>Extreme Difficulty.</strong> Start from nothing with no sekitori, minimal funds, and no reputation.
                    You will need to recruit and develop talent from scratch.
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Name Your Stable</CardTitle>
                  <CardDescription>
                    Choose a name for your new stable. This cannot be changed without governance approval.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Enter stable name (e.g., Takamiyama)"
                      value={newStableName}
                      onChange={(e) => setNewStableName(e.target.value)}
                      className="flex-1"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Your stable will start with:
                  </p>
                  <ul className="text-xs text-muted-foreground list-disc list-inside space-y-1">
                    <li>Minimal starting funds (very tight runway)</li>
                    <li>No sekitori-ranked wrestlers</li>
                    <li>Basic facilities only</li>
                    <li>No kōenkai (supporter group)</li>
                    <li>6 basho of FTUE protection</li>
                  </ul>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Confirm Button */}
          <div className="mt-8 flex justify-center">
            <Button 
              size="lg" 
              className="gap-2 min-w-[200px]"
              onClick={handleConfirmStable}
              disabled={!canConfirm}
            >
              {selectionMode === "found_new" ? "Found Stable" : "Begin Journey"}
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>

          {/* Footer */}
          <div className="mt-12 text-center text-sm text-muted-foreground">
            <p className="mb-2">82 authentic kimarite • 6 annual tournaments • {HEYA_NAMES_COUNT}+ stables</p>
            <p className="font-display text-xs">頂点を目指せ — Reach for the summit</p>
          </div>
        </div>
      </div>
    </>
  );
}
