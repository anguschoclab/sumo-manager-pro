// BoutViewer.tsx
// Main Bout Viewer - combines all bout UI components
//
// Fixes:
// - Removes Math.random shuffle (use deterministic shuffle + seedrandom)
// - Ensures SAMPLE_RIKISHI access is safe (prevents undefined crashes)
// - Guards against missing result.log
// - Prevents setState after unmount (clears timeout)
// - Makes shuffle deterministic (seeded) but still “random-feeling” when seed empty

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import seedrandom from "seedrandom";
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

function safeSampleRikishi(): Rikishi[] {
  return Array.isArray(SAMPLE_RIKISHI) ? (SAMPLE_RIKISHI as Rikishi[]).filter(Boolean) : [];
}

function stableKey(r: Rikishi | undefined | null): string {
  return r?.id || r?.shikona || "";
}

function deterministicShuffle<T>(items: T[], seed: string): T[] {
  const rng = seedrandom(seed);
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export function BoutViewer({ className }: BoutViewerProps) {
  const samples = useMemo(() => safeSampleRikishi(), []);
  const fallbackEast = samples[0] ?? (null as any as Rikishi);
  const fallbackWest = samples[1] ?? samples[0] ?? (null as any as Rikishi);

  const [eastRikishi, setEastRikishi] = useState<Rikishi>(fallbackEast);
  const [westRikishi, setWestRikishi] = useState<Rikishi>(fallbackWest);
  const [result, setResult] = useState<BoutResult | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [seed, setSeed] = useState<string>("");

  const timeoutRef = useRef<number | null>(null);

  // Cleanup to avoid setState after unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    };
  }, []);

  const canRun = Boolean(eastRikishi && westRikishi && stableKey(eastRikishi) && stableKey(westRikishi));

  const runSimulation = useCallback(() => {
    if (!canRun) return;

    if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    timeoutRef.current = null;

    setIsSimulating(true);
    setResult(null);

    // Small delay for visual effect
    timeoutRef.current = window.setTimeout(() => {
      const boutSeed = seed?.trim() || `bout-${Date.now()}`;
      const boutResult = simulateBout(eastRikishi, westRikishi, boutSeed);
      setResult(boutResult);
      setIsSimulating(false);
      timeoutRef.current = null;
    }, 500);
  }, [canRun, eastRikishi, westRikishi, seed]);

  const shuffleRikishi = useCallback(() => {
    if (samples.length < 2) return;

    setResult(null);

    // Deterministic but “fresh”: if user has a seed, honor it; otherwise use a time-based seed
    const shuffleSeed = seed?.trim() ? `shuffle-${seed.trim()}` : `shuffle-${Date.now()}`;

    const shuffled = deterministicShuffle(samples, shuffleSeed);

    // Ensure two distinct picks if possible
    const a = shuffled[0];
    const b = shuffled.find((x) => stableKey(x) !== stableKey(a)) ?? shuffled[1] ?? a;

    setEastRikishi(a);
    setWestRikishi(b);

    // Optional: keep user seed (so they can deterministically rerun) — but clear if it was empty
    if (!seed?.trim()) setSeed("");
  }, [samples, seed]);

  const resetBout = useCallback(() => {
    if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    timeoutRef.current = null;

    setIsSimulating(false);
    setResult(null);
    setSeed("");
  }, []);

  const safeLog = useMemo(() => {
    const log = (result as any)?.log;
    return Array.isArray(log) ? log : [];
  }, [result]);

  return (
    <div className={cn("max-w-5xl mx-auto p-6", className)}>
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="font-display text-4xl font-bold text-foreground mb-2">大相撲</h1>
        <p className="text-muted-foreground">Sumo Bout Simulator</p>
      </div>

      {!canRun && (
        <div className="paper p-4 mb-6 text-sm text-muted-foreground">
          No sample rikishi available. Ensure <code>SAMPLE_RIKISHI</code> contains at least two wrestlers.
        </div>
      )}

      {/* Rikishi matchup */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-east" />
            <span className="font-display font-semibold text-muted-foreground uppercase tracking-wide text-sm">
              East
            </span>
          </div>
          {eastRikishi && (
            <RikishiCard rikishi={eastRikishi} side="east" isWinner={result?.winner === "east"} />
          )}
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-west" />
            <span className="font-display font-semibold text-muted-foreground uppercase tracking-wide text-sm">
              West
            </span>
          </div>
          {westRikishi && (
            <RikishiCard rikishi={westRikishi} side="west" isWinner={result?.winner === "west"} />
          )}
        </div>
      </div>

      {/* Dohyo / Action area */}
      <div className="flex flex-col items-center gap-4 mb-8">
        <div className="dohyo-ring w-32 h-32 flex items-center justify-center">
          <span className="font-display text-2xl font-bold text-foreground/70">土俵</span>
        </div>

        <div className="flex gap-3">
          <Button onClick={shuffleRikishi} variant="outline" size="lg" disabled={isSimulating || samples.length < 2}>
            <Shuffle className="mr-2 h-4 w-4" />
            Shuffle
          </Button>

          <Button
            onClick={runSimulation}
            size="lg"
            disabled={isSimulating || !canRun}
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
            <Button onClick={resetBout} variant="outline" size="lg">
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
            className="px-2 py-1 text-sm bg-secondary border border-border rounded-md w-40 text-foreground placeholder:text-muted-foreground"
            disabled={isSimulating}
          />
        </div>
      </div>

      {/* Results */}
      {result && (
        <div className="grid md:grid-cols-2 gap-6 animate-fade-in">
          <BoutResultDisplay result={result} eastRikishi={eastRikishi} westRikishi={westRikishi} />
          <BoutLog log={safeLog} />
        </div>
      )}
    </div>
  );
}
