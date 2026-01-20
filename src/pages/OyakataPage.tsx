// OyakataPage.tsx - Oyakata Profile View
// Displays the personality, traits, and management style of a stable's oyakata

import { useParams, useNavigate } from "react-router-dom";
import { useGame } from "@/contexts/GameContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Quote, Users, Target, Shield, Flame, Brain } from "lucide-react";
import { 
  getOrCreateOyakataPersonality, 
  archetypeLabel, 
  traitLabel,
  type OyakataPersonality,
  type OyakataTraits
} from "@/engine/oyakataPersonalities";
import { StableName } from "@/components/ClickableName";

interface TraitDisplayProps {
  label: string;
  value: number;
  icon: React.ReactNode;
}

function TraitDisplay({ label, value, icon }: TraitDisplayProps) {
  const level = traitLabel(value);
  const colorClass = level === "high" ? "text-primary" : level === "low" ? "text-muted-foreground" : "text-foreground";
  
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          {icon}
          <span className={colorClass}>{label}</span>
        </div>
        <span className="text-xs text-muted-foreground">{Math.round(value)}</span>
      </div>
      <Progress value={value} className="h-2" />
    </div>
  );
}

interface TraitGroupProps {
  title: string;
  icon: React.ReactNode;
  traits: Array<{ key: keyof OyakataTraits; label: string }>;
  oyakataTraits: OyakataTraits;
}

function TraitGroup({ title, icon, traits, oyakataTraits }: TraitGroupProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          {icon}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {traits.map(({ key, label }) => (
          <TraitDisplay 
            key={key} 
            label={label} 
            value={oyakataTraits[key]} 
            icon={<div className="w-2 h-2 rounded-full bg-primary/50" />}
          />
        ))}
      </CardContent>
    </Card>
  );
}

export default function OyakataPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { state } = useGame();
  
  if (!state.world || !id) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">No world or oyakata specified.</p>
      </div>
    );
  }

  // Find heya by oyakata id or heya id
  let heya = Array.from(state.world.heyas.values()).find(h => h.oyakataId === id);
  if (!heya) {
    heya = state.world.heyas.get(id);
  }

  if (!heya) {
    return (
      <div className="p-6">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <p className="text-muted-foreground">Oyakata not found.</p>
      </div>
    );
  }

  const personality = getOrCreateOyakataPersonality(state.world, heya);
  const archetype = archetypeLabel(personality.archetype);
  
  const trainingTraits: Array<{ key: keyof OyakataTraits; label: string }> = [
    { key: "discipline", label: "Discipline" },
    { key: "intensityBias", label: "Intensity Preference" },
    { key: "recoveryBias", label: "Recovery Emphasis" },
    { key: "techniqueBias", label: "Technique Focus" },
    { key: "youthBias", label: "Youth Development" },
  ];

  const competitiveTraits: Array<{ key: keyof OyakataTraits; label: string }> = [
    { key: "riskTolerance", label: "Risk Tolerance" },
    { key: "shortTermism", label: "Short-Term Focus" },
    { key: "adaptability", label: "Adaptability" },
  ];

  const organizationalTraits: Array<{ key: keyof OyakataTraits; label: string }> = [
    { key: "scoutingBias", label: "Scouting Investment" },
    { key: "favoritism", label: "Star Focus" },
    { key: "professionalism", label: "Professionalism" },
  ];

  const narrativeTraits: Array<{ key: keyof OyakataTraits; label: string }> = [
    { key: "charisma", label: "Charisma" },
    { key: "tradition", label: "Traditionalism" },
  ];

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="font-display text-2xl font-bold">Oyakata Profile</h1>
          <p className="text-muted-foreground">
            <StableName id={heya.id} name={heya.name} />
          </p>
        </div>
      </div>

      {/* Profile Card */}
      <Card className="border-primary/20 bg-gradient-to-br from-card to-muted/20">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-xl font-display">
                {archetype.en}
              </CardTitle>
              <CardDescription className="text-lg font-display text-primary/80">
                {archetype.ja}
              </CardDescription>
            </div>
            <Badge variant="outline" className="capitalize">
              {personality.governanceStyle} governance
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Motto */}
          <div className="flex items-start gap-3 p-4 bg-muted/50 rounded-lg">
            <Quote className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <p className="italic text-foreground/90">"{personality.motto.en}"</p>
          </div>
          
          {/* Summary */}
          <p className="text-sm text-muted-foreground leading-relaxed">
            {personality.summary}
          </p>

          {/* Tags */}
          <div className="flex flex-wrap gap-2">
            {personality.tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="capitalize">
                {tag.split("-").join(" ")}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Traits Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <TraitGroup
          title="Training Philosophy"
          icon={<Flame className="h-4 w-4 text-orange-500" />}
          traits={trainingTraits}
          oyakataTraits={personality.traits}
        />
        
        <TraitGroup
          title="Competitive Temperament"
          icon={<Target className="h-4 w-4 text-red-500" />}
          traits={competitiveTraits}
          oyakataTraits={personality.traits}
        />
        
        <TraitGroup
          title="Organization & Scouting"
          icon={<Users className="h-4 w-4 text-blue-500" />}
          traits={organizationalTraits}
          oyakataTraits={personality.traits}
        />
        
        <TraitGroup
          title="Public Persona"
          icon={<Brain className="h-4 w-4 text-purple-500" />}
          traits={narrativeTraits}
          oyakataTraits={personality.traits}
        />
      </div>

      {/* Governance Style Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Governance Style: <span className="capitalize">{personality.governanceStyle}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            {personality.governanceStyle === "strict" && 
              "This oyakata runs a tight ship with clear rules and high expectations. Discipline infractions are dealt with swiftly, reducing scandal risk but potentially limiting creativity."}
            {personality.governanceStyle === "pragmatic" && 
              "This oyakata balances tradition with flexibility, adapting rules to circumstances. A practical approach that works for most situations without being too rigid or too loose."}
            {personality.governanceStyle === "loose" && 
              "This oyakata gives wrestlers significant freedom and autonomy. This can foster innovation and loyalty but may increase the risk of discipline issues or scandals."}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
