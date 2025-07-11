import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Download, Shield, Database, FileCheck, RefreshCw } from "lucide-react";
import { toast } from "sonner";

interface SecurityUpdate {
  id: string;
  name: string;
  type: 'DAT' | 'Engine' | 'Content';
  platform: 'Windows' | 'macOS' | 'Linux';
  version: string;
  releaseDate: string;
  fileSize: string;
  fileName: string;
  sha256: string;
  description: string;
  isRecommended?: boolean;
}

const securityUpdates: SecurityUpdate[] = [
  // DAT Files
  {
    id: '1',
    name: 'Virus Definition Update',
    type: 'DAT',
    platform: 'Windows',
    version: '1234.0000',
    releaseDate: '2025-01-11',
    fileSize: '45.2 MB',
    fileName: 'avvdat-1234.zip',
    sha256: '4C09DB4914F16918E3A518B8D44E7E65527A90694BBBB460D5A5C4C965B385B7',
    description: 'Latest virus definition file for Windows with enhanced threat detection.',
    isRecommended: true
  },
  {
    id: '2',
    name: 'Virus Definition Update',
    type: 'DAT',
    platform: 'macOS',
    version: '1234.0000',
    releaseDate: '2025-01-11',
    fileSize: '42.8 MB',
    fileName: 'avvdat-1234-mac.zip',
    sha256: '84570DE12504814C1D722085E49E9D2516192598AA36C3DA99B046DE9CD75C47',
    description: 'Latest virus definition file for macOS with enhanced threat detection.'
  },
  {
    id: '3',
    name: 'Virus Definition Update',
    type: 'DAT',
    platform: 'Linux',
    version: '1234.0000',
    releaseDate: '2025-01-11',
    fileSize: '48.1 MB',
    fileName: 'avvdat-1234-lnx.zip',
    sha256: 'D85D8B96891AB23788CADD2BAB7B052D813205CDE452125BC347800F2023969A',
    description: 'Latest virus definition file for Linux with enhanced threat detection.'
  },
  // Engine Updates
  {
    id: '4',
    name: 'Security Engine Package',
    type: 'Engine',
    platform: 'Windows',
    version: '6810',
    releaseDate: '2025-06-30',
    fileSize: '8.35 MB',
    fileName: 'epo6810eng.zip',
    sha256: '4C09DB4914F16918E3A518B8D44E7E65527A90694BBBB460D5A5C4C965B385B7',
    description: 'Windows Engine Package for use with ePO - Enhanced scanning performance.',
    isRecommended: true
  },
  {
    id: '5',
    name: 'Security Engine Package',
    type: 'Engine',
    platform: 'macOS',
    version: '6810',
    releaseDate: '2025-06-30',
    fileSize: '7.14 MB',
    fileName: 'epo6810mub.zip',
    sha256: '84570DE12504814C1D722085E49E9D2516192598AA36C3DA99B046DE9CD75C47',
    description: 'Mac OS Universal Engine Package for use with ePO.'
  },
  {
    id: '6',
    name: 'Security Engine Package',
    type: 'Engine',
    platform: 'Linux',
    version: '6810',
    releaseDate: '2025-06-30',
    fileSize: '10.8 MB',
    fileName: 'epo6810lnx.zip',
    sha256: 'D85D8B96891AB23788CADD2BAB7B052D813205CDE452125BC347800F2023969A',
    description: 'Linux Engine Package for use with ePO - Optimized for server environments.'
  },
  // Content Updates
  {
    id: '7',
    name: 'Security Content Package',
    type: 'Content',
    platform: 'Windows',
    version: '2.8.5',
    releaseDate: '2025-01-10',
    fileSize: '128 MB',
    fileName: 'content-285-win.zip',
    sha256: '5D18EB5915F26928F4A529C9E55F8F76638B91705CCCC571E6A6D5D976C486C8',
    description: 'Web protection filters and application control rules for Windows.',
    isRecommended: true
  },
  {
    id: '8',
    name: 'Security Content Package',
    type: 'Content',
    platform: 'macOS',
    version: '2.8.5',
    releaseDate: '2025-01-10',
    fileSize: '95.4 MB',
    fileName: 'content-285-mac.zip',
    sha256: '95681EF23615925E2E833186F5AB9E63527A91806DDDD571F7B7E6E087D397D9',
    description: 'Web protection filters and application control rules for macOS.'
  },
  {
    id: '9',
    name: 'Security Content Package',
    type: 'Content',
    platform: 'Linux',
    version: '2.8.5',
    releaseDate: '2025-01-10',
    fileSize: '112 MB',
    fileName: 'content-285-lnx.zip',
    sha256: 'A96E9C07902BC34899DBEE3CAC8C163E724B92917EEEE682F8C8F7F198E408FA',
    description: 'Web protection filters and application control rules for Linux.'
  }
];

export const DATManagement = () => {
  const [refreshing, setRefreshing] = useState(false);

  const handleDownload = (update: SecurityUpdate) => {
    const confirmDownload = window.confirm(
      `Download ${update.name}?\n\nPlatform: ${update.platform}\nVersion: ${update.version}\nSize: ${update.fileSize}\nFile: ${update.fileName}\n\nSHA-256: ${update.sha256.substring(0, 16)}...`
    );

    if (confirmDownload) {
      // Create a temporary download link
      const link = document.createElement('a');
      link.href = `data:application/octet-stream;base64,${btoa(`Trellix ${update.type} Package - ${update.platform} v${update.version}`)}`;
      link.download = update.fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success(
        `${update.name} download initiated!`,
        {
          description: `Platform: ${update.platform} | Version: ${update.version}`,
          duration: 5000,
        }
      );
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    setRefreshing(false);
    toast.success("Security updates refreshed successfully!");
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'DAT': return <Database className="h-4 w-4" />;
      case 'Engine': return <Shield className="h-4 w-4" />;
      case 'Content': return <FileCheck className="h-4 w-4" />;
      default: return <Database className="h-4 w-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'DAT': return 'default';
      case 'Engine': return 'secondary';
      case 'Content': return 'outline';
      default: return 'default';
    }
  };

  const datUpdates = securityUpdates.filter(u => u.type === 'DAT');
  const engineUpdates = securityUpdates.filter(u => u.type === 'Engine');
  const contentUpdates = securityUpdates.filter(u => u.type === 'Content');

  const renderUpdatesTable = (updates: SecurityUpdate[]) => (
    <Table>
      <TableHeader>
        <TableRow>
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
          <TableRow key={update.id}>
            <TableCell>
              <div className="flex items-center space-x-2">
                {getTypeIcon(update.type)}
                <div>
                  <div className="font-medium">{update.name}</div>
                  <div className="text-xs text-muted-foreground">{update.description}</div>
                </div>
              </div>
            </TableCell>
            <TableCell>
              <Badge variant="outline">{update.platform}</Badge>
            </TableCell>
            <TableCell className="font-mono">{update.version}</TableCell>
            <TableCell>{new Date(update.releaseDate).toLocaleDateString()}</TableCell>
            <TableCell>{update.fileSize}</TableCell>
            <TableCell>
              {update.isRecommended && (
                <Badge variant="default">Recommended</Badge>
              )}
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
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-primary">Security Updates Management</h2>
          <p className="text-muted-foreground">Download and manage latest security updates from Trellix</p>
        </div>
        <Button onClick={handleRefresh} disabled={refreshing}>
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Refreshing...' : 'Refresh Updates'}
        </Button>
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
              {renderUpdatesTable(securityUpdates)}
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