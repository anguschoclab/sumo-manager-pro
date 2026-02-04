import React, { useEffect, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useGame } from "@/contexts/GameContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ShieldAlert, Scale, Gavel, FileWarning } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import type { GovernanceStatus, GovernanceRuling, Heya } from "@/engine/types";
import { getStatusColor, getStatusLabel } from "@/engine/governance";

export default function GovernancePage() {
  const { state, isLoaded } = useGame();
  const [heya, setHeya] = useState<Heya | null>(null);

  useEffect(() => {
    if (isLoaded && state.playerHeyaId) {
      setHeya(state.heyas.get(state.playerHeyaId) || null);
    }
  }, [state, isLoaded]);

  if (!isLoaded || !heya) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-full">Loading Council Records...</div>
      </AppLayout>
    );
  }

  const status = heya.governanceStatus || "good_standing";
  const scandal = heya.scandalScore || 0;
  const history = heya.governanceHistory || [];

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Governance & Compliance</h1>
            <p className="text-muted-foreground">
              Official records of the Sumo Association regarding {heya.name}.
            </p>
          </div>
          <Badge variant={status === "good_standing" ? "outline" : "destructive"} className="text-lg px-4 py-1">
            <Scale className="mr-2 h-4 w-4" />
            {getStatusLabel(status)}
          </Badge>
        </div>

        {/* STATUS OVERVIEW */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card className={status !== "good_standing" ? "border-red-200 bg-red-50 dark:bg-red-950/20" : ""}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center">
                <ShieldAlert className={`mr-2 h-4 w-4 ${getStatusColor(status)}`} />
                Official Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${getStatusColor(status)}`}>{getStatusLabel(status)}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {status === "good_standing" 
                  ? "Full privileges. No restrictions." 
                  : status === "warning" 
                    ? "Under observation. Future infractions may lead to probation."
                    : "Severe restrictions active. Rectify immediately."}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center">
                <FileWarning className="mr-2 h-4 w-4 text-orange-500" />
                Scandal Index
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{scandal.toFixed(1)} / 100</div>
              <Progress value={scandal} className="mt-2 h-2" indicatorClassName={scandal > 50 ? "bg-red-600" : "bg-orange-400"} />
              <p className="text-xs text-muted-foreground mt-2">
                Accumulated reputational damage. Decays over time.
              </p>
            </CardContent>
          </Card>

           <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center">
                <Gavel className="mr-2 h-4 w-4 text-blue-500" />
                Total Fines Paid
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(history.reduce((acc, r) => acc + (r.effects.fineAmount || 0), 0))}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Lifetime financial penalties.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* DETAILS TABS */}
        <Tabs defaultValue="history" className="w-full">
          <TabsList>
            <TabsTrigger value="history">Ruling History</TabsTrigger>
            <TabsTrigger value="restrictions">Active Restrictions</TabsTrigger>
          </TabsList>
          
          <TabsContent value="history" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Council Ruling Log</CardTitle>
                <CardDescription>
                  Chronological record of all disciplinary actions and status changes.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px] w-full pr-4">
                  {history.length === 0 ? (
                     <div className="text-center py-12 text-muted-foreground">
                        No disciplinary records found. The stable is exemplary.
                     </div>
                  ) : (
                    <div className="space-y-4">
                      {history.map((ruling) => (
                        <div key={ruling.id} className="flex flex-col space-y-2 border-b pb-4 last:border-0">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                                <Badge variant="secondary">{ruling.date}</Badge>
                                <span className="font-semibold">{ruling.type.toUpperCase()}</span>
                            </div>
                            <Badge variant={ruling.severity === 'high' ? 'destructive' : 'outline'}>
                                {ruling.severity}
                            </Badge>
                          </div>
                          <p className="text-sm">{ruling.reason}</p>
                          {ruling.effects.fineAmount ? (
                              <div className="text-xs font-mono text-red-600">
                                  Fine: {formatCurrency(ruling.effects.fineAmount)}
                              </div>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="restrictions" className="mt-4">
             <Card>
              <CardHeader>
                <CardTitle>Active Sanctions & Restrictions</CardTitle>
                <CardDescription>
                  Current limitations imposed on stable operations.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {status === "good_standing" ? (
                    <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                        <Scale className="h-12 w-12 mb-4 opacity-20" />
                        <p>No active restrictions.</p>
                    </div>
                ) : (
                    <ul className="space-y-2">
                        {status === "warning" && (
                            <li className="flex items-center text-yellow-700">
                                • Increased scrutiny on recruitment.
                            </li>
                        )}
                         {status === "probation" && (
                            <>
                            <li className="flex items-center text-orange-700">
                                • Recruitment frozen.
                            </li>
                             <li className="flex items-center text-orange-700">
                                • Koenkai income reduced by 20%.
                            </li>
                            </>
                        )}
                        {status === "sanctioned" && (
                            <>
                             <li className="flex items-center text-red-700">
                                • Recruitment frozen.
                            </li>
                             <li className="flex items-center text-red-700">
                                • Forced retirement of scandal-linked staff possible.
                            </li>
                            <li className="flex items-center text-red-700">
                                • Closure review imminent.
                            </li>
                            </>
                        )}
                    </ul>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
