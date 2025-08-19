import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { RefreshCw, Download, ArrowLeft, Calendar, HardDrive, Shield, Activity, AlertTriangle, CheckCircle, Smartphone, Monitor, Server, Database, FileCheck, DownloadCloud, Clock, Bell, Heart, Globe, Zap, Mail, Cog, Package, FileText, Lock } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useNavigate } from 'react-router-dom';
import { useSecurityUpdates, SecurityUpdate, normalizeUpdateType } from '@/hooks/useSecurityUpdates';
import { useToast } from '@/hooks/use-toast';

export const DATManagement = () => {
  const { updates, isLoading, stats, filterTabs, triggerUpdateFetch } = useSecurityUpdates();
  const [selectedUpdates, setSelectedUpdates] = useState<string[]>([]);
  const { toast } = useToast();
  const navigate = useNavigate();

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
      const selectedUpdatesList = updates.filter(update => 
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

  const getTypeIcon = (type: string, updateCategory?: string) => {
    const normalizedType = normalizeUpdateType(type, updateCategory);
    switch (normalizedType.toLowerCase()) {
      case 'datv3': return <Shield className="h-4 w-4" />;
      case 'meddat': return <Heart className="h-4 w-4" />;
      case 'tie intelligence': return <Globe className="h-4 w-4" />;
      case 'exploit prevention': return <Lock className="h-4 w-4" />;
      case 'amcore': return <Zap className="h-4 w-4" />;
      case 'email dat':
      case 'gateway dat': return <Mail className="h-4 w-4" />;
      case 'engine': return <Cog className="h-4 w-4" />;
      case 'content': return <Package className="h-4 w-4" />;
      case 'epo': return <Shield className="h-4 w-4" />;
      case 'policy templates': return <FileText className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const getTypeColor = (type: string, updateCategory?: string) => {
    const normalizedType = normalizeUpdateType(type, updateCategory);
    switch (normalizedType.toLowerCase()) {
      case 'datv3': return 'destructive';
      case 'meddat': return 'secondary';
      case 'tie intelligence': return 'outline';
      case 'exploit prevention': return 'destructive';
      case 'amcore': return 'secondary';
      case 'email dat':
      case 'gateway dat': return 'outline';
      case 'engine': return 'default';
      case 'content': return 'secondary';
      case 'epo': return 'destructive';
      case 'policy templates': return 'outline';
      default: return 'outline';
    }
  };

  const getCriticalityColor = (level?: string) => {
    switch (level?.toLowerCase()) {
      case 'critical': return 'destructive';
      case 'high': return 'secondary';
      case 'medium': return 'outline';
      case 'low': return 'default';
      default: return 'outline';
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

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center h-32">
          <RefreshCw className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  // Filter updates by normalized type
  const getUpdatesForTab = (tabId: string) => {
    if (tabId === 'all') return updates;
    return updates.filter(update => {
      const normalizedType = normalizeUpdateType(update.type, update.update_category);
      return normalizedType.toLowerCase().replace(/\s+/g, '_') === tabId;
    });
  };

  const renderUpdatesTable = (updates: SecurityUpdate[]) => {
    const isAllSelected = updates.every(u => selectedUpdates.includes(u.id));

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
                      <Badge variant={getTypeColor(update.type, update.update_category)} className="flex items-center gap-1">
                        {getTypeIcon(update.type, update.update_category)}
                        {normalizeUpdateType(update.type, update.update_category)}
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
                        <CheckCircle className="h-3 w-3" />
                        <span>Recommended</span>
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
              {stats.recent > 0 && (
                <Badge variant="destructive" className="flex items-center space-x-1">
                  <Bell className="h-3 w-3" />
                  <span>{stats.recent} New</span>
                </Badge>
              )}
            </h2>
            <p className="text-muted-foreground">Download and manage DAT files, MEDDAT, TIE Intelligence, and security updates</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button onClick={handleRefresh} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Check Updates
          </Button>
          {selectedUpdates.length > 0 && (
            <Button onClick={handleBulkDownload}>
              <DownloadCloud className="h-4 w-4 mr-2" />
              Download Selected ({selectedUpdates.length})
            </Button>
          )}
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Updates</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">All security updates</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Critical</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{stats.critical}</div>
            <p className="text-xs text-muted-foreground">High priority updates</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recommended</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.recommended}</div>
            <p className="text-xs text-muted-foreground">Recommended installs</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Week</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.recent}</div>
            <p className="text-xs text-muted-foreground">Recent releases</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">DATV3</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.byType.DATV3 || 0}</div>
            <p className="text-xs text-muted-foreground">DAT & V3 definitions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">TIE Intel</CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.byType['TIE Intelligence'] || 0}</div>
            <p className="text-xs text-muted-foreground">Threat intelligence</p>
          </CardContent>
        </Card>
      </div>

      {/* Security Updates Tabs */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          {filterTabs.slice(0, 6).map(tab => (
            <TabsTrigger key={tab.id} value={tab.id} className="text-xs">
              {tab.label}
              <Badge variant="secondary" className="ml-1 text-xs">
                {tab.count}
              </Badge>
            </TabsTrigger>
          ))}
        </TabsList>

        {filterTabs.slice(0, 6).map(tab => (
          <TabsContent key={tab.id} value={tab.id} className="space-y-4">
            {renderUpdatesTable(getUpdatesForTab(tab.id))}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};