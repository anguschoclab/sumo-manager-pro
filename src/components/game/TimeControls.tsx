import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Play, FastForward, Trophy, Calendar, ArrowRight } from "lucide-react";
import { useGame } from "@/contexts/GameContext";
import { useToast } from "@/components/ui/use-toast";
import { advanceBashoDay, startBasho, endBasho, advanceInterim, publishBanzukeUpdate } from "@/engine/world";

export function TimeControls() {
  const { state, updateState, saveGame } = useGame();
  const { toast } = useToast();

  if (!state) return null;

  const phase = state.cyclePhase || "active_basho"; // Default fallback
  const basho = state.currentBasho;

  // === HANDLERS ===

  const handleNextDay = () => {
    if (!basho) return;
    const nextState = advanceBashoDay({ ...state });
    updateState(nextState);
  };

  const handleFinishBasho = () => {
    // Trigger End of Basho logic
    const nextState = endBasho({ ...state });
    updateState(nextState);
    toast({
        title: "Basho Concluded",
        description: "Review the results and awards before proceeding.",
    });
    saveGame();
  };

  const handlePublishBanzuke = () => {
    const nextState = publishBanzukeUpdate({ ...state });
    updateState(nextState);
    toast({
        title: "New Banzuke Published",
        description: "Rankings have been updated. Entering interim training period.",
    });
    saveGame();
  };

  const handleAdvanceWeek = () => {
    const nextState = advanceInterim({ ...state }, 1);
    updateState(nextState);
  };

  const handleStartBasho = () => {
    const nextState = startBasho({ ...state });
    updateState(nextState);
    toast({
        title: "Grand Sumo Tournament Started!",
        description: `The ${nextState.currentBasho?.bashoName} Basho has begun.`,
    });
    saveGame();
  };

  // === RENDER ===

  return (
    <Card className="border-t-4 border-t-primary shadow-sm">
      <CardContent className="p-4 flex items-center justify-between gap-4">
        
        {/* STATUS TEXT */}
        <div className="flex-1">
          <div className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            Current Phase
          </div>
          <div className="text-2xl font-bold flex items-center gap-2">
            {phase === "active_basho" && basho && (
               <>
                 <SwordsIcon className="h-6 w-6 text-red-600" />
                 Day {basho.day} <span className="text-muted-foreground text-lg font-normal">of 15</span>
               </>
            )}
            {phase === "post_basho" && (
                <>
                  <Trophy className="h-6 w-6 text-yellow-500" />
                  Post-Basho Review
                </>
            )}
            {phase === "interim" && (
                <>
                  <Calendar className="h-6 w-6 text-blue-500" />
                  Interim Period <span className="text-muted-foreground text-lg font-normal">(Week {state.week})</span>
                </>
            )}
          </div>
        </div>

        {/* ACTIONS */}
        <div className="flex items-center gap-2">
            
            {/* 1. ACTIVE BASHO CONTROLS */}
            {phase === "active_basho" && basho && (
                <>
                  {basho.day < 15 ? (
                      <Button onClick={handleNextDay} size="lg" className="gap-2">
                          <Play className="h-5 w-5 fill-current" />
                          Next Day
                      </Button>
                  ) : (
                      <Button onClick={handleFinishBasho} size="lg" variant="default" className="gap-2 bg-yellow-600 hover:bg-yellow-700 text-white">
                          <Trophy className="h-5 w-5" />
                          Conclude Basho
                      </Button>
                  )}
                </>
            )}

            {/* 2. POST BASHO CONTROLS */}
            {phase === "post_basho" && (
                <Button onClick={handlePublishBanzuke} size="lg" variant="default" className="gap-2">
                    <ScrollTextIcon className="h-5 w-5" />
                    Publish New Rankings
                </Button>
            )}

            {/* 3. INTERIM CONTROLS */}
            {phase === "interim" && (
                <>
                   <Button onClick={handleAdvanceWeek} variant="outline" size="lg" className="gap-2">
                      <FastForward className="h-5 w-5" />
                      Advance Week
                   </Button>
                   <Button onClick={handleStartBasho} size="lg" className="gap-2 bg-red-600 hover:bg-red-700 text-white">
                      <SwordsIcon className="h-5 w-5" />
                      Start {state.currentBashoName || "Next"} Basho
                   </Button>
                </>
            )}

        </div>
      </CardContent>
    </Card>
  );
}

function SwordsIcon(props: React.SVGProps<SVGSVGElement>) {
    return (
      <svg
        {...props}
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <polyline points="14.5 17.5 3 6 3 3 6 3 17.5 14.5" />
        <line x1="13" x2="19" y1="19" y2="13" />
        <line x1="16" x2="20" y1="16" y2="20" />
        <line x1="19" x2="21" y1="21" y2="19" />
      </svg>
    )
}

function ScrollTextIcon(props: React.SVGProps<SVGSVGElement>) {
    return (
      <svg
        {...props}
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M15 12h-5" />
        <path d="M15 8h-5" />
        <path d="M19 17V5a2 2 0 0 0-2-2H4" />
        <path d="M8 21h12a2 2 0 0 0 2-2v-1a1 1 0 0 0-1-1H11a1 1 0 0 0-1 1v1a2 2 0 1 1-4 0V5a2 2 0 1 0-4 0v2a1 1 0 0 0 1 1h3" />
      </svg>
    )
}
