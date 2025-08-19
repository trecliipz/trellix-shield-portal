
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
  Terminal, 
  Play, 
  RefreshCw, 
  Monitor, 
  Network,
  Wifi,
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle,
  Loader2
} from 'lucide-react';

interface PingResult {
  attempt: number;
  status: string;
  latency_ms: number | null;
  error_message: string | null;
  timestamp: string;
}

interface PingLog {
  id: string;
  target: string;
  resolved_ip: string | null;
  method: string;
  port: number | null;
  status: string;
  latency_ms: number | null;
  attempts: number;
  attempt_index: number;
  error_message: string | null;
  created_at: string;
}

export const RemoteOperations = () => {
  const [activeCommand, setActiveCommand] = useState('');
  const [commandOutput, setCommandOutput] = useState('');
  const [isExecuting, setIsExecuting] = useState(false);

  // Network Tools state
  const [pingTarget, setPingTarget] = useState('');
  const [pingMethod, setPingMethod] = useState('http');
  const [pingPort, setPingPort] = useState('');
  const [pingAttempts, setPingAttempts] = useState('3');
  const [pingResults, setPingResults] = useState<PingResult[]>([]);
  const [isPinging, setIsPinging] = useState(false);
  const [pingHistory, setPingHistory] = useState<PingLog[]>([]);

  // Load ping history on component mount
  useEffect(() => {
    loadPingHistory();
  }, []);

  const loadPingHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('network_ping_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('Error loading ping history:', error);
        return;
      }

      setPingHistory(data || []);
    } catch (error) {
      console.error('Error loading ping history:', error);
    }
  };

  const executePing = async () => {
    if (!pingTarget) {
      toast({
        title: "Error",
        description: "Please enter a target to ping",
        variant: "destructive"
      });
      return;
    }

    setIsPinging(true);
    setPingResults([]);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({
          title: "Authentication Required", 
          description: "Please log in to use ping functionality",
          variant: "destructive"
        });
        return;
      }

      const response = await supabase.functions.invoke('admin-ping', {
        body: {
          target: pingTarget,
          method: pingMethod,
          port: pingPort ? parseInt(pingPort) : null,
          attempts: parseInt(pingAttempts) || 3
        }
      });

      if (response.error) {
        throw new Error(response.error.message || 'Ping failed');
      }

      if (response.data) {
        setPingResults(response.data.results || []);
        toast({
          title: "Ping Complete",
          description: `Completed ${response.data.total_attempts} attempts to ${response.data.target}`
        });
        
        // Reload history to show new results
        await loadPingHistory();
      }

    } catch (error) {
      console.error('Ping error:', error);
      toast({
        title: "Ping Failed",
        description: error.message || "Failed to execute ping",
        variant: "destructive"
      });
    } finally {
      setIsPinging(false);
    }
  };

  const executeRemoteCommand = async () => {
    if (!activeCommand.trim()) {
      toast({
        title: "Error",
        description: "Please enter a command to execute",
        variant: "destructive"
      });
      return;
    }

    setIsExecuting(true);
    setCommandOutput('Executing command...\n');

    try {
      // Simulate command execution
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const simulatedOutput = `
Command: ${activeCommand}
Status: Success
Output:
${activeCommand === 'systeminfo' ? 
  'Host Name: EPO-SERVER-01\nOS Name: Windows Server 2019\nOS Version: 10.0.17763\nSystem Type: x64-based PC' :
  activeCommand === 'ipconfig' ?
  'Windows IP Configuration\n\nEthernet adapter Ethernet:\n   IPv4 Address: 192.168.1.100\n   Subnet Mask: 255.255.255.0\n   Default Gateway: 192.168.1.1' :
  `Command "${activeCommand}" executed successfully.`
}

Execution completed at: ${new Date().toLocaleString()}
      `;
      
      setCommandOutput(simulatedOutput);
      toast({
        title: "Command Executed",
        description: "Remote command completed successfully"
      });
    } catch (error) {
      setCommandOutput(`Error: ${error.message}`);
      toast({
        title: "Execution Failed",
        description: "Failed to execute remote command",
        variant: "destructive"
      });
    } finally {
      setIsExecuting(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'timeout':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'unreachable':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variant = status === 'success' ? 'default' : status === 'timeout' ? 'secondary' : 'destructive';
    return <Badge variant={variant}>{status}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold">Remote Operations</h3>
          <p className="text-muted-foreground">Execute remote commands and network operations</p>
        </div>
      </div>

      <Tabs defaultValue="commands" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="commands" className="flex items-center gap-2">
            <Terminal className="h-4 w-4" />
            Remote Commands
          </TabsTrigger>
          <TabsTrigger value="network" className="flex items-center gap-2">
            <Network className="h-4 w-4" />
            Network Tools
          </TabsTrigger>
          <TabsTrigger value="monitoring" className="flex items-center gap-2">
            <Monitor className="h-4 w-4" />
            System Monitoring
          </TabsTrigger>
        </TabsList>

        <TabsContent value="commands">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Terminal className="h-5 w-5" />
                  Command Execution
                </CardTitle>
                <CardDescription>Execute commands on remote ePO servers</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Command</Label>
                  <Input
                    placeholder="Enter command (e.g., systeminfo, ipconfig, whoami)"
                    value={activeCommand}
                    onChange={(e) => setActiveCommand(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && !isExecuting && executeRemoteCommand()}
                  />
                </div>
                <Button 
                  onClick={executeRemoteCommand} 
                  disabled={isExecuting}
                  className="w-full"
                >
                  {isExecuting ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Play className="h-4 w-4 mr-2" />
                  )}
                  Execute Command
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Command Output</CardTitle>
                <CardDescription>Results from remote command execution</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-64 w-full border rounded-md p-3">
                  <pre className="text-sm font-mono whitespace-pre-wrap">
                    {commandOutput || 'No command executed yet...'}
                  </pre>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="network">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wifi className="h-5 w-5" />
                  Network Ping Tool
                </CardTitle>
                <CardDescription>Test network connectivity to hosts and services</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Target Host/IP</Label>
                  <Input
                    placeholder="e.g., google.com, 192.168.1.1"
                    value={pingTarget}
                    onChange={(e) => setPingTarget(e.target.value)}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Method</Label>
                    <Select value={pingMethod} onValueChange={setPingMethod}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="http">HTTP</SelectItem>
                        <SelectItem value="https">HTTPS</SelectItem>
                        <SelectItem value="tcp">TCP</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Port (optional)</Label>
                    <Input
                      type="number"
                      placeholder="80, 443, 8443..."
                      value={pingPort}
                      onChange={(e) => setPingPort(e.target.value)}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Attempts</Label>
                  <Select value={pingAttempts} onValueChange={setPingAttempts}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1</SelectItem>
                      <SelectItem value="3">3</SelectItem>
                      <SelectItem value="5">5</SelectItem>
                      <SelectItem value="10">10</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <Button 
                  onClick={executePing} 
                  disabled={isPinging}
                  className="w-full"
                >
                  {isPinging ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Network className="h-4 w-4 mr-2" />
                  )}
                  Execute Ping
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Ping Results</CardTitle>
                <CardDescription>Real-time ping results and statistics</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-64 w-full">
                  {pingResults.length > 0 ? (
                    <div className="space-y-2">
                      {pingResults.map((result, index) => (
                        <div key={index} className="flex items-center justify-between p-2 border rounded">
                          <div className="flex items-center gap-2">
                            {getStatusIcon(result.status)}
                            <span className="text-sm">Attempt {result.attempt}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            {getStatusBadge(result.status)}
                            {result.latency_ms && (
                              <Badge variant="outline">{result.latency_ms}ms</Badge>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                      No ping results yet
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          {/* Ping History */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Ping History</CardTitle>
                  <CardDescription>Recent network connectivity tests</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={loadPingHistory}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-64 w-full">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Target</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Latency</TableHead>
                      <TableHead>Timestamp</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pingHistory.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="font-mono">{log.target}</TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {log.method.toUpperCase()}
                            {log.port && `:${log.port}`}
                          </Badge>
                        </TableCell>
                        <TableCell>{getStatusBadge(log.status)}</TableCell>
                        <TableCell>
                          {log.latency_ms ? `${log.latency_ms}ms` : '-'}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(log.created_at).toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {pingHistory.length === 0 && (
                  <div className="flex items-center justify-center py-8 text-muted-foreground">
                    No ping history available
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="monitoring">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Monitor className="h-5 w-5" />
                System Monitoring
              </CardTitle>
              <CardDescription>Real-time system performance and health monitoring</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                System monitoring features coming soon...
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
