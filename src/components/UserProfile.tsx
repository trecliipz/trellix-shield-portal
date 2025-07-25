import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { 
  User, 
  Building2, 
  Monitor, 
  Shield, 
  Server, 
  FileText,
  Download, 
  Plus, 
  Trash2, 
  AlertCircle,
  CheckCircle,
  Clock,
  Edit,
  Settings,
  Activity,
  RefreshCw,
  Bell,
  HardDrive,
  Star,
  HelpCircle
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const endpointSchema = z.object({
  machineName: z.string().min(1, "Machine name is required"),
  osType: z.string().min(1, "OS type is required"),
  description: z.string().optional(),
});

const epoConfigSchema = z.object({
  groupName: z.string().min(1, "Group name is required"),
  ouName: z.string().min(1, "OU name is required"),
});

interface UserPlan {
  name: 'starter' | 'professional' | 'enterprise';
  displayName: string;
  endpointLimit: number;
  pricePerEndpoint: number;
}

const PLAN_CONFIG: Record<string, UserPlan> = {
  starter: { name: 'starter', displayName: 'Starter', endpointLimit: 5, pricePerEndpoint: 15 },
  professional: { name: 'professional', displayName: 'Professional', endpointLimit: -1, pricePerEndpoint: 25 },
  enterprise: { name: 'enterprise', displayName: 'Enterprise', endpointLimit: -1, pricePerEndpoint: 35 },
};

export default function UserProfile() {
  const [user, setUser] = useState<any>(null);
  const [organization, setOrganization] = useState<any>(null);
  const [endpoints, setEndpoints] = useState<any[]>([]);
  const [agentConfiguration, setAgentConfiguration] = useState<any>(null);
  const [assignedAgentDownloads, setAssignedAgentDownloads] = useState<any[]>([]);
  const [showAddEndpoint, setShowAddEndpoint] = useState(false);
  const [showEpoConfig, setShowEpoConfig] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [userPlan, setUserPlan] = useState<UserPlan>(PLAN_CONFIG.professional);
  const [userSubscription, setUserSubscription] = useState<any>(null);

  const endpointForm = useForm<z.infer<typeof endpointSchema>>({
    resolver: zodResolver(endpointSchema),
    defaultValues: { machineName: "", osType: "", description: "" },
  });

  const epoForm = useForm<z.infer<typeof epoConfigSchema>>({
    resolver: zodResolver(epoConfigSchema),
    defaultValues: { groupName: "", ouName: "" },
  });

  useEffect(() => {
    loadUserData();
    setupRealtimeSubscription();
  }, []);

  const setupRealtimeSubscription = () => {
    const channel = supabase
      .channel('user-agent-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'agent_configurations'
      }, (payload) => {
        if (payload.new && (payload.new as any).user_id === user?.id) {
          loadAgentConfiguration();
          toast.success("Agent configuration updated");
        }
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'agent_downloads'
      }, (payload) => {
        if (payload.new && (payload.new as any).user_id === user?.id) {
          loadAssignedAgentDownloads();
          toast.success("New agent assigned by administrator");
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const loadUserData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      setUser(user);

      // Load organization data
      const { data: orgData } = await supabase
        .from('user_organizations')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      if (orgData) {
        setOrganization(orgData);
        if (orgData.group_name && orgData.organization_name) {
          epoForm.reset({
            groupName: orgData.group_name,
            ouName: orgData.organization_name
          });
        }
      }

      // Load endpoints
      const { data: endpointsData } = await supabase
        .from('endpoints')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (endpointsData) setEndpoints(endpointsData);

      // Load user subscription, configuration, and assigned downloads
      await Promise.all([
        loadUserSubscription(),
        loadAgentConfiguration(),
        loadAssignedAgentDownloads()
      ]);

    } catch (error) {
      toast.error("Error loading profile data");
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadUserSubscription = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      setUserSubscription(data);
    } catch (error) {
      console.error('Error loading user subscription:', error);
    }
  };

  const loadAgentConfiguration = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('agent_configurations')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      setAgentConfiguration(data);
    } catch (error) {
      console.error('Error loading agent configuration:', error);
    }
  };

  const loadAssignedAgentDownloads = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('agent_downloads')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAssignedAgentDownloads(data || []);
    } catch (error) {
      console.error('Error loading assigned agent downloads:', error);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const initiateFileDownload = async (downloadData: any) => {
    try {
      // Create a mock download URL for demonstration
      // In a real implementation, this would be the actual file URL from the assigned download
      const downloadUrl = downloadData.download_url || `https://releases.company.com/agents/${downloadData.file_name}`;
      
      // Create hidden anchor element for download
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = downloadData.file_name;
      link.style.display = 'none';
      
      // Add to DOM, click, and remove
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success(`Downloading ${downloadData.agent_name} v${downloadData.agent_version} (${formatFileSize(downloadData.file_size || 0)})`);
      return true;
    } catch (error) {
      console.error('Error initiating file download:', error);
      toast.error("Download failed. Please try again.");
      return false;
    }
  };

  const handleDownloadAssignedAgent = async (downloadId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Check if user can download based on subscription
      const { data: canDownload, error: checkError } = await supabase
        .rpc('can_user_download', { p_user_id: user.id });

      if (checkError) throw checkError;

      if (!canDownload) {
        toast.error("Download limit reached. Please upgrade your subscription.");
        return;
      }

      // Find the specific assigned download
      const assignedDownload = assignedAgentDownloads.find(download => download.id === downloadId);
      if (!assignedDownload || assignedDownload.status !== 'available') {
        toast.error("This agent is not available for download");
        return;
      }

      // Initiate download
      const downloadSuccess = await initiateFileDownload(assignedDownload);
      
      if (downloadSuccess) {
        // Update download status and increment count
        const { error: updateError } = await supabase
          .from('agent_downloads')
          .update({ 
            status: 'downloaded',
            downloaded_at: new Date().toISOString()
          })
          .eq('id', downloadId);

        if (updateError) throw updateError;

        // Increment download count
        const { error } = await supabase
          .rpc('increment_download_count', { p_user_id: user.id });

        if (error) throw error;
        
        // Reload data to update UI
        await Promise.all([loadUserSubscription(), loadAssignedAgentDownloads()]);
      }
    } catch (error) {
      console.error('Error downloading agent:', error);
      toast.error("Error downloading agent");
    }
  };

  const handleAddEndpoint = async (values: z.infer<typeof endpointSchema>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !organization) return;

      if (userPlan.endpointLimit > 0 && endpoints.length >= userPlan.endpointLimit) {
        toast.error(`Endpoint limit reached. Upgrade to add more than ${userPlan.endpointLimit} endpoints.`);
        return;
      }

      const { error } = await supabase
        .from('endpoints')
        .insert([{
          user_id: user.id,
          organization_id: organization.id,
          machine_name: values.machineName,
          os_type: values.osType,
          deployment_status: 'pending',
          health_status: 'unknown',
        }]);

      if (error) throw error;

      toast.success("Machine added successfully!");
      setShowAddEndpoint(false);
      endpointForm.reset();
      loadUserData();
    } catch (error) {
      toast.error("Error adding machine");
      console.error('Error:', error);
    }
  };

  const handleDeleteEndpoint = async (id: string) => {
    try {
      const { error } = await supabase
        .from('endpoints')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success("Machine removed successfully!");
      loadUserData();
    } catch (error) {
      toast.error("Error removing machine");
      console.error('Error:', error);
    }
  };

  const handleSaveEpoConfig = async (values: z.infer<typeof epoConfigSchema>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !organization) return;

      // Update organization with EPO settings
      const { error: orgError } = await supabase
        .from('user_organizations')
        .update({
          group_name: values.groupName,
          organization_name: values.ouName,
        })
        .eq('id', organization.id);

      if (orgError) throw orgError;

      // Also sync with agent configuration
      const epoConfig = {
        server_url: 'https://epo.company.com',
        group_name: values.groupName,
        ou_name: values.ouName
      };

      const { error: syncError } = await supabase.rpc('sync_user_agent_config', {
        p_user_id: user.id,
        p_agent_version: assignedAgentDownloads[0]?.agent_version || '2.1.5',
        p_epo_config: epoConfig
      });

      if (syncError) throw syncError;

      toast.success("EPO configuration saved and synced successfully!");
      setShowEpoConfig(false);
      loadUserData();
    } catch (error) {
      toast.error("Error saving EPO configuration");
      console.error('Error:', error);
    }
  };

  const handleSyncConfiguration = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const epoConfig = {
        server_url: 'https://epo.company.com',
        group_name: organization?.group_name,
        ou_name: organization?.organization_name
      };

      const { data, error } = await supabase.rpc('sync_user_agent_config', {
        p_user_id: user.id,
        p_agent_version: assignedAgentDownloads[0]?.agent_version || '2.1.5',
        p_epo_config: epoConfig
      });

      if (error) throw error;

      toast.success("Configuration synced with admin system");
      loadAgentConfiguration();
    } catch (error) {
      console.error('Error syncing configuration:', error);
      toast.error("Failed to sync configuration");
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { variant: "secondary" as const, icon: Clock, color: "text-yellow-600" },
      deployed: { variant: "default" as const, icon: CheckCircle, color: "text-green-600" },
      failed: { variant: "destructive" as const, icon: AlertCircle, color: "text-red-600" },
      healthy: { variant: "default" as const, icon: Shield, color: "text-green-600" },
      warning: { variant: "destructive" as const, icon: AlertCircle, color: "text-yellow-600" },
      offline: { variant: "secondary" as const, icon: Clock, color: "text-gray-600" },
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    const Icon = config.icon;
    
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const activeEndpoints = endpoints.filter(e => e.deployment_status === 'deployed' || e.health_status === 'healthy').length;
  const pendingEndpoints = endpoints.filter(e => e.deployment_status === 'pending').length;
  const monthlyBilling = endpoints.length * userPlan.pricePerEndpoint;
  
  const downloadsRemaining = userSubscription?.max_downloads === -1 
    ? 'Unlimited' 
    : Math.max(0, (userSubscription?.max_downloads || 0) - (userSubscription?.downloads_used || 0));

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="container mx-auto">
          <div className="text-center text-muted-foreground">Loading profile...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Enhanced Header */}
        <Card className="modern-card border-border/50">
          <CardContent className="p-6">
            <div className="flex items-center space-x-6">
              <div className="relative">
                <div className="w-20 h-20 bg-gradient-to-br from-primary to-trellix-orange rounded-full flex items-center justify-center shadow-lg">
                  <User className="w-10 h-10 text-primary-foreground" />
                </div>
                <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center border-4 border-background">
                  <Activity className="w-4 h-4 text-white" />
                </div>
              </div>
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-foreground mb-1">
                  {user?.user_metadata?.name || 'Welcome'}
                </h1>
                <p className="text-muted-foreground mb-3">{user?.email}</p>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-2">
                      <Monitor className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium">Endpoints:</span>
                      <span className="text-sm text-muted-foreground">{endpoints.length} / {userPlan.endpointLimit === -1 ? '∞' : userPlan.endpointLimit}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Star className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium">Plan:</span>
                      <Badge variant="secondary">{userSubscription?.plan_type || 'Professional'}</Badge>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Download className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium">Downloads:</span>
                      <span className="text-sm text-muted-foreground">{downloadsRemaining}</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-6 text-sm text-muted-foreground">
                    <div className="flex items-center space-x-1">
                      <CheckCircle className="h-3 w-3 text-green-500" />
                      <span>{activeEndpoints} Active</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Clock className="h-3 w-3 text-yellow-500" />
                      <span>{pendingEndpoints} Pending</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <span className="text-primary font-medium">${monthlyBilling}/month</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex space-x-2">
                <Dialog open={showEpoConfig} onOpenChange={setShowEpoConfig}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Settings className="h-4 w-4 mr-2" />
                      EPO Config
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>EPO Configuration</DialogTitle>
                    </DialogHeader>
                    <Form {...epoForm}>
                      <form onSubmit={epoForm.handleSubmit(handleSaveEpoConfig)} className="space-y-4">
                        <FormField
                          control={epoForm.control}
                          name="groupName"
                          render={({ field }) => (
                           <FormItem>
                             <FormLabel className="flex items-center gap-2">
                               Group Name
                               <TooltipProvider>
                                 <Tooltip>
                                   <TooltipTrigger>
                                     <HelpCircle className="h-4 w-4 text-muted-foreground" />
                                   </TooltipTrigger>
                                   <TooltipContent>
                                     <p>The EPO group name where this organization's endpoints will be managed</p>
                                   </TooltipContent>
                                 </Tooltip>
                               </TooltipProvider>
                             </FormLabel>
                             <FormControl>
                               <Input placeholder="Corporate-Security" {...field} />
                             </FormControl>
                             <FormMessage />
                           </FormItem>
                          )}
                        />
                        <FormField
                          control={epoForm.control}
                          name="ouName"
                          render={({ field }) => (
                           <FormItem>
                             <FormLabel className="flex items-center gap-2">
                               Organizational Unit (OU)
                               <TooltipProvider>
                                 <Tooltip>
                                   <TooltipTrigger>
                                     <HelpCircle className="h-4 w-4 text-muted-foreground" />
                                   </TooltipTrigger>
                                   <TooltipContent>
                                     <p>The organizational unit structure for agent deployment and policy management</p>
                                   </TooltipContent>
                                 </Tooltip>
                               </TooltipProvider>
                             </FormLabel>
                             <FormControl>
                               <Input placeholder="IT-Security" {...field} />
                             </FormControl>
                             <FormMessage />
                           </FormItem>
                          )}
                        />
                        <div className="flex space-x-2 pt-4">
                          <Button type="submit" className="flex-1">Save Config</Button>
                          <Button 
                            type="button" 
                            variant="outline" 
                            onClick={() => setShowEpoConfig(false)}
                            className="flex-1"
                          >
                            Cancel
                          </Button>
                        </div>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>
                <Button 
                  onClick={handleSyncConfiguration}
                  size="sm"
                  className="bg-primary hover:bg-primary/90"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Sync Config
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* My Agent Downloads Section */}
        <Card className="modern-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Download className="h-5 w-5 text-primary" />
                <CardTitle>My Agent Downloads</CardTitle>
              </div>
              {userSubscription && (
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <span>{userSubscription.downloads_used} of {userSubscription.max_downloads === -1 ? 'unlimited' : userSubscription.max_downloads} downloads used</span>
                  <Badge variant={downloadsRemaining === 0 ? 'destructive' : 'secondary'}>
                    {downloadsRemaining} Remaining
                  </Badge>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {assignedAgentDownloads.length > 0 ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium">Agents Assigned by Administrator</h4>
                  <Badge variant="outline">{assignedAgentDownloads.length} Available</Badge>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Version</TableHead>
                      <TableHead>Platform</TableHead>
                      <TableHead>Size</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Assigned Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {assignedAgentDownloads.map((download) => (
                      <TableRow key={download.id}>
                        <TableCell className="font-medium">{download.agent_name}</TableCell>
                        <TableCell>{download.agent_version}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{download.platform}</Badge>
                        </TableCell>
                        <TableCell>{formatFileSize(download.file_size || 0)}</TableCell>
                        <TableCell>
                          {download.status === 'available' && (
                            <Badge variant="default">Ready to Download</Badge>
                          )}
                          {download.status === 'downloaded' && (
                            <Badge variant="secondary">Downloaded</Badge>
                          )}
                          {download.status === 'installed' && (
                            <Badge variant="outline">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Installed
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(download.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          {download.status === 'available' ? (
                            <Button 
                              size="sm"
                              onClick={() => handleDownloadAssignedAgent(download.id)}
                              disabled={downloadsRemaining === 0}
                            >
                              <Download className="h-3 w-3 mr-1" />
                              Download
                            </Button>
                          ) : (
                            <Button size="sm" variant="ghost" disabled>
                              <CheckCircle className="h-3 w-3 mr-1" />
                              {download.status === 'downloaded' ? 'Downloaded' : 'Installed'}
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-foreground mb-2">No Agent Downloads Assigned</h3>
                <p className="text-muted-foreground mb-1">Your administrator hasn't assigned any agent packages yet.</p>
                <p className="text-sm text-muted-foreground">Contact your administrator to request agent access.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Endpoints Section */}
        <Card className="modern-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Monitor className="h-5 w-5 text-primary" />
                <CardTitle>Endpoint Management</CardTitle>
              </div>
              <Dialog open={showAddEndpoint} onOpenChange={setShowAddEndpoint}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Machine
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Machine</DialogTitle>
                  </DialogHeader>
                  <Form {...endpointForm}>
                    <form onSubmit={endpointForm.handleSubmit(handleAddEndpoint)} className="space-y-4">
                      <FormField
                        control={endpointForm.control}
                        name="machineName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Machine Name</FormLabel>
                            <FormControl>
                              <Input placeholder="DESKTOP-001" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={endpointForm.control}
                        name="osType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Operating System</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select OS" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="windows">Windows</SelectItem>
                                <SelectItem value="macos">macOS</SelectItem>
                                <SelectItem value="linux">Linux</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="flex space-x-2 pt-4">
                        <Button type="submit" className="flex-1">Add Machine</Button>
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={() => setShowAddEndpoint(false)}
                          className="flex-1"
                        >
                          Cancel
                        </Button>
                      </div>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            {endpoints.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Machine Name</TableHead>
                    <TableHead>OS Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Agent Version</TableHead>
                    <TableHead>Last Check-in</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {endpoints.map((endpoint) => (
                    <TableRow key={endpoint.id}>
                      <TableCell className="font-medium">{endpoint.machine_name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{endpoint.os_type}</Badge>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(endpoint.health_status)}
                      </TableCell>
                      <TableCell>{endpoint.agent_version || 'Not installed'}</TableCell>
                      <TableCell>
                        {endpoint.last_check_in 
                          ? new Date(endpoint.last_check_in).toLocaleDateString()
                          : 'Never'
                        }
                      </TableCell>
                      <TableCell>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleDeleteEndpoint(endpoint.id)}
                          className="hover:bg-destructive hover:text-destructive-foreground"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-12">
                <Monitor className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">No Machines Added</h3>
                <p className="text-muted-foreground mb-4">Add your first machine to start monitoring endpoint security.</p>
                <Button onClick={() => setShowAddEndpoint(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Machine
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Configuration Status */}
        {agentConfiguration && (
          <Card className="modern-card">
            <CardHeader>
              <div className="flex items-center space-x-2">
                <Server className="h-5 w-5 text-primary" />
                <CardTitle>Agent Configuration</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Shield className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">Agent Version:</span>
                    <Badge variant="secondary">{agentConfiguration.agent_version}</Badge>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Server className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">EPO Server:</span>
                    <span className="text-sm text-muted-foreground">{agentConfiguration.epo_server_url || 'Not configured'}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Building2 className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">Group:</span>
                    <span className="text-sm text-muted-foreground">{agentConfiguration.group_name || 'Default'}</span>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Activity className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">Auto Update:</span>
                    <Badge variant={agentConfiguration.auto_update_enabled ? "default" : "secondary"}>
                      {agentConfiguration.auto_update_enabled ? "Enabled" : "Disabled"}
                    </Badge>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">Last Sync:</span>
                    <span className="text-sm text-muted-foreground">
                      {new Date(agentConfiguration.last_sync_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}