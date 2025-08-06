import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlertTriangle, RefreshCw, Search, Download, Filter, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ErrorLog {
  id: string;
  timestamp: string;
  level: 'error' | 'warning' | 'critical';
  message: string;
  source: string;
  details?: string;
  userId?: string;
  resolved: boolean;
}

export const ErrorLogs = () => {
  const [errorLogs, setErrorLogs] = useState<ErrorLog[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<ErrorLog[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [levelFilter, setLevelFilter] = useState<string>("all");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadErrorLogs();
    
    // Set up error monitoring
    const originalConsoleError = console.error;
    const originalConsoleWarn = console.warn;
    
    window.addEventListener('error', handleGlobalError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    
    console.error = (...args) => {
      originalConsoleError.apply(console, args);
      captureError('error', args.join(' '), 'Console');
    };
    
    console.warn = (...args) => {
      originalConsoleWarn.apply(console, args);
      captureError('warning', args.join(' '), 'Console');
    };

    return () => {
      window.removeEventListener('error', handleGlobalError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      console.error = originalConsoleError;
      console.warn = originalConsoleWarn;
    };
  }, []);

  useEffect(() => {
    // Filter logs based on search and level
    let filtered = errorLogs;
    
    if (searchQuery) {
      filtered = filtered.filter(log =>
        log.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.source.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (log.details && log.details.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }
    
    if (levelFilter !== "all") {
      filtered = filtered.filter(log => log.level === levelFilter);
    }
    
    setFilteredLogs(filtered);
  }, [errorLogs, searchQuery, levelFilter]);

  const loadErrorLogs = () => {
    const savedLogs = localStorage.getItem('error_logs');
    if (savedLogs) {
      setErrorLogs(JSON.parse(savedLogs));
    } else {
      // Initialize with some example logs
      const mockLogs: ErrorLog[] = [
        {
          id: '1',
          timestamp: new Date().toISOString(),
          level: 'error',
          message: 'Failed to load user data from API',
          source: 'UserManagement.tsx',
          details: 'Network request failed: 500 Internal Server Error',
          resolved: false
        },
        {
          id: '2',
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          level: 'warning',
          message: 'Agent deployment timeout warning',
          source: 'DeploymentModal.tsx',
          details: 'Deployment taking longer than expected (>30s)',
          resolved: true
        },
        {
          id: '3',
          timestamp: new Date(Date.now() - 7200000).toISOString(),
          level: 'critical',
          message: 'Database connection lost',
          source: 'Supabase Client',
          details: 'Connection timeout after 30 seconds',
          resolved: false
        }
      ];
      setErrorLogs(mockLogs);
      localStorage.setItem('error_logs', JSON.stringify(mockLogs));
    }
  };

  const handleGlobalError = (event: ErrorEvent) => {
    captureError('error', event.message, event.filename || 'Unknown', event.error?.stack);
  };

  const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
    captureError('error', `Unhandled Promise Rejection: ${event.reason}`, 'Promise');
  };

  const captureError = (level: 'error' | 'warning' | 'critical', message: string, source: string, details?: string) => {
    const newLog: ErrorLog = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      level,
      message,
      source,
      details,
      resolved: false
    };

    setErrorLogs(prev => {
      const updated = [newLog, ...prev].slice(0, 1000); // Keep only last 1000 logs
      localStorage.setItem('error_logs', JSON.stringify(updated));
      return updated;
    });
  };

  const handleRefresh = async () => {
    setLoading(true);
    
    // Simulate API call to refresh logs
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    loadErrorLogs();
    setLoading(false);
    
    toast({
      title: "Logs Refreshed",
      description: "Error logs have been updated.",
    });
  };

  const handleResolveError = (errorId: string) => {
    const updatedLogs = errorLogs.map(log =>
      log.id === errorId ? { ...log, resolved: true } : log
    );
    setErrorLogs(updatedLogs);
    localStorage.setItem('error_logs', JSON.stringify(updatedLogs));
    
    toast({
      title: "Error Resolved",
      description: "Error has been marked as resolved.",
    });
  };

  const handleClearLogs = () => {
    setErrorLogs([]);
    localStorage.removeItem('error_logs');
    
    toast({
      title: "Logs Cleared",
      description: "All error logs have been cleared.",
    });
  };

  const handleExportLogs = () => {
    const dataStr = JSON.stringify(errorLogs, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `error-logs-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
    
    toast({
      title: "Export Complete",
      description: "Error logs have been exported successfully.",
    });
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'critical': return 'destructive';
      case 'error': return 'destructive';
      case 'warning': return 'secondary';
      default: return 'outline';
    }
  };

  const stats = {
    total: errorLogs.length,
    critical: errorLogs.filter(log => log.level === 'critical').length,
    errors: errorLogs.filter(log => log.level === 'error').length,
    warnings: errorLogs.filter(log => log.level === 'warning').length,
    unresolved: errorLogs.filter(log => !log.resolved).length
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Logs</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Critical</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{stats.critical}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Errors</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">{stats.errors}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Warnings</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-500">{stats.warnings}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unresolved</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-500">{stats.unresolved}</div>
          </CardContent>
        </Card>
      </div>

      {/* Error Logs Table */}
      <Card className="modern-card">
        <CardHeader>
          <div className="flex justify-between items-start">
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Error Logs
            </CardTitle>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={loading}
                className="hover:bg-trellix-orange/10 hover:border-trellix-orange/50"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportLogs}
                className="hover:bg-blue-500/10 hover:border-blue-500/50"
              >
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearLogs}
                className="hover:bg-destructive/10 hover:border-destructive/50 hover:text-destructive"
              >
                <X className="h-4 w-4 mr-2" />
                Clear All
              </Button>
            </div>
          </div>
          
          {/* Filters */}
          <div className="flex gap-4 mt-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search logs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <select
                value={levelFilter}
                onChange={(e) => setLevelFilter(e.target.value)}
                className="bg-background border border-border rounded-md px-3 py-2 text-sm"
              >
                <option value="all">All Levels</option>
                <option value="critical">Critical</option>
                <option value="error">Error</option>
                <option value="warning">Warning</option>
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Timestamp</TableHead>
                <TableHead>Level</TableHead>
                <TableHead>Message</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLogs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    No error logs found
                  </TableCell>
                </TableRow>
              ) : (
                filteredLogs.map((log) => (
                  <TableRow key={log.id} className={log.resolved ? 'opacity-60' : ''}>
                    <TableCell className="font-mono text-sm">
                      {new Date(log.timestamp).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getLevelColor(log.level)}>
                        {log.level.toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-xs truncate" title={log.message}>
                      {log.message}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {log.source}
                    </TableCell>
                    <TableCell>
                      <Badge variant={log.resolved ? 'default' : 'secondary'}>
                        {log.resolved ? 'Resolved' : 'Open'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {!log.resolved && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleResolveError(log.id)}
                          className="hover:bg-green-500/10 hover:border-green-500/50 hover:text-green-400"
                        >
                          Resolve
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};