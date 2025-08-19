import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { 
  Server, 
  Shield, 
  CheckCircle, 
  AlertCircle, 
  Copy, 
  ExternalLink,
  Settings,
  HelpCircle,
  Link,
  Database,
  Save,
  Edit,
  RefreshCw
} from "lucide-react";
import { toast } from "sonner";

export const AdminEPOIntegration = () => {
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'testing'>('disconnected');
  const [isEditing, setIsEditing] = useState(false);
  const [epoConfig, setEpoConfig] = useState({
    serverUrl: 'https://103-98-212-249.cloud-xip.com:8443',
    serverName: 'trellixepo2025',
    publicIP: '103.98.212.249',
    hostname: '103-98-212-249.cloud-xip.com',
    username: '',
    password: '',
    certificatePath: '/etc/ssl/certs/epo-cert.pem',
    apiEndpoint: '/remote/core.executeTask'
  });
  const [apiSettings, setApiSettings] = useState({
    autoSync: true,
    syncInterval: 15,
    retryAttempts: 3,
    timeout: 30,
    enableLogging: true,
    apiKeys: {
      primaryKey: '',
      secondaryKey: ''
    },
    webhookUrl: '',
    customHeaders: ''
  });

  const handleTestConnection = async () => {
    setConnectionStatus('testing');
    
    // Simulate connection test
    setTimeout(() => {
      if (epoConfig.serverUrl && epoConfig.username && epoConfig.password) {
        setConnectionStatus('connected');
        toast.success("Successfully connected to Trellix EPO!");
      } else {
        setConnectionStatus('disconnected');
        toast.error("Connection failed. Please check your credentials.");
      }
    }, 2000);
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  const handleSaveConfiguration = () => {
    // Validate required fields
    if (!epoConfig.serverUrl || !epoConfig.username || !epoConfig.password) {
      toast.error("Please fill in all required fields before saving.");
      return;
    }

    // Save configuration logic here
    console.log('Saving EPO configuration:', epoConfig);
    toast.success("EPO configuration saved successfully!");
  };

  const handleSaveApiSettings = () => {
    // Validate API settings
    if (apiSettings.apiKeys.primaryKey && apiSettings.apiKeys.primaryKey.length < 10) {
      toast.error("API key must be at least 10 characters long.");
      return;
    }

    // Save API settings logic here
    console.log('Saving API settings:', apiSettings);
    toast.success("API settings saved successfully!");
  };

  const getConnectionBadge = () => {
    switch (connectionStatus) {
      case 'connected':
        return <Badge variant="default" className="flex items-center gap-1">
          <CheckCircle className="h-3 w-3" />
          Connected
        </Badge>;
      case 'testing':
        return <Badge variant="secondary" className="flex items-center gap-1">
          <Settings className="h-3 w-3 animate-spin" />
          Testing...
        </Badge>;
      default:
        return <Badge variant="destructive" className="flex items-center gap-1">
          <AlertCircle className="h-3 w-3" />
          Disconnected
        </Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Trellix EPO Integration</h2>
          <p className="text-muted-foreground">Configure and manage your Trellix ePO server connection</p>
        </div>
        {getConnectionBadge()}
      </div>

      <Tabs defaultValue="setup" className="space-y-6">
        <TabsList>
          <TabsTrigger value="setup">Setup & Configuration</TabsTrigger>
          <TabsTrigger value="templates">Configuration Templates</TabsTrigger>
          <TabsTrigger value="troubleshooting">Troubleshooting</TabsTrigger>
          <TabsTrigger value="api">API Documentation</TabsTrigger>
        </TabsList>

        <TabsContent value="setup" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Server className="h-5 w-5" />
                EPO Server Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="server-name">EPO Server Name</Label>
                  <Input
                    id="server-name"
                    placeholder="trellixepo2025"
                    value={epoConfig.serverName}
                    onChange={(e) => setEpoConfig({ ...epoConfig, serverName: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="public-ip">Public Internet IP (WAN)</Label>
                  <Input
                    id="public-ip"
                    placeholder="103.98.212.249"
                    value={epoConfig.publicIP}
                    onChange={(e) => setEpoConfig({ ...epoConfig, publicIP: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="hostname">Hostname</Label>
                  <Input
                    id="hostname"
                    placeholder="103-98-212-249.cloud-xip.com"
                    value={epoConfig.hostname}
                    onChange={(e) => setEpoConfig({ ...epoConfig, hostname: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="server-url">EPO Server URL</Label>
                  <Input
                    id="server-url"
                    placeholder="https://103-98-212-249.cloud-xip.com:8443"
                    value={epoConfig.serverUrl}
                    onChange={(e) => setEpoConfig({ ...epoConfig, serverUrl: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Include protocol (https://) and port number (typically 8443)
                  </p>
                </div>
                <div>
                  <Label htmlFor="api-endpoint">API Endpoint</Label>
                  <Input
                    id="api-endpoint"
                    placeholder="/remote/core.executeTask"
                    value={epoConfig.apiEndpoint}
                    onChange={(e) => setEpoConfig({ ...epoConfig, apiEndpoint: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="username">Admin Username</Label>
                  <Input
                    id="username"
                    placeholder="admin"
                    value={epoConfig.username}
                    onChange={(e) => setEpoConfig({ ...epoConfig, username: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="password">Admin Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={epoConfig.password}
                    onChange={(e) => setEpoConfig({ ...epoConfig, password: e.target.value })}
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="cert-path">SSL Certificate Path (Optional)</Label>
                <Input
                  id="cert-path"
                  placeholder="/etc/ssl/certs/epo-cert.pem"
                  value={epoConfig.certificatePath}
                  onChange={(e) => setEpoConfig({ ...epoConfig, certificatePath: e.target.value })}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Leave empty to use system default SSL verification
                </p>
              </div>

              <div className="flex space-x-2 pt-4">
                <Button onClick={handleTestConnection} disabled={connectionStatus === 'testing'}>
                  <Shield className="h-4 w-4 mr-2" />
                  Test Connection
                </Button>
                <Button 
                  variant="outline" 
                  disabled={connectionStatus !== 'connected'}
                  onClick={handleSaveConfiguration}
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save Configuration
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setIsEditing(!isEditing)}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  {isEditing ? 'View Mode' : 'Edit Mode'}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Step-by-Step Integration Guide</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center text-xs text-primary-foreground font-medium">1</div>
                  <div>
                    <h4 className="font-medium">Create EPO Administrator Account</h4>
                    <p className="text-sm text-muted-foreground">
                      Create a dedicated service account in your EPO console with administrator privileges for API access.
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center text-xs text-primary-foreground font-medium">2</div>
                  <div>
                    <h4 className="font-medium">Configure API Access</h4>
                    <p className="text-sm text-muted-foreground">
                      Enable remote API access in EPO settings and note down the server URL and port (usually 8443).
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center text-xs text-primary-foreground font-medium">3</div>
                  <div>
                    <h4 className="font-medium">SSL Certificate Setup</h4>
                    <p className="text-sm text-muted-foreground">
                      If using self-signed certificates, add the EPO certificate to your trusted certificate store.
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center text-xs text-primary-foreground font-medium">4</div>
                  <div>
                    <h4 className="font-medium">Test & Validate</h4>
                    <p className="text-sm text-muted-foreground">
                      Use the connection test above to validate your configuration before saving.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Standard Enterprise Setup
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="bg-muted p-3 rounded font-mono text-sm">
                  <div className="flex justify-between items-center">
                    <span>Server URL:</span>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => copyToClipboard('https://epo.company.com:8443', 'Server URL')}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                  <div>https://epo.company.com:8443</div>
                  <div className="mt-2">API Endpoint: /remote/core.executeTask</div>
                  <div>SSL Port: 8443</div>
                  <div>HTTP Port: 8080 (not recommended)</div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Standard configuration for most enterprise deployments with domain-joined EPO server.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  High Security Setup
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="bg-muted p-3 rounded font-mono text-sm">
                  <div className="flex justify-between items-center">
                    <span>Configuration:</span>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => copyToClipboard('Certificate-based auth required', 'Security Config')}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                  <div>• Certificate-based authentication</div>
                  <div>• Custom SSL certificate required</div>
                  <div>• IP allowlist configured</div>
                  <div>• API rate limiting enabled</div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Enhanced security configuration for highly regulated environments.
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="troubleshooting" className="space-y-6">
          <div className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Common Connection Issues</strong>
                <div className="mt-2 space-y-2">
                  <div>• <strong>SSL Certificate Error:</strong> Add EPO certificate to trusted store or disable SSL verification for testing</div>
                  <div>• <strong>Port 8443 Blocked:</strong> Check firewall rules and ensure port 8443 is accessible</div>
                  <div>• <strong>Authentication Failed:</strong> Verify admin credentials have API access permissions</div>
                  <div>• <strong>Timeout Issues:</strong> Check network connectivity and EPO service status</div>
                </div>
              </AlertDescription>
            </Alert>

            <Card>
              <CardHeader>
                <CardTitle>Diagnostic Commands</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label>Test EPO Server Connectivity</Label>
                  <div className="bg-muted p-3 rounded font-mono text-sm flex justify-between items-center">
                    <span>telnet epo.company.com 8443</span>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => copyToClipboard('telnet epo.company.com 8443', 'Command')}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                <div>
                  <Label>Test HTTPS Connection</Label>
                  <div className="bg-muted p-3 rounded font-mono text-sm flex justify-between items-center">
                    <span>curl -k https://epo.company.com:8443/remote/core.executeTask</span>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => copyToClipboard('curl -k https://epo.company.com:8443/remote/core.executeTask', 'Command')}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="api" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>API Configuration & Settings</span>
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Sync EPO
                  </Button>
                  <Button variant="outline" size="sm">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Documentation
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* API Settings */}
              <div className="space-y-4">
                <h4 className="font-medium">Sync & Integration Settings</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="auto-sync">Auto Sync with EPO</Label>
                      <p className="text-xs text-muted-foreground">Automatically sync data every interval</p>
                    </div>
                    <Switch
                      id="auto-sync"
                      checked={apiSettings.autoSync}
                      onCheckedChange={(checked) => setApiSettings({ ...apiSettings, autoSync: checked })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="sync-interval">Sync Interval (minutes)</Label>
                    <Input
                      id="sync-interval"
                      type="number"
                      min="5"
                      max="1440"
                      value={apiSettings.syncInterval}
                      onChange={(e) => setApiSettings({ ...apiSettings, syncInterval: parseInt(e.target.value) })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="retry-attempts">Retry Attempts</Label>
                    <Input
                      id="retry-attempts"
                      type="number"
                      min="1"
                      max="10"
                      value={apiSettings.retryAttempts}
                      onChange={(e) => setApiSettings({ ...apiSettings, retryAttempts: parseInt(e.target.value) })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="timeout">Timeout (seconds)</Label>
                    <Input
                      id="timeout"
                      type="number"
                      min="10"
                      max="300"
                      value={apiSettings.timeout}
                      onChange={(e) => setApiSettings({ ...apiSettings, timeout: parseInt(e.target.value) })}
                    />
                  </div>
                </div>
              </div>

              {/* API Keys */}
              <div className="space-y-4">
                <h4 className="font-medium">API Authentication</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="primary-key">Primary API Key</Label>
                    <Input
                      id="primary-key"
                      type="password"
                      placeholder="Enter primary API key"
                      value={apiSettings.apiKeys.primaryKey}
                      onChange={(e) => setApiSettings({
                        ...apiSettings,
                        apiKeys: { ...apiSettings.apiKeys, primaryKey: e.target.value }
                      })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="secondary-key">Secondary API Key (Backup)</Label>
                    <Input
                      id="secondary-key"
                      type="password"
                      placeholder="Enter secondary API key"
                      value={apiSettings.apiKeys.secondaryKey}
                      onChange={(e) => setApiSettings({
                        ...apiSettings,
                        apiKeys: { ...apiSettings.apiKeys, secondaryKey: e.target.value }
                      })}
                    />
                  </div>
                </div>
              </div>

              {/* Webhook Configuration */}
              <div className="space-y-4">
                <h4 className="font-medium">Webhook & Custom Settings</h4>
                <div>
                  <Label htmlFor="webhook-url">Webhook URL</Label>
                  <Input
                    id="webhook-url"
                    placeholder="https://your-app.com/webhook/epo"
                    value={apiSettings.webhookUrl}
                    onChange={(e) => setApiSettings({ ...apiSettings, webhookUrl: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    URL to receive EPO event notifications
                  </p>
                </div>
                <div>
                  <Label htmlFor="custom-headers">Custom Headers (JSON)</Label>
                  <Textarea
                    id="custom-headers"
                    placeholder='{"X-Custom-Header": "value", "Authorization": "Bearer token"}'
                    value={apiSettings.customHeaders}
                    onChange={(e) => setApiSettings({ ...apiSettings, customHeaders: e.target.value })}
                    rows={3}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={apiSettings.enableLogging}
                    onCheckedChange={(checked) => setApiSettings({ ...apiSettings, enableLogging: checked })}
                  />
                  <Label>Enable API Logging</Label>
                </div>
                <Button onClick={handleSaveApiSettings}>
                  <Save className="h-4 w-4 mr-2" />
                  Save API Settings
                </Button>
              </div>

              {/* API Reference */}
              <div className="border-t pt-6">
                <h4 className="font-medium mb-2">EPO API Endpoints</h4>
                <div className="space-y-2">
                  <div className="bg-muted p-3 rounded">
                    <div className="font-mono text-sm">POST /remote/core.executeTask</div>
                    <div className="text-xs text-muted-foreground">Execute management tasks on EPO server</div>
                  </div>
                  <div className="bg-muted p-3 rounded">
                    <div className="font-mono text-sm">GET /remote/core.listSystems</div>
                    <div className="text-xs text-muted-foreground">Retrieve list of managed systems</div>
                  </div>
                  <div className="bg-muted p-3 rounded">
                    <div className="font-mono text-sm">POST /remote/core.createGroup</div>
                    <div className="text-xs text-muted-foreground">Create new system groups</div>
                  </div>
                  <div className="bg-muted p-3 rounded">
                    <div className="font-mono text-sm">POST /remote/core.assignAgentTask</div>
                    <div className="text-xs text-muted-foreground">Assign agent deployment tasks to groups</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};