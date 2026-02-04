// OyakataPage.tsx - Oyakata Profile View
// Displays the personality, traits, and management style of a stable's oyakata
//
// DROP-IN FIXES (runtime + safety):
// - Safe guards for missing world/id/heya
// - Supports route param being either oyakataId OR heyaId (fallback search)
// - Avoids assuming personality fields always exist (tags/motto/summary)
// - Uses canonical "Heya" naming in copy (Basho is the game title)
// - Defensive trait access (missing keys -> 0)
// - Keeps UI structure, but prevents crashes on older saves / partial data

import React from "react";
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
  type OyakataTraits
} from "@/engine/oyakataPersonalities";
import { StableName } from "@/components/ClickableName";

interface TraitDisplayProps {
  label: string;
  value: number;
  icon: React.ReactNode;
}

function clamp01to100(n: number) {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(100, n));
}

function TraitDisplay({ label, value, icon }: TraitDisplayProps) {
  const v = clamp01to100(value);
  const level = traitLabel(v as any);
  const colorClass = level === "high" ? "text-primary" : level === "low" ? "text-muted-foreground" : "text-foreground";

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          {icon}
          <span className={colorClass}>{label}</span>
        </div>
        <span className="text-xs text-muted-foreground">{Math.round(v)}</span>
      </div>
      <Progress value={v} className="h-2" />
    </div>
  );
}

interface TraitGroupProps {
  title: string;
  icon: React.ReactNode;
  traits: Array<{ key: keyof OyakataTraits; label: string }>;
  oyakataTraits: Partial<OyakataTraits> | null | undefined;
}

function TraitGroup({ title, icon, traits, oyakataTraits }: TraitGroupProps) {
  return (
    <Card className="paper">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          {icon}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {traits.map(({ key, label }) => {
          const raw = (oyakataTraits as any)?.[key];
          const value = typeof raw === "number" ? raw : 0;
          return (
            <TraitDisplay
              key={String(key)}
              label={label}
              value={value}
              icon={<div className="w-2 h-2 rounded-full bg-primary/50" />}
            />
          );
        })}
      </CardContent>
    </Card>
  );
}

function governanceDescription(style: string) {
  if (style === "strict")
    return "This oyakata runs a tight ship with clear rules and high expectations. Discipline infractions are handled swiftly, reducing scandal risk but sometimes limiting flexibility.";
  if (style === "loose")
    return "This oyakata gives wrestlers significant autonomy. It can foster innovation and loyalty, but may increase discipline issues if the culture isn’t strong.";
  // pragmatic (default)
  return "This oyakata balances tradition with flexibility, adapting rules to the situation. A practical approach that works in most environments without being overly rigid.";
}

export default function OyakataPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { state } = useGame();

  const world = state.world;

  if (!world || !id) {
    return (
      <div className="p-6">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <p className="text-muted-foreground">No world loaded or no oyakata specified.</p>
      </div>
    );
  }

  // Route param can be an oyakataId OR a heyaId
  let heya =
    Array.from(world.heyas.values()).find((h: any) => h?.oyakataId === id) ||
    world.heyas.get(id) ||
    null;

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

  // Personality is generated/loaded deterministically by engine helper.
  const personality: any = getOrCreateOyakataPersonality(world as any, heya as any);
  const archetype = archetypeLabel(personality?.archetype);

  const traits: Partial<OyakataTraits> | null = (personality?.traits ?? null) as any;

  const trainingTraits: Array<{ key: keyof OyakataTraits; label: string }> = [
    { key: "discipline", label: "Discipline" },
    { key: "intensityBias", label: "Intensity Preference" },
    { key: "recoveryBias", label: "Recovery Emphasis" },
    { key: "techniqueBias", label: "Technique Focus" },
    { key: "youthBias", label: "Youth Development" }
  ];

  const competitiveTraits: Array<{ key: keyof OyakataTraits; label: string }> = [
    { key: "riskTolerance", label: "Risk Tolerance" },
    { key: "shortTermism", label: "Short-Term Focus" },
    { key: "adaptability", label: "Adaptability" }
  ];

  const organizationalTraits: Array<{ key: keyof OyakataTraits; label: string }> = [
    { key: "scoutingBias", label: "Scouting Investment" },
    { key: "favoritism", label: "Star Focus" },
    { key: "professionalism", label: "Professionalism" }
  ];

  const narrativeTraits: Array<{ key: keyof OyakataTraits; label: string }> = [
    { key: "charisma", label: "Charisma" },
    { key: "tradition", label: "Traditionalism" }
  ];

  const governanceStyle = typeof personality?.governanceStyle === "string" ? personality.governanceStyle : "pragmatic";
  const tags: string[] = Array.isArray(personality?.tags) ? personality.tags : [];

  const mottoEn =
    (typeof personality?.motto?.en === "string" && personality.motto.en.trim()) ||
    "Train with purpose. Fight with honor.";
  const summary =
    (typeof personality?.summary === "string" && personality.summary.trim()) ||
    "An oyakata shaped by the dohyo—balancing tradition, development, and results.";

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
            <StableName id={(heya as any).id} name={(heya as any).name} />
          </p>
        </div>
      </div>

      {/* Profile Card */}
      <Card className="paper border-primary/20 bg-gradient-to-br from-card to-muted/20">
        <CardHeader>
          <div className="flex items-start justify-between gap-3">
            <div>
              <CardTitle className="text-xl font-display">{archetype?.en ?? "Oyakata"}</CardTitle>
              <CardDescription className="text-lg font-display text-primary/80">
                {archetype?.ja ?? ""}
              </CardDescription>
            </div>
            <Badge variant="outline" className="capitalize shrink-0">
              {governanceStyle} governance
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Motto */}
          <div className="flex items-start gap-3 p-4 bg-muted/50 rounded-lg">
            <Quote className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <p className="italic text-foreground/90">"{mottoEn}"</p>
          </div>

          {/* Summary */}
          <p className="text-sm text-muted-foreground leading-relaxed">{summary}</p>

          {/* Tags */}
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="capitalize">
                  {String(tag).split("-").join(" ")}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Traits Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <TraitGroup
          title="Training Philosophy"
          icon={<Flame className="h-4 w-4 text-orange-500" />}
          traits={trainingTraits}
          oyakataTraits={traits}
        />

        <TraitGroup
          title="Competitive Temperament"
          icon={<Target className="h-4 w-4 text-red-500" />}
          traits={competitiveTraits}
          oyakataTraits={traits}
        />

        <TraitGroup
          title="Organization & Scouting"
          icon={<Users className="h-4 w-4 text-blue-500" />}
          traits={organizationalTraits}
          oyakataTraits={traits}
        />

        <TraitGroup
          title="Public Persona"
          icon={<Brain className="h-4 w-4 text-purple-500" />}
          traits={narrativeTraits}
          oyakataTraits={traits}
        />
      </div>

      {/* Governance Style Details */}
      <Card className="paper">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Governance Style: <span className="capitalize">{governanceStyle}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{governanceDescription(governanceStyle)}</p>
        </CardContent>
      </Card>
    </div>
  );
}
