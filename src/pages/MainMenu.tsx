// Main Menu - World creation and stable selection
// Follows Foundations Canon v2.0: World Entry & Stable Selection

import { useState, useMemo } from "react";
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
  AlertTriangle, TrendingDown, Shield, Plus
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
          <div className="flex gap-1 pt-1">
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
  const [isCreating, setIsCreating] = useState(false);
  const [selectionMode, setSelectionMode] = useState<"found_new" | "take_over" | "recommended">("recommended");
  const [newStableName, setNewStableName] = useState("");
  const [selectedHeyaId, setSelectedHeyaId] = useState<string | null>(null);
  const [worldPreview, setWorldPreview] = useState<{ heyas: Heya[] } | null>(null);

  // Generate world preview when seed changes
  const handlePreviewWorld = () => {
    const worldSeed = seed || `world-${Date.now()}`;
    setSeed(worldSeed);
    
    // Create world to get stable list
    createWorld(worldSeed);
    
    // After world is created, we can access the stables
    setIsCreating(false);
  };

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

  const handleRandomSeed = () => {
    const randomSeed = `${Math.random().toString(36).substring(2, 8)}-${Date.now().toString(36)}`;
    setSeed(randomSeed);
  };

  const handleCreateWorld = () => {
    if (!state.world) {
      setIsCreating(true);
      const worldSeed = seed || `world-${Date.now()}`;
      createWorld(worldSeed);
      return;
    }
    
    // World exists, proceed to stable selection confirmation
    if (selectionMode === "found_new") {
      // For founding new stable, we need the name
      if (!newStableName.trim()) {
        return;
      }
      // TODO: Create new stable with the name
      navigate("/");
    } else {
      // For take over or recommended, we need a selected stable
      if (!selectedHeyaId) {
        return;
      }
      // Set player heya and navigate
      navigate("/");
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
        // Update world with player heya
        createWorld(state.world.seed, selected.id);
      }
    } else if (selectedHeyaId) {
      // Take over selected stable
      createWorld(state.world.seed, selectedHeyaId);
    }
    
    navigate("/");
  };

  // If no world exists, show seed input
  if (!state.world) {
    return (
      <>
        <Helmet>
          <title>Stable Lords - Sumo Management Simulation</title>
          <meta name="description" content="Take control of a sumo stable. Train rikishi, compete in tournaments, and build a legacy in the world of professional sumo." />
        </Helmet>

        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
          {/* Hero Section */}
          <div className="text-center mb-12 animate-fade-in">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary shadow-lg">
                <CircleDot className="h-10 w-10 text-primary-foreground" />
              </div>
            </div>
            
            <h1 className="font-display text-5xl font-bold tracking-tight mb-2">
              Stable Lords
            </h1>
            <p className="font-display text-2xl text-muted-foreground mb-4">
              相撲経営シミュレーション
            </p>
            <p className="text-muted-foreground max-w-md mx-auto">
              Build your stable. Train your rikishi. Compete for glory on the dohyo.
            </p>
          </div>

          {/* Create World Card */}
          <Card className="w-full max-w-md animate-slide-up paper">
            <CardHeader className="text-center">
              <CardTitle className="font-display text-xl">Begin Your Journey</CardTitle>
              <CardDescription>
                Create a new world or enter a seed to recreate a specific world
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">World Seed (optional)</label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter seed or leave blank for random"
                    value={seed}
                    onChange={(e) => setSeed(e.target.value)}
                    className="flex-1"
                  />
                  <Button 
                    variant="outline" 
                    size="icon"
                    onClick={handleRandomSeed}
                    title="Generate random seed"
                  >
                    <Dices className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Same seed = same world. Share seeds to challenge friends!
                </p>
              </div>

              <Button 
                className="w-full gap-2" 
                size="lg"
                onClick={handleCreateWorld}
                disabled={isCreating}
              >
                {isCreating ? (
                  <>Creating World...</>
                ) : (
                  <>
                    Generate World
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Footer Info */}
          <div className="mt-12 text-center text-sm text-muted-foreground animate-fade-in">
            <p className="mb-2">82 authentic kimarite • 6 annual tournaments • {HEYA_NAMES_COUNT}+ stables</p>
            <p className="font-display text-xs">頂点を目指せ — Reach for the summit</p>
          </div>
        </div>
      </>
    );
  }

  // World exists - show stable selection
  return (
    <>
      <Helmet>
        <title>Choose Your Stable - Stable Lords</title>
      </Helmet>

      <div className="min-h-screen bg-background p-6">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="font-display text-3xl font-bold mb-2">Choose Your Stable</h1>
            <p className="text-muted-foreground">
              The world awaits. Select how you will enter the sumo hierarchy.
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              World Seed: <code className="bg-muted px-2 py-0.5 rounded">{state.world.seed}</code>
              {" • "}{stables.length} Active Stables
            </p>
          </div>

          {/* Selection Mode Tabs */}
          <Tabs value={selectionMode} onValueChange={(v) => setSelectionMode(v as typeof selectionMode)} className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger value="recommended" className="gap-2">
                <Star className="w-4 h-4" />
                Recommended Start
              </TabsTrigger>
              <TabsTrigger value="take_over" className="gap-2">
                <Building2 className="w-4 h-4" />
                Take Over Stable
              </TabsTrigger>
              <TabsTrigger value="found_new" className="gap-2">
                <Plus className="w-4 h-4" />
                Found New Stable
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
                    if (stablesInGroup.length === 0) return null;
                    
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
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        // Generate random stable name
                        const prefixes = ["Taka", "Waka", "Asa", "Koto", "Tochi", "Haku", "Kai", "Teru"];
                        const suffixes = ["yama", "umi", "kaze", "nami", "shima"];
                        const name = prefixes[Math.floor(Math.random() * prefixes.length)] + 
                                    suffixes[Math.floor(Math.random() * suffixes.length)];
                        setNewStableName(name);
                      }}
                    >
                      <Dices className="w-4 h-4" />
                    </Button>
                  </div>
                  
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p>Your new stable will start with:</p>
                    <ul className="list-disc list-inside space-y-1 ml-2">
                      <li>Lowest prestige band</li>
                      <li>Minimal facilities</li>
                      <li>Weak or no supporter group (kōenkai)</li>
                      <li>No sekitori (top division wrestlers)</li>
                      <li>6-10 low-ranked recruits</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Confirm Button */}
          <div className="mt-8 flex justify-center gap-4">
            <Button
              variant="outline"
              onClick={() => {
                // Reset and allow new world generation
                setSelectedHeyaId(null);
                setNewStableName("");
              }}
            >
              Change Seed
            </Button>
            <Button
              size="lg"
              className="gap-2 min-w-[200px]"
              onClick={handleConfirmStable}
              disabled={
                (selectionMode === "found_new" && !newStableName.trim()) ||
                ((selectionMode === "take_over" || selectionMode === "recommended") && !selectedHeyaId)
              }
            >
              {selectionMode === "found_new" ? "Found Stable" : "Take Control"}
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}

// Export stable count for display
const HEYA_NAMES_COUNT = 44;
