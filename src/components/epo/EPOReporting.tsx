import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  BarChart3, 
  FileText, 
  Download, 
  Calendar, 
  TrendingUp,
  Shield,
  AlertTriangle,
  CheckCircle,
  Clock,
  Users,
  Server
} from 'lucide-react';

export const EPOReporting = () => {
  const [reportPeriod, setReportPeriod] = useState('last7days');

  // Mock reports data
  const generatedReports = [
    {
      id: 'RPT001',
      name: 'Weekly Security Summary',
      type: 'Security',
      generated: '2024-01-19 09:00',
      period: 'Jan 12 - Jan 19, 2024',
      format: 'PDF',
      size: '2.4 MB',
      status: 'completed'
    },
    {
      id: 'RPT002',
      name: 'Policy Compliance Report',
      type: 'Compliance',
      generated: '2024-01-15 14:30',
      period: 'January 2024',
      format: 'Excel',
      size: '856 KB',
      status: 'completed'
    },
    {
      id: 'RPT003',
      name: 'Threat Detection Analysis',
      type: 'Threat Intelligence',
      generated: '2024-01-18 16:45',
      period: 'Last 30 days',
      format: 'PDF',
      size: '1.8 MB',
      status: 'completed'
    },
    {
      id: 'RPT004',
      name: 'Executive Dashboard',
      type: 'Executive',
      generated: 'In Progress',
      period: 'Q1 2024',
      format: 'PowerPoint',
      size: '-',
      status: 'generating'
    }
  ];

  const reportTemplates = [
    {
      name: 'Security Posture Report',
      category: 'Security',
      description: 'Comprehensive security status across all endpoints',
      frequency: 'Weekly',
      metrics: ['Threat detections', 'Policy compliance', 'System health']
    },
    {
      name: 'Compliance Audit Report',
      category: 'Compliance',
      description: 'Detailed compliance status for regulatory requirements',
      frequency: 'Monthly',
      metrics: ['Policy adherence', 'Violation tracking', 'Remediation status']
    },
    {
      name: 'Executive Summary',
      category: 'Executive',
      description: 'High-level security metrics for leadership',
      frequency: 'Monthly',
      metrics: ['Risk scores', 'Trends', 'Key recommendations']
    },
    {
      name: 'Incident Response Report',
      category: 'Incident',
      description: 'Detailed analysis of security incidents and responses',
      frequency: 'As needed',
      metrics: ['Incident timeline', 'Response actions', 'Lessons learned']
    }
  ];

  // Mock dashboard metrics
  const dashboardMetrics = {
    totalEndpoints: 1247,
    threatsBlocked: 47,
    policyCompliance: 94.2,
    systemsAtRisk: 8,
    incidentResponse: 2.4, // hours
    updateCompliance: 98.7
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800">Completed</Badge>;
      case 'generating':
        return <Badge className="bg-blue-100 text-blue-800">Generating</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>ePO Reporting & Analytics</CardTitle>
              <CardDescription>
                Generate comprehensive security reports and analyze trends
              </CardDescription>
            </div>
            <div className="flex space-x-2">
              <Button variant="outline" size="sm">
                <Calendar className="h-4 w-4 mr-2" />
                Schedule
              </Button>
              <Button size="sm">
                <FileText className="h-4 w-4 mr-2" />
                New Report
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="dashboard" className="space-y-4">
            <TabsList>
              <TabsTrigger value="dashboard">Executive Dashboard</TabsTrigger>
              <TabsTrigger value="reports">Generated Reports</TabsTrigger>
              <TabsTrigger value="templates">Report Templates</TabsTrigger>
              <TabsTrigger value="analytics">Advanced Analytics</TabsTrigger>
            </TabsList>

            <TabsContent value="dashboard" className="space-y-4">
              {/* Period Selector */}
              <div className="flex items-center space-x-4">
                <label className="text-sm font-medium">Report Period:</label>
                <Select value={reportPeriod} onValueChange={setReportPeriod}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="last7days">Last 7 Days</SelectItem>
                    <SelectItem value="last30days">Last 30 Days</SelectItem>
                    <SelectItem value="thisquarter">This Quarter</SelectItem>
                    <SelectItem value="thisyear">This Year</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Key Metrics Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-medium text-muted-foreground">Total Endpoints</CardTitle>
                      <Server className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{dashboardMetrics.totalEndpoints.toLocaleString()}</div>
                    <div className="flex items-center text-sm text-green-600">
                      <TrendingUp className="h-4 w-4 mr-1" />
                      5% increase
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-medium text-muted-foreground">Threats Blocked</CardTitle>
                      <Shield className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-red-600">{dashboardMetrics.threatsBlocked}</div>
                    <div className="text-sm text-muted-foreground">Last 24 hours</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-medium text-muted-foreground">Policy Compliance</CardTitle>
                      <CheckCircle className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">{dashboardMetrics.policyCompliance}%</div>
                    <div className="text-sm text-muted-foreground">Organization-wide</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-medium text-muted-foreground">Systems at Risk</CardTitle>
                      <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-amber-600">{dashboardMetrics.systemsAtRisk}</div>
                    <div className="text-sm text-muted-foreground">Need attention</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-medium text-muted-foreground">Avg Response Time</CardTitle>
                      <Clock className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-blue-600">{dashboardMetrics.incidentResponse}h</div>
                    <div className="text-sm text-muted-foreground">Incident response</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-medium text-muted-foreground">Update Compliance</CardTitle>
                      <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">{dashboardMetrics.updateCompliance}%</div>
                    <div className="text-sm text-muted-foreground">Current patches</div>
                  </CardContent>
                </Card>
              </div>

              {/* Trend Charts Placeholder */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Threat Trends</CardTitle>
                    <CardDescription>Security threats over time</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-48 flex items-center justify-center bg-muted rounded">
                      <div className="text-center">
                        <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                        <p className="text-sm text-muted-foreground">Threat trend chart would appear here</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Compliance Status</CardTitle>
                    <CardDescription>Policy compliance by department</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {[
                        { dept: 'Finance', compliance: 98 },
                        { dept: 'HR', compliance: 92 },
                        { dept: 'IT', compliance: 96 },
                        { dept: 'Marketing', compliance: 89 },
                        { dept: 'Operations', compliance: 94 }
                      ].map((item) => (
                        <div key={item.dept} className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span>{item.dept}</span>
                            <span className="font-medium">{item.compliance}%</span>
                          </div>
                          <div className="w-full bg-muted rounded-full h-2">
                            <div 
                              className="bg-green-600 h-2 rounded-full" 
                              style={{ width: `${item.compliance}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="reports" className="space-y-4">
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Report Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Generated</TableHead>
                      <TableHead>Period</TableHead>
                      <TableHead>Format</TableHead>
                      <TableHead>Size</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {generatedReports.map((report) => (
                      <TableRow key={report.id}>
                        <TableCell className="font-medium">{report.name}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{report.type}</Badge>
                        </TableCell>
                        <TableCell className="text-sm">{report.generated}</TableCell>
                        <TableCell className="text-sm">{report.period}</TableCell>
                        <TableCell className="text-sm">{report.format}</TableCell>
                        <TableCell className="text-sm">{report.size}</TableCell>
                        <TableCell>{getStatusBadge(report.status)}</TableCell>
                        <TableCell>
                          <div className="flex space-x-1">
                            <Button variant="ghost" size="sm" disabled={report.status !== 'completed'}>
                              <Download className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <FileText className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            <TabsContent value="templates" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {reportTemplates.map((template, index) => (
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
                          <label className="text-sm font-medium">Frequency:</label>
                          <div className="text-sm text-muted-foreground">{template.frequency}</div>
                        </div>
                        <div>
                          <label className="text-sm font-medium">Key Metrics:</label>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {template.metrics.map((metric) => (
                              <Badge key={metric} variant="secondary" className="text-xs">
                                {metric}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <Button className="flex-1" variant="outline">
                            Generate Now
                          </Button>
                          <Button className="flex-1">
                            Schedule
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="analytics" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Report Generation</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">156</div>
                    <div className="text-sm text-muted-foreground">Reports this month</div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Avg Generation Time</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">3.2m</div>
                    <div className="text-sm text-muted-foreground">Per report</div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Most Requested</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-lg font-bold">Security Summary</div>
                    <div className="text-sm text-muted-foreground">42 requests this month</div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Report Usage Analytics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      { type: 'Security Reports', requests: 45, percentage: 35 },
                      { type: 'Compliance Reports', requests: 32, percentage: 25 },
                      { type: 'Executive Summaries', requests: 28, percentage: 22 },
                      { type: 'Incident Reports', requests: 23, percentage: 18 }
                    ].map((item) => (
                      <div key={item.type} className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="font-medium">{item.type}</span>
                          <span>{item.requests} requests ({item.percentage}%)</span>
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
    </div>
  );
};