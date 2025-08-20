
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Settings, 
  Shield, 
  Server, 
  Database, 
  Network, 
  CheckCircle, 
  AlertCircle, 
  Clock,
  Plus,
  Edit,
  Trash2,
  Webhook,
  Key,
  Plug,
  Terminal,
  Play,
  FileText,
  Users,
  Activity,
  Loader2
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { logIntegrationError } from "@/lib/logger";

interface EPOConnection {
  id: string;
  name: string;
  server_url: string;
  username: string;
  port: number;
  status: 'connected' | 'disconnected' | 'error';
  last_sync: string | null;
  version: string | null;
  created_at: string;
  updated_at: string;
}

export const IntegrationCenter = () => {
  const [connections, setConnections] = useState<EPOConnection[]>([]);
  const [loading, setLoading] = useState(true);

  const [showAddConnection, setShowAddConnection] = useState(false);
  const [newConnection, setNewConnection] = useState({
    name: '',
    serverUrl: '',
    username: '',
    password: '',
    port: '8443'
  });

  // Integration settings state
  const [integrationSettings, setIntegrationSettings] = useState({
    connectionTimeout: 30,
    retryAttempts: 3,
    logLevel: 'info'
  });

  // API Commands state
  const [selectedConnection, setSelectedConnection] = useState<string>('');
  const [selectedCommand, setSelectedCommand] = useState<string>('');
  const [commandParameters, setCommandParameters] = useState<string>('');
  const [commandResults, setCommandResults] = useState<string>('');
  const [isExecuting, setIsExecuting] = useState(false);

  // Load connections from Supabase
  useEffect(() => {
    loadConnections();
  }, []);

  const loadConnections = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('epo_connections')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading connections:', error);
        logIntegrationError(
          'Failed to load EPO connections from database',
          'IntegrationCenter.tsx',
          'epo',
          { error: error.message, code: error.code }
        );
        toast.error('Failed to load connections');
      } else {
        setConnections((data || []) as EPOConnection[]);
      }
    } catch (error) {
      console.error('Error loading connections:', error);
      logIntegrationError(
        'Failed to load EPO connections - network error',
        'IntegrationCenter.tsx',
        'epo',
        { error: error.message, stack: error.stack }
      );
      toast.error('Failed to load connections');
    } finally {
      setLoading(false);
    }
  };

  const epoCommands = [
    { value: 'system.find', label: 'Get Agent/System Info', description: 'Retrieve agent and system information' },
    { value: 'policy.listPolicies', label: 'List Policies', description: 'Get all policies from EPO server' },
    { value: 'policy.getPolicy', label: 'Get Policy Details', description: 'Get detailed policy information' },
    { value: 'system.listUsers', label: 'List Users', description: 'Get all users from EPO server' },
    { value: 'core.getVersion', label: 'Get EPO Version', description: 'Get EPO server version information' },
    { value: 'system.clearTags', label: 'Clear Tags', description: 'Clear tags from systems' },
    { value: 'system.applyTag', label: 'Apply Tag', description: 'Apply tags to systems' },
    { value: 'clienttask.run', label: 'Run Client Task', description: 'Execute client task on endpoints' },
    { value: 'repository.findPackages', label: 'Find Packages', description: 'Find packages in repository' },
    { value: 'system.getLastAgent', label: 'Get Last Agent Communication', description: 'Get last agent communication time' }
  ];

  const handleAddConnection = async () => {
    if (!newConnection.name || !newConnection.serverUrl || !newConnection.username) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("You must be logged in to add connections");
        return;
      }

      const { error } = await supabase
        .from('epo_connections')
        .insert({
          user_id: user.id,
          name: newConnection.name,
          server_url: newConnection.serverUrl,
          username: newConnection.username,
          port: parseInt(newConnection.port),
          status: 'disconnected'
        });

      if (error) {
        console.error('Error adding connection:', error);
        logIntegrationError(
          'Failed to add new EPO connection',
          'IntegrationCenter.tsx',
          'epo',
          {
            connectionName: newConnection.name,
            serverUrl: newConnection.serverUrl,
            error: error.message,
            code: error.code
          }
        );
        toast.error("Failed to add connection");
        return;
      }

      // Reload connections
      await loadConnections();
      
      setShowAddConnection(false);
      setNewConnection({
        name: '',
        serverUrl: '',
        username: '',
        password: '',
        port: '8443'
      });

      toast.success("EPO connection added successfully");
    } catch (error) {
      console.error('Error adding connection:', error);
      logIntegrationError(
        'Network error while adding EPO connection',
        'IntegrationCenter.tsx',
        'epo',
        {
          connectionName: newConnection.name,
          serverUrl: newConnection.serverUrl,
          error: error.message,
          stack: error.stack
        }
      );
      toast.error("Failed to add connection");
    }
  };

  const handleTestConnection = async (connectionId: string) => {
    const connection = connections.find(c => c.id === connectionId);
    if (!connection) return;

    toast.info("Testing connection...");
    
    try {
      // Simulate connection test
      setTimeout(async () => {
        const { error } = await supabase
          .from('epo_connections')
          .update({
            status: 'connected',
            last_sync: new Date().toISOString(),
            version: '5.10.0'
          })
          .eq('id', connectionId);

        if (error) {
          console.error('Error updating connection:', error);
          logIntegrationError(
            'Failed to update EPO connection status after test',
            'IntegrationCenter.tsx',
            'epo',
            {
              connectionId,
              connectionName: connection.name,
              error: error.message,
              code: error.code
            }
          );
          toast.error("Failed to update connection status");
        } else {
          await loadConnections();
          toast.success("Connection test successful");
        }
      }, 2000);
    } catch (error) {
      console.error('Error testing connection:', error);
      logIntegrationError(
        'Network error during EPO connection test',
        'IntegrationCenter.tsx',
        'epo',
        {
          connectionId,
          connectionName: connection.name,
          error: error.message,
          stack: error.stack
        }
      );
      toast.error("Failed to test connection");
    }
  };

  const handleDeleteConnection = async (connectionId: string) => {
    const connection = connections.find(c => c.id === connectionId);
    if (!connection) return;

    if (window.confirm(`Are you sure you want to delete the connection "${connection.name}"? This action cannot be undone.`)) {
      try {
        const { error } = await supabase
          .from('epo_connections')
          .delete()
          .eq('id', connectionId);

        if (error) {
          console.error('Error deleting connection:', error);
          toast.error("Failed to delete connection");
        } else {
          await loadConnections();
          toast.success("Connection deleted successfully");
        }
      } catch (error) {
        console.error('Error deleting connection:', error);
        toast.error("Failed to delete connection");
      }
    }
  };

  const handleSaveSettings = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("You must be logged in to save settings");
        return;
      }

      // Save settings to localStorage for now (could be moved to Supabase later)
      localStorage.setItem('integration_settings', JSON.stringify(integrationSettings));
      
      // Trigger sync for all connected servers
      const connectedServers = connections.filter(c => c.status === 'connected');
      
      if (connectedServers.length === 0) {
        toast.warning("No connected servers to sync");
        return;
      }

      toast.info(`Syncing settings with ${connectedServers.length} server(s)...`);

      // Simulate sync process
      for (const server of connectedServers) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Update last sync time
        await supabase
          .from('epo_connections')
          .update({ last_sync: new Date().toISOString() })
          .eq('id', server.id);
      }

      await loadConnections();
      toast.success("Settings saved and synced successfully!");
      
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error("Failed to save settings");
    }
  };

  const handleExecuteCommand = async () => {
    if (!selectedConnection || !selectedCommand) {
      toast.error("Please select a connection and command");
      return;
    }

    const connection = connections.find(c => c.id === selectedConnection);
    if (!connection) {
      toast.error("Selected connection not found");
      return;
    }

    if (connection.status !== 'connected') {
      toast.error("Connection must be active to execute commands");
      return;
    }

    setIsExecuting(true);
    toast.info("Executing EPO command...");

    // Simulate API command execution
    setTimeout(() => {
      const mockResponses = {
        'system.find': `[
  {
    "EPOBranchNode.AutoID": 3,
    "EPOLeafNode.NodeName": "WORKSTATION-001",
    "EPOComputerProperties.IPAddress": "192.168.1.100",
    "EPOComputerProperties.OSType": "Windows 10 Pro",
    "EPOComputerProperties.LastUpdate": "2024-08-03T14:30:00Z",
    "EPOComputerProperties.AgentVersion": "5.10.0.123"
  }
]`,
        'policy.listPolicies': `[
  {
    "productId": "ENDP_AM_1000",
    "policyName": "Default Anti-Malware Policy",
    "policyType": "Anti-Malware",
    "assignedSystems": 45,
    "lastModified": "2024-08-01T10:15:00Z"
  },
  {
    "productId": "ENDP_FW_1000", 
    "policyName": "Corporate Firewall Policy",
    "policyType": "Firewall",
    "assignedSystems": 52,
    "lastModified": "2024-07-28T16:45:00Z"
  }
]`,
        'system.listUsers': `[
  {
    "userId": 1,
    "userName": "admin",
    "fullName": "Administrator",
    "email": "admin@company.com",
    "lastLogin": "2024-08-03T09:30:00Z",
    "permissions": ["SuperUser"]
  }
]`,
        'core.getVersion': `{
  "version": "5.10.0 Build 3201",
  "build": "3201",
  "buildDate": "2024-07-15",
  "hotfixes": ["HF1234567", "HF1234568"]
}`,
        'repository.findPackages': `[
  {
    "packageId": 1001,
    "packageName": "ENS 10.7.0 Windows",
    "version": "10.7.0.1234",
    "platform": "Windows",
    "packageType": "Product Package",
    "size": "256 MB",
    "checkInDate": "2024-08-01T14:22:00Z"
  }
]`
      };

      const result = mockResponses[selectedCommand as keyof typeof mockResponses] || 
        `Command executed successfully on ${connection.name}`;
      
      setCommandResults(result);
      setIsExecuting(false);
      toast.success("Command executed successfully");
    }, 2000);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      connected: { variant: "default" as const, icon: CheckCircle, color: "text-green-600" },
      disconnected: { variant: "secondary" as const, icon: Clock, color: "text-yellow-600" },
      error: { variant: "destructive" as const, icon: AlertCircle, color: "text-red-600" },
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.disconnected;
    const Icon = config.icon;
    
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Integration Center</h2>
          <p className="text-muted-foreground">Manage EPO server connections and integrations</p>
        </div>
        <Button onClick={() => setShowAddConnection(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Connection
        </Button>
      </div>

      <Tabs defaultValue="connections" className="space-y-6">
        <TabsList>
          <TabsTrigger value="connections">Connections</TabsTrigger>
          <TabsTrigger value="connectors">Available Connectors</TabsTrigger>
          <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
          <TabsTrigger value="api">API Management</TabsTrigger>
          <TabsTrigger value="commands">API Commands</TabsTrigger>
          <TabsTrigger value="sync">Synchronization</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="connections" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Connections</CardTitle>
                <Server className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{connections.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Connections</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {connections.filter(c => c.status === 'connected').length}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Last Sync</CardTitle>
                <Database className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {connections.length > 0 && connections.some(c => c.last_sync) 
                    ? new Date(Math.max(...connections.filter(c => c.last_sync).map(c => new Date(c.last_sync!).getTime()))).toLocaleTimeString()
                    : 'Never'
                  }
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>EPO Server Connections</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin mr-2" />
                  Loading connections...
                </div>
              ) : (
                <div className="space-y-4">
                  {connections.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No EPO connections configured. Click "Add Connection" to get started.
                    </div>
                  ) : (
                    connections.map((connection) => (
                      <div key={connection.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center space-x-4">
                          <div className="p-2 bg-primary/10 rounded-lg">
                            <Shield className="h-6 w-6 text-primary" />
                          </div>
                          <div>
                            <h3 className="font-semibold">{connection.name}</h3>
                            <p className="text-sm text-muted-foreground">{connection.server_url}:{connection.port}</p>
                            <div className="flex items-center space-x-4 mt-1">
                              <span className="text-xs text-muted-foreground">Username: {connection.username}</span>
                              <span className="text-xs text-muted-foreground">Version: {connection.version || 'Unknown'}</span>
                              <span className="text-xs text-muted-foreground">
                                Last Sync: {connection.last_sync ? new Date(connection.last_sync).toLocaleString() : 'Never'}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {getStatusBadge(connection.status)}
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleTestConnection(connection.id)}
                          >
                            <Network className="h-4 w-4 mr-1" />
                            Test
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleDeleteConnection(connection.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="connectors" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Available Connectors</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Shield className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Trellix EPO</h3>
                      <p className="text-sm text-muted-foreground">Enterprise security management</p>
                    </div>
                  </div>
                  <Badge variant="default">Active</Badge>
                </div>
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="p-2 bg-secondary/10 rounded-lg">
                      <Database className="h-6 w-6 text-secondary" />
                    </div>
                    <div>
                      <h3 className="font-semibold">SIEM Integration</h3>
                      <p className="text-sm text-muted-foreground">Security information management</p>
                    </div>
                  </div>
                  <Badge variant="secondary">Available</Badge>
                </div>
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="p-2 bg-accent/10 rounded-lg">
                      <Network className="h-6 w-6 text-accent" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Active Directory</h3>
                      <p className="text-sm text-muted-foreground">User directory integration</p>
                    </div>
                  </div>
                  <Badge variant="outline">Coming Soon</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="webhooks" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Webhook className="h-5 w-5" />
                Webhook Management
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium">Active Webhooks</h3>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Webhook
                  </Button>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <h4 className="font-medium">Threat Detection Events</h4>
                      <p className="text-sm text-muted-foreground">https://api.company.com/webhooks/threats</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="default">Active</Badge>
                      <Button variant="ghost" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <h4 className="font-medium">Policy Updates</h4>
                      <p className="text-sm text-muted-foreground">https://api.company.com/webhooks/policies</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="secondary">Inactive</Badge>
                      <Button variant="ghost" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="api" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                API Management
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium mb-3">API Keys</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <h4 className="font-medium">Production API Key</h4>
                        <p className="text-sm text-muted-foreground">sk-prod-xxxxxxxxxxxxxxxx</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant="default">Active</Badge>
                        <Button variant="outline" size="sm">Regenerate</Button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <h4 className="font-medium">Development API Key</h4>
                        <p className="text-sm text-muted-foreground">sk-dev-xxxxxxxxxxxxxxxx</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant="secondary">Test</Badge>
                        <Button variant="outline" size="sm">Regenerate</Button>
                      </div>
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-medium mb-3">Rate Limits</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-3 border rounded-lg">
                      <h4 className="font-medium">Current Usage</h4>
                      <p className="text-2xl font-bold">1,247</p>
                      <p className="text-sm text-muted-foreground">requests today</p>
                    </div>
                    <div className="p-3 border rounded-lg">
                      <h4 className="font-medium">Rate Limit</h4>
                      <p className="text-2xl font-bold">10,000</p>
                      <p className="text-sm text-muted-foreground">requests per day</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="commands" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Terminal className="h-5 w-5" />
                EPO API Commands
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label>Select Connection</Label>
                    <Select value={selectedConnection} onValueChange={setSelectedConnection}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose EPO connection" />
                      </SelectTrigger>
                      <SelectContent>
                         {connections.filter(c => c.status === 'connected').map((connection) => (
                           <SelectItem key={connection.id} value={connection.id}>
                             {connection.name} ({connection.server_url})
                           </SelectItem>
                         ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Select Command</Label>
                    <Select value={selectedCommand} onValueChange={setSelectedCommand}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose EPO command" />
                      </SelectTrigger>
                      <SelectContent>
                        {epoCommands.map((command) => (
                          <SelectItem key={command.value} value={command.value}>
                            <div className="flex flex-col items-start">
                              <span className="font-medium">{command.label}</span>
                              <span className="text-xs text-muted-foreground">{command.description}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Parameters (JSON)</Label>
                    <textarea
                      className="w-full h-24 p-3 border rounded-md font-mono text-sm"
                      placeholder='{"searchText": "WORKSTATION-*", "maxResults": 10}'
                      value={commandParameters}
                      onChange={(e) => setCommandParameters(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Optional: Provide parameters in JSON format
                    </p>
                  </div>

                  <Button 
                    onClick={handleExecuteCommand} 
                    className="w-full"
                    disabled={isExecuting || !selectedConnection || !selectedCommand}
                  >
                    {isExecuting ? (
                      <>
                        <Activity className="h-4 w-4 mr-2 animate-spin" />
                        Executing...
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4 mr-2" />
                        Execute Command
                      </>
                    )}
                  </Button>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Command Results
                    </Label>
                    <div className="bg-muted p-4 rounded-lg border">
                      <pre className="text-sm overflow-auto max-h-96 whitespace-pre-wrap">
                        {commandResults || 'No results yet. Execute a command to see output.'}
                      </pre>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setCommandResults('')}
                    >
                      Clear Results
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        if (commandResults) {
                          navigator.clipboard.writeText(commandResults);
                          toast.success("Results copied to clipboard");
                        }
                      }}
                    >
                      Copy Results
                    </Button>
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <h3 className="text-lg font-medium mb-3 flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Available Commands
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {epoCommands.map((command) => (
                    <div key={command.value} className="p-3 border rounded-lg">
                      <h4 className="font-medium text-sm">{command.label}</h4>
                      <p className="text-xs text-muted-foreground mt-1">{command.description}</p>
                      <Badge variant="outline" className="mt-2 text-xs">
                        {command.value}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sync" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Synchronization Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label>Sync Frequency</Label>
                  <Select defaultValue="hourly">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="realtime">Real-time</SelectItem>
                      <SelectItem value="hourly">Every Hour</SelectItem>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="manual">Manual Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Data Types to Sync</Label>
                  <div className="mt-2 space-y-2">
                    <div className="flex items-center space-x-2">
                      <input type="checkbox" defaultChecked />
                      <span className="text-sm">Policies</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input type="checkbox" defaultChecked />
                      <span className="text-sm">Agent Status</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input type="checkbox" defaultChecked />
                      <span className="text-sm">Threat Events</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input type="checkbox" />
                      <span className="text-sm">System Information</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Integration Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label>Default Connection Timeout (seconds)</Label>
                  <Input 
                    type="number" 
                    value={integrationSettings.connectionTimeout}
                    onChange={(e) => setIntegrationSettings({
                      ...integrationSettings,
                      connectionTimeout: parseInt(e.target.value) || 30
                    })}
                  />
                </div>
                <div>
                  <Label>Retry Attempts</Label>
                  <Input 
                    type="number" 
                    value={integrationSettings.retryAttempts}
                    onChange={(e) => setIntegrationSettings({
                      ...integrationSettings,
                      retryAttempts: parseInt(e.target.value) || 3
                    })}
                  />
                </div>
                <div>
                  <Label>Log Level</Label>
                  <Select 
                    value={integrationSettings.logLevel} 
                    onValueChange={(value) => setIntegrationSettings({
                      ...integrationSettings,
                      logLevel: value
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="debug">Debug</SelectItem>
                      <SelectItem value="info">Info</SelectItem>
                      <SelectItem value="warn">Warning</SelectItem>
                      <SelectItem value="error">Error</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleSaveSettings} className="w-full">
                  <Settings className="h-4 w-4 mr-2" />
                  Save Settings & Sync
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {showAddConnection && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Add EPO Connection</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="name">Connection Name</Label>
                <Input
                  id="name"
                  placeholder="Primary EPO Server"
                  value={newConnection.name}
                  onChange={(e) => setNewConnection({ ...newConnection, name: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="serverUrl">Server URL</Label>
                <Input
                  id="serverUrl"
                  placeholder="https://epo.company.com"
                  value={newConnection.serverUrl}
                  onChange={(e) => setNewConnection({ ...newConnection, serverUrl: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="port">Port</Label>
                <Input
                  id="port"
                  placeholder="8443"
                  value={newConnection.port}
                  onChange={(e) => setNewConnection({ ...newConnection, port: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  placeholder="admin"
                  value={newConnection.username}
                  onChange={(e) => setNewConnection({ ...newConnection, username: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Password"
                  value={newConnection.password}
                  onChange={(e) => setNewConnection({ ...newConnection, password: e.target.value })}
                />
              </div>
              <div className="flex space-x-2">
                <Button onClick={handleAddConnection} className="flex-1">
                  Add Connection
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setShowAddConnection(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};
