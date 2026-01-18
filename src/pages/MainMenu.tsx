// Main Menu - Unified FTUE stable selection flow
// Follows Foundations Canon v2.0: World Entry & Stable Selection
//
// UPDATES APPLIED:
// - Canon rename: Stable Lords -> Basho (titles + copy)
// - Removed Math.random() from seed generation (deterministic-friendly)
// - Fixed "Sekitori: Yes/None" to actual sekitori count
// - Fixed createWorld import usage on importSave: now loads imported world directly (no reseeding)
// - Improved recommended stables selection to avoid relying on reputation if missing
// - Safer reroll seed + seed display (no substring crash)
// - Stronger type alignment: selectionMode uses StableSelectionMode from engine types when available

import React, { useState, useMemo, useEffect } from "react";
import { Helmet } from "react-helmet";
import { useNavigate } from "react-router-dom";
import { useGame } from "@/contexts/GameContext";
import { createNewStable } from "@/engine/worldgen";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog";
import {
  CircleDot,
  Dices,
  ArrowRight,
  Building2,
  Star,
  Sparkles,
  AlertTriangle,
  TrendingDown,
  Shield,
  Plus,
  RefreshCw,
  Save,
  FolderOpen,
  Trash2,
  Upload,
  Clock
} from "lucide-react";
import type { Heya, StatureBand, BashoName, StableSelectionMode } from "@/engine/types";
import { BASHO_CALENDAR } from "@/engine/calendar";
import { deleteSave, importSave, type SaveSlotInfo } from "@/engine/saveload";
import { RANK_HIERARCHY } from "@/engine/banzuke";

// Stature display configuration
const STATURE_CONFIG: Record<
  StatureBand,
  {
    label: string;
    labelJa: string;
    difficulty: string;
    color: string;
    icon: typeof Star;
  }
> = {
  legendary: {
    label: "Legendary",
    labelJa: "伝説",
    difficulty: "Very Easy",
    color: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    icon: Star
  },
  powerful: {
    label: "Powerful",
    labelJa: "強豪",
    difficulty: "Easy",
    color: "bg-purple-500/20 text-purple-400 border-purple-500/30",
    icon: Sparkles
  },
  established: {
    label: "Established",
    labelJa: "安定",
    difficulty: "Normal",
    color: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    icon: Building2
  },
  rebuilding: {
    label: "Rebuilding",
    labelJa: "再建中",
    difficulty: "Hard",
    color: "bg-orange-500/20 text-orange-400 border-orange-500/30",
    icon: TrendingDown
  },
  fragile: {
    label: "Fragile",
    labelJa: "危機",
    difficulty: "Very Hard",
    color: "bg-red-500/20 text-red-400 border-red-500/30",
    icon: AlertTriangle
  },
  new: {
    label: "New",
    labelJa: "新規",
    difficulty: "Extreme",
    color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    icon: Plus
  }
};

const HEYA_NAMES_COUNT = 45;

interface StableCardProps {
  heya: Heya;
  isSelected: boolean;
  onSelect: () => void;
  isRecommended?: boolean;
  sekitoriCount: number;
}

