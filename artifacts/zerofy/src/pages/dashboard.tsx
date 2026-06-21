import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { useAuth } from "@/hooks/use-auth";
import { useGetDashboardMetrics, getGetDashboardMetricsQueryKey, useGetEmissionHistory, getGetEmissionHistoryQueryKey, useGetCarbonProfile, getGetCarbonProfileQueryKey, useGetRecommendations, getGetRecommendationsQueryKey, useGetGoals, getGetGoalsQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { ArrowRight, Leaf, Zap, ShoppingBag, Car, TrendingDown, Target, Activity } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

export default function DashboardPage() {
  const { user } = useAuth();
  
  const { data: profile, isLoading: isProfileLoading } = useGetCarbonProfile({
    query: { retry: false, queryKey: getGetCarbonProfileQueryKey() }
  });

  const { data: metrics } = useGetDashboardMetrics({
    query: { enabled: !!profile, queryKey: getGetDashboardMetricsQueryKey() }
  });

  const { data: history } = useGetEmissionHistory({
    query: { enabled: !!profile, queryKey: getGetEmissionHistoryQueryKey() }
  });

  const { data: recommendations } = useGetRecommendations({
    query: { enabled: !!profile, queryKey: getGetRecommendationsQueryKey() }
  });

  const { data: goals } = useGetGoals({
    query: { enabled: !!profile, queryKey: getGetGoalsQueryKey() }
  });

  if (isProfileLoading) {
    return <DashboardLayout><div className="animate-pulse text-muted-foreground font-mono">CALCULATING TRAJECTORY...</div></DashboardLayout>;
  }

  if (!profile) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-[70vh] text-center space-y-6">
          <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <Activity className="w-12 h-12 text-primary" />
          </div>
          <h1 className="text-4xl font-bold font-mono tracking-tight">SYSTEM UNINITIALIZED</h1>
          <p className="text-muted-foreground max-w-md text-lg">
            Mission control requires initial telemetry data to construct your carbon trajectory.
          </p>
          <Link href="/calculator" className="inline-flex items-center space-x-2 bg-primary text-primary-foreground px-8 py-3 rounded-md font-bold uppercase tracking-wider hover:bg-primary/90 transition-colors">
            <span>Initiate Calibration</span>
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  const PIE_COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))'];
  
  const pieData = profile.result.breakdown ? [
    { name: 'Transport', value: profile.result.breakdown.transportation },
    { name: 'Energy', value: profile.result.breakdown.electricity },
    { name: 'Food', value: profile.result.breakdown.food },
    { name: 'Shopping', value: profile.result.breakdown.shopping },
  ] : [];

  const activeGoals = goals?.filter(g => !g.completed).slice(0, 3) || [];

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold font-mono uppercase tracking-tight">Mission Control</h1>
            <p className="text-muted-foreground mt-1">Live telemetry for operative {user?.name}</p>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Carbon Score Card */}
          <Card className="col-span-1 md:col-span-2 bg-card/50 backdrop-blur border-primary/20 overflow-hidden relative">
            <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-mono text-muted-foreground uppercase tracking-wider">Overall Carbon Score</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-end space-x-4 mb-6">
                <span className="text-6xl font-bold font-mono tracking-tighter text-primary">
                  {metrics?.carbonScore || profile.result.carbonScore}
                </span>
                <span className="text-xl text-muted-foreground font-mono mb-2">/100</span>
                {metrics && metrics.monthlyDelta !== 0 && (
                  <Badge variant={metrics.monthlyDelta < 0 ? "default" : "destructive"} className="mb-3 font-mono">
                    {metrics.monthlyDelta < 0 ? <TrendingDown className="w-3 h-3 mr-1" /> : null}
                    {Math.abs(metrics.monthlyDelta)}kg CO₂ / mo
                  </Badge>
                )}
              </div>
              
              <div className="h-[120px] w-full">
                {history && history.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={history}>
                      <Line type="monotone" dataKey="score" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 4, fill: "hsl(var(--background))", strokeWidth: 2 }} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' }}
                        labelStyle={{ color: 'hsl(var(--muted-foreground))' }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground font-mono text-sm border border-dashed border-border rounded">
                    NO HISTORICAL DATA
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Breakdown Donut */}
          <Card className="col-span-1 bg-card/50 backdrop-blur border-border/50">
            <CardHeader>
              <CardTitle className="text-sm font-mono text-muted-foreground uppercase tracking-wider">Emission Source</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center">
              <div className="h-[160px] w-full relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={70}
                      paddingAngle={2}
                      dataKey="value"
                      stroke="none"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' }}
                      formatter={(value: number) => [`${value} kg`, 'CO₂']}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex items-center justify-center flex-col pointer-events-none">
                  <span className="text-2xl font-bold font-mono">{metrics?.totalAnnualKgCo2 || profile.result.totalAnnualKgCo2}</span>
                  <span className="text-xs text-muted-foreground">kg/yr</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Aria Recommendations */}
          <Card className="bg-card/50 backdrop-blur border-border/50 flex flex-col">
            <CardHeader className="border-b border-border/50 bg-muted/20">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center font-mono uppercase tracking-wider text-sm">
                    <Zap className="w-4 h-4 text-primary mr-2" />
                    AI Aria Directives
                  </CardTitle>
                  <CardDescription className="font-mono text-xs mt-1">OPTIMAL IMPACT VECTORS</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0 flex-1">
              <div className="divide-y divide-border/50">
                {recommendations?.slice(0, 4).map((rec, i) => (
                  <div key={rec.id} className="p-4 hover:bg-muted/10 transition-colors group">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3">
                        <div className="mt-1 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 text-primary text-xs font-bold font-mono">
                          {i+1}
                        </div>
                        <div>
                          <h4 className="font-medium text-foreground group-hover:text-primary transition-colors">{rec.action}</h4>
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-1">{rec.description}</p>
                          <div className="flex items-center space-x-3 mt-2 text-xs font-mono">
                            <span className="text-primary">-{rec.estimatedKgCo2Reduction} kg CO₂</span>
                            <span className="text-muted-foreground">•</span>
                            <span className={rec.costDirection === 'save' ? 'text-green-500' : 'text-orange-500'}>
                              {rec.costDirection === 'save' ? 'Save' : 'Cost'} £{rec.costImpact}/yr
                            </span>
                          </div>
                        </div>
                      </div>
                      <Badge variant="outline" className={`ml-2 text-xs font-mono uppercase tracking-wider ${
                        rec.difficulty === 'easy' ? 'text-green-400 border-green-400/20 bg-green-400/10' :
                        rec.difficulty === 'medium' ? 'text-yellow-400 border-yellow-400/20 bg-yellow-400/10' :
                        'text-orange-400 border-orange-400/20 bg-orange-400/10'
                      }`}>
                        {rec.difficulty}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Active Goals */}
          <Card className="bg-card/50 backdrop-blur border-border/50 flex flex-col">
            <CardHeader className="border-b border-border/50 bg-muted/20">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center font-mono uppercase tracking-wider text-sm">
                    <Target className="w-4 h-4 text-primary mr-2" />
                    Active Objectives
                  </CardTitle>
                </div>
                <Link href="/goals" className="text-xs font-mono text-primary hover:underline">VIEW ALL</Link>
              </div>
            </CardHeader>
            <CardContent className="p-4 flex-1">
              {activeGoals.length > 0 ? (
                <div className="space-y-6">
                  {activeGoals.map(goal => {
                    const progressPct = Math.min(100, Math.round((goal.currentProgress / goal.targetKgCo2Reduction) * 100));
                    return (
                      <div key={goal.id} className="space-y-2">
                        <div className="flex justify-between items-end">
                          <div>
                            <h4 className="font-medium text-sm">{goal.title}</h4>
                            <p className="text-xs text-muted-foreground font-mono mt-1">Target: {goal.targetKgCo2Reduction} kg</p>
                          </div>
                          <span className="text-xs font-mono font-bold text-primary">{progressPct}%</span>
                        </div>
                        <Progress value={progressPct} className="h-2 rounded-none bg-muted/30 [&>div]:bg-primary" />
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-muted-foreground py-8">
                  <Target className="w-8 h-8 mb-3 opacity-20" />
                  <p className="font-mono text-sm uppercase tracking-wider">No Active Objectives</p>
                  <Link href="/goals" className="mt-4 text-primary text-sm hover:underline">Create Objective</Link>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
