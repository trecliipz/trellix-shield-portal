
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
import { Checkbox } from "@/components/ui/checkbox";
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
  Zap,
  RefreshCw,
  Settings
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface AgentPackage {
  id: string;
  name: string;
  version: string;
  platform: 'windows' | 'macos' | 'linux';
  fileSize: number;
  uploadDate: string;
  description: string;
  isActive: boolean;
  isRecommended?: boolean;
  deploymentTarget?: 'all' | 'group' | 'organization' | 'manual';
  features?: string[];
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

interface UserConfiguration {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  agentVersion: string;
  epoServerUrl?: string;
  groupName?: string;
  ouName?: string;
  lastSyncAt: string;
  organizationName?: string;
}

export const AdminAgentManagement = () => {
  const [packages, setPackages] = useState<AgentPackage[]>([]);
  const [deployments, setDeployments] = useState<DeploymentJob[]>([]);
  const [userConfigurations, setUserConfigurations] = useState<UserConfiguration[]>([]);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [showDeployDialog, setShowDeployDialog] = useState(false);
  const [showBulkAssignDialog, setShowBulkAssignDialog] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<AgentPackage | null>(null);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [newPackage, setNewPackage] = useState({
    name: '',
    version: '',
    platform: 'windows' as 'windows' | 'macos' | 'linux',
    description: '',
    features: '',
    deploymentTarget: 'all' as 'all' | 'group' | 'organization' | 'manual',
    file: null as File | null
  });

  useEffect(() => {
    loadData();
    setupRealtimeSubscription();
  }, []);

  const setupRealtimeSubscription = () => {
    const channel = supabase
      .channel('admin-agent-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'admin_agent_packages'
      }, () => {
        loadPackages();
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'agent_configurations'
      }, () => {
        loadUserConfigurations();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const loadData = async () => {
    await Promise.all([
      loadPackages(),
      loadUserConfigurations(),
      loadMockDeployments()
    ]);
  };

  const loadPackages = async () => {
    try {
      const { data, error } = await supabase
        .from('admin_agent_packages')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedPackages: AgentPackage[] = data?.map(pkg => ({
        id: pkg.id,
        name: pkg.name,
        version: pkg.version,
        platform: pkg.platform as 'windows' | 'macos' | 'linux',
        fileSize: pkg.file_size || 0,
        uploadDate: new Date(pkg.created_at).toISOString().split('T')[0],
        description: pkg.description || '',
        isActive: pkg.is_active,
        isRecommended: pkg.is_recommended,
        deploymentTarget: pkg.deployment_target as 'all' | 'group' | 'organization' | 'manual',
        features: Array.isArray(pkg.features) ? pkg.features.map(f => String(f)) : []
      })) || [];

      setPackages(formattedPackages);
    } catch (error) {
      console.error('Error loading packages:', error);
      toast.error("Failed to load agent packages");
    }
  };

  const loadUserConfigurations = async () => {
    try {
      const { data, error } = await supabase
        .from('agent_configurations')
        .select(`
          *,
          profiles:user_id (
            name,
            email
          ),
          user_organizations (
            organization_name
          )
        `)
        .order('last_sync_at', { ascending: false });

      if (error) throw error;

      const formattedConfigs: UserConfiguration[] = data?.map(config => ({
        id: config.id,
        userId: config.user_id,
        userName: (config.profiles as any)?.name || 'Unknown User',
        userEmail: (config.profiles as any)?.email || 'unknown@email.com',
        agentVersion: config.agent_version,
        epoServerUrl: config.epo_server_url,
        groupName: config.group_name,
        ouName: config.ou_name,
        lastSyncAt: new Date(config.last_sync_at).toLocaleString(),
        organizationName: config.user_organizations?.organization_name
      })) || [];

      setUserConfigurations(formattedConfigs);
    } catch (error) {
      console.error('Error loading user configurations:', error);
      toast.error("Failed to load user configurations");
    }
  };

  const loadMockDeployments = () => {
    // Keep mock deployments for demo purposes
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

    setDeployments(mockDeployments);
  };

  const handleCreatePackage = async () => {
    if (!newPackage.name || !newPackage.version || !newPackage.file) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const featuresArray = newPackage.features.split(',').map(f => f.trim()).filter(f => f);

      const { error } = await supabase
        .from('admin_agent_packages')
        .insert([{
          name: newPackage.name,
          version: newPackage.version,
          platform: newPackage.platform,
          file_name: newPackage.file.name,
          file_size: newPackage.file.size,
          description: newPackage.description,
          features: featuresArray,
          deployment_target: newPackage.deploymentTarget,
          created_by: user.id,
          is_active: true
        }]);

      if (error) throw error;

      toast.success("Agent package created successfully!");
      setShowUploadDialog(false);
      setNewPackage({
        name: '',
        version: '',
        platform: 'windows',
        description: '',
        features: '',
        deploymentTarget: 'all',
        file: null
      });
      setUploadProgress(0);
      loadPackages();
    } catch (error) {
      console.error('Error creating package:', error);
      toast.error("Failed to create agent package");
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['.exe', '.msi', '.pkg', '.deb', '.rpm'];
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    
    if (!allowedTypes.includes(fileExtension)) {
      toast.error("Please upload a valid agent package (.exe, .msi, .pkg, .deb, .rpm)");
      return;
    }

    setNewPackage({ ...newPackage, file });
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

  const handleBulkAssignAgent = async () => {
    if (!selectedPackage || selectedUsers.length === 0) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase.rpc('assign_agent_to_users', {
        p_agent_id: selectedPackage.id,
        p_user_ids: selectedUsers,
        p_assigned_by: user.id
      });

      if (error) throw error;

      toast.success(`Agent assigned to ${selectedUsers.length} users successfully!`);
      setShowBulkAssignDialog(false);
      setSelectedUsers([]);
      setSelectedPackage(null);
      
      // Trigger refresh of user configurations
      loadUserConfigurations();
    } catch (error) {
      console.error('Error assigning agent:', error);
      toast.error("Failed to assign agent to users");
    }
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
                    <Input 
                      id="package-name" 
                      placeholder="Trellix Agent v24.2"
                      value={newPackage.name}
                      onChange={(e) => setNewPackage({ ...newPackage, name: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="version">Version</Label>
                    <Input 
                      id="version" 
                      placeholder="24.2.0"
                      value={newPackage.version}
                      onChange={(e) => setNewPackage({ ...newPackage, version: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="platform">Platform</Label>
                    <Select value={newPackage.platform} onValueChange={(value: 'windows' | 'macos' | 'linux') => setNewPackage({ ...newPackage, platform: value })}>
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
                    <Label htmlFor="deployment-target">Deployment Target</Label>
                    <Select value={newPackage.deploymentTarget} onValueChange={(value: 'all' | 'group' | 'organization' | 'manual') => setNewPackage({ ...newPackage, deploymentTarget: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select deployment target" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Users</SelectItem>
                        <SelectItem value="group">Specific Groups</SelectItem>
                        <SelectItem value="organization">Organization</SelectItem>
                        <SelectItem value="manual">Manual Assignment</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea 
                      id="description" 
                      placeholder="Brief description of this agent version..."
                      value={newPackage.description}
                      onChange={(e) => setNewPackage({ ...newPackage, description: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="features">Features (comma-separated)</Label>
                    <Textarea 
                      id="features" 
                      placeholder="Real-time scanning, Behavioral analysis, Cloud intelligence"
                      value={newPackage.features}
                      onChange={(e) => setNewPackage({ ...newPackage, features: e.target.value })}
                    />
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
                  <Button onClick={handleCreatePackage} className="w-full">
                    Create Agent Package
                  </Button>
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
          <TabsTrigger value="user-configs">User Configurations</TabsTrigger>
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

        <TabsContent value="user-configs" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>User Agent Configurations</CardTitle>
                <div className="flex space-x-2">
                  <Button variant="outline" onClick={loadUserConfigurations}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                  </Button>
                  <Dialog open={showBulkAssignDialog} onOpenChange={setShowBulkAssignDialog}>
                    <DialogTrigger asChild>
                      <Button>
                        <Users className="h-4 w-4 mr-2" />
                        Bulk Assign Agent
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Bulk Assign Agent to Users</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label>Select Agent Package</Label>
                          <Select onValueChange={(value) => setSelectedPackage(packages.find(p => p.id === value) || null)}>
                            <SelectTrigger>
                              <SelectValue placeholder="Choose an agent package" />
                            </SelectTrigger>
                            <SelectContent>
                              {packages.filter(p => p.isActive).map(pkg => (
                                <SelectItem key={pkg.id} value={pkg.id}>
                                  {pkg.name} v{pkg.version} ({pkg.platform})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Select Users</Label>
                          <div className="max-h-48 overflow-y-auto border rounded-md p-2 space-y-2">
                            {userConfigurations.map(config => (
                              <div key={config.id} className="flex items-center space-x-2">
                                <Checkbox
                                  checked={selectedUsers.includes(config.userId)}
                                  onCheckedChange={(checked) => {
                                    if (checked) {
                                      setSelectedUsers([...selectedUsers, config.userId]);
                                    } else {
                                      setSelectedUsers(selectedUsers.filter(id => id !== config.userId));
                                    }
                                  }}
                                />
                                <div className="flex-1">
                                  <div className="font-medium">{config.userName}</div>
                                  <div className="text-sm text-muted-foreground">{config.userEmail}</div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                        <Button 
                          onClick={() => handleBulkAssignAgent()}
                          disabled={!selectedPackage || selectedUsers.length === 0}
                          className="w-full"
                        >
                          Assign Agent to {selectedUsers.length} Users
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Agent Version</TableHead>
                    <TableHead>EPO Group</TableHead>
                    <TableHead>Organization</TableHead>
                    <TableHead>Last Sync</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {userConfigurations.map((config) => (
                    <TableRow key={config.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{config.userName}</div>
                          <div className="text-sm text-muted-foreground">{config.userEmail}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{config.agentVersion}</Badge>
                      </TableCell>
                      <TableCell>{config.groupName || 'Not configured'}</TableCell>
                      <TableCell>{config.organizationName || 'Not configured'}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{config.lastSyncAt}</TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button variant="ghost" size="sm">
                            <Settings className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <RefreshCw className="h-4 w-4" />
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
