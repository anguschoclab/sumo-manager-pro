// Economy Page - Financial overview with narrative language
// Follows Economy Canon v3.0: No raw numbers revealed, only bands and descriptions

import { useMemo } from "react";
import { Helmet } from "react-helmet";
import { useGame } from "@/contexts/GameContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { 
  Wallet, TrendingUp, TrendingDown, Users, Building2, 
  CircleDollarSign, Award, Shield, AlertTriangle, Info
} from "lucide-react";
import type { RunwayBand, KoenkaiBand, PrestigeBand, FacilitiesBand } from "@/engine/types";

// Runway narrative descriptions
const RUNWAY_CONFIG: Record<RunwayBand, {
  label: string;
  description: string;
  color: string;
  icon: typeof Wallet;
  progressValue: number;
}> = {
  secure: {
    label: "Secure Finances",
    description: "Your stable has a comfortable financial cushion. Multiple basho of runway with room for investment.",
    color: "text-emerald-400",
    icon: Shield,
    progressValue: 100,
  },
  comfortable: {
    label: "Comfortable",
    description: "Finances are stable. You can weather minor setbacks without concern.",
    color: "text-green-400",
    icon: TrendingUp,
    progressValue: 75,
  },
  tight: {
    label: "Tight Budget",
    description: "Careful management required. Unexpected expenses could cause problems.",
    color: "text-yellow-400",
    icon: Wallet,
    progressValue: 50,
  },
  critical: {
    label: "Critical",
    description: "Financial pressure is mounting. Consider reducing costs or seeking sponsor support.",
    color: "text-orange-400",
    icon: TrendingDown,
    progressValue: 25,
  },
  desperate: {
    label: "Desperate",
    description: "Immediate financial intervention required. The stable's survival is at stake.",
    color: "text-red-400",
    icon: AlertTriangle,
    progressValue: 10,
  },
};

// Koenkai (supporter) descriptions
const KOENKAI_CONFIG: Record<KoenkaiBand, {
  label: string;
  description: string;
  color: string;
  monthlySupport: string;
}> = {
  powerful: {
    label: "Powerful Kōenkai",
    description: "A vast network of wealthy patrons and devoted fans provides substantial monthly support.",
    color: "text-amber-400",
    monthlySupport: "Very High",
  },
  strong: {
    label: "Strong Kōenkai",
    description: "A dedicated group of supporters contributes reliably each month.",
    color: "text-purple-400",
    monthlySupport: "High",
  },
  moderate: {
    label: "Modest Kōenkai",
    description: "A small but loyal supporter base helps cover some expenses.",
    color: "text-blue-400",
    monthlySupport: "Moderate",
  },
  weak: {
    label: "Weak Kōenkai",
    description: "Few supporters. Building stronger fan relationships should be a priority.",
    color: "text-muted-foreground",
    monthlySupport: "Low",
  },
  none: {
    label: "No Kōenkai",
    description: "The stable has no organized supporter group. You're on your own.",
    color: "text-red-400",
    monthlySupport: "None",
  },
};

// Expense categories (narrative)
const EXPENSE_CATEGORIES = [
  { name: "Wrestler Salaries", description: "Monthly salaries for sekitori-ranked wrestlers" },
  { name: "Stable Operations", description: "Daily meals, utilities, and maintenance" },
  { name: "Training & Equipment", description: "Dohyo upkeep, equipment, and supplies" },
  { name: "Medical & Recovery", description: "Injury treatment and rehabilitation" },
  { name: "Travel (Jungyo)", description: "Regional tours and exhibition matches" },
];

// Income sources (narrative)
const INCOME_SOURCES = [
  { name: "League Distributions", description: "JSA payments based on stable rank" },
  { name: "Kōenkai Contributions", description: "Monthly supporter donations" },
  { name: "Kenshō Winnings", description: "Sponsor banner prizes from bout victories" },
  { name: "Prize Money", description: "Tournament awards and special prizes" },
  { name: "Appearance Fees", description: "Exhibition matches and events" },
];

