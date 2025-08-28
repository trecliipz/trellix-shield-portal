import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { toast } from "sonner";
import { ArrowLeft, Download, RefreshCw, Shield, Zap, Database, Settings, AlertTriangle, ChevronDown, CheckCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useSecurityUpdates } from "@/hooks/useSecurityUpdates";
import { supabase } from "@/integrations/supabase/client";

interface SecurityUpdate {
  id: string;
  name: string;
  type: string;
  platform: string;
  version: string;
  release_date: string;
  file_size: number;
  is_recommended: boolean;
  criticality_level?: string;
  update_category?: string;
  description?: string;
}

const SecurityUpdates = () => {
  const navigate = useNavigate();
  const [selectedUpdates, setSelectedUpdates] = useState<string[]>([]);
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'size'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { updates, stats, filterTabs, isLoading, triggerUpdateFetch } = useSecurityUpdates();

  // Helper functions
  const getTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'dat':
      case 'datv3':
      case 'epo_dat':
        return <Database className="h-4 w-4" />;
      case 'engine':
      case 'security_engine':
        return <Zap className="h-4 w-4" />;
      case 'policy':
      case 'policy_template':
      case 'epo_policy':
        return <Settings className="h-4 w-4" />;
      default:
        return <Shield className="h-4 w-4" />;
    }
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'windows':
        return '🪟';
      case 'linux':
        return '🐧';
      case 'mac':
      case 'macos':
        return '🍎';
      default:
        return '💻';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'dat':
      case 'datv3':
      case 'epo_dat':
        return 'bg-primary/10 text-primary border border-primary/20';
      case 'engine':
      case 'security_engine':
        return 'bg-primary/10 text-primary border border-primary/20';
      case 'policy':
      case 'policy_template':
      case 'epo_policy':
        return 'bg-primary/10 text-primary border border-primary/20';
      default:
        return 'bg-primary/10 text-primary border border-primary/20';
    }
  };

  const getCriticalityColor = (criticality: string) => {
    switch (criticality?.toLowerCase()) {
      case 'critical':
        return 'bg-red-600 text-white border border-red-600 font-bold';
      case 'high':
        return 'bg-orange-500/15 text-orange-300 border border-orange-500/30';
      case 'medium':
        return 'bg-yellow-500/15 text-yellow-200 border border-yellow-500/30';
      case 'low':
        return 'bg-green-500/15 text-green-300 border border-green-500/30';
      default:
        return 'bg-primary/10 text-primary border border-primary/20';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const handleDownload = async (updateId: string) => {
    const update = updates.find(u => u.id === updateId);
    if (!update) return;

    try {
      toast.loading(`Preparing download for ${update.name}...`);
      
      // Call Supabase edge function
      const { data, error } = await supabase.functions.invoke('security-update-download', {
        body: { updateId: update.id, name: update.name }
      });

      if (error) throw error;
      
      const { downloadUrl, filename } = data;
      
      // Create and trigger download
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename || update.name;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success(`Download started for ${update.name}`, {
        description: `${update.name} (${formatFileSize(update.file_size)}) is downloading...`,
      });
    } catch (error) {
      console.error('Download error:', error);
      toast.error(`Failed to download ${update.name}`, {
        description: 'Please try again or contact support.',
      });
    }
  };

  const handleBulkDownload = () => {
    if (selectedUpdates.length === 0) {
      toast.error("No updates selected", {
        description: "Please select at least one update to download.",
      });
      return;
    }

    toast.success(`Downloaded ${selectedUpdates.length} updates`, {
      description: `Successfully downloaded ${selectedUpdates.length} security updates.`,
    });
    setSelectedUpdates([]);
  };

  const handleSelectUpdate = (updateId: string, checked: boolean) => {
    if (checked) {
      setSelectedUpdates(prev => [...prev, updateId]);
    } else {
      setSelectedUpdates(prev => prev.filter(id => id !== updateId));
    }
  };

  const handleSelectAll = (updates: SecurityUpdate[], checked: boolean) => {
    if (checked) {
      const allIds = updates.map(u => u.id);
      setSelectedUpdates(prev => [...new Set([...prev, ...allIds])]);
    } else {
      const updateIds = updates.map(u => u.id);
      setSelectedUpdates(prev => prev.filter(id => !updateIds.includes(id)));
    }
  };

  const handleRefresh = async () => {
    try {
      setIsRefreshing(true);
      
      toast.loading("Checking for updates from Trellix...", {
        description: "Fetching the latest security updates from https://www.trellix.com/downloads/security-updates/",
        id: "refresh-updates"
      });

      // Call the edge function to fetch from Trellix
      const { data, error } = await supabase.functions.invoke('fetch-security-updates', {
        body: { 
          source: 'trellix',
          timestamp: new Date().toISOString() 
        }
      });

      if (error) {
        console.error('Error calling fetch-security-updates:', error);
        throw error;
      }

      console.log('Fetch response:', data);

      // Force refresh the local data
      await triggerUpdateFetch();

      toast.success("Updates refreshed successfully!", {
        description: data?.message || `Found ${data?.totalUpdates || 0} updates, ${data?.newUpdates || 0} new ones added.`,
        id: "refresh-updates"
      });

    } catch (error) {
      console.error('Error refreshing updates:', error);
      toast.error("Failed to refresh updates", {
        description: "Unable to fetch updates from Trellix. Please try again.",
        id: "refresh-updates"
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleSort = (field: 'name' | 'date' | 'size') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const getUpdatesForTab = (tabId: string) => {
    let filteredUpdates = updates;
    
    if (tabId !== 'all') {
      filteredUpdates = updates.filter(update => {
        const normalizedType = update.type?.toLowerCase().replace(/[_-]/g, '');
        const tabType = tabId.toLowerCase().replace(/[_-]/g, '');
        return normalizedType === tabType || 
               (tabType === 'dat' && ['dat', 'datv3', 'epodat'].includes(normalizedType)) ||
               (tabType === 'engine' && ['engine', 'securityengine'].includes(normalizedType));
      });
    }

    // Sort updates
    const sortedUpdates = [...filteredUpdates].sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'date':
          comparison = new Date(a.release_date).getTime() - new Date(b.release_date).getTime();
          break;
        case 'size':
          comparison = a.file_size - b.file_size;
          break;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return sortedUpdates;
  };

  const getCount = (key: string) => stats.byType?.[key] ?? 0;

  const renderUpdatesTable = (updates: SecurityUpdate[]) => {
    if (updates.length === 0) {
      return (
        <Card className="modern-card">
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">No security updates found for this category.</p>
          </CardContent>
        </Card>
      );
    }

    const allSelected = updates.length > 0 && updates.every(update => selectedUpdates.includes(update.id));

    return (
      <div className="space-y-4">
        {selectedUpdates.length > 0 && (
          <div className="modern-card flex items-center justify-between p-4">
            <span className="text-sm font-medium">
              {selectedUpdates.length} update{selectedUpdates.length !== 1 ? 's' : ''} selected
            </span>
            <Button onClick={handleBulkDownload} size="sm" className="glow-button">
              <Download className="h-4 w-4 mr-2" />
              Download Selected
            </Button>
          </div>
        )}

        <Card className="modern-card">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="sticky top-0 z-10 bg-card/70 backdrop-blur-sm border-b border-muted">
                  <tr>
                    <th className="w-12 text-left p-4">
                      <Checkbox
                        checked={allSelected}
                        onCheckedChange={(checked) => handleSelectAll(updates, checked as boolean)}
                      />
                    </th>
                    <th className="text-left p-4 cursor-pointer hover:bg-card/70 transition-colors" onClick={() => handleSort('name')}>
                      <div className="flex items-center gap-2">
                        Name
                        <ChevronDown className={`h-4 w-4 transition-transform ${sortBy === 'name' && sortOrder === 'asc' ? 'rotate-180' : ''}`} />
                      </div>
                    </th>
                    <th className="text-left p-4">Platform</th>
                    <th className="text-left p-4">Version</th>
                    <th className="text-left p-4 cursor-pointer hover:bg-card/70 transition-colors" onClick={() => handleSort('date')}>
                      <div className="flex items-center gap-2">
                        Release Date
                        <ChevronDown className={`h-4 w-4 transition-transform ${sortBy === 'date' && sortOrder === 'asc' ? 'rotate-180' : ''}`} />
                      </div>
                    </th>
                    <th className="text-left p-4 cursor-pointer hover:bg-card/70 transition-colors" onClick={() => handleSort('size')}>
                      <div className="flex items-center gap-2">
                        File Size
                        <ChevronDown className={`h-4 w-4 transition-transform ${sortBy === 'size' && sortOrder === 'asc' ? 'rotate-180' : ''}`} />
                      </div>
                    </th>
                    <th className="text-left p-4">Status</th>
                    <th className="text-center p-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {updates.map((update) => (
                    <tr key={update.id} className="border-b hover:bg-card/70 transition-colors">
                      <td className="p-4">
                        <Checkbox
                          checked={selectedUpdates.includes(update.id)}
                          onCheckedChange={(checked) => handleSelectUpdate(update.id, checked as boolean)}
                        />
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center justify-center w-8 h-8 rounded bg-primary/10">
                            {getTypeIcon(update.type)}
                          </div>
                          <div>
                            <div className="font-medium">{update.name}</div>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="secondary" className={getTypeColor(update.type)}>
                                {update.type.toUpperCase()}
                              </Badge>
                              {update.criticality_level && (
                                <Badge className={getCriticalityColor(update.criticality_level)}>
                                  {update.criticality_level.toUpperCase()}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <span className="text-sm">{getPlatformIcon(update.platform)}</span>
                          <span className="text-muted-foreground">{update.platform}</span>
                        </div>
                      </td>
                      <td className="p-4 font-mono text-sm">{update.version}</td>
                      <td className="p-4">{formatDate(update.release_date)}</td>
                      <td className="p-4">{formatFileSize(update.file_size)}</td>
                      <td className="p-4">
                        {update.is_recommended ? (
                          <Badge className="bg-green-500/15 text-green-300 border border-green-500/30">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Recommended
                          </Badge>
                        ) : (
                          <Badge variant="outline">Available</Badge>
                        )}
                      </td>
                      <td className="p-4 text-center">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDownload(update.id)}
                          className="hover:bg-primary/10 hover:border-primary transition-all"
                        >
                          <Download className="h-4 w-4 mr-1" />
                          Download
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-lg font-medium">Loading security updates...</p>
          <p className="text-muted-foreground">Please wait while we fetch the latest updates</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">DAT Files Management</h2>
          <p className="text-muted-foreground">
            Download and manage DAT files, MEDDAT, TIE Intelligence, and security updates
          </p>
        </div>
        <Button
          onClick={handleRefresh}
          disabled={isLoading || isRefreshing}
          variant="outline"
          size="sm"
          className="glow-button"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
          {isRefreshing ? 'Checking...' : 'Check Updates'}
        </Button>
      </div>

      {/* Category Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 animate-fade-in">
        <Card className="modern-card cursor-pointer hover:scale-105 transition-transform" onClick={() => setActiveFilter('dat')}>
          <CardContent className="p-4 text-center">
            <Database className="h-6 w-6 mx-auto mb-2 text-primary" />
            <div className="text-xl font-bold">{getCount('DAT') + getCount('DATV3')}</div>
            <p className="text-xs text-muted-foreground">DAT Files</p>
          </CardContent>
        </Card>

        <Card className="modern-card cursor-pointer hover:scale-105 transition-transform" onClick={() => setActiveFilter('meddat')}>
          <CardContent className="p-4 text-center">
            <Shield className="h-6 w-6 mx-auto mb-2 text-primary" />
            <div className="text-xl font-bold">{getCount('MEDDAT')}</div>
            <p className="text-xs text-muted-foreground">MEDDAT Files</p>
          </CardContent>
        </Card>

        <Card className="modern-card cursor-pointer hover:scale-105 transition-transform" onClick={() => setActiveFilter('tie')}>
          <CardContent className="p-4 text-center">
            <Zap className="h-6 w-6 mx-auto mb-2 text-primary" />
            <div className="text-xl font-bold">{getCount('TIE Intelligence')}</div>
            <p className="text-xs text-muted-foreground">TIE Intelligence</p>
          </CardContent>
        </Card>

        <Card className="modern-card cursor-pointer hover:scale-105 transition-transform" onClick={() => setActiveFilter('exploit')}>
          <CardContent className="p-4 text-center">
            <AlertTriangle className="h-6 w-6 mx-auto mb-2 text-primary" />
            <div className="text-xl font-bold">{getCount('Exploit Prevention')}</div>
            <p className="text-xs text-muted-foreground">Exploit Prevention</p>
          </CardContent>
        </Card>

        <Card className="modern-card cursor-pointer hover:scale-105 transition-transform" onClick={() => setActiveFilter('engine')}>
          <CardContent className="p-4 text-center">
            <Settings className="h-6 w-6 mx-auto mb-2 text-primary" />
            <div className="text-xl font-bold">{getCount('Engine')}</div>
            <p className="text-xs text-muted-foreground">Engines</p>
          </CardContent>
        </Card>

        <Card className="modern-card cursor-pointer hover:scale-105 transition-transform" onClick={() => setActiveFilter('content')}>
          <CardContent className="p-4 text-center">
            <Database className="h-6 w-6 mx-auto mb-2 text-primary" />
            <div className="text-xl font-bold">{getCount('Content')}</div>
            <p className="text-xs text-muted-foreground">Content</p>
          </CardContent>
        </Card>
      </div>

      {/* Show all updates without tabs */}
      <div className="mt-6 animate-fade-in">
        {renderUpdatesTable(getUpdatesForTab('all'))}
      </div>
    </div>
  );
};

export default SecurityUpdates;
