// Auto-Sim Controls - UI for auto-simulation and observer modes
// Per Constitution §7: Auto-Sim "Watch the World" Mode

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { 
  Play, 
  FastForward, 
  Eye, 
  Pause, 
  Clock,
  Trophy,
  AlertTriangle,
  Star,
  TrendingUp
} from "lucide-react";
import type { 
  SimDuration, 
  StopCondition, 
  VerbosityLevel,
  AutoSimConfig,
  AutoSimResult,
  ChronicleReport 
} from "@/engine/autoSim";

interface AutoSimControlsProps {
  onStartSim: (config: AutoSimConfig) => Promise<AutoSimResult>;
  isSimulating: boolean;
  playerHeyaId?: string;
}

export function AutoSimControls({ onStartSim, isSimulating, playerHeyaId }: AutoSimControlsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [durationType, setDurationType] = useState<string>("basho");
  const [durationCount, setDurationCount] = useState(1);
  const [verbosity, setVerbosity] = useState<VerbosityLevel>("standard");
  const [observerMode, setObserverMode] = useState(!playerHeyaId);
  const [stopOnYusho, setStopOnYusho] = useState(false);
  const [stopOnPromotion, setStopOnPromotion] = useState(false);
  const [stopOnInjury, setStopOnInjury] = useState(false);
  
  const [result, setResult] = useState<AutoSimResult | null>(null);
  const [showResult, setShowResult] = useState(false);

  const handleStartSim = async () => {
    const stopConditions: StopCondition[] = [];
    if (stopOnYusho) stopConditions.push("yusho");
    if (stopOnPromotion) stopConditions.push("yokozunaPromotion", "ozekiPromotion");
    if (stopOnInjury) stopConditions.push("majorInjury");
    if (stopConditions.length === 0) stopConditions.push("never");

    const duration: SimDuration = {
      type: durationType as SimDuration["type"],
      count: durationCount
    } as SimDuration;

    const config: AutoSimConfig = {
      duration,
      stopConditions,
      verbosity,
      delegationPolicy: "balanced",
      observerMode,
      playerHeyaId
    };

    const simResult = await onStartSim(config);
    setResult(simResult);
    setShowResult(true);
    setIsOpen(false);
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" className="gap-2">
            <FastForward className="h-4 w-4" />
            Auto-Sim
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Watch the World
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Duration */}
            <div className="space-y-3">
              <Label>Simulation Duration</Label>
              <div className="flex gap-2">
                <Select value={durationType} onValueChange={setDurationType}>
                  <SelectTrigger className="flex-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="days">Days</SelectItem>
                    <SelectItem value="weeks">Weeks</SelectItem>
                    <SelectItem value="basho">Basho</SelectItem>
                    <SelectItem value="years">Years</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={String(durationCount)} onValueChange={(v) => setDurationCount(Number(v))}>
                  <SelectTrigger className="w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1</SelectItem>
                    <SelectItem value="2">2</SelectItem>
                    <SelectItem value="3">3</SelectItem>
                    <SelectItem value="5">5</SelectItem>
                    <SelectItem value="10">10</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Verbosity */}
            <div className="space-y-3">
              <Label>Detail Level</Label>
              <Select value={verbosity} onValueChange={(v) => setVerbosity(v as VerbosityLevel)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="minimal">Minimal - Results only</SelectItem>
                  <SelectItem value="standard">Standard - Key events</SelectItem>
                  <SelectItem value="detailed">Detailed - Full chronicle</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Stop Conditions */}
            <div className="space-y-3">
              <Label>Stop Conditions</Label>
              <div className="space-y-2">
                {playerHeyaId && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm">
                      <Trophy className="h-4 w-4 text-amber-400" />
                      Your stable wins yusho
                    </div>
                    <Switch checked={stopOnYusho} onCheckedChange={setStopOnYusho} />
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm">
                    <Star className="h-4 w-4 text-primary" />
                    Yokozuna/Ozeki promotion
                  </div>
                  <Switch checked={stopOnPromotion} onCheckedChange={setStopOnPromotion} />
                </div>
                {playerHeyaId && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm">
                      <AlertTriangle className="h-4 w-4 text-destructive" />
                      Major injury to your wrestler
                    </div>
                    <Switch checked={stopOnInjury} onCheckedChange={setStopOnInjury} />
                  </div>
                )}
              </div>
            </div>

            {/* Observer Mode */}
            {!playerHeyaId && (
              <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
                <div>
                  <div className="font-medium text-sm">Observer Mode</div>
                  <div className="text-xs text-muted-foreground">
                    Watch the world evolve without a player stable
                  </div>
                </div>
                <Switch checked={observerMode} onCheckedChange={setObserverMode} />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleStartSim} disabled={isSimulating} className="gap-2">
              {isSimulating ? (
                <>
                  <Clock className="h-4 w-4 animate-spin" />
                  Simulating...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4" />
                  Start Simulation
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Results Dialog */}
      <Dialog open={showResult} onOpenChange={setShowResult}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-amber-400" />
              Simulation Complete
            </DialogTitle>
          </DialogHeader>

          {result && (
            <div className="space-y-4">
              {/* Summary */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 rounded-lg bg-secondary/50 text-center">
                  <div className="text-2xl font-bold">{result.bashoSimulated}</div>
                  <div className="text-xs text-muted-foreground">Basho Simulated</div>
                </div>
                <div className="p-3 rounded-lg bg-secondary/50 text-center">
                  <div className="text-2xl font-bold">{result.endYear - result.startYear}</div>
                  <div className="text-xs text-muted-foreground">Years Elapsed</div>
                </div>
              </div>

              {result.stoppedBy !== "completed" && (
                <Badge variant="outline" className="w-full justify-center py-2">
                  Stopped by: {result.stoppedBy}
                </Badge>
              )}

              {/* Chronicle Highlights */}
              {result.chronicle.highlights.length > 0 && (
                <Card>
                  <CardHeader className="py-3">
                    <CardTitle className="text-sm">Chronicle Highlights</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-32">
                      <div className="space-y-1">
                        {result.chronicle.highlights.slice(0, 10).map((h, i) => (
                          <div key={i} className="text-sm text-muted-foreground">
                            {h}
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              )}

              {/* Top Champions */}
              {result.chronicle.topChampions.length > 0 && (
                <Card>
                  <CardHeader className="py-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" />
                      Era Champions
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {result.chronicle.topChampions.slice(0, 5).map((c, i) => (
                        <div key={c.rikishiId} className="flex items-center justify-between text-sm">
                          <span className="font-display">{c.shikona}</span>
                          <Badge variant="outline">{c.yushoCount} yusho</Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Era Labels */}
              {result.chronicle.eraLabels.length > 0 && (
                <div className="p-3 rounded-lg bg-primary/10 text-center">
                  <div className="text-sm font-medium text-primary">
                    {result.chronicle.eraLabels[0]}
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button onClick={() => setShowResult(false)}>Continue</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
