import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
  RefreshCw,
  Terminal,
  Play,
  Loader2,
  AlertTriangle
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

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
  const [apiExplorer, setApiExplorer] = useState({
    endpoint: 'core.help',
    params: '',
    response: '',
    loading: false
  });

  const handleTestConnection = async () => {
    setConnectionStatus('testing');
    
    try {
      // Validate required fields
      if (!epoConfig.serverUrl || !epoConfig.username || !epoConfig.password) {
        setConnectionStatus('disconnected');
        toast.error("Please fill in all required fields (Server URL, Username, Password)");
        return;
      }

      // Update the server URL if it's using the old format
      let serverUrl = epoConfig.serverUrl;
      if (serverUrl === 'https://103-98-212-249.cloud-xip.com:8443') {
        serverUrl = 'https://trellixepo2025:8443';
        setEpoConfig({ ...epoConfig, serverUrl });
        toast.info("Server URL updated to https://trellixepo2025:8443");
      }

      // Test connection using EPO integration function
      const { data, error } = await supabase.functions.invoke('epo-integration', {
        body: {
          action: 'test-connection',
          serverUrl: serverUrl,
          username: epoConfig.username,
          password: epoConfig.password
        }
      });

      if (error) {
        setConnectionStatus('disconnected');
        toast.error(`Connection test failed: ${error.message}`);
      } else if (data?.success) {
        setConnectionStatus('connected');
        toast.success("Successfully connected to Trellix EPO server!");
      } else {
        setConnectionStatus('disconnected');
        
        // Enhanced error messaging with suggestions
        let errorMessage = data?.error || "Connection test failed";
        const suggestions = data?.suggestions || [];
        
        if (data?.type === 'network_error') {
          errorMessage = `Network connectivity issue: ${data.error}`;
          if (suggestions.length > 0) {
            errorMessage += `\n\nSuggestions:\n${suggestions.map((s: string) => `• ${s}`).join('\n')}`;
          }
        }
        
        toast.error(errorMessage);
      }
    } catch (error: any) {
      setConnectionStatus('disconnected');
      console.error('EPO connection test error:', error);
      
      let errorMessage = "Connection test failed";
      
      // Provide specific guidance for common issues
      if (epoConfig.serverUrl.includes('trellixepo2025:8443')) {
        errorMessage = "Cannot reach trellixepo2025:8443. This appears to be a private server address. Consider: 1) Using the public IP address, 2) Setting up port forwarding, 3) Using a VPN, or 4) Making the server publicly accessible.";
      } else if (error.message?.includes('fetch') || error.message?.includes('network')) {
        errorMessage = "Network error: Unable to reach EPO server. Please check the server URL and network connectivity.";
      } else {
        errorMessage = `Connection test failed: ${error.message || 'Unknown error'}`;
      }
      
      toast.error(errorMessage);
    }
  };

  const handleApiExplorer = async () => {
    setApiExplorer(prev => ({ ...prev, loading: true, response: '' }));
    
    try {
      let params = {};
      if (apiExplorer.params.trim()) {
        try {
          params = JSON.parse(apiExplorer.params);
        } catch {
          // Try as key=value pairs
          const pairs = apiExplorer.params.split('\n').filter(line => line.includes('='));
          params = pairs.reduce((acc: any, line) => {
            const [key, ...valueParts] = line.split('=');
            acc[key.trim()] = valueParts.join('=').trim();
            return acc;
          }, {});
        }
      }

      const { data, error } = await supabase.functions.invoke('epo-integration', {
        body: {
          action: 'proxy',
          endpoint: apiExplorer.endpoint,
          params: params,
          useFormData: true
        }
      });

      if (error) {
        throw new Error(error.message);
      }

      setApiExplorer(prev => ({
        ...prev,
        response: JSON.stringify(data, null, 2)
      }));

      if (data?.success) {
        toast.success('API call successful!');
      } else {
        toast.warning(`API returned status: ${data?.status}`);
      }
    } catch (error: any) {
      setApiExplorer(prev => ({
        ...prev,
        response: `Error: ${error.message}`
      }));
      toast.error(`API call failed: ${error.message}`);
    } finally {
      setApiExplorer(prev => ({ ...prev, loading: false }));
    }
  };

  const copyToClipboard = (text: string, label?: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label || 'Text'} copied to clipboard`);
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
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="setup">Setup & Configuration</TabsTrigger>
          <TabsTrigger value="templates">Configuration Templates</TabsTrigger>
          <TabsTrigger value="explorer">API Explorer</TabsTrigger>
          <TabsTrigger value="troubleshooting">Troubleshooting</TabsTrigger>
          <TabsTrigger value="api">API Documentation</TabsTrigger>
        </TabsList>

        <TabsContent value="setup" className="space-y-6">
          {/* Connectivity Prerequisites Banner */}
          <Card className="border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-orange-800 dark:text-orange-200">
                <AlertTriangle className="h-5 w-5" />
                Connectivity Prerequisites
              </CardTitle>
              <CardDescription className="text-orange-700 dark:text-orange-300">
                <strong>Important:</strong> Your EPO server must be accessible from the internet for this integration to work.
                <br />
                <br />
                <strong>Common solutions:</strong>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>Use <strong>Cloudflare Tunnel</strong> to securely expose your EPO server</li>
                  <li>Configure your firewall to allow inbound HTTPS traffic on port 8443</li>
                  <li>Ensure your EPO server has a valid SSL certificate (not self-signed)</li>
                  <li>Use a public DNS name instead of internal hostnames like "trellixepo2025"</li>
                </ul>
              </CardDescription>
            </CardHeader>
          </Card>

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

        <TabsContent value="explorer" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Terminal className="h-5 w-5" />
                EPO API Explorer
              </CardTitle>
              <CardDescription>
                Test EPO API endpoints directly with custom parameters
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="endpoint">API Endpoint</Label>
                  <Input
                    id="endpoint"
                    value={apiExplorer.endpoint}
                    onChange={(e) => setApiExplorer(prev => ({ ...prev, endpoint: e.target.value }))}
                    placeholder="core.help"
                    className="font-mono"
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    Common endpoints: core.help, core.listUsers, system.findSystems
                  </p>
                </div>
                <div>
                  <Label htmlFor="params">Parameters</Label>
                  <Textarea
                    id="params"
                    value={apiExplorer.params}
                    onChange={(e) => setApiExplorer(prev => ({ ...prev, params: e.target.value }))}
                    placeholder={`JSON format:\n{"param1": "value1"}\n\nOr key=value pairs:\nparam1=value1\nparam2=value2`}
                    className="font-mono h-20"
                  />
                </div>
              </div>
              <Button 
                onClick={handleApiExplorer}
                disabled={apiExplorer.loading || !apiExplorer.endpoint}
                className="w-full"
              >
                {apiExplorer.loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Executing API Call...
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    Execute API Call
                  </>
                )}
              </Button>
              {apiExplorer.response && (
                <div>
                  <Label>Response</Label>
                  <Textarea
                    value={apiExplorer.response}
                    readOnly
                    className="font-mono h-40 mt-2"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(apiExplorer.response)}
                    className="mt-2"
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copy Response
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="troubleshooting" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HelpCircle className="h-5 w-5" />
                Common Connection Issues
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Private Server Address Issue:</strong> If your EPO server uses a private hostname like "trellixepo2025:8443", 
                  it won't be accessible from our cloud service. Use the public IP address or set up proper DNS resolution.
                </AlertDescription>
              </Alert>
              
              <div className="space-y-3">
                <h4 className="font-medium">Quick Diagnostics</h4>
                <div className="bg-muted p-3 rounded font-mono text-sm">
                  <div>Test connectivity from command line:</div>
                  <div className="mt-2">
                    <code>telnet 103.98.212.249 8443</code>
                  </div>
                  <div className="mt-2">
                    <code>curl -k https://103.98.212.249:8443/remote/core.help</code>
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
                <Settings className="h-5 w-5" />
                API Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="auto-sync">Auto-sync enabled</Label>
                  <Switch
                    id="auto-sync"
                    checked={apiSettings.autoSync}
                    onCheckedChange={(checked) => setApiSettings({ ...apiSettings, autoSync: checked })}
                  />
                </div>
                <div>
                  <Label htmlFor="sync-interval">Sync interval (minutes)</Label>
                  <Input
                    id="sync-interval"
                    type="number"
                    value={apiSettings.syncInterval}
                    onChange={(e) => setApiSettings({ ...apiSettings, syncInterval: parseInt(e.target.value) })}
                  />
                </div>
              </div>
              <Button onClick={handleSaveApiSettings} className="w-full">
                <Save className="h-4 w-4 mr-2" />
                Save API Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
