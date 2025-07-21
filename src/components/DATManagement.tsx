
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { RefreshCw, Download, ArrowLeft, Calendar, HardDrive, Shield, Activity, AlertTriangle, CheckCircle, Smartphone, Monitor, Server, Database, FileCheck, DownloadCloud, Clock, Bell, Heart, Globe, Zap, Mail, Cog, Package, FileText, Lock } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

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
}

export const DATManagement = () => {
  const [refreshing, setRefreshing] = useState(false);
  const [selectedUpdates, setSelectedUpdates] = useState<string[]>([]);
  const [notifications, setNotifications] = useState<number>(0);
  const [securityUpdatesState, setSecurityUpdatesState] = useState<SecurityUpdate[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Fetch security updates from Supabase
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
      
      setSecurityUpdatesState(typedData as SecurityUpdate[]);
      
      // Count new updates (released within last 7 days)
      const newUpdatesCount = data?.filter(update => {
        const releaseDate = new Date(update.release_date);
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        return releaseDate > sevenDaysAgo;
      }).length || 0;
      
      setNotifications(newUpdatesCount);
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
        description: `Found ${data.new_updates} new updates out of ${data.updates_found} total`,
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

  // Load data on component mount
  useEffect(() => {
    fetchSecurityUpdates();
  }, []);

  const handleDownload = (update: SecurityUpdate) => {
    if (update.download_url) {
      window.open(update.download_url, '_blank');
      toast({
        title: "Download Started",
        description: `${update.name} download initiated for ${update.platform}`,
      });
    } else {
      toast({
        title: "Download Unavailable",
        description: "Direct download link is not available for this update.",
        variant: "destructive",
      });
    }
  };

  const handleRefresh = async () => {
    await triggerUpdateFetch();
  };

  const handleBulkDownload = () => {
    if (selectedUpdates.length === 0) {
      toast({
        title: "No Updates Selected",
        description: "Please select at least one update to download.",
        variant: "destructive",
      });
      return;
    }

    const confirmDownload = window.confirm(
      `Download ${selectedUpdates.length} selected updates?\n\nThis will download all selected security updates for all platforms.`
    );

    if (confirmDownload) {
      const selectedUpdatesList = securityUpdatesState.filter(update => 
        selectedUpdates.includes(update.id) && update.download_url
      );
      
      selectedUpdatesList.forEach(update => {
        if (update.download_url) {
          window.open(update.download_url, '_blank');
        }
      });

      toast({
        title: "Downloads Started",
        description: `Started downloading ${selectedUpdatesList.length} security updates.`,
      });

      setSelectedUpdates([]);
    }
  };

  const handleSelectUpdate = (updateId: string, checked: boolean) => {
    if (checked) {
      setSelectedUpdates([...selectedUpdates, updateId]);
    } else {
      setSelectedUpdates(selectedUpdates.filter(id => id !== updateId));
    }
  };

  const handleSelectAll = (updates: SecurityUpdate[], checked: boolean) => {
    if (checked) {
      const newSelections = updates.map(u => u.id).filter(id => !selectedUpdates.includes(id));
      setSelectedUpdates([...selectedUpdates, ...newSelections]);
    } else {
      const updateIds = updates.map(u => u.id);
      setSelectedUpdates(selectedUpdates.filter(id => !updateIds.includes(id)));
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'dat':
      case 'datv3':
        return <Shield className="h-4 w-4" />;
      case 'meddat':
        return <Heart className="h-4 w-4" />;
      case 'tie':
        return <Globe className="h-4 w-4" />;
      case 'exploit_prevention':
        return <Lock className="h-4 w-4" />;
      case 'amcore_dat':
        return <Zap className="h-4 w-4" />;
      case 'gateway_dat':
      case 'email_dat':
        return <Mail className="h-4 w-4" />;
      case 'engine':
        return <Cog className="h-4 w-4" />;
      case 'content':
        return <Package className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'dat':
      case 'datv3':
        return 'destructive';
      case 'meddat':
        return 'secondary';
      case 'tie':
        return 'outline';
      case 'exploit_prevention':
        return 'destructive';
      case 'amcore_dat':
        return 'secondary';
      case 'gateway_dat':
      case 'email_dat':
        return 'outline';
      case 'engine':
        return 'default';
      case 'content':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const getCriticalityColor = (level?: string) => {
    switch (level?.toLowerCase()) {
      case 'critical':
        return 'destructive';
      case 'high':
        return 'secondary';
      case 'medium':
        return 'outline';
      case 'low':
        return 'default';
      default:
        return 'outline';
    }
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'windows': return <Monitor className="h-3 w-3" />;
      case 'macos': return <Smartphone className="h-3 w-3" />;
      case 'linux': return <Server className="h-3 w-3" />;
      default: return <Monitor className="h-3 w-3" />;
    }
  };

  const formatFileSize = (bytes: number): string => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center h-32">
          <RefreshCw className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  const datUpdates = securityUpdatesState.filter(u => u.type === 'dat' || u.type === 'datv3');
  const meddatUpdates = securityUpdatesState.filter(u => u.type === 'meddat');
  const tieUpdates = securityUpdatesState.filter(u => u.type === 'tie');
  const exploitPreventionUpdates = securityUpdatesState.filter(u => u.type === 'exploit_prevention');
  const engineUpdates = securityUpdatesState.filter(u => u.type === 'engine');
  const contentUpdates = securityUpdatesState.filter(u => u.type === 'content');

  const renderUpdatesTable = (updates: SecurityUpdate[]) => {
    const isAllSelected = updates.every(u => selectedUpdates.includes(u.id));
    const isSomeSelected = updates.some(u => selectedUpdates.includes(u.id));

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Checkbox
              checked={isAllSelected}
              onCheckedChange={(checked) => handleSelectAll(updates, checked as boolean)}
              className="mr-2"
            />
            <span className="text-sm font-medium">
              Select All ({selectedUpdates.filter(id => updates.find(u => u.id === id)).length} of {updates.length} selected)
            </span>
          </div>
          {selectedUpdates.length > 0 && (
            <Button
              onClick={handleBulkDownload}
              className="flex items-center space-x-2"
            >
              <DownloadCloud className="h-4 w-4" />
              <span>Bulk Download ({selectedUpdates.length})</span>
            </Button>
          )}
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">Select</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Platform</TableHead>
              <TableHead>Version</TableHead>
              <TableHead>Release Date</TableHead>
              <TableHead>File Size</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {updates.map((update) => (
              <TableRow key={update.id} className={selectedUpdates.includes(update.id) ? "bg-muted/50" : ""}>
                <TableCell>
                  <Checkbox
                    checked={selectedUpdates.includes(update.id)}
                    onCheckedChange={(checked) => handleSelectUpdate(update.id, checked as boolean)}
                  />
                </TableCell>
                <TableCell>
                  <div className="flex flex-col space-y-1">
                    <div className="flex gap-2">
                      <Badge variant={getTypeColor(update.type)} className="flex items-center gap-1">
                        {getTypeIcon(update.type)}
                        {update.type.toUpperCase().replace('_', ' ')}
                      </Badge>
                      {update.criticality_level && (
                        <Badge variant={getCriticalityColor(update.criticality_level)}>
                          {update.criticality_level.toUpperCase()}
                        </Badge>
                      )}
                    </div>
                    <div className="text-sm font-medium text-foreground">{update.name}</div>
                    <div className="text-xs text-muted-foreground font-mono">
                      {update.file_name}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-2">
                    {getPlatformIcon(update.platform)}
                    <Badge variant="outline">{update.platform}</Badge>
                  </div>
                </TableCell>
                <TableCell className="font-mono">{update.version}</TableCell>
                <TableCell>
                  <div className="flex items-center space-x-2">
                    <Clock className="h-3 w-3 text-muted-foreground" />
                    <span>{formatDate(update.release_date)}</span>
                  </div>
                </TableCell>
                <TableCell className="font-medium">{formatFileSize(update.file_size)}</TableCell>
                <TableCell>
                  <div className="flex items-center space-x-2">
                    {update.is_recommended && (
                      <Badge variant="default" className="flex items-center space-x-1">
                        <AlertTriangle className="h-3 w-3" />
                        <span>Critical</span>
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Button
                    variant="outline" 
                    size="sm"
                    onClick={() => handleDownload(update)}
                    disabled={!update.download_url}
                  >
                    <Download className="h-4 w-4 mr-1" />
                    Download
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => navigate(-1)}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back</span>
          </Button>
          <div>
            <h2 className="text-2xl font-bold text-primary flex items-center space-x-3">
              <span>DAT Files Management</span>
              {notifications > 0 && (
                <Badge variant="destructive" className="flex items-center space-x-1">
                  <Bell className="h-3 w-3" />
                  <span>{notifications} New</span>
                </Badge>
              )}
            </h2>
            <p className="text-muted-foreground">Download and manage DAT files, MEDDAT, TIE Intelligence, and security updates</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button onClick={handleRefresh} disabled={refreshing} variant="outline">
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Checking...' : 'Check Updates'}
          </Button>
          {selectedUpdates.length > 0 && (
            <Button onClick={handleBulkDownload}>
              <DownloadCloud className="h-4 w-4 mr-2" />
              Download Selected ({selectedUpdates.length})
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">DAT Files</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{datUpdates.length}</div>
            <p className="text-xs text-muted-foreground">DAT & V3 definitions</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">MEDDAT Files</CardTitle>
            <Heart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{meddatUpdates.length}</div>
            <p className="text-xs text-muted-foreground">Medical device security</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">TIE Intelligence</CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{tieUpdates.length}</div>
            <p className="text-xs text-muted-foreground">Threat intelligence feeds</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Exploit Prevention</CardTitle>
            <Lock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{exploitPreventionUpdates.length}</div>
            <p className="text-xs text-muted-foreground">Zero-day protection</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Engines</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{engineUpdates.length}</div>
            <p className="text-xs text-muted-foreground">Security engines</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Content</CardTitle>
            <FileCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{contentUpdates.length}</div>
            <p className="text-xs text-muted-foreground">Content packages</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="all">All Updates</TabsTrigger>
          <TabsTrigger value="dat">DAT Files</TabsTrigger>
          <TabsTrigger value="meddat">MEDDAT Files</TabsTrigger>
          <TabsTrigger value="tie">TIE Intelligence</TabsTrigger>
          <TabsTrigger value="exploit_prevention">Exploit Prevention</TabsTrigger>
          <TabsTrigger value="engines">Engines</TabsTrigger>
          <TabsTrigger value="content">Content</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>All Security Updates</CardTitle>
            </CardHeader>
            <CardContent>
              {renderUpdatesTable(securityUpdatesState)}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="dat" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>DAT Files (Virus Definitions & V3)</CardTitle>
              <CardDescription>
                Traditional and next-generation virus definition files for comprehensive threat protection
              </CardDescription>
            </CardHeader>
            <CardContent>
              {renderUpdatesTable(datUpdates)}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="meddat" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>MEDDAT Files (Medical Device Security)</CardTitle>
              <CardDescription>
                Specialized threat definitions for medical device security and healthcare networks
              </CardDescription>
            </CardHeader>
            <CardContent>
              {renderUpdatesTable(meddatUpdates)}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tie" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>TIE Intelligence Updates</CardTitle>
              <CardDescription>
                Global threat intelligence feeds with real-time reputation data and file reputation scoring
              </CardDescription>
            </CardHeader>
            <CardContent>
              {renderUpdatesTable(tieUpdates)}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="exploit_prevention" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Exploit Prevention Content</CardTitle>
              <CardDescription>
                Zero-day exploit protection rules, behavioral heuristics, and vulnerability shields
              </CardDescription>
            </CardHeader>
            <CardContent>
              {renderUpdatesTable(exploitPreventionUpdates)}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="engines" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Security Engines</CardTitle>
            </CardHeader>
            <CardContent>
              {renderUpdatesTable(engineUpdates)}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="content" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Content Packages</CardTitle>
            </CardHeader>
            <CardContent>
              {renderUpdatesTable(contentUpdates)}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
