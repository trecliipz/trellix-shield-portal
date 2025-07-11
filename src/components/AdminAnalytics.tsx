import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { BarChart, TrendingUp, Users, Download, Activity, Calendar } from "lucide-react";

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

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = () => {
    const savedAnalytics = localStorage.getItem('admin_analytics');
    if (savedAnalytics) {
      setAnalytics(JSON.parse(savedAnalytics));
    } else {
      // Initialize with mock analytics data
      const mockAnalytics: AnalyticsData = {
        userRegistrations: [
          { date: '2024-07-01', count: 5 },
          { date: '2024-07-02', count: 8 },
          { date: '2024-07-03', count: 12 },
          { date: '2024-07-04', count: 6 },
          { date: '2024-07-05', count: 15 },
          { date: '2024-07-06', count: 9 },
          { date: '2024-07-07', count: 11 }
        ],
        agentDownloads: [
          { agent: 'Trellix Agent', downloads: 156, trend: 12 },
          { agent: 'Endpoint Security', downloads: 234, trend: -5 },
          { agent: 'ePolicy Orchestrator Tools', downloads: 89, trend: 8 }
        ],
        systemActivity: [
          { action: 'User Login', timestamp: '2024-07-11 14:30', user: 'john.doe@company.com', details: 'Successful login from 192.168.1.100' },
          { action: 'Agent Download', timestamp: '2024-07-11 14:25', user: 'jane.smith@company.com', details: 'Downloaded Trellix Agent v5.7.8' },
          { action: 'User Registration', timestamp: '2024-07-11 14:20', user: 'new.user@company.com', details: 'New user account created' },
          { action: 'Admin Action', timestamp: '2024-07-11 14:15', user: 'admin@trellix.com', details: 'Updated user role for john.doe@company.com' },
          { action: 'Agent Upload', timestamp: '2024-07-11 14:10', user: 'admin@trellix.com', details: 'Uploaded new agent: Security Scanner v2.1.0' }
        ],
        popularAgents: [
          { name: 'Trellix Agent', downloads: 156, percentage: 45 },
          { name: 'Endpoint Security', downloads: 234, percentage: 35 },
          { name: 'ePolicy Orchestrator Tools', downloads: 89, percentage: 20 }
        ]
      };
      setAnalytics(mockAnalytics);
      localStorage.setItem('admin_analytics', JSON.stringify(mockAnalytics));
    }
  };

  const totalDownloads = analytics.agentDownloads.reduce((sum, agent) => sum + agent.downloads, 0);
  const totalUsers = analytics.userRegistrations.reduce((sum, day) => sum + day.count, 0);
  const avgDailyRegistrations = analytics.userRegistrations.length > 0 
    ? Math.round(totalUsers / analytics.userRegistrations.length) 
    : 0;

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