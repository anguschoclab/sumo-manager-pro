import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Play, FastForward, Trophy, Calendar, ArrowRight } from "lucide-react";
import { useGame } from "@/contexts/GameContext";
import { useToast } from "@/components/ui/use-toast";

/**
 * TimeControls
 * - Aligns strictly with GameContext interface (no updateState/saveGame/initializeGame).
 * - Provides quick controls for basho flow and interim progression.
 */
export function TimeControls() {
  const { state, startBasho, advanceDay, simulateAllBouts, endDay, endBasho, setPhase } = useGame();
  const { toast } = useToast();

  const world = state.world;
  if (!world) return null;

  const basho = world.currentBasho;
  const inBasho = !!basho?.isActive;

  const handleStartBasho = () => {
    startBasho();
    toast({ title: "Basho started", description: "The tournament is underway." });
  };

  const handleSimDay = () => {
    simulateAllBouts();
    endDay();
    toast({ title: "Day completed", description: "All bouts simulated and day ended." });
  };

  const handleAdvanceDay = () => {
    advanceDay();
  };

  const handleEndBasho = () => {
    endBasho();
    toast({ title: "Basho concluded", description: "Review results and banzuke changes." });
  };

  return (
    <Card>
      <CardContent className="p-4 flex flex-wrap gap-2 items-center">
        {!inBasho ? (
          <>
            <Button onClick={handleStartBasho} className="gap-2">
              <Play className="h-4 w-4" />
              Start Basho
            </Button>
            <Button variant="outline" onClick={() => setPhase("interim")} className="gap-2">
              <Calendar className="h-4 w-4" />
              Interim
            </Button>
          </>
        ) : (
          <>
            <Button onClick={handleSimDay} className="gap-2">
              <FastForward className="h-4 w-4" />
              Simulate Day
            </Button>
            <Button variant="outline" onClick={handleAdvanceDay} className="gap-2">
              <ArrowRight className="h-4 w-4" />
              Next Day
            </Button>
            <Button variant="outline" onClick={handleEndBasho} className="gap-2">
              <Trophy className="h-4 w-4" />
              End Basho
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
