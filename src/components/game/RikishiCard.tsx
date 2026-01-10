// Rikishi card component - displays wrestler info with fog of war
// Per Observability Contract: show qualitative descriptors, not numbers

import { cn } from "@/lib/utils";
import type { Rikishi, TacticalArchetype } from "@/engine/types";
import { Badge } from "@/components/ui/badge";
import { 
  RANK_NAMES, 
  ARCHETYPE_NAMES, 
  STYLE_NAMES,
  createScoutedView, 
  getScoutedAttributes,
  type ConfidenceLevel 
} from "@/engine/scouting";
import { Eye, EyeOff, HelpCircle } from "lucide-react";

interface RikishiCardProps {
  rikishi: Rikishi;
  side?: "east" | "west";
  isWinner?: boolean;
  compact?: boolean;
  isOwned?: boolean;
  className?: string;
}

export function RikishiCard({ 
  rikishi, 
  side, 
  isWinner,
  compact = false,
  isOwned = false,
  className 
}: RikishiCardProps) {
  const rankInfo = RANK_NAMES[rikishi.rank] || { ja: rikishi.rank, en: rikishi.rank };
  const rankWithNumber = rikishi.rankNumber 
    ? `${rankInfo.ja} ${rikishi.rankNumber}` 
    : rankInfo.ja;
  const rankEnWithNumber = rikishi.rankNumber
    ? `${rankInfo.en} ${rikishi.rankNumber}`
    : rankInfo.en;

  // Get scouted view of attributes
  const scouted = createScoutedView(rikishi, isOwned ? rikishi.heyaId : null, isOwned ? 100 : 5);
  const attributes = getScoutedAttributes(scouted);

  const archetypeInfo = ARCHETYPE_NAMES[rikishi.archetype] || { label: rikishi.archetype, description: "" };
  const styleInfo = STYLE_NAMES[rikishi.style] || { label: rikishi.style, description: "" };

  return (
    <div 
      className={cn(
        "paper p-4 transition-all duration-200",
        side === "east" && "side-east",
        side === "west" && "side-west",
        isWinner && "ring-2 ring-gold",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div>
          <h3 className="font-display text-xl font-semibold text-foreground">
            {rikishi.shikona}
          </h3>
          {!compact && rikishi.realName && (
            <p className="text-sm text-muted-foreground">{rikishi.realName}</p>
          )}
        </div>
        
        <div className="text-right">
          <Badge 
            variant="secondary"
            className={cn(
              "font-display text-xs",
              rikishi.rank === "yokozuna" && "rank-yokozuna text-foreground",
              rikishi.rank === "ozeki" && "rank-ozeki text-foreground",
              (rikishi.rank === "sekiwake" || rikishi.rank === "komusubi") && "rank-sekiwake text-foreground"
            )}
          >
            {rankWithNumber}
          </Badge>
          <div className="text-xs text-muted-foreground mt-0.5">{rankEnWithNumber}</div>
        </div>
      </div>

      {!compact && (
        <>
          {/* Physical stats - always public */}
          <div className="flex gap-4 mb-3 text-sm text-muted-foreground">
            <span>{rikishi.height}cm</span>
            <span>{rikishi.weight}kg</span>
            <span>{rikishi.nationality}</span>
          </div>

          {/* Style & Archetype */}
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <Badge variant="outline" className="text-xs" title={styleInfo.description}>
              {styleInfo.label}
            </Badge>
            <Badge 
              variant="outline" 
              className="text-xs"
              title={archetypeInfo.description}
            >
              {archetypeInfo.label}
            </Badge>
            {rikishi.momentum !== 0 && (
              <Badge 
                variant={rikishi.momentum > 0 ? "default" : "destructive"}
                className="text-xs"
              >
                {rikishi.momentum > 0 ? "Rising" : "Struggling"}
              </Badge>
            )}
          </div>

          {/* Scouted attributes - narrative descriptors, not numbers */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <AttributeDisplay label="Power" attr={attributes.power} />
            <AttributeDisplay label="Speed" attr={attributes.speed} />
            <AttributeDisplay label="Balance" attr={attributes.balance} />
            <AttributeDisplay label="Technique" attr={attributes.technique} />
            <AttributeDisplay label="Aggression" attr={attributes.aggression} />
            <AttributeDisplay label="Experience" attr={attributes.experience} />
          </div>

          {/* Scouting indicator */}
          {!isOwned && (
            <div className="mt-3 pt-3 border-t border-border/50 flex items-center gap-2 text-xs text-muted-foreground">
              <ConfidenceIndicator confidence={attributes.power.confidence} />
              <span>
                {attributes.power.confidence === "unknown" 
                  ? "Limited intelligence available" 
                  : attributes.power.confidence === "low"
                    ? "Basic scouting report"
                    : attributes.power.confidence === "medium"
                      ? "Moderately scouted"
                      : "Well scouted"}
              </span>
            </div>
          )}
        </>
      )}

      {compact && (
        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
          <span>{archetypeInfo.label}</span>
          <span>•</span>
          <span>{rikishi.weight}kg</span>
        </div>
      )}
    </div>
  );
}

function AttributeDisplay({ 
  label, 
  attr 
}: { 
  label: string; 
  attr: { value: string; confidence: ConfidenceLevel; narrative: string } 
}) {
  const isUnknown = attr.confidence === "unknown";
  
  return (
    <div className="flex items-center justify-between gap-2 p-1.5 rounded bg-secondary/30">
      <span className="text-muted-foreground">{label}</span>
      <span className={cn(
        "font-medium",
        isUnknown && "text-muted-foreground/50 italic"
      )}>
        {isUnknown ? "?" : attr.value}
      </span>
    </div>
  );
}

function ConfidenceIndicator({ confidence }: { confidence: ConfidenceLevel }) {
  switch (confidence) {
    case "certain":
    case "high":
      return <Eye className="h-3 w-3 text-primary" />;
    case "medium":
      return <Eye className="h-3 w-3" />;
    case "low":
      return <EyeOff className="h-3 w-3 opacity-70" />;
    default:
      return <HelpCircle className="h-3 w-3 opacity-50" />;
  }
}
