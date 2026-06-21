import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useGetCommunityLeaderboard, getGetCommunityLeaderboardQueryKey, useGetCommunityStats, getGetCommunityStatsQueryKey, useGetCommunityChallenge, getGetCommunityChallengeQueryKey } from "@workspace/api-client-react";
import { Trophy, Users, Globe2, Activity, Medal, Target } from "lucide-react";
import { format } from "date-fns";

export default function CommunityPage() {
  const { data: leaderboard } = useGetCommunityLeaderboard({
    query: { queryKey: getGetCommunityLeaderboardQueryKey() }
  });

  const { data: stats } = useGetCommunityStats({
    query: { queryKey: getGetCommunityStatsQueryKey() }
  });

  const { data: challenges } = useGetCommunityChallenge({
    query: { queryKey: getGetCommunityChallengeQueryKey() }
  });

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <header>
          <h1 className="text-3xl font-bold font-mono uppercase tracking-tight">Global Network</h1>
          <p className="text-muted-foreground mt-1">Aggregated telemetry and operational leaderboards.</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-card/50 backdrop-blur border-border/50">
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <p className="font-mono text-xs uppercase text-muted-foreground mb-2">Total Operatives</p>
                <Users className="w-4 h-4 text-muted-foreground" />
              </div>
              <div className="text-3xl font-bold font-mono text-foreground">{stats?.totalUsers.toLocaleString() || '---'}</div>
            </CardContent>
          </Card>
          
          <Card className="bg-card/50 backdrop-blur border-border/50">
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <p className="font-mono text-xs uppercase text-muted-foreground mb-2">Network CO₂ Saved</p>
                <Globe2 className="w-4 h-4 text-primary" />
              </div>
              <div className="flex items-baseline space-x-1">
                <div className="text-3xl font-bold font-mono text-primary">{stats?.totalCo2Saved.toLocaleString() || '---'}</div>
                <span className="text-xs font-mono text-primary">kg</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/50 backdrop-blur border-border/50">
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <p className="font-mono text-xs uppercase text-muted-foreground mb-2">Active Directives</p>
                <Target className="w-4 h-4 text-muted-foreground" />
              </div>
              <div className="text-3xl font-bold font-mono text-foreground">{stats?.activeChallenges || '---'}</div>
            </CardContent>
          </Card>

          <Card className="bg-card/50 backdrop-blur border-border/50">
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <p className="font-mono text-xs uppercase text-muted-foreground mb-2">Avg Network Score</p>
                <Activity className="w-4 h-4 text-muted-foreground" />
              </div>
              <div className="flex items-baseline space-x-1">
                <div className="text-3xl font-bold font-mono text-foreground">{Math.round(stats?.avgCarbonScore || 0) || '---'}</div>
                <span className="text-xs font-mono text-muted-foreground">/100</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 bg-card/50 backdrop-blur border-border/50 overflow-hidden">
            <CardHeader className="bg-muted/20 border-b border-border/50">
              <CardTitle className="font-mono text-sm uppercase tracking-wider flex items-center">
                <Trophy className="w-4 h-4 mr-2 text-yellow-500" />
                Top Operatives Leaderboard
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="w-full overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs uppercase bg-muted/30 font-mono text-muted-foreground">
                    <tr>
                      <th className="px-6 py-4 font-normal">Rank</th>
                      <th className="px-6 py-4 font-normal">Operative</th>
                      <th className="px-6 py-4 font-normal text-right">Score</th>
                      <th className="px-6 py-4 font-normal text-right">CO₂ Yield</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/30">
                    {leaderboard?.map((entry) => (
                      <tr key={entry.userId} className="hover:bg-muted/10 transition-colors">
                        <td className="px-6 py-4 font-mono font-bold">
                          {entry.rank <= 3 ? (
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                              entry.rank === 1 ? 'bg-yellow-500/20 text-yellow-500' :
                              entry.rank === 2 ? 'bg-slate-300/20 text-slate-300' :
                              'bg-amber-700/20 text-amber-600'
                            }`}>
                              {entry.rank}
                            </div>
                          ) : (
                            <span className="text-muted-foreground ml-2">{entry.rank}</span>
                          )}
                        </td>
                        <td className="px-6 py-4 font-medium">{entry.name}</td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex flex-col items-end">
                            <span className="font-mono font-bold text-primary">{entry.carbonScore}</span>
                            {entry.scoreImprovement > 0 && (
                              <span className="text-[10px] text-green-500 font-mono">+{entry.scoreImprovement} pts</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right font-mono text-muted-foreground">
                          {entry.totalCo2Saved.toLocaleString()} kg
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/50 backdrop-blur border-border/50 flex flex-col">
            <CardHeader className="bg-muted/20 border-b border-border/50">
              <CardTitle className="font-mono text-sm uppercase tracking-wider flex items-center">
                <Medal className="w-4 h-4 mr-2 text-primary" />
                Network Directives
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 flex-1">
              <div className="divide-y divide-border/30">
                {challenges?.map(challenge => (
                  <div key={challenge.id} className="p-5">
                    <div className="flex justify-between items-start mb-2">
                      <Badge variant="outline" className="font-mono text-[10px] uppercase border-primary/30 text-primary">{challenge.category}</Badge>
                      <span className="text-xs font-mono text-muted-foreground flex items-center">
                        <Users className="w-3 h-3 mr-1" /> {challenge.participantCount}
                      </span>
                    </div>
                    <h4 className="font-bold text-sm mb-1">{challenge.title}</h4>
                    <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{challenge.description}</p>
                    <div className="flex items-center justify-between text-xs font-mono">
                      <div className="text-primary font-bold">{challenge.targetKgCo2} kg target</div>
                      <div className="text-muted-foreground opacity-70">{format(new Date(challenge.endDate), 'MMM dd')}</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
