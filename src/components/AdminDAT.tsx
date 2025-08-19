
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { RefreshCw, Download, CheckCircle, AlertTriangle, Shield, Database, Zap, Globe, Mail, Lock, FileText, Heart, Activity, ArrowLeft, Calendar, Monitor, Package, Cog, HardDrive } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Json } from "@/integrations/supabase/types";

interface SecurityUpdate {
  id: string;
  name: string;
  type: string;
  platform: string;
  version: string;
  release_date: string;
  file_size: number;
  file_name: string;
  sha256?: string;
  description?: string;
  is_recommended: boolean;
  update_category?: string;
  criticality_level?: string;
  target_systems?: string[];
  dependencies?: string[];
  compatibility_info?: any;
  threat_coverage?: string[];
  deployment_notes?: string;
  download_url?: string;
  changelog?: string;
  created_at: string;
  updated_at: string;
  status?: string;
}

// Real-time data from database

const AdminDAT: React.FC = () => {
  const navigate = useNavigate();
  const [securityUpdates, setSecurityUpdates] = useState<SecurityUpdate[]>([]);
  const [selectedUpdates, setSelectedUpdates] = useState<Set<string>>(new Set());
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<string>("ALL");
  const [sortField, setSortField] = useState<string>("");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const { toast } = useToast();

  // Fetch security updates from database
  const fetchSecurityUpdates = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('security_updates')
        .select('*')
        .order('release_date', { ascending: false });

      if (error) {
        console.error('Error fetching security updates:', error);
        toast({
          title: "Error",
          description: "Failed to fetch security updates",
          variant: "destructive",
        });
        return;
      }

      const typedData = data?.map(update => ({
        ...update,
        target_systems: Array.isArray(update.target_systems) 
          ? update.target_systems.map(item => typeof item === 'string' ? item : String(item))
          : [],
        dependencies: Array.isArray(update.dependencies)
          ? update.dependencies.map(item => typeof item === 'string' ? item : String(item))
          : [],
        compatibility_info: update.compatibility_info || {},
        threat_coverage: update.threat_coverage || []
      })) || [];
      
      setSecurityUpdates(typedData as SecurityUpdate[]);
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "Failed to fetch security updates",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSecurityUpdates();
  }, []);

  // Trigger update fetch from external APIs
  const triggerUpdateFetch = async () => {
    try {
      setRefreshing(true);
      const { data, error } = await supabase.functions.invoke('fetch-security-updates');
      
      if (error) {
        console.error('Error triggering update fetch:', error);
        toast({
          title: "Error",
          description: "Failed to fetch latest updates from servers",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Updates Refreshed",
        description: `Found ${data?.new_updates || 0} new updates out of ${data?.updates_found || 0} total`,
      });

      // Refresh the local data
      await fetchSecurityUpdates();
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "Failed to refresh updates",
        variant: "destructive",
      });
    } finally {
      setRefreshing(false);
    }
  };

  // Filter updates based on active filter
  const filteredUpdates = securityUpdates.filter(update => {
    if (activeFilter === "ALL") return true;
    return update.type === activeFilter;
  });

  // Sort updates
  const sortedUpdates = [...filteredUpdates].sort((a, b) => {
    if (!sortField) return 0;
    
    let aVal = a[sortField as keyof SecurityUpdate];
    let bVal = b[sortField as keyof SecurityUpdate];
    
    if (sortField === 'release_date') {
      aVal = new Date(aVal as string).getTime();
      bVal = new Date(bVal as string).getTime();
    } else if (sortField === 'file_size') {
      aVal = Number(aVal);
      bVal = Number(bVal);
    }
    
    if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const getTypeIcon = (type: string): React.ReactNode => {
    const iconMap: Record<string, React.ReactNode> = {
      DATV3: <Zap className="h-4 w-4" />,
      AMCORE: <Activity className="h-4 w-4" />,
      MEDDAT: <Heart className="h-4 w-4" />,
      TIE: <Globe className="h-4 w-4" />,
      EXPLOIT_PREVENTION: <Lock className="h-4 w-4" />,
      ENGINES: <Cog className="h-4 w-4" />,
      CONTENT: <Package className="h-4 w-4" />
    };
    return iconMap[type] || <Database className="h-4 w-4" />;
  };

  const getPlatformIcon = (platform: string): React.ReactNode => {
    const iconMap: Record<string, React.ReactNode> = {
      Windows: <Monitor className="h-4 w-4" />,
      Linux: <HardDrive className="h-4 w-4" />,
      macOS: <Monitor className="h-4 w-4" />,
      "Cross-Platform": <Globe className="h-4 w-4" />
    };
    return iconMap[platform] || <Monitor className="h-4 w-4" />;
  };

  const getTypeColor = (type: string): "default" | "secondary" | "destructive" | "outline" => {
    const colorMap: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      DATV3: "destructive", 
      AMCORE: "default",
      MEDDAT: "secondary",
      TIE: "outline",
      EXPLOIT_PREVENTION: "destructive",
      ENGINES: "secondary",
      CONTENT: "default"
    };
    return colorMap[type] || "default";
  };

  const getCriticalityColor = (level?: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (level?.toLowerCase()) {
      case 'critical': return "destructive";
      case 'high': return "destructive";
      case 'medium': return "secondary";
      case 'low': return "outline";
      default: return "default";
    }
  };

  const formatFileSize = (bytes: number): string => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleSelectUpdate = (updateId: string, checked: boolean) => {
    setSelectedUpdates(prev => {
      const newSet = new Set(prev);
      if (checked) {
        newSet.add(updateId);
      } else {
        newSet.delete(updateId);
      }
      return newSet;
    });
  };

  const handleSelectAll = (updates: SecurityUpdate[], checked: boolean) => {
    setSelectedUpdates(prev => {
      const newSet = new Set(prev);
      updates.forEach(update => {
        if (checked) {
          newSet.add(update.id);
        } else {
          newSet.delete(update.id);
        }
      });
      return newSet;
    });
  };

  const handleDownload = (update: SecurityUpdate) => {
    if (update.download_url) {
      window.open(update.download_url, '_blank');
    } else {
      toast({
        title: "Download Unavailable",
        description: "Direct download link is not available for this update.",
        variant: "destructive",
      });
    }
  };

  const handleBulkDownload = () => {
    const selectedUpdatesList = securityUpdates.filter(update => 
      selectedUpdates.has(update.id) && update.download_url
    );
    
    selectedUpdatesList.forEach(update => {
      if (update.download_url) {
        // Simulate download
        toast({
          title: "Download Started",
          description: `Downloading ${update.name}...`,
        });
      }
    });
    
    toast({
      title: "Downloads Started",
      description: `Started downloading ${selectedUpdatesList.length} security updates.`,
    });
  };

  const getUpdateStats = () => {
    return {
      datFiles: securityUpdates.filter(u => u.type === 'DATV3').length,
      meddatFiles: securityUpdates.filter(u => u.type === 'MEDDAT').length,
      tieIntelligence: securityUpdates.filter(u => u.type === 'TIE').length,
      exploitPrevention: securityUpdates.filter(u => u.type === 'EXPLOIT_PREVENTION').length,
      engines: securityUpdates.filter(u => u.type === 'ENGINES').length,
      content: securityUpdates.filter(u => u.type === 'CONTENT').length
    };
  };

  const stats = getUpdateStats();

  const renderUpdatesTable = (updates: SecurityUpdate[]) => (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">
              <Checkbox
                checked={updates.length > 0 && updates.every(update => selectedUpdates.has(update.id))}
                onCheckedChange={(checked) => handleSelectAll(updates, checked as boolean)}
              />
            </TableHead>
            <TableHead 
              className="cursor-pointer hover:bg-muted/50"
              onClick={() => handleSort('name')}
            >
              Name {sortField === 'name' && (sortDirection === 'asc' ? '↑' : '↓')}
            </TableHead>
            <TableHead className="text-center">Platform</TableHead>
            <TableHead 
              className="cursor-pointer hover:bg-muted/50"
              onClick={() => handleSort('version')}
            >
              Version {sortField === 'version' && (sortDirection === 'asc' ? '↑' : '↓')}
            </TableHead>
            <TableHead 
              className="cursor-pointer hover:bg-muted/50"
              onClick={() => handleSort('release_date')}
            >
              Release Date {sortField === 'release_date' && (sortDirection === 'asc' ? '↑' : '↓')}
            </TableHead>
            <TableHead 
              className="cursor-pointer hover:bg-muted/50"
              onClick={() => handleSort('file_size')}
            >
              File Size {sortField === 'file_size' && (sortDirection === 'asc' ? '↑' : '↓')}
            </TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {updates.map((update) => (
            <TableRow key={update.id} className="hover:bg-muted/50">
              <TableCell>
                <Checkbox
                  checked={selectedUpdates.has(update.id)}
                  onCheckedChange={(checked) => handleSelectUpdate(update.id, checked as boolean)}
                />
              </TableCell>
              <TableCell>
                <div className="flex items-center space-x-3">
                  <Badge variant={getTypeColor(update.type)} className="px-2 py-1">
                    {update.type}
                  </Badge>
                  <div>
                    <div className="font-medium text-sm">{update.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {update.file_name}
                    </div>
                  </div>
                  {update.is_recommended && (
                    <Badge variant="outline" className="text-xs">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Recommended
                    </Badge>
                  )}
                </div>
              </TableCell>
              <TableCell className="text-center">
                <div className="flex items-center justify-center space-x-2">
                  {getPlatformIcon(update.platform)}
                  <span className="text-sm">{update.platform}</span>
                </div>
              </TableCell>
              <TableCell>
                <Badge variant="outline" className="font-mono">
                  {update.version}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    {new Date(update.release_date).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
              </TableCell>
              <TableCell>
                <span className="text-sm font-medium">
                  {formatFileSize(update.file_size)}
                </span>
              </TableCell>
              <TableCell>
                <Badge variant={getCriticalityColor(update.criticality_level)}>
                  {update.criticality_level}
                </Badge>
              </TableCell>
              <TableCell>
                <Button
                  size="sm"
                  onClick={() => handleDownload(update)}
                  disabled={!update.download_url}
                  className="h-8"
                >
                  <Download className="h-3 w-3 mr-1" />
                  Download
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <RefreshCw className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading security updates...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      {/* Header */}
      <header className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center space-x-8">
              <h1 className="text-2xl font-bold text-primary">Trellix</h1>
              <nav className="hidden md:flex items-center space-x-6">
                <a href="#" className="text-sm text-muted-foreground hover:text-foreground">Features</a>
                <a href="#" className="text-sm text-muted-foreground hover:text-foreground">Architecture</a>
                <a href="#" className="text-sm text-muted-foreground hover:text-foreground">Documentation</a>
                <a href="#" className="text-sm text-muted-foreground hover:text-foreground">Support & Resources</a>
              </nav>
            </div>
            
            {/* Right side */}
            <div className="flex items-center space-x-4">
              <Badge variant="secondary">Admin DAT</Badge>
              <Button variant="outline" size="sm">Contact Admin</Button>
              <span className="text-sm text-muted-foreground">Welcome, Admin!</span>
              <Button variant="ghost" size="sm">Logout</Button>
            </div>
          </div>
        </div>
      </header>

      {/* Page Header */}
      <div className="container mx-auto px-6 py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center space-x-4 mb-2">
              <h2 className="text-3xl font-bold">Admin Portal</h2>
              <Badge variant="destructive">ADMIN</Badge>
            </div>
            
            {/* Sub Navigation */}
            <nav className="flex items-center space-x-6 mb-4">
              {['Downloads', 'Users', 'Agents', 'Updates', 'Trellix ePO', 'Messages', 'Security', 'Audit Log', 'Analytics'].map((item) => (
                <a 
                  key={item}
                  href="#" 
                  className={`text-sm px-3 py-2 rounded-md transition-colors ${
                    item === 'Updates' 
                      ? 'bg-primary text-primary-foreground' 
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  }`}
                >
                  {item}
                </a>
              ))}
            </nav>
          </div>
        </div>

        {/* Breadcrumb & Actions */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => navigate(-1)}
              className="hover:bg-muted"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h3 className="text-2xl font-semibold">DAT Files Management</h3>
              <p className="text-muted-foreground text-sm">
                Download and manage DAT files, MEDDAT, TIE Intelligence, and security updates
              </p>
            </div>
          </div>
          <Button onClick={triggerUpdateFetch} disabled={refreshing} className="bg-primary hover:bg-primary/90">
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Check Updates
          </Button>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <Card className="bg-card/50 backdrop-blur-sm border-border/50">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="p-3 rounded-lg bg-primary/10">
                  <Zap className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.datFiles}</p>
                  <p className="text-sm text-muted-foreground">DAT & V3 definitions</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-card/50 backdrop-blur-sm border-border/50">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="p-3 rounded-lg bg-destructive/10">
                  <Heart className="h-6 w-6 text-destructive" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.meddatFiles}</p>
                  <p className="text-sm text-muted-foreground">Medical device security</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-card/50 backdrop-blur-sm border-border/50">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="p-3 rounded-lg bg-blue-500/10">
                  <Globe className="h-6 w-6 text-blue-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.tieIntelligence}</p>
                  <p className="text-sm text-muted-foreground">Threat intelligence feeds</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-card/50 backdrop-blur-sm border-border/50">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="p-3 rounded-lg bg-orange-500/10">
                  <Lock className="h-6 w-6 text-orange-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.exploitPrevention}</p>
                  <p className="text-sm text-muted-foreground">Zero-day protection</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-card/50 backdrop-blur-sm border-border/50">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="p-3 rounded-lg bg-green-500/10">
                  <Cog className="h-6 w-6 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.engines}</p>
                  <p className="text-sm text-muted-foreground">Security engines</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-card/50 backdrop-blur-sm border-border/50">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="p-3 rounded-lg bg-purple-500/10">
                  <Package className="h-6 w-6 text-purple-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.content}</p>
                  <p className="text-sm text-muted-foreground">Content packages</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filter Tabs */}
        <div className="mb-6">
          <div className="flex flex-wrap gap-2">
            {['ALL', 'DATV3', 'MEDDAT', 'TIE', 'EXPLOIT_PREVENTION', 'ENGINES', 'CONTENT'].map((filter) => (
              <Button
                key={filter}
                variant={activeFilter === filter ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveFilter(filter)}
                className="transition-all"
              >
                {filter === 'ALL' ? 'All Updates' : 
                 filter === 'DATV3' ? 'DAT Files' :
                 filter === 'MEDDAT' ? 'MEDDAT Files' :
                 filter === 'TIE' ? 'TIE Intelligence' :
                 filter === 'EXPLOIT_PREVENTION' ? 'Exploit Prevention' :
                 filter === 'ENGINES' ? 'Engines' :
                 'Content'}
              </Button>
            ))}
          </div>
        </div>

        {/* Data Table */}
        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl">All Security Updates</CardTitle>
                <p className="text-sm text-muted-foreground">
                  {selectedUpdates.size > 0 
                    ? `${selectedUpdates.size} of ${filteredUpdates.length} selected`
                    : `${filteredUpdates.length} updates available`
                  }
                </p>
              </div>
              {selectedUpdates.size > 0 && (
                <Button onClick={handleBulkDownload} className="bg-primary hover:bg-primary/90">
                  <Download className="h-4 w-4 mr-2" />
                  Download Selected ({selectedUpdates.size})
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {renderUpdatesTable(sortedUpdates)}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDAT;
