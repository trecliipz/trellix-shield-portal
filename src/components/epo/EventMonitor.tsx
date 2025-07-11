import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useConfirm } from "@/hooks/useConfirm";
import { useAsync } from "@/hooks/useAsync";
import { 
  Activity, 
  AlertTriangle, 
  Shield, 
  Search,
  RefreshCw,
  Filter,
  Bell,
  Eye,
  Archive,
  TrendingUp
} from 'lucide-react';

export const EventMonitor = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSeverity, setFilterSeverity] = useState('all');
  const [refreshing, setRefreshing] = useState(false);
  
  const { toast } = useToast();
  const { confirm, ConfirmDialog } = useConfirm();
  const { loading: operationLoading, execute } = useAsync();

  // Mock security events data
  const securityEvents = [
    {
      id: 'EVT001',
      timestamp: '2024-01-19 14:23:45',
      severity: 'critical',
      type: 'Malware Detection',
      source: 'DESKTOP-WRK001',
      description: 'Trojan.Generic.KD.123456 detected and quarantined',
      status: 'resolved',
      assignee: 'Auto-remediated'
    },
    {
      id: 'EVT002',
      timestamp: '2024-01-19 13:45:12',
      severity: 'high',
      type: 'Policy Violation',
      source: 'LAPTOP-HR002',
      description: 'Unauthorized software installation attempt blocked',
      status: 'investigating',
      assignee: 'John Smith'
    },
    {
      id: 'EVT003',
      timestamp: '2024-01-19 12:30:08',
      severity: 'medium',
      type: 'System Alert',
      source: 'SERVER-DC01',
      description: 'Agent communication lost and restored',
      status: 'resolved',
      assignee: 'Auto-resolved'
    },
    {
      id: 'EVT004',
      timestamp: '2024-01-19 11:15:33',
      severity: 'low',
      type: 'Update Event',
      source: 'Multiple Systems',
      description: 'DAT file update completed successfully',
      status: 'closed',
      assignee: 'System'
    },
    {
      id: 'EVT005',
      timestamp: '2024-01-19 10:45:22',
      severity: 'critical',
      type: 'Threat Detection',
      source: 'MOBILE-DEV003',
      description: 'Suspicious network activity detected',
      status: 'open',
      assignee: 'Sarah Johnson'
    }
  ];

  const alertRules = [
    {
      id: 'RULE001',
      name: 'Critical Malware Detection',
      condition: 'Threat Severity = Critical',
      action: 'Email + SMS Alert',
      enabled: true,
      lastTriggered: '2024-01-19 14:23:45'
    },
    {
      id: 'RULE002',
      name: 'Multiple Failed Logins',
      condition: 'Failed Auth > 5 in 10 minutes',
      action: 'Email Alert',
      enabled: true,
      lastTriggered: '2024-01-18 09:15:33'
    },
    {
      id: 'RULE003',
      name: 'Agent Offline Alert',
      condition: 'Agent Offline > 4 hours',
      action: 'Dashboard Alert',
      enabled: false,
      lastTriggered: 'Never'
    },
    {
      id: 'RULE004',
      name: 'Policy Compliance Violation',
      condition: 'Policy Violation Count > 10',
      action: 'Email + Ticket Creation',
      enabled: true,
      lastTriggered: '2024-01-17 16:42:11'
    }
  ];

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <Badge variant="destructive">Critical</Badge>;
      case 'high':
        return <Badge className="bg-orange-100 text-orange-800">High</Badge>;
      case 'medium':
        return <Badge className="bg-yellow-100 text-yellow-800">Medium</Badge>;
      case 'low':
        return <Badge variant="secondary">Low</Badge>;
      default:
        return <Badge variant="outline">{severity}</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'open':
        return <Badge variant="destructive">Open</Badge>;
      case 'investigating':
        return <Badge className="bg-blue-100 text-blue-800">Investigating</Badge>;
      case 'resolved':
        return <Badge className="bg-green-100 text-green-800">Resolved</Badge>;
      case 'closed':
        return <Badge variant="secondary">Closed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const filteredEvents = securityEvents.filter(event => {
    const matchesSearch = event.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         event.source.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterSeverity === 'all' || event.severity === filterSeverity;
    return matchesSearch && matchesFilter;
  });

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await execute(() => new Promise(resolve => setTimeout(resolve, 1500)));
      toast({
        title: "Events Refreshed",
        description: "Event data has been updated successfully.",
      });
    } catch (error) {
      toast({
        title: "Refresh Failed",
        description: "Failed to refresh event data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setRefreshing(false);
    }
  };

  const handleAlertRules = () => {
    toast({
      title: "Alert Rules",
      description: "Alert rules management would open here.",
    });
  };

  const handleViewEvent = (eventId: string) => {
    toast({
      title: "Event Details",
      description: `Viewing details for event ${eventId}.`,
    });
  };

  const handleArchiveEvent = (eventId: string) => {
    toast({
      title: "Event Archived",
      description: `Event ${eventId} has been archived.`,
    });
  };

  const handleEditRule = (ruleId: string) => {
    toast({
      title: "Edit Rule",
      description: `Editing alert rule ${ruleId}.`,
    });
  };

  const handleTestRule = (ruleId: string) => {
    toast({
      title: "Testing Rule",
      description: `Sending test notification for rule ${ruleId}.`,
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Event Monitor</CardTitle>
              <CardDescription>
                Real-time security event monitoring and alert management
              </CardDescription>
            </div>
            <div className="flex space-x-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleRefresh}
                disabled={refreshing}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                {refreshing ? 'Refreshing...' : 'Refresh'}
              </Button>
              <Button size="sm" onClick={handleAlertRules}>
                <Bell className="h-4 w-4 mr-2" />
                Alert Rules
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="events" className="space-y-4">
            <TabsList>
              <TabsTrigger value="events">Security Events</TabsTrigger>
              <TabsTrigger value="alerts">Alert Rules</TabsTrigger>
              <TabsTrigger value="dashboard">Live Dashboard</TabsTrigger>
              <TabsTrigger value="analytics">Event Analytics</TabsTrigger>
            </TabsList>

            <TabsContent value="events" className="space-y-4">
              {/* Event Statistics */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Open Events</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-red-600">8</div>
                    <div className="text-sm text-muted-foreground">Require attention</div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Critical Alerts</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-red-600">2</div>
                    <div className="text-sm text-muted-foreground">Last 24 hours</div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Resolved Today</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">15</div>
                    <div className="text-sm text-muted-foreground">Auto + Manual</div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Threats Blocked</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-blue-600">47</div>
                    <div className="text-sm text-muted-foreground">Last 24 hours</div>
                  </CardContent>
                </Card>
              </div>

              {/* Search and Filter Controls */}
              <div className="flex space-x-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search events by description or source..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={filterSeverity} onValueChange={setFilterSeverity}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Filter by severity" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Severities</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Events Table */}
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Timestamp</TableHead>
                      <TableHead>Severity</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Source</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Assignee</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredEvents.map((event) => (
                      <TableRow key={event.id}>
                        <TableCell className="text-sm">{event.timestamp}</TableCell>
                        <TableCell>{getSeverityBadge(event.severity)}</TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            {event.type.includes('Malware') && <Shield className="h-4 w-4 text-red-600" />}
                            {event.type.includes('Policy') && <AlertTriangle className="h-4 w-4 text-amber-600" />}
                            {event.type.includes('System') && <Activity className="h-4 w-4 text-blue-600" />}
                            <span className="text-sm">{event.type}</span>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">{event.source}</TableCell>
                        <TableCell className="max-w-xs truncate">{event.description}</TableCell>
                        <TableCell>{getStatusBadge(event.status)}</TableCell>
                        <TableCell className="text-sm">{event.assignee}</TableCell>
                        <TableCell>
                          <div className="flex space-x-1">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleViewEvent(event.id)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleArchiveEvent(event.id)}
                            >
                              <Archive className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            <TabsContent value="alerts" className="space-y-4">
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Rule Name</TableHead>
                      <TableHead>Condition</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Last Triggered</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {alertRules.map((rule) => (
                      <TableRow key={rule.id}>
                        <TableCell className="font-medium">{rule.name}</TableCell>
                        <TableCell className="text-sm">{rule.condition}</TableCell>
                        <TableCell className="text-sm">{rule.action}</TableCell>
                        <TableCell>
                          <Badge variant={rule.enabled ? "default" : "secondary"}>
                            {rule.enabled ? "Enabled" : "Disabled"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">{rule.lastTriggered}</TableCell>
                        <TableCell>
                          <div className="flex space-x-1">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleEditRule(rule.id)}
                            >
                              Edit
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleTestRule(rule.id)}
                            >
                              Test
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            <TabsContent value="dashboard" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Real-time Event Feed</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3 max-h-80 overflow-y-auto">
                      {securityEvents.slice(0, 6).map((event) => (
                        <div key={event.id} className="flex items-start space-x-3 p-3 border rounded">
                          <div className="flex-shrink-0">
                            {getSeverityBadge(event.severity)}
                          </div>
                          <div className="flex-1 space-y-1">
                            <div className="text-sm font-medium">{event.type}</div>
                            <div className="text-xs text-muted-foreground">{event.description}</div>
                            <div className="text-xs text-muted-foreground">{event.timestamp}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Event Trends</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Malware Detections</span>
                          <span className="font-medium">12 this week</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div className="bg-red-600 h-2 rounded-full" style={{ width: '75%' }} />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Policy Violations</span>
                          <span className="font-medium">8 this week</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div className="bg-amber-600 h-2 rounded-full" style={{ width: '50%' }} />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>System Alerts</span>
                          <span className="font-medium">23 this week</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div className="bg-blue-600 h-2 rounded-full" style={{ width: '90%' }} />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="analytics" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Events This Week</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">127</div>
                    <div className="flex items-center text-sm text-green-600">
                      <TrendingUp className="h-4 w-4 mr-1" />
                      12% from last week
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Resolution Time</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">4.2h</div>
                    <div className="text-sm text-muted-foreground">Average resolution time</div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Auto-Resolution Rate</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">78%</div>
                    <div className="text-sm text-muted-foreground">Automatically resolved</div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Event Distribution by Type</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {[
                      { type: 'Malware Detection', count: 45, percentage: 35 },
                      { type: 'Policy Violation', count: 32, percentage: 25 },
                      { type: 'System Alert', count: 28, percentage: 22 },
                      { type: 'Update Event', count: 22, percentage: 18 }
                    ].map((item) => (
                      <div key={item.type} className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="font-medium">{item.type}</span>
                          <span>{item.count} events ({item.percentage}%)</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{ width: `${item.percentage}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      <ConfirmDialog />
    </div>
  );
};