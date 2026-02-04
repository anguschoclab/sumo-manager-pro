import React, { useEffect, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useGame } from "@/contexts/GameContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getArchetypeDescription } from "@/engine/oyakataPersonalities";
import type { Oyakata } from "@/engine/types";
import { Brain, Heart, Briefcase, Zap, Scale } from "lucide-react";

export default function OyakataPage() {
  const { state, isLoaded } = useGame();
  const [selectedOyakata, setSelectedOyakata] = useState<Oyakata | null>(null);

  useEffect(() => {
    if (isLoaded && state.playerHeyaId) {
      const playerHeya = state.heyas.get(state.playerHeyaId);
      if (playerHeya && playerHeya.oyakataId) {
        const o = state.oyakata.get(playerHeya.oyakataId);
        if (o) setSelectedOyakata(o);
      }
    }
  }, [isLoaded, state]);

  if (!isLoaded || !selectedOyakata) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-full">Loading Oyakata...</div>
      </AppLayout>
    );
  }

  const traits = selectedOyakata.traits;

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* HEADER */}
        <div className="flex items-start gap-6">
          <Avatar className="h-32 w-32 border-4 border-muted">
            <AvatarFallback className="text-4xl font-bold bg-slate-800 text-white">
              {selectedOyakata.name[0]}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-4xl font-bold">{selectedOyakata.name} Oyakata</h1>
              <Badge variant="secondary" className="text-lg">Age {selectedOyakata.age}</Badge>
            </div>
            <div className="text-muted-foreground mt-1 flex gap-4">
              <span>Former: <strong>{selectedOyakata.formerShikona}</strong></span>
              <span>•</span>
              <span>Highest Rank: <strong>{selectedOyakata.highestRank}</strong></span>
              <span>•</span>
              <span>Tenure: <strong>{selectedOyakata.yearsInCharge} Years</strong></span>
            </div>
            
            <div className="mt-4 flex gap-2">
                <Badge className="bg-blue-600 hover:bg-blue-700 capitalize text-sm px-3 py-1">
                    {selectedOyakata.archetype}
                </Badge>
                <div className="text-sm text-muted-foreground italic flex items-center">
                    "{getArchetypeDescription(selectedOyakata.archetype)}"
                </div>
            </div>
          </div>
        </div>

        {/* TRAITS DASHBOARD */}
        <div className="grid gap-6 md:grid-cols-2">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Brain className="h-5 w-5" />
                        Managerial Personality
                    </CardTitle>
                    <CardDescription>
                        Biases that drive decision making and stable culture.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <TraitRow icon={Briefcase} label="Ambition" value={traits.ambition} 
                        desc="Desire for promotion vs stability." color="bg-amber-500" />
                    <TraitRow icon={Scale} label="Patience" value={traits.patience} 
                        desc="Long-term development vs immediate results." color="bg-blue-500" />
                    <TraitRow icon={Zap} label="Risk Tolerance" value={traits.risk} 
                        desc="Willingness to push through injury." color="bg-red-500" />
                    <TraitRow icon={Brain} label="Tradition" value={traits.tradition} 
                        desc="Adherence to old training methods." color="bg-slate-600" />
                    <TraitRow icon={Heart} label="Compassion" value={traits.compassion} 
                        desc="Care for rikishi welfare." color="bg-green-500" />
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Other Masters</CardTitle>
                    <CardDescription>View profiles of rival Oyakata.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2">
                        {Array.from(state.oyakata.values())
                            .filter(o => o.id !== selectedOyakata.id)
                            .map(o => {
                                const h = state.heyas.get(o.heyaId);
                                return (
                                    <div 
                                        key={o.id} 
                                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted cursor-pointer transition-colors"
                                        onClick={() => setSelectedOyakata(o)}
                                    >
                                        <div>
                                            <div className="font-bold">{o.name}</div>
                                            <div className="text-xs text-muted-foreground">{h?.name}</div>
                                        </div>
                                        <Badge variant="outline" className="capitalize">{o.archetype}</Badge>
                                    </div>
                                );
                            })
                        }
                    </div>
                </CardContent>
            </Card>
        </div>
      </div>
    </AppLayout>
  );
}

function TraitRow({ icon: Icon, label, value, desc, color }: any) {
    return (
        <div className="space-y-1">
            <div className="flex justify-between items-end">
                <div className="flex items-center gap-2 font-medium">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                    {label}
                </div>
                <span className="text-xs font-mono">{value}/100</span>
            </div>
            <Progress value={value} indicatorClassName={color} className="h-2" />
            <p className="text-[10px] text-muted-foreground">{desc}</p>
        </div>
    );
}
