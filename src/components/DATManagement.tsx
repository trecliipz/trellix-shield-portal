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
  // DAT V3 Files
  {
    id: '1',
    name: 'DAT V3 Definition Update',
    type: 'DAT',
    platform: 'Windows',
    version: 'v3.1234.5678',
    releaseDate: '2025-01-11',
    fileSize: '45.2 MB',
    fileName: 'avvdat-v3123456.zip',
    sha256: '4C09DB4914F16918E3A518B8D44E7E65527A90694BBBB460D5A5C4C965B385B7',
    description: 'Latest DAT V3 definition files with enhanced machine learning detection patterns.',
    isRecommended: true
  },
  {
    id: '2',
    name: 'DAT V3 Definition Update',
    type: 'DAT',
    platform: 'macOS',
    version: 'v3.1234.5678',
    releaseDate: '2025-01-11',
    fileSize: '42.8 MB',
    fileName: 'avvdat-v3123456-mac.zip',
    sha256: '84570DE12504814C1D722085E49E9D2516192598AA36C3DA99B046DE9CD75C47',
    description: 'Latest DAT V3 definition files for macOS with behavioral analysis signatures.'
  },
  {
    id: '3',
    name: 'DAT V3 Definition Update',
    type: 'DAT',
    platform: 'Linux',
    version: 'v3.1234.5678',
    releaseDate: '2025-01-11',
    fileSize: '48.1 MB',
    fileName: 'avvdat-v3123456-lnx.zip',
    sha256: 'D85D8B96891AB23788CADD2BAB7B052D813205CDE452125BC347800F2023969A',
    description: 'Latest DAT V3 definition files for Linux with advanced threat intelligence.'
  },
  // MEDDAT Files
  {
    id: '4',
    name: 'MEDDAT Mobile Endpoint Detection',
    type: 'DAT',
    platform: 'Windows',
    version: 'MEDDAT.2024.11.15',
    releaseDate: '2025-01-10',
    fileSize: '28.5 MB',
    fileName: 'meddat-20241115.zip',
    sha256: 'A7B8C9D0E1F2A3B4C5D6E7F8G9H0I1J2K3L4M5N6O7P8Q9R0S1T2U3V4W5X6Y7Z8',
    description: 'Mobile and endpoint detection files for advanced threat hunting.',
    isRecommended: true
  },
  // Engine Updates
  {
    id: '5',
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
    id: '6',
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
    id: '7',
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
  // TIE Content Updates
  {
    id: '8',
    name: 'TIE Threat Intelligence Package',
    type: 'Content',
    platform: 'Windows',
    version: 'TIE.2025.01.11',
    releaseDate: '2025-01-11',
    fileSize: '85.3 MB',
    fileName: 'tie-content-20250111-win.zip',
    sha256: '5D18EB5915F26928F4A529C9E55F8F76638B91705CCCC571E6A6D5D976C486C8',
    description: 'Threat Intelligence Exchange content with global reputation data.',
    isRecommended: true
  },
  {
    id: '9',
    name: 'TIE Threat Intelligence Package',
    type: 'Content',
    platform: 'macOS',
    version: 'TIE.2025.01.11',
    releaseDate: '2025-01-11',
    fileSize: '76.8 MB',
    fileName: 'tie-content-20250111-mac.zip',
    sha256: '95681EF23615925E2E833186F5AB9E63527A91806DDDD571F7B7E6E087D397D9',
    description: 'Threat Intelligence Exchange content for macOS with file reputation services.'
  },
  {
    id: '10',
    name: 'TIE Threat Intelligence Package',
    type: 'Content',
    platform: 'Linux',
    version: 'TIE.2025.01.11',
    releaseDate: '2025-01-11',
    fileSize: '82.1 MB',
    fileName: 'tie-content-20250111-lnx.zip',
    sha256: 'A96E9C07902BC34899DBEE3CAC8C163E724B92917EEEE682F8C8F7F198E408FA',
    description: 'Threat Intelligence Exchange content for Linux servers and workstations.'
  },
  // Exploit Prevention Content
  {
    id: '11',
    name: 'Exploit Prevention Content',
    type: 'Content',
    platform: 'Windows',
    version: 'EP.2025.01.10',
    releaseDate: '2025-01-10',
    fileSize: '156.7 MB',
    fileName: 'exploit-prevention-20250110-win.zip',
    sha256: 'F1E2D3C4B5A6978867F5E4D3C2B1A09876543210FEDCBA987654321098765432',
    description: 'Advanced exploit prevention signatures and behavioral rules for Windows.',
    isRecommended: true
  },
  {
    id: '12',
    name: 'Exploit Prevention Content',
    type: 'Content', 
    platform: 'macOS',
    version: 'EP.2025.01.10',
    releaseDate: '2025-01-10',
    fileSize: '124.3 MB',
    fileName: 'exploit-prevention-20250110-mac.zip',
    sha256: 'E9F8G7H6I5J4K3L2M1N0O9P8Q7R6S5T4U3V2W1X0Y9Z8A7B6C5D4E3F2G1H0I9J8',
    description: 'Exploit prevention rules optimized for macOS application security.'
  },
  {
    id: '13',
    name: 'Exploit Prevention Content',
    type: 'Content',
    platform: 'Linux',
    version: 'EP.2025.01.10',
    releaseDate: '2025-01-10',
    fileSize: '143.9 MB',
    fileName: 'exploit-prevention-20250110-lnx.zip',
    sha256: 'B8A9C0D1E2F3G4H5I6J7K8L9M0N1O2P3Q4R5S6T7U8V9W0X1Y2Z3A4B5C6D7E8F9',
    description: 'Comprehensive exploit prevention for Linux environments and containers.'
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