export default function EconomyPage() {
  const { state } = useGame();
  
  const playerHeya = useMemo(() => {
    if (!state.world?.playerHeyaId) return null;
    return state.world.heyas.get(state.world.playerHeyaId);
  }, [state.world]);

  // Get sekitori count for income display
  const sekitoriCount = useMemo(() => {
    if (!playerHeya || !state.world) return 0;
    return playerHeya.rikishiIds.filter(id => {
      const r = state.world!.rikishi.get(id);
      return r && (r.division === "makuuchi" || r.division === "juryo");
    }).length;
  }, [playerHeya, state.world]);

  // Get top earners
  const topEarners = useMemo(() => {
    if (!playerHeya || !state.world) return [];
    return playerHeya.rikishiIds
      .map(id => state.world!.rikishi.get(id))
      .filter(r => r && r.economics)
      .sort((a, b) => (b?.economics?.careerKenshoWon || 0) - (a?.economics?.careerKenshoWon || 0))
      .slice(0, 5);
  }, [playerHeya, state.world]);

  if (!playerHeya) {
    return (
      <div className="p-6 text-center text-muted-foreground">
        No stable selected.
      </div>
    );
  }

  const runwayConfig = RUNWAY_CONFIG[playerHeya.runwayBand];
  const koenkaiConfig = KOENKAI_CONFIG[playerHeya.koenkaiBand];
  const RunwayIcon = runwayConfig.icon;

  return (
    <>
      <Helmet>
        <title>Economy - {playerHeya.name} | Stable Lords</title>
      </Helmet>

      <div className="p-6 max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="font-display text-3xl font-bold flex items-center gap-3">
            <CircleDollarSign className="h-8 w-8" />
            Stable Finances
          </h1>
          <p className="text-muted-foreground mt-1">
            {playerHeya.name} — Financial Overview
          </p>
        </div>

        {/* Financial Health Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RunwayIcon className={`h-5 w-5 ${runwayConfig.color}`} />
              <span className={runwayConfig.color}>{runwayConfig.label}</span>
            </CardTitle>
            <CardDescription>{runwayConfig.description}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-muted-foreground">Financial Runway</span>
                  <span className={runwayConfig.color}>{runwayConfig.label}</span>
                </div>
                <Progress 
                  value={runwayConfig.progressValue} 
                  className="h-3"
                />
              </div>
              
              {playerHeya.riskIndicators.financial && (
                <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                  <AlertTriangle className="h-4 w-4 text-red-400" />
                  <span className="text-sm text-red-400">
                    Financial risk detected. Consider reducing expenses or finding new income sources.
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Grid: Koenkai & Sekitori Income */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Koenkai Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Kōenkai (Supporters)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Status</span>
                <Badge className={koenkaiConfig.color}>
                  {koenkaiConfig.label}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                {koenkaiConfig.description}
              </p>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Monthly Support</span>
                <span className="font-medium">{koenkaiConfig.monthlySupport}</span>
              </div>
            </CardContent>
          </Card>

          {/* Sekitori Income Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5" />
                Sekitori Income
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Salaried Wrestlers</span>
                <span className="font-display text-2xl font-bold">{sekitoriCount}</span>
              </div>
              <p className="text-sm text-muted-foreground">
                {sekitoriCount > 0 
                  ? `${sekitoriCount} wrestlers earn monthly salaries from the JSA. Their rank determines payment level.`
                  : "No sekitori-ranked wrestlers. Lower-division wrestlers are supported entirely by the stable."
                }
              </p>
              <Separator />
              <div className="text-xs text-muted-foreground space-y-1">
                <p>• Yokozuna: ¥3,000,000/month</p>
                <p>• Ōzeki: ¥2,500,000/month</p>
                <p>• Maegashira: ¥1,400,000/month</p>
                <p>• Jūryō: ¥1,100,000/month</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Income Sources */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-400" />
              Income Sources
            </CardTitle>
            <CardDescription>
              Where your stable's money comes from
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {INCOME_SOURCES.map((source, i) => (
                <div key={i} className="flex items-start gap-3 py-2">
                  <div className="w-2 h-2 rounded-full bg-green-400 mt-2" />
                  <div>
                    <p className="font-medium">{source.name}</p>
                    <p className="text-sm text-muted-foreground">{source.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Expenses */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-red-400" />
              Monthly Expenses
            </CardTitle>
            <CardDescription>
              Costs of running your stable
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {EXPENSE_CATEGORIES.map((expense, i) => (
                <div key={i} className="flex items-start gap-3 py-2">
                  <div className="w-2 h-2 rounded-full bg-red-400 mt-2" />
                  <div>
                    <p className="font-medium">{expense.name}</p>
                    <p className="text-sm text-muted-foreground">{expense.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Kensho Earners */}
        {topEarners.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5 text-amber-400" />
                Top Kenshō Earners
              </CardTitle>
              <CardDescription>
                Wrestlers who attract the most sponsor banners
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {topEarners.map((r, i) => (
                  <div key={r?.id} className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl font-display font-bold text-muted-foreground">
                        {i + 1}
                      </span>
                      <div>
                        <p className="font-medium">{r?.shikona}</p>
                        <p className="text-xs text-muted-foreground capitalize">{r?.rank}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-display font-semibold">
                        {r?.economics?.careerKenshoWon || 0} 🎌
                      </p>
                      <p className="text-xs text-muted-foreground">Career Kenshō</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Info Note */}
        <Card className="bg-muted/30">
          <CardContent className="pt-4">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-blue-400 mt-0.5" />
              <div className="text-sm text-muted-foreground">
                <p className="font-medium text-foreground mb-1">About Stable Finances</p>
                <p>
                  Money flows through your stable each basho. Sekitori earn salaries from the JSA, 
                  while lower-division wrestlers are supported entirely by the stable. Your kōenkai 
                  provides monthly contributions, and kenshō winnings from bouts add to your funds.
                </p>
                <p className="mt-2">
                  The financial runway shows how long your stable can operate at current expense levels. 
                  Keep it healthy by winning bouts, attracting sponsors, and managing costs carefully.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
