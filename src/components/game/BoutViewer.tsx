// Main Bout Viewer - combines all bout UI components

import { useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { RikishiCard } from "./RikishiCard";
import { BoutResultDisplay } from "./BoutResultDisplay";
import { BoutLog } from "./BoutLog";
import { simulateBout } from "@/engine/bout";
import { SAMPLE_RIKISHI } from "@/engine/mockData";
import type { Rikishi, BoutResult } from "@/engine/types";
import { Swords, RotateCcw, Shuffle } from "lucide-react";

interface BoutViewerProps {
  className?: string;
}

export function BoutViewer({ className }: BoutViewerProps) {
  const [eastRikishi, setEastRikishi] = useState<Rikishi>(SAMPLE_RIKISHI[0]);
  const [westRikishi, setWestRikishi] = useState<Rikishi>(SAMPLE_RIKISHI[1]);
  const [result, setResult] = useState<BoutResult | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [seed, setSeed] = useState<string>("");

  const runSimulation = useCallback(() => {
    setIsSimulating(true);
    setResult(null);
    
    // Small delay for visual effect
    setTimeout(() => {
      const boutSeed = seed || `bout-${Date.now()}`;
      const boutResult = simulateBout(eastRikishi, westRikishi, boutSeed);
      setResult(boutResult);
      setIsSimulating(false);
    }, 500);
  }, [eastRikishi, westRikishi, seed]);

  const shuffleRikishi = useCallback(() => {
    setResult(null);
    const shuffled = [...SAMPLE_RIKISHI].sort(() => Math.random() - 0.5);
    setEastRikishi(shuffled[0]);
    setWestRikishi(shuffled[1]);
    setSeed("");
  }, []);

  const resetBout = useCallback(() => {
    setResult(null);
    setSeed("");
  }, []);

  return (
    <div className={cn("max-w-5xl mx-auto p-6", className)}>
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="font-display text-4xl font-bold text-foreground mb-2">
          大相撲
        </h1>
        <p className="text-muted-foreground">
          Sumo Bout Simulator
        </p>
      </div>

      {/* Rikishi matchup */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-east" />
            <span className="font-display font-semibold text-muted-foreground uppercase tracking-wide text-sm">
              East
            </span>
          </div>
          <RikishiCard 
            rikishi={eastRikishi} 
            side="east"
            isWinner={result?.winner === "east"}
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-west" />
            <span className="font-display font-semibold text-muted-foreground uppercase tracking-wide text-sm">
              West
            </span>
          </div>
          <RikishiCard 
            rikishi={westRikishi} 
            side="west"
            isWinner={result?.winner === "west"}
          />
        </div>
      </div>

      {/* Dohyo / Action area */}
      <div className="flex flex-col items-center gap-4 mb-8">
        <div className="dohyo-ring w-32 h-32 flex items-center justify-center">
          <span className="font-display text-2xl font-bold text-foreground/70">
            土俵
          </span>
        </div>

        <div className="flex gap-3">
          <Button
            onClick={shuffleRikishi}
            variant="outline"
            size="lg"
            disabled={isSimulating}
          >
            <Shuffle className="mr-2 h-4 w-4" />
            Shuffle
          </Button>

          <Button
            onClick={runSimulation}
            size="lg"
            disabled={isSimulating}
            className="min-w-[140px]"
          >
            {isSimulating ? (
              <span className="animate-pulse">Simulating...</span>
            ) : (
              <>
                <Swords className="mr-2 h-4 w-4" />
                Fight!
              </>
            )}
          </Button>

          {result && (
            <Button
              onClick={resetBout}
              variant="outline"
              size="lg"
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              Reset
            </Button>
          )}
        </div>

        {/* Seed input for deterministic testing */}
        <div className="flex items-center gap-2 text-sm">
          <label htmlFor="seed" className="text-muted-foreground">
            Seed (optional):
          </label>
          <input
            id="seed"
            type="text"
            value={seed}
            onChange={(e) => setSeed(e.target.value)}
            placeholder="random"
            className="px-2 py-1 text-sm bg-secondary border border-border rounded-md w-32 text-foreground placeholder:text-muted-foreground"
          />
        </div>
      </div>

      {/* Results */}
      {result && (
        <div className="grid md:grid-cols-2 gap-6 animate-fade-in">
          <BoutResultDisplay
            result={result}
            eastRikishi={eastRikishi}
            westRikishi={westRikishi}
          />
          <BoutLog log={result.log} />
        </div>
      )}
    </div>
  );
}
