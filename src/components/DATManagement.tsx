
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { RefreshCw, Download, Calendar, HardDrive, Shield, Activity, AlertTriangle, CheckCircle, Smartphone, Monitor, Server, Database, FileCheck, DownloadCloud, Clock, Bell } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface SecurityUpdate {
  id: string;
  name: string;
  type: 'dat' | 'engine' | 'content';
  platform: string;
  version: string;
  release_date: string;
  file_size: number;
  file_name: string;
  sha256: string;
  description: string;
  is_recommended: boolean;
}

const securityUpdates: SecurityUpdate[] = [
  // DAT V3 Files
  {
    id: '1',
    name: 'DAT V3 Definition Update',
    type: 'dat',
    platform: 'Windows',
    version: 'v3.1234.5678',
    release_date: '2025-01-11',
    file_size: 47415296, // 45.2 MB
    file_name: 'avvdat-v3123456.zip',
    sha256: '4C09DB4914F16918E3A518B8D44E7E65527A90694BBBB460D5A5C4C965B385B7',
    description: 'Latest DAT V3 definition files with enhanced machine learning detection patterns.',
    is_recommended: true
  },
  {
    id: '2',
    name: 'DAT V3 Definition Update',
    type: 'dat',
    platform: 'macOS',
    version: 'v3.1234.5678',
    release_date: '2025-01-11',
    file_size: 44879667, // 42.8 MB
    file_name: 'avvdat-v3123456-mac.zip',
    sha256: '84570DE12504814C1D722085E49E9D2516192598AA36C3DA99B046DE9CD75C47',
    description: 'Latest DAT V3 definition files for macOS with behavioral analysis signatures.'
  },
  {
    id: '3',
    name: 'DAT V3 Definition Update',
    type: 'dat',
    platform: 'Linux',
    version: 'v3.1234.5678',
    release_date: '2025-01-11',
    file_size: 50432819, // 48.1 MB
    file_name: 'avvdat-v3123456-lnx.zip',
    sha256: 'D85D8B96891AB23788CADD2BAB7B052D813205CDE452125BC347800F2023969A',
    description: 'Latest DAT V3 definition files for Linux with advanced threat intelligence.'
  },
  // MEDDAT Files
  {
    id: '4',
    name: 'MEDDAT Mobile Endpoint Detection',
    type: 'dat',
    platform: 'Windows',
    version: 'MEDDAT.2024.11.15',
    release_date: '2025-01-10',
    file_size: 29884416, // 28.5 MB
    file_name: 'meddat-20241115.zip',
    sha256: 'A7B8C9D0E1F2A3B4C5D6E7F8G9H0I1J2K3L4M5N6O7P8Q9R0S1T2U3V4W5X6Y7Z8',
    description: 'Mobile and endpoint detection files for advanced threat hunting.',
    is_recommended: true
  },
  // Engine Updates
  {
    id: '5',
    name: 'Security Engine Package',
    type: 'engine',
    platform: 'Windows',
    version: '6810',
    release_date: '2025-06-30',
    file_size: 8757683, // 8.35 MB
    file_name: 'epo6810eng.zip',
    sha256: '4C09DB4914F16918E3A518B8D44E7E65527A90694BBBB460D5A5C4C965B385B7',
    description: 'Windows Engine Package for use with ePO - Enhanced scanning performance.',
    is_recommended: true
  },
  {
    id: '6',
    name: 'Security Engine Package',
    type: 'engine',
    platform: 'macOS',
    version: '6810',
    release_date: '2025-06-30',
    file_size: 7487832, // 7.14 MB
    file_name: 'epo6810mub.zip',
    sha256: '84570DE12504814C1D722085E49E9D2516192598AA36C3DA99B046DE9CD75C47',
    description: 'Mac OS Universal Engine Package for use with ePO.'
  },
  {
    id: '7',
    name: 'Security Engine Package',
    type: 'engine',
    platform: 'Linux',
    version: '6810',
    release_date: '2025-06-30',
    file_size: 11324620, // 10.8 MB
    file_name: 'epo6810lnx.zip',
    sha256: 'D85D8B96891AB23788CADD2BAB7B052D813205CDE452125BC347800F2023969A',
    description: 'Linux Engine Package for use with ePO - Optimized for server environments.'
  },
  // TIE Content Updates
  {
    id: '8',
    name: 'TIE Threat Intelligence Package',
    type: 'content',
    platform: 'Windows',
    version: 'TIE.2025.01.11',
    release_date: '2025-01-11',
    file_size: 89478486, // 85.3 MB
    file_name: 'tie-content-20250111-win.zip',
    sha256: '5D18EB5915F26928F4A529C9E55F8F76638B91705CCCC571E6A6D5D976C486C8',
    description: 'Threat Intelligence Exchange content with global reputation data.',
    is_recommended: true
  },
  {
    id: '9',
    name: 'TIE Threat Intelligence Package',
    type: 'content',
    platform: 'macOS',
    version: 'TIE.2025.01.11',
    release_date: '2025-01-11',
    file_size: 80530636, // 76.8 MB
    file_name: 'tie-content-20250111-mac.zip',
    sha256: '95681EF23615925E2E833186F5AB9E63527A91806DDDD571F7B7E6E087D397D9',
    description: 'Threat Intelligence Exchange content for macOS with file reputation services.'
  },
  {
    id: '10',
    name: 'TIE Threat Intelligence Package',
    type: 'content',
    platform: 'Linux',
    version: 'TIE.2025.01.11',
    release_date: '2025-01-11',
    file_size: 86095626, // 82.1 MB
    file_name: 'tie-content-20250111-lnx.zip',
    sha256: 'A96E9C07902BC34899DBEE3CAC8C163E724B92917EEEE682F8C8F7F198E408FA',
    description: 'Threat Intelligence Exchange content for Linux servers and workstations.'
  },
  // Exploit Prevention Content
  {
    id: '11',
    name: 'Exploit Prevention Content',
    type: 'content',
    platform: 'Windows',
    version: 'EP.2025.01.10',
    release_date: '2025-01-10',
    file_size: 164361011, // 156.7 MB
    file_name: 'exploit-prevention-20250110-win.zip',
    sha256: 'F1E2D3C4B5A6978867F5E4D3C2B1A09876543210FEDCBA987654321098765432',
    description: 'Advanced exploit prevention signatures and behavioral rules for Windows.',
    is_recommended: true
  },
  {
    id: '12',
    name: 'Exploit Prevention Content',
    type: 'content', 
    platform: 'macOS',
    version: 'EP.2025.01.10',
    release_date: '2025-01-10',
    file_size: 130338865, // 124.3 MB
    file_name: 'exploit-prevention-20250110-mac.zip',
    sha256: 'E9F8G7H6I5J4K3L2M1N0O9P8Q7R6S5T4U3V2W1X0Y9Z8A7B6C5D4E3F2G1H0I9J8',
    description: 'Exploit prevention rules optimized for macOS application security.'
  },
  {
    id: '13',
    name: 'Exploit Prevention Content',
    type: 'content',
    platform: 'Linux',
    version: 'EP.2025.01.10',
    release_date: '2025-01-10',
    file_size: 150943539, // 143.9 MB
    file_name: 'exploit-prevention-20250110-lnx.zip',
    sha256: 'B8A9C0D1E2F3G4H5I6J7K8L9M0N1O2P3Q4R5S6T7U8V9W0X1Y2Z3A4B5C6D7E8F9',
    description: 'Comprehensive exploit prevention for Linux environments and containers.'
  },
  // AMCore Content Package
  {
    id: '14',
    name: 'AMCore Content Package',
    type: 'content',
    platform: 'Windows',
    version: '5947.0',
    release_date: '2025-01-11',
    file_size: 96909721, // 92.4 MB
    file_name: 'amcore-5947-win.zip',
    sha256: 'C9D8E7F6A5B4932176543A8B7C6D5E4F321098ABCDEF9876543210FEDCBA0987',
    description: 'Enhanced malware detection patterns and behavioral analysis for Windows.',
    is_recommended: true
  },
  {
    id: '15',
    name: 'AMCore Content Package',
    type: 'content',
    platform: 'macOS',
    version: '5947.0',
    release_date: '2025-01-11',
    file_size: 91416166, // 87.2 MB
    file_name: 'amcore-5947-mac.zip',
    sha256: 'D0E9F8A7B6C5043287654B9C8D7E6F5A432109BCDEF0987654321FEDCBA09876',
    description: 'Enhanced malware detection patterns and behavioral analysis for macOS.'
  },
  {
    id: '16',
    name: 'AMCore Content Package',
    type: 'content',
    platform: 'Linux',
    version: '5947.0',
    release_date: '2025-01-11',
    file_size: 100463034, // 95.8 MB
    file_name: 'amcore-5947-lnx.zip',
    sha256: 'E1F0A9B8C7D6154398765C0D9E8F7A6B543210CDEF10987654321FEDCBA09876',
    description: 'Enhanced malware detection patterns and behavioral analysis for Linux.'
  }
];

