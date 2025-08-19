import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { RefreshCw, Download, CheckCircle, AlertTriangle, Shield, Database, Zap, Globe, Mail, Lock, FileText, Heart, Activity, ArrowLeft, Calendar, Monitor, Package, Cog, HardDrive } from "lucide-react";
import { useSecurityUpdates, SecurityUpdate, normalizeUpdateType } from "@/hooks/useSecurityUpdates";
import { useToast } from "@/hooks/use-toast";

const AdminDAT: React.FC = () => {
  const navigate = useNavigate();
  const { updates, isLoading, stats, filterTabs, triggerUpdateFetch } = useSecurityUpdates();
  const [selectedUpdates, setSelectedUpdates] = useState<Set<string>>(new Set());
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [sortField, setSortField] = useState<string>("");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const { toast } = useToast();

  // Filter updates based on active filter
  const filteredUpdates = updates.filter(update => {
    if (activeFilter === "all") return true;
    const normalizedType = normalizeUpdateType(update.type, update.update_category);
    return normalizedType.toLowerCase().replace(/\s+/g, '_') === activeFilter;
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

  const getTypeIcon = (type: string, updateCategory?: string): React.ReactNode => {
    const normalizedType = normalizeUpdateType(type, updateCategory);
    switch (normalizedType.toLowerCase()) {
      case 'datv3': return <Zap className="h-4 w-4" />;
      case 'amcore': return <Activity className="h-4 w-4" />;
      case 'meddat': return <Heart className="h-4 w-4" />;
      case 'tie intelligence': return <Globe className="h-4 w-4" />;
      case 'exploit prevention': return <Lock className="h-4 w-4" />;
      case 'engine': return <Cog className="h-4 w-4" />;
      case 'content': return <Package className="h-4 w-4" />;
      case 'epo': return <Shield className="h-4 w-4" />;
      case 'policy templates': return <FileText className="h-4 w-4" />;
      case 'email dat': return <Mail className="h-4 w-4" />;
      case 'gateway dat': return <Mail className="h-4 w-4" />;
      default: return <Database className="h-4 w-4" />;
    }
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

  const getTypeColor = (type: string, updateCategory?: string): "default" | "secondary" | "destructive" | "outline" => {
    const normalizedType = normalizeUpdateType(type, updateCategory);
    switch (normalizedType.toLowerCase()) {
      case 'datv3': return "destructive"; 
      case 'amcore': return "default";
      case 'meddat': return "secondary";
      case 'tie intelligence': return "outline";
      case 'exploit prevention': return "destructive";
      case 'engine': return "secondary";
      case 'content': return "default";
      case 'epo': return "destructive";
      case 'policy templates': return "outline";
      default: return "default";
    }
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
    const selectedUpdatesList = updates.filter(update => 
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
                  <Badge variant={getTypeColor(update.type, update.update_category)} className="px-2 py-1">
                    {getTypeIcon(update.type, update.update_category)}
                    <span className="ml-1">{normalizeUpdateType(update.type, update.update_category)}</span>
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

  if (isLoading) {
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
            
            {/* Breadcrumb */}
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <span>Home</span>
              <span>/</span>
              <span>Admin Portal</span>
              <span>/</span>
              <span className="text-foreground">Security Updates</span>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <Button 
              onClick={triggerUpdateFetch} 
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Check Updates
            </Button>
          </div>
        </div>

        <div className="space-y-6">
          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Updates</p>
                    <p className="text-2xl font-bold">{stats.total}</p>
                  </div>
                  <Database className="h-8 w-8 text-primary" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Critical Updates</p>
                    <p className="text-2xl font-bold text-destructive">{stats.critical}</p>
                  </div>
                  <AlertTriangle className="h-8 w-8 text-destructive" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Recommended</p>
                    <p className="text-2xl font-bold text-green-600">{stats.recommended}</p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">This Week</p>
                    <p className="text-2xl font-bold text-blue-600">{stats.recent}</p>
                  </div>
                  <Calendar className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filter Tabs */}
          <Tabs value={activeFilter} onValueChange={setActiveFilter} className="mb-6">
            <TabsList className="grid w-full grid-cols-6">
              {filterTabs.slice(0, 6).map(tab => (
                <TabsTrigger key={tab.id} value={tab.id}>
                  {tab.label} ({tab.count})
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value={activeFilter} className="space-y-4">
              {selectedUpdates.size > 0 && (
                <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                  <span className="text-sm font-medium">
                    {selectedUpdates.size} updates selected
                  </span>
                  <Button onClick={handleBulkDownload} size="sm">
                    <Download className="h-4 w-4 mr-1" />
                    Download Selected
                  </Button>
                </div>
              )}
              {renderUpdatesTable(sortedUpdates)}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default AdminDAT;