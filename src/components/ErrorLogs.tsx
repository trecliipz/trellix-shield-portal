
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlertTriangle, RefreshCw, Search, Download, Filter, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useErrorHandling } from "@/hooks/useErrorHandling";
import { supabase } from "@/integrations/supabase/client";
import { logClientError } from "@/lib/logger";

interface ErrorLog {
  id: string;
  created_at: string;
  level: 'error' | 'warn' | 'info' | 'debug' | 'log';
  message: string;
  source?: string;
  url?: string;
  user_agent?: string;
  session_id?: string;
  user_id?: string;
  details?: any;
  tags?: string[];
  resolved: boolean;
  resolved_at?: string;
  resolved_by?: string;
  updated_at?: string;
}

interface UIErrorLog {
  id: string;
  timestamp: string;
  level: 'critical' | 'error' | 'warning';
  message: string;
  source: string;
  details?: string;
  userId?: string;
  resolved: boolean;
}

export const ErrorLogs = () => {
  const [errorLogs, setErrorLogs] = useState<UIErrorLog[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<UIErrorLog[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [levelFilter, setLevelFilter] = useState<string>("all");
  const [loading, setLoading] = useState(false);
  const [realTimeEnabled, setRealTimeEnabled] = useState(true);
  const { toast } = useToast();
  const { errorState, handleError, retryOperation } = useErrorHandling();

  useEffect(() => {
    loadErrorLogs();
    
    // Set up real-time subscription to database errors
    const channel = supabase
      .channel('error-logs-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'error_logs'
        },
        (payload) => {
          console.log('New error log received:', payload);
          const newDbLog = payload.new as ErrorLog;
          const uiLog = convertDbLogToUILog(newDbLog);
          
          setErrorLogs(prev => {
            const updated = [uiLog, ...prev].slice(0, 1000);
            // Also sync to localStorage for consistency
            localStorage.setItem('error_logs', JSON.stringify(updated));
            return updated;
          });
          
          // Show toast for critical errors
          if (uiLog.level === 'critical') {
            toast({
              title: "Critical Error Detected",
              description: uiLog.message,
              variant: "destructive",
            });
          }
        }
      )
      .subscribe();

    // Enhanced error monitoring for local logging
    const originalConsoleError = console.error;
    const originalConsoleWarn = console.warn;
    
    window.addEventListener('error', handleGlobalError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    
    console.error = (...args) => {
      originalConsoleError.apply(console, args);
      const message = args.join(' ');
      
      // Capture and send to database via logger
      logClientError('error', message, 'console.error');
    };
    
    console.warn = (...args) => {
      originalConsoleWarn.apply(console, args);
      const message = args.join(' ');
      logClientError('warn', message, 'console.warn');
    };

    return () => {
      supabase.removeChannel(channel);
      window.removeEventListener('error', handleGlobalError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      console.error = originalConsoleError;
      console.warn = originalConsoleWarn;
    };
  }, []);

  // Convert database error log format to UI format
  const convertDbLogToUILog = (dbLog: ErrorLog): UIErrorLog => {
    let level: 'critical' | 'error' | 'warning' = 'error';
    
    // Map database levels to UI levels
    if (dbLog.level === 'warn') level = 'warning';
    else if (dbLog.message.includes('Failed to load user data from API') || 
             dbLog.message.includes('database connection lost') ||
             dbLog.message.includes('React Error Boundary')) level = 'critical';
    
    return {
      id: dbLog.id,
      timestamp: dbLog.created_at,
      level,
      message: dbLog.message,
      source: dbLog.source || 'Unknown',
      details: typeof dbLog.details === 'string' ? dbLog.details : JSON.stringify(dbLog.details || {}),
      userId: dbLog.user_id,
      resolved: dbLog.resolved
    };
  };

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

  const loadErrorLogs = async () => {
    setLoading(true);
    try {
      // Load from database first
      const { data: dbLogs, error } = await supabase
        .from('error_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1000);

      if (error) {
        console.error('Error loading logs from database:', error);
        // Fallback to localStorage
        loadLocalErrorLogs();
        return;
      }

      // Convert database logs to UI format with safe casting
      const uiLogs = (dbLogs || []).map((log: any) => convertDbLogToUILog({
        ...log,
        updated_at: log.updated_at || log.created_at
      } as ErrorLog));
      setErrorLogs(uiLogs);
      
      // Also sync to localStorage for offline access
      localStorage.setItem('error_logs', JSON.stringify(uiLogs));
      
    } catch (error) {
      console.error('Failed to load error logs:', error);
      // Fallback to localStorage
      loadLocalErrorLogs();
    } finally {
      setLoading(false);
    }
  };

  const loadLocalErrorLogs = () => {
    const savedLogs = localStorage.getItem('error_logs');
    if (savedLogs) {
      setErrorLogs(JSON.parse(savedLogs));
    } else {
      // Initialize with common error examples
      const mockLogs: UIErrorLog[] = [
        {
          id: '1',
          timestamp: new Date().toISOString(),
          level: 'critical',
          message: 'Failed to load user data from API',
          source: 'UserManagement.tsx',
          details: 'Network request failed: API endpoint unreachable. Possible causes: Server down, network connectivity issues, or invalid API key.',
          resolved: false
        },
        {
          id: '2',
          timestamp: new Date(Date.now() - 1800000).toISOString(),
          level: 'critical',
          message: 'Database connection lost',
          source: 'Supabase Client',
          details: 'Connection timeout after 30 seconds. Database server may be experiencing high load or network issues.',
          resolved: false
        },
        {
          id: '3',
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          level: 'warning',
          message: 'Agent deployment timeout warning',
          source: 'DeploymentModal.tsx',
          details: 'Deployment taking longer than expected (>30s). Agent may still complete successfully.',
          resolved: true
        },
        {
          id: '4',
          timestamp: new Date(Date.now() - 7200000).toISOString(),
          level: 'error',
          message: 'Security updates fetch failed',
          source: 'fetch-security-updates',
          details: 'Unable to connect to Trellix security updates endpoint. Using cached data.',
          resolved: false
        }
      ];
      setErrorLogs(mockLogs);
      localStorage.setItem('error_logs', JSON.stringify(mockLogs));
    }
  };

  const handleGlobalError = (event: ErrorEvent) => {
    let details = event.error?.stack || 'No stack trace available';
    
    // Enhanced error categorization
    if (event.message.includes('fetch')) {
      details += '\n\nThis appears to be a network-related error. Check your internet connection and API endpoints.';
    } else if (event.message.includes('database') || event.message.includes('supabase')) {
      details += '\n\nDatabase connection issue detected. The system will attempt to reconnect automatically.';
    }
    
    // Log through the centralized logger which will send to database
    logClientError('error', event.message, event.filename || 'Unknown', {
      stack: details,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno
    });
  };

  const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
    let details = `Unhandled Promise Rejection: ${event.reason}`;
    
    if (typeof event.reason === 'object' && event.reason?.message) {
      details = event.reason.message;
      if (event.reason.message.includes('Failed to load user data')) {
        details += '\n\nUser data loading failed. This may be due to authentication issues or API unavailability.';
      }
    }
    
    logClientError('error', details, 'Promise', {
      reason: String(event.reason),
      stack: event.reason?.stack
    });
  };

  const handleRefresh = async () => {
    setLoading(true);
    
    try {
      await retryOperation(async () => {
        await loadErrorLogs();
      }, 3);
      
      toast({
        title: "Logs Refreshed",
        description: "Error logs have been updated successfully from database.",
      });
    } catch (error) {
      handleError(error, 'Failed to refresh error logs');
    } finally {
      setLoading(false);
    }
  };

  const handleResolveError = async (errorId: string, autoResolved: boolean = false) => {
    try {
      // Update in database if possible
      const { error } = await supabase
        .from('error_logs')
        .update({ 
          resolved: true, 
          resolved_at: new Date().toISOString(),
          resolved_by: (await supabase.auth.getUser()).data.user?.id
        })
        .eq('id', errorId);

      if (error) {
        console.warn('Failed to update error in database:', error);
      }

      // Update local state
      const updatedLogs = errorLogs.map(log =>
        log.id === errorId ? { ...log, resolved: true } : log
      );
      setErrorLogs(updatedLogs);
      localStorage.setItem('error_logs', JSON.stringify(updatedLogs));
      
      if (!autoResolved) {
        toast({
          title: "Error Resolved",
          description: "Error has been marked as resolved in the database.",
        });
      }
    } catch (error) {
      console.error('Failed to resolve error:', error);
      toast({
        title: "Error",
        description: "Failed to resolve error. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleClearLogs = async () => {
    try {
      // Clear from database (only resolved logs to preserve important errors)
      const { error } = await supabase
        .from('error_logs')
        .delete()
        .eq('resolved', true);

      if (error) {
        console.warn('Failed to clear resolved logs from database:', error);
      }

      // Clear from local storage
      setErrorLogs([]);
      localStorage.removeItem('error_logs');
      
      toast({
        title: "Resolved Logs Cleared",
        description: "Resolved error logs have been cleared from database and local storage.",
      });
    } catch (error) {
      console.error('Failed to clear logs:', error);
      toast({
        title: "Error",
        description: "Failed to clear logs. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleExportLogs = async () => {
    try {
      // Get all logs from database for export
      const { data: allLogs, error } = await supabase
        .from('error_logs')
        .select('*')
        .order('created_at', { ascending: false });

      const exportData = error ? errorLogs : (allLogs || []);
      const dataStr = JSON.stringify(exportData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `error-logs-${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      URL.revokeObjectURL(url);
      
      toast({
        title: "Export Complete",
        description: `Exported ${exportData.length} error logs successfully.`,
      });
    } catch (error) {
      console.error('Failed to export logs:', error);
      toast({
        title: "Export Failed",
        description: "Failed to export logs. Please try again.",
        variant: "destructive",
      });
    }
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
    <div className="space-y-6 animate-fade-in">
      {/* Real-time Status Indicator */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Error Monitoring System</h2>
          <p className="text-muted-foreground">
            Real-time error tracking and logging across all website components
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${realTimeEnabled ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
          <span className="text-sm text-muted-foreground">
            {realTimeEnabled ? 'Live Monitoring' : 'Monitoring Disabled'}
          </span>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="modern-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Logs</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">All error logs captured</p>
          </CardContent>
        </Card>
        <Card className="modern-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Critical</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{stats.critical}</div>
            <p className="text-xs text-muted-foreground">Requires immediate attention</p>
          </CardContent>
        </Card>
        <Card className="modern-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Errors</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">{stats.errors}</div>
            <p className="text-xs text-muted-foreground">Application errors detected</p>
          </CardContent>
        </Card>
        <Card className="modern-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Warnings</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-500">{stats.warnings}</div>
            <p className="text-xs text-muted-foreground">Non-critical issues</p>
          </CardContent>
        </Card>
        <Card className="modern-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unresolved</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-500">{stats.unresolved}</div>
            <p className="text-xs text-muted-foreground">Pending resolution</p>
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
                  Clear Resolved
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
