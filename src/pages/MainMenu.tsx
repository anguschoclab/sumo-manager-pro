// Main Menu - World creation and game start
// Traditional Japanese aesthetic

import { useState } from "react";
import { Helmet } from "react-helmet";
import { useNavigate } from "react-router-dom";
import { useGame } from "@/contexts/GameContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CircleDot, Dices, ArrowRight } from "lucide-react";

export default function MainMenu() {
  const navigate = useNavigate();
  const { createWorld } = useGame();
  const [seed, setSeed] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const handleCreateWorld = () => {
    setIsCreating(true);
    const worldSeed = seed || `world-${Date.now()}`;
    
    // Small delay for visual feedback
    setTimeout(() => {
      createWorld(worldSeed);
      navigate("/");
    }, 500);
  };

  const handleRandomSeed = () => {
    const randomSeed = `${Math.random().toString(36).substring(2, 8)}-${Date.now().toString(36)}`;
    setSeed(randomSeed);
  };

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
                  Enter the Dohyo
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Footer Info */}
        <div className="mt-12 text-center text-sm text-muted-foreground animate-fade-in">
          <p className="mb-2">82 authentic kimarite • 6 annual tournaments • Full economics</p>
          <p className="font-display text-xs">頂点を目指せ — Reach for the summit</p>
        </div>
      </div>
    </>
  );
}
