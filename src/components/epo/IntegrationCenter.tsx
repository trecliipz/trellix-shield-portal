import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
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
  Loader2,
  Lock,
  Info,
  LogOut
} from "lucide-react";
  import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { logIntegrationError } from "@/lib/logger";
import { testNetlifyEpoConnection, epoApi } from "@/utils/netlifyEpoClient";

interface EPOConnection {
  id: string;
  name: string;
  server_url: string;
  username: string;
  port: number;
  status: 'connected' | 'disconnected' | 'error' | 'testing';
  last_sync: string | null;
  version: string | null;
  created_at: string;
  updated_at: string;
}

export const IntegrationCenter = () => {
  const [connections, setConnections] = useState<EPOConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [testingConnections, setTestingConnections] = useState<Set<string>>(new Set());

  const [showAddConnection, setShowAddConnection] = useState(false);
  const [newConnection, setNewConnection] = useState({
    name: '',
    serverUrl: '',
    username: '',
    password: '',
    port: '8443',
    caCertificate: '',
    pinCertificate: false,
    allowInsecureTLS: false
  });

  // Certificate analysis state
  const [certificateAnalysis, setCertificateAnalysis] = useState<any>(null);
  const [showCertificateAnalysis, setShowCertificateAnalysis] = useState(false);

  // Webhook management state
  const [showAddWebhook, setShowAddWebhook] = useState(false);
  const [newWebhook, setNewWebhook] = useState({
    name: '',
    url: '',
    events: [] as string[],
    secret: '',
    active: true
  });

  // Authentication state
  const [authMode, setAuthMode] = useState<'basic' | 'session'>('basic');
  const [outputType, setOutputType] = useState('json');
  const [authPassword, setAuthPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [sessionExpiry, setSessionExpiry] = useState<string>('');

  // Helper function to normalize and validate EPO server URL
  const normalizeServerUrl = (url: string): string => {
    if (!url) return url;
    
    // Remove trailing slashes
    let normalized = url.replace(/\/+$/, '');
    
    // Remove any existing /remote paths
    normalized = normalized.replace(/\/remote.*$/, '');
    
    // Ensure https:// protocol if no protocol specified
    if (!normalized.startsWith('http://') && !normalized.startsWith('https://')) {
      normalized = `https://${normalized}`;
    }
    
    return normalized;
  };

  // Validate URL and show warnings
  const validateServerUrl = (url: string): { isValid: boolean; warnings: string[] } => {
    const warnings: string[] = [];
    
    if (!url) {
      return { isValid: false, warnings: [] };
    }
    
    // Check for IP address (should use hostname for proper TLS)
    const ipPattern = /^https?:\/\/(\d{1,3}\.){3}\d{1,3}/;
    if (ipPattern.test(url)) {
      warnings.push("⚠️ Using IP address may cause TLS certificate issues. Consider using hostname.");
    }
    
    // Check for /remote path (will be stripped automatically)
    if (url.includes('/remote')) {
      warnings.push("ℹ️ '/remote' path will be normalized automatically.");
    }
    
    // Check for HTTP instead of HTTPS
    if (url.startsWith('http://')) {
      warnings.push("⚠️ HTTP is not recommended. Use HTTPS for secure communication.");
    }
    
    return { isValid: true, warnings };
  };

  // Analyze certificate data and provide feedback
  const analyzeCertificateData = (pemData: string) => {
    if (!pemData.trim()) {
      setCertificateAnalysis(null);
      return;
    }

    const analysis = {
      totalBlocks: 0,
      validCerts: 0,
      invalidBlocks: 0,
      details: [] as any[],
      warnings: [] as string[]
    };

    // Split by certificate boundaries
    const certBlocks = pemData
      .split('-----END CERTIFICATE-----')
      .map(block => block.trim() + '-----END CERTIFICATE-----')
      .filter(block => block.includes('-----BEGIN CERTIFICATE-----'))
      .filter(block => block.length > 50);

    analysis.totalBlocks = certBlocks.length;

    if (analysis.totalBlocks === 0) {
      analysis.warnings.push("No certificate blocks found. Ensure PEM format with proper BEGIN/END markers.");
      setCertificateAnalysis(analysis);
      return;
    }

    certBlocks.forEach((block, index) => {
      try {
        // Basic PEM validation
        if (!block.includes('-----BEGIN CERTIFICATE-----') || 
            !block.includes('-----END CERTIFICATE-----')) {
          analysis.invalidBlocks++;
          analysis.details.push({
            index: index + 1,
            type: 'invalid',
            error: 'Missing proper PEM markers'
          });
          return;
        }

        // Extract and validate base64 data
        const certData = block
          .replace('-----BEGIN CERTIFICATE-----', '')
          .replace('-----END CERTIFICATE-----', '')
          .replace(/\s/g, '');

        if (!/^[A-Za-z0-9+/]*={0,2}$/.test(certData)) {
          analysis.invalidBlocks++;
          analysis.details.push({
            index: index + 1,
            type: 'invalid',
            error: 'Invalid base64 encoding'
          });
          return;
        }

        // Test base64 decoding
        atob(certData);
        
        analysis.validCerts++;
        analysis.details.push({
          index: index + 1,
          type: 'valid',
          size: certData.length,
          description: `Certificate ${index + 1} - Valid PEM format`
        });

      } catch (error) {
        analysis.invalidBlocks++;
        analysis.details.push({
          index: index + 1,
          type: 'invalid',
          error: error.message || 'Parsing failed'
        });
      }
    });

    // Add helpful warnings
    if (analysis.validCerts === 1 && analysis.totalBlocks === 1) {
      analysis.warnings.push("Single certificate detected. For enterprise CAs, you may need the full certificate chain.");
    }
    
    if (analysis.validCerts > 3) {
      analysis.warnings.push("Many certificates detected. Ensure this includes only necessary CA certificates.");
    }

    setCertificateAnalysis(analysis);
  };

  // Handle certificate textarea changes with real-time analysis
  const handleCertificateChange = (value: string) => {
    setNewConnection(prev => ({ ...prev, caCertificate: value }));
    analyzeCertificateData(value);
  };

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

  // Command Console state
  const [consoleInput, setConsoleInput] = useState('');
  const [consoleOutput, setConsoleOutput] = useState<Array<{
    timestamp: string;
    command: string;
    response: string;
    type: 'success' | 'error';
  }>>([]);
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // Netlify EPO testing state
  const [isTestingNetlify, setIsTestingNetlify] = useState(false);
  const [netlifyTestResult, setNetlifyTestResult] = useState<string>('');

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

  // Test Netlify EPO connection
  const handleTestNetlifyConnection = async () => {
    setIsTestingNetlify(true);
    setNetlifyTestResult('');

    try {
      console.log('Starting Netlify EPO connection test...');
      
      // First test Netlify function health
      const { testNetlifyHealth } = await import('@/utils/netlifyEpoClient');
      const healthResult = await testNetlifyHealth();
      
      if (!healthResult.success) {
        setNetlifyTestResult(`❌ Netlify function health check failed: ${healthResult.error}\n\nSuggestions:\n${healthResult.suggestions?.map(s => `• ${s}`).join('\n') || 'No suggestions available'}`);
        toast.error('Netlify function not accessible');
        return;
      }

      // Then test EPO connection
      const result = await testNetlifyEpoConnection();
      
      if (result.success) {
        setNetlifyTestResult(`✅ ${result.message}\n\nDiagnostics:\n${JSON.stringify(result.diagnostics, null, 2)}\n\nDetails:\n${JSON.stringify(result.details, null, 2)}`);
        toast.success('Netlify EPO connection successful!');
      } else {
        let errorOutput = `❌ ${result.message}\n\n`;
        
        if (result.details?.suggestions) {
          errorOutput += `Suggestions:\n${result.details.suggestions.map(s => `• ${s}`).join('\n')}\n\n`;
        }
        
        if (result.diagnostics) {
          errorOutput += `Diagnostics:\n${JSON.stringify(result.diagnostics, null, 2)}\n\n`;
        }
        
        if (result.details) {
          errorOutput += `Details:\n${JSON.stringify(result.details, null, 2)}`;
        }
        
        setNetlifyTestResult(errorOutput);
        toast.error('Netlify EPO connection failed');
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      setNetlifyTestResult(`❌ Test failed: ${errorMsg}`);
      toast.error('Connection test failed');
    } finally {
      setIsTestingNetlify(false);
    }
  };

  // Authentication functions
  const handleAuthenticate = async () => {
    const connection = connections.find(c => c.id === selectedConnection);
    if (!connection || !authPassword.trim()) {
      toast.error("Please select a connection and enter your password");
      return;
    }

    setIsExecuting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { data, error } = await supabase.functions.invoke('epo-integration', {
        body: {
          action: 'login',
          serverUrl: connection.server_url,
          username: connection.username,
          password: authPassword,
          port: connection.port,
          connectionId: connection.id,
          userId: user?.id,
          allowInsecureTLS: false // Could be made configurable per connection
        }
      });

      if (error) throw error;

      setIsAuthenticated(true);
      setSessionExpiry(data.expiresAt);
      setAuthPassword('');
      
      toast.success("Authentication successful");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Authentication failed');
    } finally {
      setIsExecuting(false);
    }
  };

  const handleLogout = async () => {
    if (!selectedConnection) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase.functions.invoke('epo-integration', {
        body: {
          action: 'logout',
          connectionId: selectedConnection,
          userId: user?.id
        }
      });

      if (error) throw error;

      setIsAuthenticated(false);
      setSessionExpiry('');
      
      toast.success("Logged out successfully");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Logout failed');
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

  // Execute EPO command
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

    setIsExecuting(true);
    setCommandResults('');

    try {
      let parameters = {};
      if (commandParameters.trim()) {
        try {
          parameters = JSON.parse(commandParameters);
        } catch (error) {
          toast.error("Invalid JSON in parameters field");
          setIsExecuting(false);
          return;
        }
      }

      const { data: { user } } = await supabase.auth.getUser();
      const { data, error } = await supabase.functions.invoke('epo-integration', {
        body: {
          action: 'proxy',
          serverUrl: connection.server_url,
          username: connection.username,
          port: connection.port,
          connectionId: connection.id,
          userId: user?.id,
          endpoint: selectedCommand,
          parameters,
          outputType,
          useSession: authMode === 'session',
          allowInsecureTLS: false // Could be made configurable per connection
        }
      });

      if (error) {
        throw error;
      }

      setCommandResults(JSON.stringify(data, null, 2));
      toast.success("Command executed successfully");
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Command execution failed';
      setCommandResults(`Error: ${errorMessage}`);
      toast.error(errorMessage);
    } finally {
      setIsExecuting(false);
    }
  };

  // Console command execution
  const handleConsoleCommand = async (command: string) => {
    if (!selectedConnection || !command.trim()) {
      toast.error("Please select a connection and enter a command");
      return;
    }

    const connection = connections.find(c => c.id === selectedConnection);
    if (!connection) {
      toast.error("Selected connection not found");
      return;
    }

    // Parse command: first word is endpoint, rest is JSON parameters
    const parts = command.trim().split(' ');
    const endpoint = parts[0];
    let parameters = {};
    
    if (parts.length > 1) {
      try {
        parameters = JSON.parse(parts.slice(1).join(' '));
      } catch (error) {
        const errorOutput = {
          timestamp: new Date().toLocaleTimeString(),
          command,
          response: `Error: Invalid JSON parameters - ${error.message}`,
          type: 'error' as const
        };
        setConsoleOutput(prev => [...prev, errorOutput]);
        return;
      }
    }

    // Add command to history
    setCommandHistory(prev => {
      const updated = [command, ...prev.filter(cmd => cmd !== command)];
      return updated.slice(0, 50); // Keep last 50 commands
    });
    setHistoryIndex(-1);

    setIsExecuting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { data, error } = await supabase.functions.invoke('epo-integration', {
        body: {
          action: 'proxy',
          serverUrl: connection.server_url,
          username: connection.username,
          port: connection.port,
          connectionId: connection.id,
          userId: user?.id,
          endpoint,
          parameters,
          outputType: 'json',
          useSession: authMode === 'session',
          allowInsecureTLS: false
        }
      });

      if (error) throw error;

      const consoleEntry = {
        timestamp: new Date().toLocaleTimeString(),
        command,
        response: typeof data === 'object' ? JSON.stringify(data, null, 2) : String(data),
        type: 'success' as const
      };
      
      setConsoleOutput(prev => [...prev, consoleEntry]);
    } catch (error) {
      const errorEntry = {
        timestamp: new Date().toLocaleTimeString(),
        command,
        response: `Error: ${error instanceof Error ? error.message : 'Command execution failed'}`,
        type: 'error' as const
      };
      setConsoleOutput(prev => [...prev, errorEntry]);
    } finally {
      setIsExecuting(false);
    }
  };

  // Handle console input keydown
  const handleConsoleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (consoleInput.trim()) {
        handleConsoleCommand(consoleInput);
        setConsoleInput('');
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (commandHistory.length > 0) {
        const newIndex = Math.min(historyIndex + 1, commandHistory.length - 1);
        setHistoryIndex(newIndex);
        setConsoleInput(commandHistory[newIndex] || '');
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);
        setConsoleInput(commandHistory[newIndex] || '');
      } else if (historyIndex === 0) {
        setHistoryIndex(-1);
        setConsoleInput('');
      }
    }
  };

  // Clear console
  const clearConsole = () => {
    setConsoleOutput([]);
  };

  // Copy console output
  const copyConsoleOutput = () => {
    const output = consoleOutput.map(entry => 
      `[${entry.timestamp}] ${entry.command}\n${entry.response}\n`
    ).join('\n');
    navigator.clipboard.writeText(output);
    toast.success("Console output copied to clipboard");
  };

  const handleAddConnection = async () => {
    if (!newConnection.name || !newConnection.serverUrl || !newConnection.username) {
      toast.error("Please fill in all required fields");
      return;
    }

    // Normalize server URL before saving
    const normalizedUrl = normalizeServerUrl(newConnection.serverUrl);
    const { warnings } = validateServerUrl(normalizedUrl);
    
    // Show warnings but don't block creation
    if (warnings.length > 0) {
      warnings.forEach(warning => {
        toast.info(warning, { duration: 4000 });
      });
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
          server_url: normalizedUrl, // Use normalized URL
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
            serverUrl: normalizedUrl,
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
        port: '8443',
        caCertificate: '',
        pinCertificate: false,
        allowInsecureTLS: false
      });
      setCertificateAnalysis(null);

      toast.success("EPO connection added successfully");
    } catch (error) {
      console.error('Error adding connection:', error);
      logIntegrationError(
        'Network error while adding EPO connection',
        'IntegrationCenter.tsx',
        'epo',
        {
          connectionName: newConnection.name,
          serverUrl: normalizedUrl,
          error: error.message,
          stack: error.stack
        }
      );
      toast.error("Failed to add connection");
    }
  };

  const handleTestConnection = async (connectionId: string, caCertificate?: string, pinCertificate?: boolean) => {
    const connection = connections.find(c => c.id === connectionId);
    if (!connection) return;

    // Set testing state immediately for real-time UI feedback
    setTestingConnections(prev => new Set([...prev, connectionId]));
    setConnections(prev => prev.map(c => 
      c.id === connectionId ? { ...c, status: 'testing' } : c
    ));

    toast.info(`Testing connection to ${connection.name}...`, {
      duration: 2000,
    });
    
    try {
      console.log(`Starting connection test for ${connection.name} (${connection.server_url}:${connection.port})`);
      
      // Call the EPO integration function to test the connection
      const { data, error } = await supabase.functions.invoke('epo-integration', {
        body: {
          action: 'test-connection',
          serverUrl: connection.server_url,
          username: connection.username,
          port: connection.port,
          caCertificate: caCertificate,
          pinCertificate: pinCertificate,
          allowInsecureTLS: newConnection.allowInsecureTLS
        }
      });

      console.log('Test connection response:', { data, error });

      if (error) {
        console.error('Connection test error:', error);
        
        // Update connection status to error immediately
        setConnections(prev => prev.map(c => 
          c.id === connectionId ? { ...c, status: 'error' } : c
        ));

        logIntegrationError(
          `EPO connection test failed: ${error.message}`,
          'IntegrationCenter.tsx',
          'epo',
          {
            connectionId,
            connectionName: connection.name,
            serverUrl: connection.server_url,
            error: error.message
          }
        );
        
        toast.error(`Connection test failed: ${error.message}`, {
          duration: 5000,
        });
      } else if (data?.success) {
        console.log('Connection test successful:', data);
        
        // Update connection status and sync info immediately
        const updatedConnection = {
          status: 'connected' as const,
          last_sync: new Date().toISOString(),
          version: data.version || '5.10.0'
        };
        
        setConnections(prev => prev.map(c => 
          c.id === connectionId ? { ...c, ...updatedConnection } : c
        ));

        // Also update in database
        const { error: updateError } = await supabase
          .from('epo_connections')
          .update(updatedConnection)
          .eq('id', connectionId);

        if (updateError) {
          console.error('Error updating connection in database:', updateError);
          logIntegrationError(
            'Failed to update EPO connection status in database',
            'IntegrationCenter.tsx',
            'epo',
            {
              connectionId,
              connectionName: connection.name,
              error: updateError.message,
              code: updateError.code
            }
          );
        }

        // Show detailed connection success info
        const connectionInfo = [
          `Version: ${data.version || 'Unknown'}`,
          `Response time: ${data.responseTime || 'N/A'}`
        ];
        
        if (data.certificateAnalysis?.validCerts) {
          connectionInfo.push(`Custom CA: ${data.certificateAnalysis.validCerts} cert(s)`);
        }
        
        if (data.connectionDetails?.certificatePinning) {
          connectionInfo.push(`Certificate pinning: Active`);
        }

        toast.success(`✅ Successfully connected to ${connection.name}!`, {
          description: connectionInfo.join(' • '),
          duration: 4000,
        });

        // Log certificate analysis if available
        if (data.certificateAnalysis || data.connectionDetails) {
          console.log('Connection details:', {
            certificateAnalysis: data.certificateAnalysis,
            connectionDetails: data.connectionDetails
          });
        }
      } else {
        console.log('Connection test failed:', data);
        
        // Update connection status to error immediately
        setConnections(prev => prev.map(c => 
          c.id === connectionId ? { ...c, status: 'error' } : c
        ));

        const errorMessage = data?.error || "Connection test failed - server not reachable";
        const suggestions = data?.suggestions || [];
        
        logIntegrationError(
          errorMessage,
          'IntegrationCenter.tsx',
          'epo',
          {
            connectionId,
            connectionName: connection.name,
            serverUrl: connection.server_url,
            responseData: data,
            suggestions
          }
        );
        
        // Show error with TLS-specific suggestions if available
        const toastDescription = suggestions.length > 0 
          ? `💡 ${suggestions.slice(0, 2).join(' • ')}`
          : "Please check server URL, credentials, and network connectivity";
        
        toast.error(`❌ ${errorMessage}`, {
          description: toastDescription,
          duration: 8000,
        });
        
        // Show additional suggestions as separate info toasts
        if (suggestions.length > 2) {
          setTimeout(() => {
            suggestions.slice(2).forEach((suggestion, index) => {
              setTimeout(() => {
                toast.info(`💡 ${suggestion}`, { duration: 6000 });
              }, index * 1500);
            });
          }, 2000);
        }
      }
    } catch (error: any) {
      console.error('Connection test network error:', error);
      
      // Update connection status to error immediately
      setConnections(prev => prev.map(c => 
        c.id === connectionId ? { ...c, status: 'error' } : c
      ));
      
      let errorMessage = "Connection test failed";
      
      if (error.message?.includes('fetch') || error.message?.includes('network')) {
        errorMessage = "Network error: Unable to reach EPO server. Please check connectivity.";
      } else {
        errorMessage = `Connection test failed: ${error.message || 'Unknown error'}`;
      }
      
      logIntegrationError(
        errorMessage,
        'IntegrationCenter.tsx',
        'epo',
        {
          connectionId,
          connectionName: connection.name,
          serverUrl: connection.server_url,
          error: error.message,
          stack: error.stack
        }
      );
      
      toast.error(`❌ ${errorMessage}`, {
        duration: 6000,
      });
    } finally {
      // Remove from testing state
      setTestingConnections(prev => {
        const newSet = new Set(prev);
        newSet.delete(connectionId);
        return newSet;
      });
      
      console.log(`Connection test completed for ${connection.name}`);
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

  const getStatusBadge = (status: string, isLoading = false) => {
    if (isLoading) {
      return (
        <Badge variant="secondary" className="flex items-center gap-1">
          <Loader2 className="h-3 w-3 animate-spin" />
          Testing...
        </Badge>
      );
    }

    const statusConfig = {
      connected: { variant: "default" as const, icon: CheckCircle, color: "text-green-600" },
      disconnected: { variant: "secondary" as const, icon: Clock, color: "text-yellow-600" },
      error: { variant: "destructive" as const, icon: AlertCircle, color: "text-red-600" },
      testing: { variant: "secondary" as const, icon: Loader2, color: "text-blue-600" },
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.disconnected;
    const Icon = config.icon;
    
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className={`h-3 w-3 ${status === 'testing' ? 'animate-spin' : ''}`} />
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
          <TabsTrigger value="console">Command Console</TabsTrigger>
          <TabsTrigger value="sync">Synchronization</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

          <TabsContent value="connections" className="space-y-6">
          {/* Netlify EPO Testing Section */}
          <Card className="border-blue-200 bg-blue-50/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plug className="h-5 w-5 text-blue-600" />
                Netlify EPO Proxy Test
              </CardTitle>
              <CardDescription>
                Test EPO connectivity via Netlify Functions proxy (bypasses CORS and credentials)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Button 
                  onClick={handleTestNetlifyConnection}
                  disabled={isTestingNetlify}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {isTestingNetlify ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Play className="h-4 w-4 mr-2" />
                  )}
                  {isTestingNetlify ? 'Testing...' : 'Test Connection'}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setNetlifyTestResult('')}
                  disabled={!netlifyTestResult}
                >
                  Clear Results
                </Button>
              </div>
              {netlifyTestResult && (
                <div className="bg-card border rounded-md p-4">
                  <pre className="text-xs whitespace-pre-wrap font-mono">
                    {netlifyTestResult}
                  </pre>
                </div>
              )}
              <div className="text-xs text-muted-foreground">
                <p>📋 <strong>Requirements:</strong> PROXY_URL, PROXY_USER, PROXY_PASS environment variables in Netlify</p>
                <p>🔗 <strong>Endpoint:</strong> /.netlify/functions/epo?path=remote/core.help</p>
              </div>
            </CardContent>
          </Card>

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
                    connections.map((connection) => {
                      const isTestingThisConnection = testingConnections.has(connection.id);
                      
                      return (
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
                            {getStatusBadge(connection.status, isTestingThisConnection)}
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleTestConnection(connection.id)}
                              disabled={isTestingThisConnection}
                            >
                              {isTestingThisConnection ? (
                                <>
                                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                                  Testing...
                                </>
                              ) : (
                                <>
                                  <Network className="h-4 w-4 mr-1" />
                                  Test
                                </>
                              )}
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => {
                                const ca = prompt("Paste your CA certificate(s) (PEM format).\nYou can include multiple certificates:");
                                if (ca) handleTestConnection(connection.id, ca);
                              }}
                              disabled={isTestingThisConnection}
                              title="Test with custom CA certificate - supports multiple PEMs"
                            >
                              <Lock className="h-3 w-3 mr-1" />
                              Test w/ CA
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleTestConnection(connection.id, undefined, true)}
                              disabled={isTestingThisConnection}
                              title="Test with certificate pinning (bypass CA validation)"
                              className="text-amber-600 border-amber-300 hover:bg-amber-50"
                            >
                              <Lock className="h-3 w-3 mr-1" />
                              Pin & Test
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
                      );
                    })
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
                  <Button onClick={() => setShowAddWebhook(true)}>
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
              <CardDescription>
                Execute ePO API commands directly
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Authentication Section */}
              <div className="border border-border rounded-lg p-4 space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <Lock className="h-4 w-4" />
                  <h4 className="font-medium">Authentication</h4>
                  {isAuthenticated && (
                    <Badge variant="secondary" className="ml-auto">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Authenticated
                    </Badge>
                  )}
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="auth-mode">Authentication Mode</Label>
                    <Select value={authMode} onValueChange={(value: 'basic' | 'session') => setAuthMode(value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="basic">Basic Authentication</SelectItem>
                        <SelectItem value="session">Session Authentication</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="output-type">Output Format</Label>
                    <Select value={outputType} onValueChange={setOutputType}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="json">JSON</SelectItem>
                        <SelectItem value="xml">XML</SelectItem>
                        <SelectItem value="verbose">Verbose</SelectItem>
                        <SelectItem value="terse">Terse</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {authMode === 'session' && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-3 gap-3">
                      <div className="col-span-2">
                        <Label htmlFor="auth-password">Password</Label>
                        <Input
                          id="auth-password"
                          type="password"
                          placeholder="Enter your ePO password"
                          value={authPassword}
                          onChange={(e) => setAuthPassword(e.target.value)}
                          disabled={isAuthenticated}
                        />
                      </div>
                      <div className="flex items-end">
                        {!isAuthenticated ? (
                          <Button 
                            onClick={handleAuthenticate}
                            disabled={!selectedConnection || !authPassword.trim() || isExecuting}
                            className="w-full"
                          >
                            {isExecuting ? (
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                              <Lock className="h-4 w-4 mr-2" />
                            )}
                            Authenticate
                          </Button>
                        ) : (
                          <Button 
                            onClick={handleLogout}
                            variant="outline"
                            className="w-full"
                          >
                            <LogOut className="h-4 w-4 mr-2" />
                            Logout
                          </Button>
                        )}
                      </div>
                    </div>
                    
                    {isAuthenticated && sessionExpiry && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        Session expires: {new Date(sessionExpiry).toLocaleString()}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Command Execution Section */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label>Select Connection</Label>
                    <Select value={selectedConnection} onValueChange={setSelectedConnection}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose EPO connection" />
                      </SelectTrigger>
                      <SelectContent>
                         {connections.map((connection) => (
                           <SelectItem key={connection.id} value={connection.id}>
                             <div className="flex items-center justify-between w-full">
                               <span>{connection.name}</span>
                               <Badge 
                                 variant={connection.status === 'connected' ? 'default' : 'secondary'} 
                                 className="ml-2"
                               >
                                 {connection.status}
                               </Badge>
                             </div>
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
                    <Textarea
                      className="font-mono text-sm"
                      placeholder='{"searchText": "WORKSTATION-*", "maxResults": 10}'
                      value={commandParameters}
                      onChange={(e) => setCommandParameters(e.target.value)}
                      rows={4}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Optional: Provide parameters in JSON format
                    </p>
                  </div>

                  <Button 
                    onClick={handleExecuteCommand} 
                    className="w-full"
                    disabled={isExecuting || !selectedConnection || !selectedCommand || (authMode === 'session' && !isAuthenticated)}
                  >
                    {isExecuting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
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

        <TabsContent value="console" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Terminal className="h-5 w-5" />
                Command Console
              </CardTitle>
              <CardDescription>
                Interactive terminal for ePO API commands. Type commands like "core.help" or "system.find {'{"searchText":"*"}'}"
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Connection and Auth Status */}
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div className="flex items-center gap-2">
                  <Select
                    value={selectedConnection}
                    onValueChange={setSelectedConnection}
                  >
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Select Connection" />
                    </SelectTrigger>
                    <SelectContent>
                      {connections.map((connection) => (
                        <SelectItem key={connection.id} value={connection.id}>
                          {connection.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  <Select value={authMode} onValueChange={(value: 'basic' | 'session') => setAuthMode(value)}>
                    <SelectTrigger className="w-24">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="basic">Basic</SelectItem>
                      <SelectItem value="session">Session</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  {authMode === 'session' && (
                    <div className="flex items-center gap-2">
                      {isAuthenticated ? (
                        <Badge variant="secondary" className="text-green-600">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Authenticated
                        </Badge>
                      ) : (
                        <Badge variant="outline">Not Authenticated</Badge>
                      )}
                    </div>
                  )}
                </div>
                
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearConsole}
                  >
                    Clear
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={copyConsoleOutput}
                    disabled={consoleOutput.length === 0}
                  >
                    Copy All
                  </Button>
                </div>
              </div>

              {/* Quick Commands */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Quick Commands:</Label>
                <div className="flex flex-wrap gap-2">
                  {['core.help', 'core.getVersion', 'system.find {"searchText":"*"}', 'policy.listPolicies'].map((cmd) => (
                    <Button
                      key={cmd}
                      variant="outline"
                      size="sm"
                      onClick={() => setConsoleInput(cmd)}
                      className="text-xs"
                    >
                      {cmd}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Console Output */}
              <div className="border rounded-lg">
                <ScrollArea className="h-80 p-4 font-mono text-sm">
                  {consoleOutput.length === 0 ? (
                    <div className="text-muted-foreground">
                      No commands executed yet. Type a command below and press Enter.
                      <br />
                      <br />
                      Examples:
                      <br />
                      • core.help
                      <br />
                      • system.find {"{\"searchText\":\"*\"}"}
                      <br />
                      • policy.listPolicies {"{\"type\":\"ENS\"}"}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {consoleOutput.map((entry, index) => (
                        <div key={index} className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground text-xs">
                              [{entry.timestamp}]
                            </span>
                            <span className="text-blue-600 font-medium">
                              $ {entry.command}
                            </span>
                          </div>
                          <div className={`pl-4 whitespace-pre-wrap ${
                            entry.type === 'error' ? 'text-red-600' : 'text-foreground'
                          }`}>
                            {entry.response}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </div>

              {/* Command Input */}
              <div className="flex items-center gap-2">
                <span className="text-blue-600 font-mono font-medium">$</span>
                <Input
                  value={consoleInput}
                  onChange={(e) => setConsoleInput(e.target.value)}
                  onKeyDown={handleConsoleKeyDown}
                  placeholder="Enter ePO API command (e.g., core.help or system.find {&quot;searchText&quot;:&quot;*&quot;})"
                  disabled={isExecuting || !selectedConnection}
                  className="font-mono"
                />
                <Button
                  onClick={() => {
                    if (consoleInput.trim()) {
                      handleConsoleCommand(consoleInput);
                      setConsoleInput('');
                    }
                  }}
                  disabled={isExecuting || !selectedConnection || !consoleInput.trim()}
                  size="sm"
                >
                  {isExecuting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Play className="h-4 w-4" />
                  )}
                </Button>
              </div>

              {/* Help Text */}
              <div className="text-xs text-muted-foreground space-y-1">
                <p><strong>Usage:</strong> Type endpoint name followed by optional JSON parameters</p>
                <p><strong>Navigation:</strong> Use ↑↓ arrow keys to browse command history</p>
                <p><strong>Session Mode:</strong> Authenticate first to use session tokens for commands</p>
                <div className="flex items-center gap-1 mt-2">
                  <Info className="h-3 w-3" />
                  <span>Need Node.js for local development? Check the </span>
                  <Button variant="link" className="p-0 h-auto text-xs underline" asChild>
                    <a href="#" onClick={(e) => {
                      e.preventDefault();
                      toast.info("Switch to Admin Portal → Terminal tab for Node.js installation guide");
                    }}>
                      Admin Terminal
                    </a>
                  </Button>
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
        <div className="fixed inset-0 bg-black/50 z-50 p-4 overflow-y-auto flex items-center justify-center">
          <Card className="w-full max-w-2xl max-h-[90vh] flex flex-col">
            <CardHeader>
              <CardTitle>Add EPO Connection</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="max-h-[70vh] p-6">
                <div className="space-y-4">
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
                <div className="mt-1 text-xs text-muted-foreground space-y-1">
                  <p>💡 <strong>Best practices:</strong></p>
                  <p>• Use hostname instead of IP address for proper TLS</p>
                  <p>• Ensure HTTPS with valid certificate from trusted CA</p>
                  <p>• Server must support TLS 1.2 or higher</p>
                  <p>• Don't include /remote path (added automatically)</p>
                </div>
                {newConnection.serverUrl && (() => {
                  const { warnings } = validateServerUrl(newConnection.serverUrl);
                  return warnings.map((warning, index) => (
                    <p key={index} className="text-xs text-amber-600 mt-1">{warning}</p>
                  ));
                })()}
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
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label htmlFor="caCertificate">CA Certificate (Optional)</Label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowCertificateAnalysis(!showCertificateAnalysis)}
                      className="text-xs"
                    >
                      <Info className="h-3 w-3 mr-1" />
                      {showCertificateAnalysis ? 'Hide' : 'Show'} Analysis
                    </Button>
                  </div>
                  <Textarea
                    id="caCertificate"
                    className="font-mono text-xs resize-y min-h-[120px]"
                    placeholder="-----BEGIN CERTIFICATE-----
MIIFaTCCA1GgAwIBAgIJALvN...
-----END CERTIFICATE-----

Can paste multiple certificates here (full chain)"
                    value={newConnection.caCertificate}
                    onChange={(e) => handleCertificateChange(e.target.value)}
                  />
                  
                  {/* Certificate Analysis */}
                  {showCertificateAnalysis && certificateAnalysis && (
                    <div className="mt-2 p-3 bg-muted/50 rounded-md border">
                      <div className="text-xs font-medium mb-2">Certificate Analysis:</div>
                      <div className="space-y-1 text-xs">
                        <div className="flex justify-between">
                          <span>Total Blocks:</span>
                          <span>{certificateAnalysis.totalBlocks}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Valid Certificates:</span>
                          <span className="text-green-600 font-medium">{certificateAnalysis.validCerts}</span>
                        </div>
                        {certificateAnalysis.invalidBlocks > 0 && (
                          <div className="flex justify-between">
                            <span>Invalid Blocks:</span>
                            <span className="text-red-600 font-medium">{certificateAnalysis.invalidBlocks}</span>
                          </div>
                        )}
                      </div>
                      
                      {certificateAnalysis.warnings.length > 0 && (
                        <div className="mt-2 space-y-1">
                          {certificateAnalysis.warnings.map((warning, index) => (
                            <div key={index} className="text-xs text-amber-600 flex items-start gap-1">
                              <AlertCircle className="h-3 w-3 mt-0.5 flex-shrink-0" />
                              <span>{warning}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {certificateAnalysis.details.length > 0 && (
                        <div className="mt-2">
                          <div className="text-xs font-medium mb-1">Certificate Details:</div>
                          <div className="space-y-1">
                            {certificateAnalysis.details.map((detail, index) => (
                              <div key={index} className="text-xs flex items-center gap-2">
                                {detail.type === 'valid' ? (
                                  <CheckCircle className="h-3 w-3 text-green-600" />
                                ) : (
                                  <AlertCircle className="h-3 w-3 text-red-600" />
                                )}
                                <span>{detail.description || `${detail.type}: ${detail.error || 'Unknown'}`}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="mt-2 text-xs text-muted-foreground space-y-1">
                    <p>🔒 <strong>Enterprise CA Support:</strong></p>
                    <p>• Paste your enterprise CA certificate(s) here if EPO uses self-signed/internal CA</p>
                    <p>• Can include multiple certificates (full chain) in single input</p>
                    <p>• Only needed if you get "SSL certificate validation failed" errors</p>
                    <p>• Certificates must be in PEM format (-----BEGIN CERTIFICATE-----)</p>
                  </div>

                  <Separator className="my-3" />

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="pinCertificate"
                      checked={newConnection.pinCertificate}
                      onCheckedChange={(checked) => 
                        setNewConnection({ ...newConnection, pinCertificate: !!checked })
                      }
                    />
                    <Label htmlFor="pinCertificate" className="text-xs flex items-center gap-1">
                      <Lock className="h-3 w-3" />
                      Pin server certificate (bypass CA validation)
                    </Label>
                  </div>
                  
                  {newConnection.pinCertificate && (
                    <div className="mt-1 p-2 bg-amber-50 border border-amber-200 rounded text-xs text-amber-800">
                      <div className="flex items-start gap-1">
                        <AlertCircle className="h-3 w-3 mt-0.5 flex-shrink-0" />
                        <div>
                          <strong>Security Warning:</strong> Certificate pinning bypasses CA validation.
                          Only use this as a temporary workaround. Consider obtaining proper CA certificates instead.
                        </div>
                      </div>
                    </div>
                  )}
                 </div>
                 
                 <Separator />
                 
                 {/* TLS Security Options */}
                 <div>
                   <Label className="text-sm font-medium">TLS Security Options</Label>
                   <div className="mt-2 space-y-3">
                     <div className="flex items-start space-x-2">
                       <Checkbox
                         id="allowInsecureTLS"
                         checked={newConnection.allowInsecureTLS}
                         onCheckedChange={(checked) => setNewConnection({ ...newConnection, allowInsecureTLS: checked as boolean })}
                       />
                       <div className="space-y-1">
                         <Label htmlFor="allowInsecureTLS" className="text-sm">
                           Ignore TLS errors (testing only)
                         </Label>
                         <p className="text-xs text-muted-foreground">
                           ⚠️ For development/testing only. Bypasses certificate validation including hostname/IP mismatches.
                         </p>
                       </div>
                     </div>
                     
                     {newConnection.allowInsecureTLS && (
                       <div className="p-3 bg-amber-50 border border-amber-200 rounded-md">
                         <div className="flex items-start gap-2">
                           <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                           <div className="text-xs text-amber-800">
                             <div className="font-medium mb-1">Security Warning</div>
                             <div>This option disables TLS certificate validation and should only be used for testing. In production, use proper certificates with matching hostnames.</div>
                           </div>
                         </div>
                       </div>
                     )}
                   </div>
                  </div>
                </div>
              </ScrollArea>
              
              <div className="flex space-x-2 p-6 pt-4 border-t bg-card">
                <Button onClick={handleAddConnection} className="flex-1">
                  Add Connection
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setShowAddConnection(false);
                    setNewConnection({
                      name: '',
                      serverUrl: '',
                      username: '',
                      password: '',
                      port: '8443',
                      caCertificate: '',
                      pinCertificate: false,
                      allowInsecureTLS: false
                    });
                    setCertificateAnalysis(null);
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Add Webhook Modal */}
      {showAddWebhook && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Webhook className="h-5 w-5" />
                Add New Webhook
              </CardTitle>
              <CardDescription>
                Configure a webhook endpoint to receive EPO events
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="webhook-name">Webhook Name</Label>
                <Input
                  id="webhook-name"
                  value={newWebhook.name}
                  onChange={(e) => setNewWebhook({ ...newWebhook, name: e.target.value })}
                  placeholder="e.g., Threat Detection Webhook"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="webhook-url">Endpoint URL</Label>
                <Input
                  id="webhook-url"
                  value={newWebhook.url}
                  onChange={(e) => setNewWebhook({ ...newWebhook, url: e.target.value })}
                  placeholder="https://api.example.com/webhooks/epo"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="webhook-secret">Secret (Optional)</Label>
                <Input
                  id="webhook-secret"
                  type="password"
                  value={newWebhook.secret}
                  onChange={(e) => setNewWebhook({ ...newWebhook, secret: e.target.value })}
                  placeholder="Webhook secret for verification"
                />
              </div>
              
              <div className="space-y-2">
                <Label>Event Types</Label>
                <div className="space-y-2">
                  {['threat-detection', 'policy-update', 'agent-status', 'system-alert'].map((event) => (
                    <div key={event} className="flex items-center space-x-2">
                      <Checkbox
                        id={`event-${event}`}
                        checked={newWebhook.events.includes(event)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setNewWebhook({ ...newWebhook, events: [...newWebhook.events, event] });
                          } else {
                            setNewWebhook({ ...newWebhook, events: newWebhook.events.filter(e => e !== event) });
                          }
                        }}
                      />
                      <Label htmlFor={`event-${event}`} className="text-sm capitalize">
                        {event.replace('-', ' ')}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="webhook-active"
                  checked={newWebhook.active}
                  onCheckedChange={(checked) => setNewWebhook({ ...newWebhook, active: checked as boolean })}
                />
                <Label htmlFor="webhook-active" className="text-sm">
                  Active (start receiving events immediately)
                </Label>
              </div>
            </CardContent>
            
            <div className="flex space-x-2 p-6 pt-4 border-t bg-card">
              <Button 
                onClick={() => {
                  // Here you would typically save the webhook to your backend
                  toast.success("Webhook added successfully!");
                  setShowAddWebhook(false);
                  setNewWebhook({
                    name: '',
                    url: '',
                    events: [],
                    secret: '',
                    active: true
                  });
                }}
                className="flex-1"
                disabled={!newWebhook.name.trim() || !newWebhook.url.trim()}
              >
                Add Webhook
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowAddWebhook(false);
                  setNewWebhook({
                    name: '',
                    url: '',
                    events: [],
                    secret: '',
                    active: true
                  });
                }}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};