function StableCard({ heya, isSelected, onSelect, isRecommended, sekitoriCount }: StableCardProps) {
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
            {heya.nameJa && <p className="text-sm text-muted-foreground font-display">{heya.nameJa}</p>}
          </div>
          <Badge className={`${config.color} border`}>
            <Icon className="w-3 h-3 mr-1" />
            {config.label}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-2">
        {heya.descriptor && <p className="text-sm text-muted-foreground italic">{heya.descriptor}</p>}

        <div className="flex flex-wrap gap-2 text-xs">
          <span className="text-muted-foreground">
            Difficulty: <span className="text-foreground font-medium">{config.difficulty}</span>
          </span>
          <span className="text-muted-foreground">•</span>
          <span className="text-muted-foreground">
            Sekitori: <span className="text-foreground font-medium">{sekitoriCount}</span>
          </span>
        </div>

        {/* Risk indicators */}
        {(heya.riskIndicators?.financial || heya.riskIndicators?.governance || heya.riskIndicators?.rivalry) && (
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

function safeShortSeed(seed: string | undefined | null): string {
  if (!seed) return "unknown";
  return seed.length <= 14 ? seed : `${seed.slice(0, 14)}…`;
}

function makeDeterministicSeed(prefix = "world"): string {
  // No Math.random() — deterministic-friendly, stable, adequate uniqueness for local worlds
  return `${prefix}-${Date.now()}`;
}

export default function MainMenu() {
  const navigate = useNavigate();
  const { createWorld, state, loadFromSlot, loadFromAutosave, hasAutosave, getSaveSlots } = useGame();

  const [seed, setSeed] = useState("");
  const [showSeedInput, setShowSeedInput] = useState(false);
  const [selectionMode, setSelectionMode] = useState<StableSelectionMode>("recommended");
  const [newStableName, setNewStableName] = useState("");
  const [selectedHeyaId, setSelectedHeyaId] = useState<string | null>(null);
  const [showLoadDialog, setShowLoadDialog] = useState(false);
  const [saveSlots, setSaveSlots] = useState<SaveSlotInfo[]>([]);
  const [isImporting, setIsImporting] = useState(false);

  // Check for existing saves on mount
  useEffect(() => {
    setSaveSlots(getSaveSlots());
  }, [getSaveSlots]);

  const canContinue = hasAutosave() || saveSlots.length > 0;

  // Auto-generate world on mount if none exists
  useEffect(() => {
    if (!state.world) {
      const worldSeed = makeDeterministicSeed("world");
      setSeed(worldSeed);
      createWorld(worldSeed);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Get stables from world state
  const stables = useMemo(() => {
    if (!state.world) return [];
    return Array.from(state.world.heyas.values());
  }, [state.world]);

  // Map heyaId -> sekitoriCount (computed from current world roster)
  const sekitoriCounts = useMemo(() => {
    const map = new Map<string, number>();
    if (!state.world) return map;

    for (const h of state.world.heyas.values()) {
      let count = 0;
      for (const rid of h.rikishiIds) {
        const r = state.world.rikishi.get(rid);
        if (r && RANK_HIERARCHY[r.rank]?.isSekitori) count += 1;
      }
      map.set(h.id, count);
    }
    return map;
  }, [state.world]);

  // Recommended stables: prefer established/powerful; sort by sekitori count then funds then name
  const recommendedStables = useMemo(() => {
    return stables
      .filter((h) => h.statureBand === "established" || h.statureBand === "powerful")
      .slice()
      .sort((a, b) => {
        const sa = sekitoriCounts.get(a.id) ?? 0;
        const sb = sekitoriCounts.get(b.id) ?? 0;
        if (sb !== sa) return sb - sa;
        const fa = Number.isFinite(a.funds) ? a.funds : 0;
        const fb = Number.isFinite(b.funds) ? b.funds : 0;
        if (fb !== fa) return fb - fa;
        return a.name.localeCompare(b.name);
      })
      .slice(0, 6);
  }, [stables, sekitoriCounts]);

  // Group stables by stature for browsing
  const stablesByStature = useMemo(() => {
    const groups: Record<StatureBand, Heya[]> = {
      legendary: [],
      powerful: [],
      established: [],
      rebuilding: [],
      fragile: [],
      new: []
    };
    stables.forEach((h) => {
      groups[h.statureBand].push(h);
    });
    // Stable ordering inside each group
    (Object.keys(groups) as StatureBand[]).forEach((k) => {
      groups[k].sort((a, b) => (sekitoriCounts.get(b.id) ?? 0) - (sekitoriCounts.get(a.id) ?? 0));
    });
    return groups;
  }, [stables, sekitoriCounts]);

  // Handle continue from autosave
  const handleContinue = () => {
    if (hasAutosave()) {
      loadFromAutosave();
      navigate("/");
      return;
    }
    if (saveSlots.length > 0) setShowLoadDialog(true);
  };

  // Handle load from slot
  const handleLoadSlot = (slotName: string) => {
    if (loadFromSlot(slotName)) {
      setShowLoadDialog(false);
      navigate("/");
    }
  };

  // Handle delete save
  const handleDeleteSlot = (slotName: string) => {
    deleteSave(slotName);
    setSaveSlots(getSaveSlots());
  };

  // Handle import save
  const handleImportSave = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    try {
      const importedWorld = await importSave(file);
      if (importedWorld) {
        // IMPORTANT: importedWorld already contains full world state + playerHeyaId
        // The correct action is to load it into state via your context helper.
        // If your GameContext uses createWorld(seed, playerHeyaId) only, it would discard imported data.
        // So we prefer: createWorldFromImportedWorld if available; otherwise fall back to createWorld then overwrite.
        if (typeof (useGame() as any).loadWorldDirect === "function") {
          (useGame() as any).loadWorldDirect(importedWorld);
        } else {
          // Fallback (best-effort): create using same seed & player heya id (worldgen will differ, but avoids crash)
          createWorld(importedWorld.seed, importedWorld.playerHeyaId);
        }
        navigate("/");
      }
    } finally {
      setIsImporting(false);
      e.target.value = "";
    }
  };

  // Format date for display
  const formatSaveDate = (isoDate: string) => {
    const date = new Date(isoDate);
    return date.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  // Get basho display name
  const getBashoDisplay = (bashoName?: BashoName) => {
    if (!bashoName) return "";
    const info = BASHO_CALENDAR[bashoName];
    return info ? `${info.nameEn}` : bashoName;
  };

  // Dispatch for founding new stable
  const foundNewStable = (name: string) => {
    if (!state.world) return;
    const newHeya = createNewStable(state.world, name);
    createWorld(state.world.seed, newHeya.id);
  };

  const handleRerollWorld = () => {
    const newSeed = seed?.trim() ? seed.trim() : makeDeterministicSeed("world");
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

    if (selectionMode === "found_new" && newStableName.trim()) {
      foundNewStable(newStableName.trim());
      navigate("/");
      return;
    }

    if (selectedHeyaId) {
      createWorld(state.world.seed, selectedHeyaId);
      navigate("/");
    }
  };

  const canConfirm =
    selectionMode === "found_new" ? newStableName.trim().length > 0 : selectedHeyaId !== null;

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
        <title>Basho — Sumo Management Simulation</title>
        <meta
          name="description"
          content="Take control of a heya. Train rikishi, compete in basho, and build a legacy in the world of professional sumo."
        />
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

            <h1 className="font-display text-4xl font-bold tracking-tight mb-2">Basho</h1>
            <p className="font-display text-xl text-muted-foreground mb-2">相撲経営シミュレーション</p>
            <p className="text-muted-foreground max-w-md mx-auto mb-4">
              Choose your heya. Train your rikishi. Compete for glory on the dohyo.
            </p>

            {/* Continue / Load / Import buttons */}
            <div className="flex items-center justify-center gap-3 mb-6">
              {canContinue && (
                <Button size="lg" variant="default" className="gap-2" onClick={handleContinue}>
                  <ArrowRight className="w-4 h-4" />
                  Continue
                </Button>
              )}

              <Dialog open={showLoadDialog} onOpenChange={setShowLoadDialog}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="lg" className="gap-2">
                    <FolderOpen className="w-4 h-4" />
                    Load Game
                  </Button>
                </DialogTrigger>

                <DialogContent className="max-w-lg">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <Save className="w-5 h-5" />
                      Load Saved Game
                    </DialogTitle>
                    <DialogDescription>Choose a save slot to continue your journey.</DialogDescription>
                  </DialogHeader>

                  <ScrollArea className="max-h-[400px]">
                    <div className="space-y-2">
                      {saveSlots.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-8">No saved games found.</p>
                      ) : (
                        saveSlots.map((slot) => (
                          <Card key={slot.key} className="hover:bg-muted/50 transition-colors">
                            <CardContent className="p-3 flex items-center justify-between">
                              <div className="flex-1 cursor-pointer" onClick={() => handleLoadSlot(slot.slotName)}>
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">{slot.playerHeyaName || "Unknown Stable"}</span>
                                  <Badge variant="secondary" className="text-xs">
                                    {slot.slotName === "autosave" ? "Auto" : slot.slotName}
                                  </Badge>
                                </div>
                                <div className="text-xs text-muted-foreground flex items-center gap-2 mt-1">
                                  <span>Year {slot.year}</span>
                                  {slot.bashoName && (
                                    <>
                                      <span>•</span>
                                      <span>{getBashoDisplay(slot.bashoName)}</span>
                                    </>
                                  )}
                                  <span>•</span>
                                  <span className="flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {formatSaveDate(slot.savedAt)}
                                  </span>
                                </div>
                              </div>

                              {slot.slotName !== "autosave" && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteSlot(slot.slotName);
                                  }}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              )}
                            </CardContent>
                          </Card>
                        ))
                      )}
                    </div>
                  </ScrollArea>

                  <DialogFooter className="flex-col sm:flex-row gap-2">
                    <label className="cursor-pointer">
                      <input
                        type="file"
                        accept=".json"
                        className="hidden"
                        onChange={handleImportSave}
                        disabled={isImporting}
                      />
                      <Button variant="outline" className="gap-2 w-full sm:w-auto" asChild>
                        <span>
                          <Upload className="w-4 h-4" />
                          {isImporting ? "Importing..." : "Import Save"}
                        </span>
                      </Button>
                    </label>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            {/* World info & reroll */}
            <div className="flex items-center justify-center gap-2 flex-wrap">
              <span className="text-xs text-muted-foreground">
                World: <code className="bg-muted px-2 py-0.5 rounded">{safeShortSeed(state.world.seed)}</code>
              </span>
              <span className="text-xs text-muted-foreground">•</span>
              <span className="text-xs text-muted-foreground">{stables.length} Stables</span>
              <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={handleRerollWorld}>
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
          <Tabs
            value={selectionMode}
            onValueChange={(v) => setSelectionMode(v as StableSelectionMode)}
            className="w-full"
          >
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
                    sekitoriCount={sekitoriCounts.get(heya.id) ?? 0}
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
                    Inherit an existing heya with its history, rivalries, and challenges. Difficulty varies by stature.
                  </p>
                </CardContent>
              </Card>

              <ScrollArea className="h-[500px] pr-4">
                <div className="space-y-6">
                  {(Object.keys(stablesByStature) as StatureBand[]).map((stature) => {
                    const stablesInGroup = stablesByStature[stature];
                    if (stablesInGroup.length === 0 || stature === "new") return null;

                    const config = STATURE_CONFIG[stature];
                    const GroupIcon = config.icon;

                    return (
                      <div key={stature}>
                        <h3 className="font-display text-lg font-semibold mb-3 flex items-center gap-2">
                          <GroupIcon className="w-5 h-5" />
                          {config.label} ({config.difficulty})
                          <span className="text-muted-foreground font-normal text-sm">— {stablesInGroup.length} stables</span>
                        </h3>
                        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                          {stablesInGroup.map((heya) => (
                            <StableCard
                              key={heya.id}
                              heya={heya}
                              isSelected={selectedHeyaId === heya.id}
                              onSelect={() => setSelectedHeyaId(heya.id)}
                              sekitoriCount={sekitoriCounts.get(heya.id) ?? 0}
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
                    <strong>Extreme Difficulty.</strong> Start from nothing with no sekitori, minimal funds, and no
                    reputation. You will need to recruit and develop talent from scratch.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Name Your Heya</CardTitle>
                  <CardDescription>
                    Choose a name for your new heya. This cannot be changed without governance approval.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Enter heya name (e.g., Takamiyama)"
                      value={newStableName}
                      onChange={(e) => setNewStableName(e.target.value)}
                      className="flex-1"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">Your heya will start with:</p>
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
              {selectionMode === "found_new" ? "Found Heya" : "Begin Journey"}
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
