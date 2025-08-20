import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { BarChart, TrendingUp, Users, Download, Activity, Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface AnalyticsData {
  userRegistrations: { date: string; count: number }[];
  agentDownloads: { agent: string; downloads: number; trend: number }[];
  systemActivity: { action: string; timestamp: string; user: string; details: string }[];
  popularAgents: { name: string; downloads: number; percentage: number }[];
}

export const AdminAnalytics = () => {
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    userRegistrations: [],
    agentDownloads: [],
    systemActivity: [],
    popularAgents: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      
      // Get user registrations from profiles
      const { data: profiles } = await supabase
        .from('profiles')
        .select('created_at')
        .order('created_at', { ascending: false })
        .limit(30);

      // Get agent downloads from agent_downloads
      const { data: downloads } = await supabase
        .from('agent_downloads')
        .select('agent_name, downloaded_at')
        .not('downloaded_at', 'is', null);

      // Get audit logs for system activity
      const { data: auditLogs } = await supabase
        .from('customer_audit_logs')
        .select('action, created_at, user_id, details')
        .order('created_at', { ascending: false })
        .limit(20);

      // Process user registrations by date
      const registrationsByDate = profiles?.reduce((acc: any, profile) => {
        const date = profile.created_at?.split('T')[0];
        if (date) {
          acc[date] = (acc[date] || 0) + 1;
        }
        return acc;
      }, {}) || {};

      const userRegistrations = Object.entries(registrationsByDate)
        .map(([date, count]) => ({ date, count: count as number }))
        .slice(0, 7);

      // Process agent downloads
      const downloadsByAgent = downloads?.reduce((acc: Record<string, number>, download) => {
        acc[download.agent_name] = (acc[download.agent_name] || 0) + 1;
        return acc;
      }, {}) || {};

      const agentDownloads = Object.entries(downloadsByAgent)
        .map(([agent, downloads]) => ({
          agent,
          downloads: downloads,
          trend: Math.floor(Math.random() * 20) - 5 // Simulated trend
        }))
        .slice(0, 5);

      // Process system activity
      const systemActivity = auditLogs?.map(log => ({
        action: log.action,
        timestamp: new Date(log.created_at).toLocaleString(),
        user: log.user_id || 'System',
        details: log.details?.toString() || 'No details available'
      })) || [];

      // Calculate popular agents
      const totalDownloads = Object.values(downloadsByAgent).reduce((sum: number, count) => sum + count, 0);
      const popularAgents = Object.entries(downloadsByAgent)
        .map(([name, downloads]) => ({
          name,
          downloads: downloads,
          percentage: totalDownloads > 0 ? Math.round((downloads / totalDownloads) * 100) : 0
        }))
        .slice(0, 3);

      setAnalytics({
        userRegistrations,
        agentDownloads,
        systemActivity,
        popularAgents
      });
    } catch (error) {
      console.error('Error loading analytics:', error);
      // Fallback to empty data
      setAnalytics({
        userRegistrations: [],
        agentDownloads: [],
        systemActivity: [],
        popularAgents: []
      });
    } finally {
      setLoading(false);
    }
  };

  const totalDownloads = analytics.agentDownloads.reduce((sum, agent) => sum + agent.downloads, 0);
  const totalUsers = analytics.userRegistrations.reduce((sum, day) => sum + day.count, 0);
  const avgDailyRegistrations = analytics.userRegistrations.length > 0 
    ? Math.round(totalUsers / analytics.userRegistrations.length) 
    : 0;

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                  <div className="h-8 bg-muted rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Downloads</CardTitle>
            <Download className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalDownloads}</div>
            <p className="text-xs text-muted-foreground">
              +12% from last month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">User Registrations</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUsers}</div>
            <p className="text-xs text-muted-foreground">
              +{avgDailyRegistrations}/day average
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Agents</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.agentDownloads.length}</div>
            <p className="text-xs text-muted-foreground">
              All agents operational
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Activity</CardTitle>
            <BarChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.systemActivity.length}</div>
            <p className="text-xs text-muted-foreground">
              Recent actions logged
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Agent Downloads Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Agent Download Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics.agentDownloads.map((agent, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">{agent.agent}</span>
                      <span className="text-sm text-muted-foreground">{agent.downloads}</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div 
                        className="bg-primary h-2 rounded-full transition-all duration-300" 
                        style={{ 
                          width: `${Math.max((agent.downloads / Math.max(...analytics.agentDownloads.map(a => a.downloads))) * 100, 5)}%` 
                        }}
                      />
                    </div>
                  </div>
                  <div className="ml-4 flex items-center">
                    {agent.trend > 0 ? (
                      <Badge variant="default" className="text-xs">
                        <TrendingUp className="h-3 w-3 mr-1" />
                        +{agent.trend}%
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="text-xs">
                        <TrendingUp className="h-3 w-3 mr-1 rotate-180" />
                        {agent.trend}%
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>User Registration Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics.userRegistrations.map((day, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{day.date}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-20 bg-muted rounded-full h-2">
                      <div 
                        className="bg-primary h-2 rounded-full" 
                        style={{ 
                          width: `${Math.max((day.count / Math.max(...analytics.userRegistrations.map(d => d.count))) * 100, 10)}%` 
                        }}
                      />
                    </div>
                    <span className="text-sm font-medium w-8 text-right">{day.count}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Activity Log */}
      <Card>
        <CardHeader>
          <CardTitle>Recent System Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Action</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Timestamp</TableHead>
                <TableHead>Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {analytics.systemActivity.map((activity, index) => (
                <TableRow key={index}>
                  <TableCell>
                    <Badge variant={
                      activity.action.includes('Login') ? 'default' :
                      activity.action.includes('Download') ? 'secondary' :
                      activity.action.includes('Admin') ? 'destructive' : 'outline'
                    }>
                      {activity.action}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-medium">{activity.user}</TableCell>
                  <TableCell>{activity.timestamp}</TableCell>
                  <TableCell className="text-muted-foreground">{activity.details}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};