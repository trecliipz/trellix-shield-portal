import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useConfirm } from "@/hooks/useConfirm";
import { useAsync } from "@/hooks/useAsync";
import { 
  Plug, 
  Settings, 
  CheckCircle, 
  AlertTriangle,
  Database,
  Shield,
  Activity,
  Webhook,
  Cloud,
  Server
} from 'lucide-react';

export const IntegrationCenter = () => {
  const { toast } = useToast();
  const { confirm, ConfirmDialog } = useConfirm();
  const { loading: operationLoading, execute } = useAsync();
  // Mock integration data
  const activeIntegrations = [
    {
      id: 'INT001',
      name: 'Splunk SIEM',
      type: 'SIEM',
      status: 'connected',
      lastSync: '2 minutes ago',
      dataFlow: 'Real-time',
      events: 15420,
      configuredBy: 'John Smith'
    },
    {
      id: 'INT002',
      name: 'ServiceNow ITSM',
      type: 'ITSM',
      status: 'connected',
      lastSync: '5 minutes ago',
      dataFlow: 'Incident-based',
      events: 127,
      configuredBy: 'Sarah Johnson'
    },
    {
      id: 'INT003',
      name: 'Microsoft Sentinel',
      type: 'SIEM',
      status: 'warning',
      lastSync: '2 hours ago',
      dataFlow: 'Batch',
      events: 8934,
      configuredBy: 'Mike Davis'
    },
    {
      id: 'INT004',
      name: 'Phantom SOAR',
      type: 'SOAR',
      status: 'disconnected',
      lastSync: '1 day ago',
      dataFlow: 'Playbook-triggered',
      events: 0,
      configuredBy: 'Alex Wilson'
    }
  ];

  const availableConnectors = [
    {
      name: 'IBM QRadar',
      category: 'SIEM',
      description: 'Security information and event management platform',
      vendor: 'IBM',
      supported: true,
      features: ['Real-time events', 'Threat indicators', 'Custom rules']
    },
    {
      name: 'ArcSight ESM',
      category: 'SIEM',
      description: 'Enterprise security management solution',
      vendor: 'Micro Focus',
      supported: true,
      features: ['Event correlation', 'Risk scoring', 'Compliance reporting']
    },
    {
      name: 'Jira Service Management',
      category: 'ITSM',
      description: 'IT service management and incident tracking',
      vendor: 'Atlassian',
      supported: true,
      features: ['Incident creation', 'Status updates', 'SLA tracking']
    },
    {
      name: 'PagerDuty',
      category: 'Alerting',
      description: 'Incident response and alerting platform',
      vendor: 'PagerDuty',
      supported: true,
      features: ['Alert routing', 'Escalation policies', 'On-call management']
    },
    {
      name: 'Cortex XSOAR',
      category: 'SOAR',
      description: 'Security orchestration and automated response',
      vendor: 'Palo Alto Networks',
      supported: false,
      features: ['Playbook automation', 'Case management', 'Threat intelligence']
    },
    {
      name: 'Elastic SIEM',
      category: 'SIEM',
      description: 'Open source security analytics platform',
      vendor: 'Elastic',
      supported: true,
      features: ['Machine learning', 'Timeline analysis', 'Custom dashboards']
    }
  ];

  const webhookConfigs = [
    {
      id: 'WH001',
      name: 'Critical Alert Webhook',
      url: 'https://api.company.com/security/alerts',
      events: ['Critical threats', 'Policy violations'],
      status: 'active',
      lastTriggered: '1 hour ago'
    },
    {
      id: 'WH002',
      name: 'System Status Updates',
      url: 'https://monitoring.company.com/status',
      events: ['Agent status', 'System health'],
      status: 'active',
      lastTriggered: '15 minutes ago'
    },
    {
      id: 'WH003',
      name: 'Compliance Notifications',
      url: 'https://compliance.company.com/notifications',
      events: ['Compliance changes', 'Audit events'],
      status: 'inactive',
      lastTriggered: 'Never'
    }
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'connected':
        return <Badge className="bg-green-100 text-green-800">Connected</Badge>;
      case 'warning':
        return <Badge className="bg-yellow-100 text-yellow-800">Warning</Badge>;
      case 'disconnected':
        return <Badge variant="destructive">Disconnected</Badge>;
      case 'active':
        return <Badge className="bg-green-100 text-green-800">Active</Badge>;
      case 'inactive':
        return <Badge variant="secondary">Inactive</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
      case 'active':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'disconnected':
      case 'inactive':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      default:
        return <Activity className="h-4 w-4 text-blue-600" />;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'SIEM':
        return <Shield className="h-5 w-5" />;
      case 'ITSM':
        return <Settings className="h-5 w-5" />;
      case 'SOAR':
        return <Activity className="h-5 w-5" />;
      case 'Alerting':
        return <AlertTriangle className="h-5 w-5" />;
      default:
        return <Database className="h-5 w-5" />;
    }
  };

  const handleAPISettings = () => {
    toast({
      title: "API Settings",
      description: "API management interface would open here.",
    });
  };

  const handleNewIntegration = () => {
    toast({
      title: "New Integration",
      description: "Integration setup wizard would open here.",
    });
  };

  const handleConfigureIntegration = (integrationId: string) => {
    toast({
      title: "Configure Integration",
      description: `Configuring integration ${integrationId}.`,
    });
  };

  const handleTestIntegration = async (integrationId: string) => {
    try {
      await execute(() => new Promise(resolve => setTimeout(resolve, 2000)));
      toast({
        title: "Test Successful",
        description: `Integration ${integrationId} is working correctly.`,
      });
    } catch (error) {
      toast({
        title: "Test Failed",
        description: "Integration test failed. Please check configuration.",
        variant: "destructive",
      });
    }
  };

  const handleConfigureConnector = (connectorName: string) => {
    if (connectorName.includes('Coming Soon')) {
      toast({
        title: "Coming Soon",
        description: `${connectorName} connector is not yet available.`,
      });
    } else {
      toast({
        title: "Configure Connector",
        description: `Setting up ${connectorName} integration.`,
      });
    }
  };

  const handleConfigureWebhook = (webhookId: string) => {
    toast({
      title: "Configure Webhook",
      description: `Configuring webhook ${webhookId}.`,
    });
  };

  const handleTestWebhook = async (webhookId: string) => {
    try {
      await execute(() => new Promise(resolve => setTimeout(resolve, 1500)));
      toast({
        title: "Webhook Test Sent",
        description: `Test payload sent to webhook ${webhookId}.`,
      });
    } catch (error) {
      toast({
        title: "Test Failed",
        description: "Webhook test failed. Please check the endpoint.",
        variant: "destructive",
      });
    }
  };

  const handleCreateWebhook = () => {
    toast({
      title: "Create Webhook",
      description: "Webhook creation wizard would open here.",
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Integration Center</CardTitle>
              <CardDescription>
                Connect ePO with SIEM platforms, ITSM tools, and other security systems
              </CardDescription>
            </div>
            <div className="flex space-x-2">
              <Button variant="outline" size="sm" onClick={handleAPISettings}>
                <Settings className="h-4 w-4 mr-2" />
                API Settings
              </Button>
              <Button size="sm" onClick={handleNewIntegration}>
                <Plug className="h-4 w-4 mr-2" />
                New Integration
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="active" className="space-y-4">
            <TabsList>
              <TabsTrigger value="active">Active Integrations</TabsTrigger>
              <TabsTrigger value="available">Available Connectors</TabsTrigger>
              <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
              <TabsTrigger value="api">API Management</TabsTrigger>
            </TabsList>

            <TabsContent value="active" className="space-y-4">
              {/* Integration Status Summary */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Active Integrations</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">3</div>
                    <div className="text-sm text-muted-foreground">Connected systems</div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Events Today</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-blue-600">24,481</div>
                    <div className="text-sm text-muted-foreground">Synchronized events</div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Failed Syncs</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-red-600">2</div>
                    <div className="text-sm text-muted-foreground">Need attention</div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Avg Response Time</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">143ms</div>
                    <div className="text-sm text-muted-foreground">API response time</div>
                  </CardContent>
                </Card>
              </div>

              {/* Active Integrations Table */}
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Integration</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Last Sync</TableHead>
                      <TableHead>Data Flow</TableHead>
                      <TableHead>Events</TableHead>
                      <TableHead>Configured By</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activeIntegrations.map((integration) => (
                      <TableRow key={integration.id}>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            {getStatusIcon(integration.status)}
                            <span className="font-medium">{integration.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            {getCategoryIcon(integration.type)}
                            <Badge variant="outline">{integration.type}</Badge>
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(integration.status)}</TableCell>
                        <TableCell className="text-sm">{integration.lastSync}</TableCell>
                        <TableCell className="text-sm">{integration.dataFlow}</TableCell>
                        <TableCell className="font-medium">{integration.events.toLocaleString()}</TableCell>
                        <TableCell className="text-sm">{integration.configuredBy}</TableCell>
                        <TableCell>
                          <div className="flex space-x-1">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleConfigureIntegration(integration.id)}
                            >
                              <Settings className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleTestIntegration(integration.id)}
                              disabled={operationLoading}
                            >
                              <Activity className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            <TabsContent value="available" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {availableConnectors.map((connector, index) => (
                  <Card key={index}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          {getCategoryIcon(connector.category)}
                          <CardTitle className="text-lg">{connector.name}</CardTitle>
                        </div>
                        <Badge variant="outline">{connector.category}</Badge>
                      </div>
                      <CardDescription>{connector.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div>
                          <label className="text-sm font-medium">Vendor:</label>
                          <div className="text-sm text-muted-foreground">{connector.vendor}</div>
                        </div>
                        <div>
                          <label className="text-sm font-medium">Features:</label>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {connector.features.map((feature) => (
                              <Badge key={feature} variant="secondary" className="text-xs">
                                {feature}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <Button 
                          className="w-full" 
                          variant={connector.supported ? "default" : "outline"}
                          disabled={!connector.supported}
                          onClick={() => handleConfigureConnector(connector.name)}
                        >
                          {connector.supported ? "Configure" : "Coming Soon"}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="webhooks" className="space-y-4">
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Webhook Name</TableHead>
                      <TableHead>URL</TableHead>
                      <TableHead>Events</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Last Triggered</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {webhookConfigs.map((webhook) => (
                      <TableRow key={webhook.id}>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Webhook className="h-4 w-4" />
                            <span className="font-medium">{webhook.name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm font-mono max-w-xs truncate">
                          {webhook.url}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {webhook.events.map((event) => (
                              <Badge key={event} variant="secondary" className="text-xs">
                                {event}
                              </Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(webhook.status)}</TableCell>
                        <TableCell className="text-sm">{webhook.lastTriggered}</TableCell>
                        <TableCell>
                          <div className="flex space-x-1">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleConfigureWebhook(webhook.id)}
                            >
                              <Settings className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleTestWebhook(webhook.id)}
                              disabled={operationLoading}
                            >
                              {operationLoading ? 'Testing...' : 'Test'}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Add New Webhook</CardTitle>
                  <CardDescription>
                    Configure custom webhooks for real-time event notifications
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button onClick={handleCreateWebhook}>
                    <Webhook className="h-4 w-4 mr-2" />
                    Create Webhook
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="api" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>API Configuration</CardTitle>
                    <CardDescription>
                      Manage API access and authentication settings
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">API Endpoint</label>
                      <div className="text-sm font-mono bg-muted p-2 rounded">
                        https://epo.company.com/api/v1
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Authentication Method</label>
                      <div className="text-sm">OAuth 2.0 / API Key</div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Rate Limiting</label>
                      <div className="text-sm">1000 requests/hour per key</div>
                    </div>
                    <Button className="w-full">
                      Generate API Key
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>API Usage Statistics</CardTitle>
                    <CardDescription>
                      Monitor API usage and performance metrics
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm">Requests Today:</span>
                        <span className="font-medium">2,847</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Success Rate:</span>
                        <span className="font-medium text-green-600">99.8%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Avg Response Time:</span>
                        <span className="font-medium">143ms</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Rate Limit Usage:</span>
                        <span className="font-medium">23%</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="text-sm font-medium">Rate Limit Status</div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div className="bg-blue-600 h-2 rounded-full" style={{ width: '23%' }} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Available API Endpoints</CardTitle>
                  <CardDescription>
                    Core ePO API endpoints for integration development
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {[
                      { method: 'GET', endpoint: '/systems', description: 'Retrieve managed systems' },
                      { method: 'GET', endpoint: '/events', description: 'Query security events' },
                      { method: 'POST', endpoint: '/policies', description: 'Create security policies' },
                      { method: 'PUT', endpoint: '/tasks', description: 'Schedule automated tasks' },
                      { method: 'GET', endpoint: '/reports', description: 'Generate compliance reports' },
                      { method: 'POST', endpoint: '/alerts', description: 'Send alert notifications' }
                    ].map((api, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded">
                        <div className="flex items-center space-x-3">
                          <Badge variant="outline" className="font-mono">
                            {api.method}
                          </Badge>
                          <span className="font-mono text-sm">{api.endpoint}</span>
                        </div>
                        <span className="text-sm text-muted-foreground">{api.description}</span>
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