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
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'engine':
      case 'security_engine':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'policy':
      case 'policy_template':
      case 'epo_policy':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getCriticalityColor = (criticality: string) => {
    switch (criticality?.toLowerCase()) {
      case 'critical':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
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

  const handleDownload = (updateId: string) => {
    const update = updates.find(u => u.id === updateId);
    if (update) {
      toast.success(`Downloaded ${update.name}`, {
        description: `${update.name} has been downloaded successfully.`,
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
      await triggerUpdateFetch();
      toast.success("Updates refreshed successfully!");
    } catch (error) {
      toast.error("Failed to refresh updates");
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

  const renderUpdatesTable = (updates: SecurityUpdate[]) => {
    if (updates.length === 0) {
      return (
        <Card>
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
          <div className="flex items-center justify-between p-4 bg-primary/10 rounded-lg border">
            <span className="text-sm font-medium">
              {selectedUpdates.length} update{selectedUpdates.length !== 1 ? 's' : ''} selected
            </span>
            <Button onClick={handleBulkDownload} size="sm">
              <Download className="h-4 w-4 mr-2" />
              Download Selected
            </Button>
          </div>
        )}

        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b bg-muted/50">
                  <tr>
                    <th className="w-12 text-left p-4">
                      <Checkbox
                        checked={allSelected}
                        onCheckedChange={(checked) => handleSelectAll(updates, checked as boolean)}
                      />
                    </th>
                    <th className="text-left p-4 cursor-pointer hover:bg-muted/80" onClick={() => handleSort('name')}>
                      <div className="flex items-center gap-2">
                        Name
                        <ChevronDown className={`h-4 w-4 transition-transform ${sortBy === 'name' && sortOrder === 'asc' ? 'rotate-180' : ''}`} />
                      </div>
                    </th>
                    <th className="text-left p-4">Platform</th>
                    <th className="text-left p-4">Version</th>
                    <th className="text-left p-4 cursor-pointer hover:bg-muted/80" onClick={() => handleSort('date')}>
                      <div className="flex items-center gap-2">
                        Release Date
                        <ChevronDown className={`h-4 w-4 transition-transform ${sortBy === 'date' && sortOrder === 'asc' ? 'rotate-180' : ''}`} />
                      </div>
                    </th>
                    <th className="text-left p-4 cursor-pointer hover:bg-muted/80" onClick={() => handleSort('size')}>
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
                    <tr key={update.id} className="border-b hover:bg-muted/50">
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
                          <span>{getPlatformIcon(update.platform)}</span>
                          <span>{update.platform}</span>
                        </div>
                      </td>
                      <td className="p-4 font-mono text-sm">{update.version}</td>
                      <td className="p-4">{formatDate(update.release_date)}</td>
                      <td className="p-4">{formatFileSize(update.file_size)}</td>
                      <td className="p-4">
                        {update.is_recommended ? (
                          <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
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
                          onClick={() => handleDownload(update.id)}
                          className="w-20"
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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-lg font-medium">Loading security updates...</p>
          <p className="text-muted-foreground">Please wait while we fetch the latest updates</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b sticky top-0 z-40">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/')}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Portal
              </Button>
              <div className="h-6 border-l border-border" />
              <h1 className="text-xl font-semibold">Security Updates</h1>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={handleRefresh}
                variant="outline"
                size="sm"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Check Updates
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 lg:px-8 py-8">
        {/* Breadcrumb */}
        <Breadcrumb className="mb-8">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink onClick={() => navigate('/')}>Portal</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Security Updates</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Page Header */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold tracking-tight">Trellix Security Updates</h2>
          <p className="text-muted-foreground mt-2">
            Download the latest DAT files, security engines, and policy updates to keep your endpoints protected.
          </p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Updates</CardTitle>
              <Database className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">Available for download</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Critical</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.critical}</div>
              <p className="text-xs text-muted-foreground">High priority updates</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Recommended</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.recommended}</div>
              <p className="text-xs text-muted-foreground">Suggested downloads</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">This Week</CardTitle>
              <Zap className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.recent}</div>
              <p className="text-xs text-muted-foreground">Recent releases</p>
            </CardContent>
          </Card>
        </div>

        {/* Updates Tabs */}
        <Tabs value={activeFilter} onValueChange={setActiveFilter} className="w-full">
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-2 h-auto p-1 bg-muted/50">
            <TabsTrigger value="all" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              All Updates ({stats.total})
            </TabsTrigger>
            {filterTabs.map((tab) => (
              <TabsTrigger 
                key={tab.id} 
                value={tab.id}
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                {tab.label} ({tab.count})
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="all" className="mt-6">
            {renderUpdatesTable(getUpdatesForTab('all'))}
          </TabsContent>

          {filterTabs.map((tab) => (
            <TabsContent key={tab.id} value={tab.id} className="mt-6">
              {renderUpdatesTable(getUpdatesForTab(tab.id))}
            </TabsContent>
          ))}
        </Tabs>
      </main>
    </div>
  );
};

export default SecurityUpdates;