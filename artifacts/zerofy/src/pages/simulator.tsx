import { useState } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useSimulateScenario, useGetCarbonProfile, getGetCarbonProfileQueryKey } from "@workspace/api-client-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend } from "recharts";
import { TreePine, Car, Activity, Zap } from "lucide-react";

export default function SimulatorPage() {
  const [params, setParams] = useState({
    publicTransportAdoptionPct: 20,
    renewableEnergyPct: 50,
    dietShift: "none" as const,
    flightReductionPct: 0
  });

  const { data: profile } = useGetCarbonProfile({
    query: { retry: false, queryKey: getGetCarbonProfileQueryKey() }
  });

  const simulateMutation = useSimulateScenario();

  const runSimulation = () => {
    simulateMutation.mutate({ data: params });
  };

  const result = simulateMutation.data;

  const chartData = profile && result ? [
    {
      name: 'Transport',
      Current: profile.result.breakdown.transportation,
      Projected: result.projectedBreakdown.transportation,
    },
    {
      name: 'Energy',
      Current: profile.result.breakdown.electricity,
      Projected: result.projectedBreakdown.electricity,
    },
    {
      name: 'Food',
      Current: profile.result.breakdown.food,
      Projected: result.projectedBreakdown.food,
    },
    {
      name: 'Shopping',
      Current: profile.result.breakdown.shopping,
      Projected: result.projectedBreakdown.shopping,
    },
  ] : [];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <header>
          <h1 className="text-3xl font-bold font-mono uppercase tracking-tight">Climate Twin Simulator</h1>
          <p className="text-muted-foreground mt-1">Run deterministic scenarios to analyze impact vectors.</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <Card className="lg:col-span-4 bg-card/50 backdrop-blur border-border/50">
            <CardHeader>
              <CardTitle className="font-mono text-sm uppercase tracking-wider flex items-center">
                <Activity className="w-4 h-4 mr-2 text-primary" />
                Scenario Parameters
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <label className="font-mono text-xs uppercase text-muted-foreground">Public Transport Shift</label>
                  <span className="font-mono text-xs text-primary">{params.publicTransportAdoptionPct}%</span>
                </div>
                <Slider 
                  value={[params.publicTransportAdoptionPct]} 
                  onValueChange={v => setParams(p => ({ ...p, publicTransportAdoptionPct: v[0] }))}
                  max={100} step={5}
                />
              </div>

              <div className="space-y-3">
                <div className="flex justify-between">
                  <label className="font-mono text-xs uppercase text-muted-foreground">Renewable Energy Adoption</label>
                  <span className="font-mono text-xs text-primary">{params.renewableEnergyPct}%</span>
                </div>
                <Slider 
                  value={[params.renewableEnergyPct]} 
                  onValueChange={v => setParams(p => ({ ...p, renewableEnergyPct: v[0] }))}
                  max={100} step={5}
                />
              </div>

              <div className="space-y-3">
                <div className="flex justify-between">
                  <label className="font-mono text-xs uppercase text-muted-foreground">Flight Reduction</label>
                  <span className="font-mono text-xs text-primary">{params.flightReductionPct}%</span>
                </div>
                <Slider 
                  value={[params.flightReductionPct]} 
                  onValueChange={v => setParams(p => ({ ...p, flightReductionPct: v[0] }))}
                  max={100} step={10}
                />
              </div>

              <div className="space-y-3">
                <label className="font-mono text-xs uppercase text-muted-foreground">Dietary Shift</label>
                <Select value={params.dietShift} onValueChange={(v: any) => setParams(p => ({ ...p, dietShift: v }))}>
                  <SelectTrigger className="font-mono bg-background/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Maintain Current</SelectItem>
                    <SelectItem value="vegetarian">Shift to Vegetarian</SelectItem>
                    <SelectItem value="vegan">Shift to Vegan</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button 
                onClick={runSimulation} 
                disabled={simulateMutation.isPending}
                className="w-full font-mono uppercase tracking-widest mt-4"
              >
                {simulateMutation.isPending ? "Computing..." : "Execute Simulation"}
              </Button>
            </CardContent>
          </Card>

          <div className="lg:col-span-8 space-y-6">
            {!result ? (
              <Card className="h-full bg-card/50 backdrop-blur border-dashed border-border/50 flex flex-col items-center justify-center p-12 text-center">
                <Activity className="w-12 h-12 text-muted-foreground mb-4 opacity-50" />
                <h3 className="font-mono text-lg uppercase tracking-wider text-muted-foreground mb-2">Awaiting Parameters</h3>
                <p className="text-muted-foreground text-sm max-w-sm">Adjust the simulation parameters and execute to visualize alternative trajectory vectors.</p>
              </Card>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="bg-primary/5 border-primary/20 backdrop-blur">
                    <CardContent className="p-6 text-center">
                      <p className="font-mono text-xs uppercase text-muted-foreground mb-2">Total Reduction</p>
                      <div className="flex justify-center items-end space-x-2">
                        <span className="text-3xl font-bold font-mono text-primary">-{result.percentageReduction}%</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2 font-mono">({result.deltaKgCo2} kg CO₂)</p>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-card/50 border-border/50 backdrop-blur">
                    <CardContent className="p-6 text-center">
                      <p className="font-mono text-xs uppercase text-muted-foreground mb-2">Tree Equivalent</p>
                      <div className="flex justify-center items-center space-x-2">
                        <TreePine className="w-6 h-6 text-green-500" />
                        <span className="text-3xl font-bold font-mono text-green-500">{result.treesEquivalent}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2 font-mono">Trees planted / year</p>
                    </CardContent>
                  </Card>

                  <Card className="bg-card/50 border-border/50 backdrop-blur">
                    <CardContent className="p-6 text-center">
                      <p className="font-mono text-xs uppercase text-muted-foreground mb-2">Car-Free Days</p>
                      <div className="flex justify-center items-center space-x-2">
                        <Car className="w-6 h-6 text-blue-400" />
                        <span className="text-3xl font-bold font-mono text-blue-400">{result.carFreeDays}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2 font-mono">Days without driving</p>
                    </CardContent>
                  </Card>
                </div>

                <Card className="bg-card/50 border-border/50 backdrop-blur overflow-hidden">
                  <CardHeader className="border-b border-border/50 bg-muted/20">
                    <CardTitle className="font-mono text-sm uppercase tracking-wider">Trajectory Analysis</CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="h-[300px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                          <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" tick={{fontFamily: 'monospace', fontSize: 12}} />
                          <YAxis stroke="hsl(var(--muted-foreground))" tick={{fontFamily: 'monospace', fontSize: 12}} />
                          <RechartsTooltip 
                            contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' }}
                            cursor={{fill: 'hsl(var(--muted)/0.5)'}}
                          />
                          <Legend wrapperStyle={{fontFamily: 'monospace', fontSize: 12, paddingTop: '20px'}} />
                          <Bar dataKey="Current" fill="hsl(var(--muted-foreground)/0.5)" radius={[4, 4, 0, 0]} />
                          <Bar dataKey="Projected" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="mt-6 p-4 rounded-lg bg-primary/5 border border-primary/20">
                      <p className="text-sm leading-relaxed text-muted-foreground">
                        <strong className="text-primary font-mono uppercase mr-2">Analysis:</strong>
                        {result.explanation}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
