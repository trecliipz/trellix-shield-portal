import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Clock, 
  Plus, 
  Play, 
  Pause, 
  Edit, 
  Trash2, 
  Calendar,
  CheckCircle,
  AlertTriangle,
  XCircle,
  RefreshCw
} from 'lucide-react';

export const TaskScheduler = () => {
  // Mock scheduled tasks data
  const scheduledTasks = [
    {
      id: 'TASK001',
      name: 'Daily Virus Scan',
      type: 'Antivirus Scan',
      schedule: 'Daily at 2:00 AM',
      nextRun: '2024-01-20 02:00',
      lastRun: '2024-01-19 02:00',
      status: 'active',
      targets: 847,
      success: 832,
      failed: 15
    },
    {
      id: 'TASK002',
      name: 'Weekly DAT Update',
      type: 'Update',
      schedule: 'Weekly on Sunday at 3:00 AM',
      nextRun: '2024-01-21 03:00',
      lastRun: '2024-01-14 03:00',
      status: 'active',
      targets: 1156,
      success: 1156,
      failed: 0
    },
    {
      id: 'TASK003',
      name: 'Monthly Compliance Report',
      type: 'Report',
      schedule: 'Monthly on 1st at 9:00 AM',
      nextRun: '2024-02-01 09:00',
      lastRun: '2024-01-01 09:00',
      status: 'active',
      targets: 1,
      success: 1,
      failed: 0
    },
    {
      id: 'TASK004',
      name: 'Emergency Threat Scan',
      type: 'Threat Scan',
      schedule: 'On-demand',
      nextRun: 'Manual trigger',
      lastRun: '2024-01-18 14:30',
      status: 'paused',
      targets: 1156,
      success: 1089,
      failed: 67
    }
  ];

  const taskHistory = [
    {
      id: 'HIST001',
      taskName: 'Daily Virus Scan',
      startTime: '2024-01-19 02:00:00',
      endTime: '2024-01-19 03:45:23',
      duration: '1h 45m 23s',
      status: 'completed',
      targets: 847,
      success: 832,
      failed: 15,
      threats: 3
    },
    {
      id: 'HIST002',
      taskName: 'Weekly DAT Update',
      startTime: '2024-01-14 03:00:00',
      endTime: '2024-01-14 03:12:45',
      duration: '12m 45s',
      status: 'completed',
      targets: 1156,
      success: 1156,
      failed: 0,
      threats: 0
    },
    {
      id: 'HIST003',
      taskName: 'Policy Deployment',
      startTime: '2024-01-18 10:00:00',
      endTime: '2024-01-18 10:05:12',
      duration: '5m 12s',
      status: 'failed',
      targets: 234,
      success: 189,
      failed: 45,
      threats: 0
    }
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800">Active</Badge>;
      case 'paused':
        return <Badge variant="secondary">Paused</Badge>;
      case 'completed':
        return <Badge className="bg-blue-100 text-blue-800">Completed</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      case 'running':
        return <Badge className="bg-amber-100 text-amber-800">Running</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'running':
        return <RefreshCw className="h-4 w-4 text-amber-600 animate-spin" />;
      default:
        return <Clock className="h-4 w-4 text-blue-600" />;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Task Scheduler</CardTitle>
              <CardDescription>
                Automate security operations with scheduled tasks and workflows
              </CardDescription>
            </div>
            <div className="flex space-x-2">
              <Button variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                New Task
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="scheduled" className="space-y-4">
            <TabsList>
              <TabsTrigger value="scheduled">Scheduled Tasks</TabsTrigger>
              <TabsTrigger value="history">Task History</TabsTrigger>
              <TabsTrigger value="templates">Task Templates</TabsTrigger>
              <TabsTrigger value="monitoring">Real-time Monitoring</TabsTrigger>
            </TabsList>

            <TabsContent value="scheduled" className="space-y-4">
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Task Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Schedule</TableHead>
                      <TableHead>Next Run</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Last Results</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {scheduledTasks.map((task) => (
                      <TableRow key={task.id}>
                        <TableCell>
                          <div className="font-medium">{task.name}</div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{task.type}</Badge>
                        </TableCell>
                        <TableCell className="text-sm">{task.schedule}</TableCell>
                        <TableCell className="text-sm">{task.nextRun}</TableCell>
                        <TableCell>{getStatusBadge(task.status)}</TableCell>
                        <TableCell>
                          <div className="text-sm space-y-1">
                            <div>✓ {task.success} success</div>
                            {task.failed > 0 && <div className="text-red-600">✗ {task.failed} failed</div>}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-1">
                            <Button variant="ghost" size="sm">
                              <Play className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Pause className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            <TabsContent value="history" className="space-y-4">
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Task</TableHead>
                      <TableHead>Start Time</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Results</TableHead>
                      <TableHead>Threats Found</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {taskHistory.map((history) => (
                      <TableRow key={history.id}>
                        <TableCell>
                          <div className="font-medium">{history.taskName}</div>
                        </TableCell>
                        <TableCell className="text-sm">{history.startTime}</TableCell>
                        <TableCell className="text-sm">{history.duration}</TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            {getStatusIcon(history.status)}
                            {getStatusBadge(history.status)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm space-y-1">
                            <div>✓ {history.success}/{history.targets}</div>
                            {history.failed > 0 && <div className="text-red-600">✗ {history.failed} failed</div>}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={history.threats > 0 ? "destructive" : "secondary"}>
                            {history.threats}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button variant="outline" size="sm">
                            View Details
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            <TabsContent value="templates" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  {
                    name: 'Daily Security Scan',
                    description: 'Comprehensive daily security scanning',
                    category: 'Security',
                    actions: ['Antivirus Scan', 'Malware Scan', 'Threat Detection']
                  },
                  {
                    name: 'Weekly System Updates',
                    description: 'Keep systems updated with latest patches',
                    category: 'Updates',
                    actions: ['DAT Update', 'Product Update', 'Signature Update']
                  },
                  {
                    name: 'Monthly Compliance Check',
                    description: 'Generate compliance reports',
                    category: 'Compliance',
                    actions: ['Policy Check', 'Compliance Report', 'Audit Trail']
                  },
                  {
                    name: 'Emergency Response',
                    description: 'Rapid threat response workflow',
                    category: 'Incident Response',
                    actions: ['Threat Scan', 'Quarantine', 'Alert Notification']
                  }
                ].map((template, index) => (
                  <Card key={index}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{template.name}</CardTitle>
                        <Badge variant="outline">{template.category}</Badge>
                      </div>
                      <CardDescription>{template.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div>
                          <label className="text-sm font-medium">Actions:</label>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {template.actions.map((action) => (
                              <Badge key={action} variant="secondary" className="text-xs">
                                {action}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <Button className="w-full" variant="outline">
                          <Plus className="h-4 w-4 mr-2" />
                          Create Task
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="monitoring" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Running Tasks</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-blue-600">3</div>
                    <div className="text-sm text-muted-foreground">Currently executing</div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Queued Tasks</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-amber-600">7</div>
                    <div className="text-sm text-muted-foreground">Waiting to execute</div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Completed Today</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">24</div>
                    <div className="text-sm text-muted-foreground">Successfully finished</div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Failed Tasks</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-red-600">2</div>
                    <div className="text-sm text-muted-foreground">Need attention</div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Currently Running Tasks</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      { name: 'Full System Scan - Finance Dept', progress: 67, eta: '15 minutes' },
                      { name: 'DAT Update Deployment', progress: 89, eta: '3 minutes' },
                      { name: 'Policy Compliance Check', progress: 34, eta: '8 minutes' }
                    ].map((task, index) => (
                      <div key={index} className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="font-medium">{task.name}</span>
                          <span className="text-muted-foreground">ETA: {task.eta}</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                            style={{ width: `${task.progress}%` }}
                          />
                        </div>
                        <div className="text-xs text-muted-foreground">{task.progress}% complete</div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};