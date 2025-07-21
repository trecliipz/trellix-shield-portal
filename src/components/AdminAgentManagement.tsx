
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { 
  Upload, 
  Users, 
  Package, 
  Download, 
  Play, 
  Pause, 
  RotateCcw, 
  CheckCircle, 
  AlertCircle, 
  Clock,
  Monitor,
  Shield,
  Zap
} from "lucide-react";
import { toast } from "sonner";

interface AgentPackage {
  id: string;
  name: string;
  version: string;
  platform: 'windows' | 'macos' | 'linux';
  fileSize: number;
  uploadDate: string;
  description: string;
  isActive: boolean;
}

interface DeploymentJob {
  id: string;
  packageId: string;
  packageName: string;
  targetUsers: number;
  completedUsers: number;
  failedUsers: number;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  createdAt: string;
  progress: number;
}

export const AdminAgentManagement = () => {
  const [packages, setPackages] = useState<AgentPackage[]>([]);
  const [deployments, setDeployments] = useState<DeploymentJob[]>([]);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [showDeployDialog, setShowDeployDialog] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<AgentPackage | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  useEffect(() => {
    loadMockData();
  }, []);

  const loadMockData = () => {
    // Mock data for demonstration
    const mockPackages: AgentPackage[] = [
      {
        id: '1',
        name: 'Trellix Agent v24.1',
        version: '24.1.0',
        platform: 'windows',
        fileSize: 45000000,
        uploadDate: '2024-07-20',
        description: 'Latest security agent with enhanced threat detection',
        isActive: true
      },
      {
        id: '2',
        name: 'Trellix Agent v24.1',
        version: '24.1.0',
        platform: 'macos',
        fileSize: 38000000,
        uploadDate: '2024-07-20',
        description: 'Latest security agent for macOS systems',
        isActive: true
      }
    ];

    const mockDeployments: DeploymentJob[] = [
      {
        id: '1',
        packageId: '1',
        packageName: 'Trellix Agent v24.1 (Windows)',
        targetUsers: 150,
        completedUsers: 120,
        failedUsers: 5,
        status: 'in_progress',
        createdAt: '2024-07-21T10:00:00Z',
        progress: 83
      },
      {
        id: '2',
        packageId: '2',
        packageName: 'Trellix Agent v24.0 (Windows)',
        targetUsers: 200,
        completedUsers: 200,
        failedUsers: 0,
        status: 'completed',
        createdAt: '2024-07-20T14:30:00Z',
        progress: 100
      }
    ];

    setPackages(mockPackages);
    setDeployments(mockDeployments);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['.exe', '.msi', '.pkg', '.deb', '.rpm'];
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    
    if (!allowedTypes.includes(fileExtension)) {
      toast.error("Please upload a valid agent package (.exe, .msi, .pkg, .deb, .rpm)");
      return;
    }

    // Simulate upload progress
    setUploadProgress(0);
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 10;
      });
    }, 200);

    // Simulate successful upload after progress completes
    setTimeout(() => {
      toast.success("Agent package uploaded successfully!");
      setShowUploadDialog(false);
      setUploadProgress(0);
    }, 2500);
  };

  const handleDeploy = (packageId: string, targetType: string) => {
    const pkg = packages.find(p => p.id === packageId);
    if (!pkg) return;

    const targetUsers = targetType === 'all' ? 250 : targetType === 'group' ? 50 : 25;
    
    const newDeployment: DeploymentJob = {
      id: Date.now().toString(),
      packageId,
      packageName: `${pkg.name} (${pkg.platform})`,
      targetUsers,
      completedUsers: 0,
      failedUsers: 0,
      status: 'pending',
      createdAt: new Date().toISOString(),
      progress: 0
    };

    setDeployments(prev => [newDeployment, ...prev]);
    setShowDeployDialog(false);

    toast.success(`Deployment initiated for ${targetUsers} users`);

    // Simulate deployment progress
    setTimeout(() => {
      setDeployments(prev => prev.map(d => 
        d.id === newDeployment.id 
          ? { ...d, status: 'in_progress' as const }
          : d
      ));
    }, 1000);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { variant: "secondary" as const, icon: Clock, color: "text-yellow-600" },
      in_progress: { variant: "default" as const, icon: Play, color: "text-blue-600" },
      completed: { variant: "default" as const, icon: CheckCircle, color: "text-green-600" },
      failed: { variant: "destructive" as const, icon: AlertCircle, color: "text-red-600" },
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    const Icon = config.icon;
    
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {status.replace('_', ' ').charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Agent Management</h2>
          <p className="text-muted-foreground">Upload and deploy security agents to endpoints</p>
        </div>
        <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
          <DialogTrigger asChild>
            <Button>
              <Upload className="h-4 w-4 mr-2" />
              Upload Agent Package
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Upload New Agent Package</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="package-name">Package Name</Label>
                <Input id="package-name" placeholder="Trellix Agent v24.2" />
              </div>
              <div>
                <Label htmlFor="version">Version</Label>
                <Input id="version" placeholder="24.2.0" />
              </div>
              <div>
                <Label htmlFor="platform">Platform</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select platform" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="windows">Windows</SelectItem>
                    <SelectItem value="macos">macOS</SelectItem>
                    <SelectItem value="linux">Linux</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" placeholder="Brief description of this agent version..." />
              </div>
              <div>
                <Label htmlFor="agent-file">Agent Package File</Label>
                <input
                  id="agent-file"
                  type="file"
                  accept=".exe,.msi,.pkg,.deb,.rpm"
                  onChange={handleFileUpload}
                  className="mt-1 block w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
                />
              </div>
              {uploadProgress > 0 && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Uploading...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <Progress value={uploadProgress} />
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="packages" className="space-y-6">
        <TabsList>
          <TabsTrigger value="packages">Agent Packages</TabsTrigger>
          <TabsTrigger value="deployments">Deployments</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="packages" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Available Packages</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Version</TableHead>
                    <TableHead>Platform</TableHead>
                    <TableHead>Size</TableHead>
                    <TableHead>Upload Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {packages.map((pkg) => (
                    <TableRow key={pkg.id}>
                      <TableCell className="font-medium">{pkg.name}</TableCell>
                      <TableCell>{pkg.version}</TableCell>
                      <TableCell className="capitalize">{pkg.platform}</TableCell>
                      <TableCell>{formatFileSize(pkg.fileSize)}</TableCell>
                      <TableCell>{pkg.uploadDate}</TableCell>
                      <TableCell>
                        <Badge variant={pkg.isActive ? "default" : "secondary"}>
                          {pkg.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Dialog open={showDeployDialog} onOpenChange={setShowDeployDialog}>
                            <DialogTrigger asChild>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => setSelectedPackage(pkg)}
                              >
                                <Zap className="h-4 w-4 mr-1" />
                                Deploy
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Deploy Agent Package</DialogTitle>
                              </DialogHeader>
                              {selectedPackage && (
                                <div className="space-y-4">
                                  <div className="p-4 bg-muted rounded-lg">
                                    <h4 className="font-medium">{selectedPackage.name}</h4>
                                    <p className="text-sm text-muted-foreground">
                                      Version {selectedPackage.version} • {selectedPackage.platform}
                                    </p>
                                  </div>
                                  <div>
                                    <Label>Deployment Target</Label>
                                    <Select onValueChange={(value) => handleDeploy(selectedPackage.id, value)}>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select deployment target" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="all">All Users (250 endpoints)</SelectItem>
                                        <SelectItem value="group">Specific Group (50 endpoints)</SelectItem>
                                        <SelectItem value="test">Test Group (25 endpoints)</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                </div>
                              )}
                            </DialogContent>
                          </Dialog>
                          <Button variant="ghost" size="sm">
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="deployments" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Deployment Status</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Package</TableHead>
                    <TableHead>Progress</TableHead>
                    <TableHead>Completed</TableHead>
                    <TableHead>Failed</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Started</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {deployments.map((deployment) => (
                    <TableRow key={deployment.id}>
                      <TableCell className="font-medium">{deployment.packageName}</TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <Progress value={deployment.progress} className="w-20" />
                          <span className="text-xs text-muted-foreground">
                            {deployment.progress}%
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>{deployment.completedUsers}/{deployment.targetUsers}</TableCell>
                      <TableCell>{deployment.failedUsers}</TableCell>
                      <TableCell>{getStatusBadge(deployment.status)}</TableCell>
                      <TableCell>{new Date(deployment.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button variant="ghost" size="sm">
                            <Pause className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <RotateCcw className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Endpoints</CardTitle>
                <Monitor className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">1,247</div>
                <p className="text-xs text-muted-foreground">
                  +12% from last month
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Successful Deployments</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">98.7%</div>
                <p className="text-xs text-muted-foreground">
                  Success rate this month
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Agents</CardTitle>
                <Shield className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">1,231</div>
                <p className="text-xs text-muted-foreground">
                  Online and protecting
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
