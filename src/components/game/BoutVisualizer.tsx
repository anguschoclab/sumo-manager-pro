// src/components/game/BoutVisualizer.tsx
import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion"; // Assuming framer-motion is available, else use CSS transitions
import { Play, Pause, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import type { BoutResult, Rikishi } from "@/engine/types";
import { RikishiName } from "@/components/ClickableName";

// Visual constants
const DOHYO_SIZE = 300;
const CENTER = DOHYO_SIZE / 2;
const RING_RADIUS = 130; // 15ft diameter scaled
const START_OFFSET = 40; // Distance from center for tachiai lines

interface BoutVisualizerProps {
  result: BoutResult;
  east: Rikishi;
  west: Rikishi;
  onComplete?: () => void;
}

export function BoutVisualizer({ result, east, west, onComplete }: BoutVisualizerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [tick, setTick] = useState(0);
  const [speed, setSpeed] = useState(1000); // ms per turn

  // Parse log to determine duration
  const log = (result as any).log || [];
  const totalTicks = log.length;

  // -- The "Vibes" Physics Engine --
  // We don't have real X,Y, so we fake it based on who won and the current tick.
  // 0 = Center, -100 = West Edge, +100 = East Edge
  const getPosition = (currentTick: number, side: "east" | "west") => {
    if (currentTick === 0) {
      return side === "east" ? START_OFFSET : -START_OFFSET;
    }

    // Normalized progress (0 to 1)
    const progress = currentTick / totalTicks;
    
    // Determine push direction: +1 (East Winning), -1 (West Winning)
    const winnerDir = result.winner === "east" ? -1 : 1; 
    
    // Base movement: The pair moves slowly towards the loser's edge
    // East starts at +40, West at -40.
    // If East wins (moves left/negative), East ends at ~ -RING_RADIUS
    
    let basePos = 0;
    
    if (result.winner === "east") {
       // East pushes West (negative direction in this coord system for visual clarity)
       // Let's say East is Right side, West is Left side.
       // Actually, standard TV: East is Right, West is Left.
       // So East (Right) pushes West (Left) -> Movement goes Left (Negative).
       basePos = progress * (-RING_RADIUS + 20); 
    } else {
       // West pushes East -> Movement goes Right (Positive)
       basePos = progress * (RING_RADIUS - 20);
    }

    // Add "Struggle Jitter" based on even/odd ticks
    const jitter = (currentTick % 2 === 0 ? 5 : -5) * (1 - progress);

    if (side === "east") return START_OFFSET + basePos + jitter;
    return -START_OFFSET + basePos + jitter;
  };

  // Timer Loop
  useEffect(() => {
    let interval: any;
    if (isPlaying && tick < totalTicks) {
      interval = setInterval(() => {
        setTick((t) => {
          if (t >= totalTicks - 1) {
            setIsPlaying(false);
            onComplete?.();
            return totalTicks; // Ensure we show the final state
          }
          return t + 1;
        });
      }, speed);
    }
    return () => clearInterval(interval);
  }, [isPlaying, tick, totalTicks, speed, onComplete]);

  // Derived positions
  // We map the 1D "push" value to 2D coordinates for the view
  // East is normally Right (positive X), West is Left (negative X) in standard coords,
  // but let's map: East start X= +40, West start X= -40.
  const eastX = CENTER + getPosition(tick, "east");
  const westX = CENTER + getPosition(tick, "west");

  const currentLogText = log[tick] ? log[tick].text : (tick === totalTicks ? result.kimariteName : "Tachiai!");

  return (
    <div className="flex flex-col items-center space-y-4 w-full max-w-md mx-auto">
      {/* The Dohyo Stage */}
      <div className="relative bg-[#e4d8b4] rounded-full shadow-inner border-4 border-[#8b4513]" 
           style={{ width: DOHYO_SIZE, height: DOHYO_SIZE }}>
        
        {/* Ring Boundary (Tawara) */}
        <div className="absolute rounded-full border-4 border-white/30"
             style={{ 
               width: RING_RADIUS * 2, 
               height: RING_RADIUS * 2, 
               top: CENTER - RING_RADIUS, 
               left: CENTER - RING_RADIUS 
             }} />
        
        {/* Tachiai Lines */}
        <div className="absolute bg-white/40 h-16 w-1" style={{ top: CENTER - 32, left: CENTER - START_OFFSET }} />
        <div className="absolute bg-white/40 h-16 w-1" style={{ top: CENTER - 32, left: CENTER + START_OFFSET }} />

        {/* West Wrestler (Left side usually, but standard UI puts West on right? Check specific Sumo convention. usually East=Right, West=Left visually) */}
        {/* We will stick to: East = Right Side (Green), West = Left Side (Red) for contrast */}
        
        {/* WEST DOT */}
        <motion.div
          className="absolute w-8 h-8 rounded-full bg-blue-600 border-2 border-white shadow-lg flex items-center justify-center text-[10px] font-bold text-white z-10"
          animate={{ left: westX - 16, top: CENTER - 16 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
        >
          W
        </motion.div>

        {/* EAST DOT */}
        <motion.div
          className="absolute w-8 h-8 rounded-full bg-green-600 border-2 border-white shadow-lg flex items-center justify-center text-[10px] font-bold text-white z-10"
          animate={{ left: eastX - 16, top: CENTER - 16 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
        >
          E
        </motion.div>

        {/* Kimarite Flash on End */}
        {tick >= totalTicks && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-full animate-in fade-in">
                <div className="bg-white px-3 py-1 rounded-full font-bold shadow-xl text-primary transform scale-125">
                    {result.kimariteName}
                </div>
            </div>
        )}
      </div>

      {/* Narrative Box */}
      <div className="w-full min-h-[80px] p-4 bg-card rounded-lg border text-center flex flex-col items-center justify-center transition-all">
        <div className="text-xs font-mono text-muted-foreground mb-1">
            Turn {tick}/{totalTicks}
        </div>
        <p className="font-medium animate-in slide-in-from-bottom-2 fade-in">
            {currentLogText}
        </p>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-4 w-full">
        <Button
          variant="outline"
          size="icon"
          onClick={() => {
            if (tick >= totalTicks) setTick(0);
            setIsPlaying(!isPlaying);
          }}
        >
          {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
        </Button>
        
        <Button variant="ghost" size="icon" onClick={() => { setIsPlaying(false); setTick(0); }}>
            <RotateCcw className="h-4 w-4" />
        </Button>

        <div className="flex-1">
            <Slider 
                value={[2000 - speed]} 
                min={100} 
                max={1900} 
                onValueChange={(v) => setSpeed(2000 - v[0])} 
            />
            <div className="text-[10px] text-muted-foreground text-center mt-1">Speed</div>
        </div>
      </div>
    </div>
  );
}
