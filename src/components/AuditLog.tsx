import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { 
  Activity, 
  Search, 
  Filter, 
  Download, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  User,
  Shield,
  Database,
  Settings
} from "lucide-react";

interface SecurityEvent {
  id: string;
  userId: string;
  action: string;
  timestamp: string;
  ipAddress: string;
  userAgent: string;
  success: boolean;
  details: string;
  category: 'auth' | 'data' | 'admin' | 'security';
}

export const AuditLog = () => {
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<SecurityEvent[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("all");

  useEffect(() => {
    loadEvents();
  }, []);

  useEffect(() => {
    filterEvents();
  }, [events, searchTerm, categoryFilter, statusFilter, dateFilter]);

  const loadEvents = () => {
    const savedEvents = localStorage.getItem('security_events');
    if (savedEvents) {
      const parsedEvents = JSON.parse(savedEvents);
      setEvents(parsedEvents.sort((a: SecurityEvent, b: SecurityEvent) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      ));
    }
  };

  const generateSampleEvents = () => {
    const sampleEvents: SecurityEvent[] = [
      {
        id: '1',
        userId: 'admin@trellix.com',
        action: 'Admin Login',
        timestamp: new Date(Date.now() - 30000).toISOString(),
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        success: true,
        details: 'Successful admin authentication',
        category: 'auth'
      },
      {
        id: '2',
        userId: 'user@company.com',
        action: 'Failed Login Attempt',
        timestamp: new Date(Date.now() - 120000).toISOString(),
        ipAddress: '203.0.113.42',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        success: false,
        details: 'Invalid password - 3rd attempt',
        category: 'auth'
      },
      {
        id: '3',
        userId: 'admin@trellix.com',
        action: 'User Management Access',
        timestamp: new Date(Date.now() - 300000).toISOString(),
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        success: true,
        details: 'Accessed user management dashboard',
        category: 'admin'
      },
      {
        id: '4',
        userId: 'system',
        action: 'Security Scan Completed',
        timestamp: new Date(Date.now() - 600000).toISOString(),
        ipAddress: '127.0.0.1',
        userAgent: 'Trellix-Scanner/1.0',
        success: true,
        details: 'Automated vulnerability scan completed - no issues found',
        category: 'security'
      },
      {
        id: '5',
        userId: 'admin@trellix.com',
        action: 'Configuration Change',
        timestamp: new Date(Date.now() - 900000).toISOString(),
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        success: true,
        details: 'Updated security policy settings',
        category: 'admin'
      }
    ];

    localStorage.setItem('security_events', JSON.stringify(sampleEvents));
    setEvents(sampleEvents);
  };

  const filterEvents = () => {
    let filtered = events;

    if (searchTerm) {
      filtered = filtered.filter(event => 
        event.userId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.ipAddress.includes(searchTerm)
      );
    }

    if (categoryFilter !== "all") {
      filtered = filtered.filter(event => event.category === categoryFilter);
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter(event => 
        statusFilter === "success" ? event.success : !event.success
      );
    }

    if (dateFilter !== "all") {
      const now = new Date();
      const filterDate = new Date();
      
      switch (dateFilter) {
        case "today":
          filterDate.setHours(0, 0, 0, 0);
          break;
        case "week":
          filterDate.setDate(now.getDate() - 7);
          break;
        case "month":
          filterDate.setMonth(now.getMonth() - 1);
          break;
      }

      if (dateFilter !== "all") {
        filtered = filtered.filter(event => 
          new Date(event.timestamp) >= filterDate
        );
      }
    }

    setFilteredEvents(filtered);
  };

  const exportAuditLog = () => {
    const csvContent = [
      'Timestamp,User ID,Action,Status,IP Address,Details',
      ...filteredEvents.map(event => 
        `"${event.timestamp}","${event.userId}","${event.action}","${event.success ? 'Success' : 'Failed'}","${event.ipAddress}","${event.details}"`
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `audit-log-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'auth':
        return <User className="h-4 w-4" />;
      case 'admin':
        return <Settings className="h-4 w-4" />;
      case 'security':
        return <Shield className="h-4 w-4" />;
      case 'data':
        return <Database className="h-4 w-4" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'auth':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'admin':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'security':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'data':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Activity className="h-6 w-6 text-primary" />
          <h3 className="text-2xl font-bold">Security Audit Log</h3>
        </div>
        <Button onClick={exportAuditLog} variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Export Log
        </Button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Events</p>
                <p className="text-2xl font-bold">{events.length}</p>
              </div>
              <Activity className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Successful Actions</p>
                <p className="text-2xl font-bold text-green-600">
                  {events.filter(e => e.success).length}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Failed Actions</p>
                <p className="text-2xl font-bold text-red-600">
                  {events.filter(e => !e.success).length}
                </p>
              </div>
              <XCircle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Security Events</p>
                <p className="text-2xl font-bold text-orange-600">
                  {events.filter(e => e.category === 'security').length}
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Filter className="h-5 w-5" />
            <span>Filters</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search events..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Category</label>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="auth">Authentication</SelectItem>
                  <SelectItem value="admin">Administration</SelectItem>
                  <SelectItem value="security">Security</SelectItem>
                  <SelectItem value="data">Data Access</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="success">Success</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Time Range</label>
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">Last Week</SelectItem>
                  <SelectItem value="month">Last Month</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Events List */}
      <Card>
        <CardHeader>
          <CardTitle>Security Events ({filteredEvents.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredEvents.length === 0 ? (
              <div className="text-center py-8">
                <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No events found matching your criteria</p>
              </div>
            ) : (
              filteredEvents.map((event) => (
                <div key={event.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      {event.success ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-600" />
                      )}
                      <Badge className={getCategoryColor(event.category)}>
                        {getCategoryIcon(event.category)}
                        <span className="ml-1">{event.category.toUpperCase()}</span>
                      </Badge>
                    </div>
                    <div>
                      <p className="font-medium">{event.action}</p>
                      <p className="text-sm text-muted-foreground">
                        {event.userId} • {event.ipAddress}
                      </p>
                      <p className="text-sm text-muted-foreground">{event.details}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">
                      {new Date(event.timestamp).toLocaleString()}
                    </p>
                    <Badge variant={event.success ? "default" : "destructive"}>
                      {event.success ? "SUCCESS" : "FAILED"}
                    </Badge>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};