export const DATManagement = () => {
  const [refreshing, setRefreshing] = useState(false);
  const [selectedUpdates, setSelectedUpdates] = useState<string[]>([]);
  const [notifications, setNotifications] = useState<number>(0);
  const [securityUpdatesState, setSecurityUpdatesState] = useState<SecurityUpdate[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

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

      setSecurityUpdatesState(data?.map(update => ({
        ...update,
        type: update.type as 'dat' | 'engine' | 'content'
      })) || []);
      
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
    const confirmDownload = window.confirm(
      `Download ${update.name}?\n\nPlatform: ${update.platform}\nVersion: ${update.version}\nSize: ${formatFileSize(update.file_size)}\nFile: ${update.file_name}\n\nSHA-256: ${update.sha256?.substring(0, 16)}...`
    );

    if (confirmDownload) {
      // Create a temporary download link
      const link = document.createElement('a');
      link.href = `data:application/octet-stream;base64,${btoa(`Trellix ${update.type} Package - ${update.platform} v${update.version}`)}`;
      link.download = update.file_name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "Download Started",
        description: `${update.name} download initiated for ${update.platform}`,
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
      selectedUpdates.forEach(updateId => {
        const update = securityUpdatesState.find(u => u.id === updateId);
        if (update) {
          const link = document.createElement('a');
          link.href = `data:application/octet-stream;base64,${btoa(`Trellix ${update.type} Package - ${update.platform} v${update.version}`)}`;
          link.download = update.file_name;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }
      });

      toast({
        title: "Bulk Download Started",
        description: `${selectedUpdates.length} security updates are being downloaded.`,
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
    switch (type) {
      case 'dat': return <Database className="h-4 w-4" />;
      case 'engine': return <Shield className="h-4 w-4" />;
      case 'content': return <FileCheck className="h-4 w-4" />;
      default: return <Database className="h-4 w-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'dat': return 'default';
      case 'engine': return 'secondary';
      case 'content': return 'outline';
      default: return 'default';
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

  const datUpdates = securityUpdatesState.filter(u => u.type === 'dat');
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
                  <div className="flex items-center space-x-2">
                    {getTypeIcon(update.type)}
                    <div>
                      <div className="font-medium flex items-center space-x-2">
                        <span>{update.name}</span>
                        {new Date(update.release_date) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) && (
                          <Badge variant="destructive" className="text-xs px-1 py-0">NEW</Badge>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">{update.description}</div>
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
          <div>
            <h2 className="text-2xl font-bold text-primary flex items-center space-x-3">
              <span>Security Updates Management</span>
              {notifications > 0 && (
                <Badge variant="destructive" className="flex items-center space-x-1">
                  <Bell className="h-3 w-3" />
                  <span>{notifications} New</span>
                </Badge>
              )}
            </h2>
            <p className="text-muted-foreground">Download and manage latest security updates from Trellix</p>
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">DAT Files</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{datUpdates.length}</div>
            <p className="text-xs text-muted-foreground">Virus definitions</p>
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
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all">All Updates</TabsTrigger>
          <TabsTrigger value="dat">DAT Files</TabsTrigger>
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
              <CardTitle>DAT Files (Virus Definitions)</CardTitle>
            </CardHeader>
            <CardContent>
              {renderUpdatesTable(datUpdates)}
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
