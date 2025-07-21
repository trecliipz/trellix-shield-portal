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
  Bell
} from "lucide-react";
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

export const UserProfile = () => {
  const [user, setUser] = useState<any>(null);
  const [organization, setOrganization] = useState<any>(null);
  const [endpoints, setEndpoints] = useState<any[]>([]);
  const [assignedAgents, setAssignedAgents] = useState<any[]>([]);
  const [agentConfiguration, setAgentConfiguration] = useState<any>(null);
  const [availableAgentPackages, setAvailableAgentPackages] = useState<any[]>([]);
  const [showAddEndpoint, setShowAddEndpoint] = useState(false);
  const [showEpoConfig, setShowEpoConfig] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [userPlan, setUserPlan] = useState<UserPlan>(PLAN_CONFIG.professional);
  const [hasNewAgents, setHasNewAgents] = useState(false);

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
        table: 'agent_downloads'
      }, (payload) => {
        if (payload.new && (payload.new as any).user_id === user?.id) {
          loadAssignedAgents();
          setHasNewAgents(true);
          toast.success("New agent assigned by administrator");
        }
      })
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

      // Load assigned agents, configuration, and available packages
      await Promise.all([
        loadAssignedAgents(),
        loadAgentConfiguration(),
        loadAvailableAgentPackages()
      ]);

    } catch (error) {
      toast.error("Error loading profile data");
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadAssignedAgents = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('agent_downloads')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAssignedAgents(data || []);
    } catch (error) {
      console.error('Error loading assigned agents:', error);
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

  const loadAvailableAgentPackages = async () => {
    try {
      const { data, error } = await supabase
        .from('admin_agent_packages')
        .select('*')
        .eq('is_active', true)
        .order('is_recommended', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAvailableAgentPackages(data || []);
    } catch (error) {
      console.error('Error loading available agent packages:', error);
    }
  };

  const initiateFileDownload = async (packageData: any) => {
    try {
      // Create a mock download URL for demonstration
      // In a real implementation, this would be the actual file URL from admin packages
      const downloadUrl = packageData.download_url || `https://releases.company.com/agents/${packageData.file_name}`;
      
      // Create hidden anchor element for download
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = packageData.file_name;
      link.style.display = 'none';
      
      // Add to DOM, click, and remove
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success(`Downloading ${packageData.name} v${packageData.version}`);
      return true;
    } catch (error) {
      console.error('Error initiating file download:', error);
      toast.error("Download failed. Please try again.");
      return false;
    }
  };

  const handleDownloadAgent = async (agentId?: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      let packageToDownload = null;

      if (agentId) {
        // User is downloading a specific assigned agent
        const assignedAgent = assignedAgents.find(agent => agent.id === agentId);
        if (!assignedAgent) {
          toast.error("Agent not found");
          return;
        }

        // Find the corresponding package info
        packageToDownload = availableAgentPackages.find(pkg => 
          pkg.name === assignedAgent.agent_name && 
          pkg.version === assignedAgent.agent_version
        );

        if (!packageToDownload) {
          // Create a mock package object from assigned agent data
          packageToDownload = {
            name: assignedAgent.agent_name,
            version: assignedAgent.agent_version,
            file_name: assignedAgent.file_name,
            platform: assignedAgent.platform
          };
        }

        // Initiate download
        const downloadSuccess = await initiateFileDownload(packageToDownload);
        
        if (downloadSuccess) {
          // Update agent download status
          const { error } = await supabase
            .from('agent_downloads')
            .update({ 
              status: 'downloaded',
              downloaded_at: new Date().toISOString()
            })
            .eq('id', agentId);

          if (error) throw error;
          loadAssignedAgents();
        }
      } else {
        // User is downloading latest available agent (self-service)
        const recommendedPackage = availableAgentPackages.find(pkg => pkg.is_recommended) || 
                                  availableAgentPackages[0];

        if (!recommendedPackage) {
          toast.error("No security agents available for download");
          return;
        }

        packageToDownload = recommendedPackage;

        // Initiate download
        const downloadSuccess = await initiateFileDownload(packageToDownload);
        
        if (downloadSuccess) {
          // Create a new agent download record for self-service download
          const { error } = await supabase
            .from('agent_downloads')
            .insert([{
              user_id: user.id,
              agent_name: packageToDownload.name,
              agent_version: packageToDownload.version,
              file_name: packageToDownload.file_name,
              platform: packageToDownload.platform,
              status: 'downloaded',
              downloaded_at: new Date().toISOString()
            }]);

          if (error) throw error;
          loadAssignedAgents();
        }
      }
      
      setHasNewAgents(false);
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

      const { error } = await supabase
        .from('user_organizations')
        .update({
          group_name: values.groupName,
          organization_name: values.ouName,
        })
        .eq('id', organization.id);

      if (error) throw error;

      toast.success("EPO configuration saved successfully!");
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
        p_agent_version: assignedAgents[0]?.agent_version || '2.1.5',
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
                  <Shield className="w-4 h-4 text-white" />
                </div>
              </div>
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-foreground">
                  {user?.user_metadata?.name || 'Security Administrator'}
                </h1>
                <p className="text-muted-foreground text-lg">{user?.email}</p>
                <div className="flex items-center space-x-4 mt-2">
                  <Badge variant="outline" className="border-green-500/50 text-green-400">
                    <Building2 className="w-4 h-4 mr-1" />
                    {organization?.industry || 'IT Security'}
                  </Badge>
                  <Badge variant="outline" className="border-blue-500/50 text-blue-400">
                    <Activity className="w-4 h-4 mr-1" />
                    Security Clearance: Active
                  </Badge>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-muted-foreground">Current Plan</div>
                <div className="text-2xl font-bold text-primary">{userPlan.displayName}</div>
                <div className="text-sm text-muted-foreground">
                  ${userPlan.pricePerEndpoint}/endpoint/month
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Security Agent & EPO Configuration */}
          <Card className="modern-card">
            <CardHeader>
              <CardTitle className="flex items-center space-x-3">
                <Download className="w-6 h-6 text-primary" />
                <span>Security Agent & Configuration</span>
                {hasNewAgents && (
                  <Badge variant="destructive" className="animate-pulse">
                    <Bell className="w-3 h-3 mr-1" />
                    New
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                {assignedAgents.length > 0 ? (
                  <div className="space-y-3">
                    {assignedAgents.map((agent) => (
                      <div key={agent.id} className="p-4 bg-primary/10 rounded-lg border border-primary/20">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-semibold text-foreground flex items-center">
                            <Shield className="w-5 h-5 mr-2 text-primary" />
                            {agent.agent_name} v{agent.agent_version}
                          </h3>
                          <Badge variant={
                            agent.status === 'downloaded' ? 'default' :
                            agent.status === 'installed' ? 'default' :
                            agent.status === 'available' ? 'secondary' : 'destructive'
                          }>
                            {agent.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-4">
                          Platform: {agent.platform} • {agent.assigned_by_admin ? 'Assigned by admin' : 'Self-downloaded'}
                        </p>
                        {agent.status === 'available' && (
                          <Button 
                            onClick={() => handleDownloadAgent(agent.id)}
                            className="w-full glow-button"
                          >
                            <Download className="w-5 h-5 mr-2" />
                            Download {agent.agent_name}
                          </Button>
                        )}
                        {agent.status === 'downloaded' && (
                          <Button variant="outline" className="w-full" disabled>
                            <CheckCircle className="w-5 h-5 mr-2" />
                            Downloaded - Install manually
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                ) : availableAgentPackages.length > 0 ? (
                  <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
                    <h3 className="font-semibold text-foreground mb-2 flex items-center">
                      <Shield className="w-5 h-5 mr-2 text-primary" />
                      {availableAgentPackages[0].name} v{availableAgentPackages[0].version}
                      {availableAgentPackages[0].is_recommended && (
                        <Badge variant="default" className="ml-2">Recommended</Badge>
                      )}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-2">
                      Platform: {availableAgentPackages[0].platform}
                    </p>
                    <p className="text-sm text-muted-foreground mb-4">
                      {availableAgentPackages[0].description || "Enhanced threat detection with real-time monitoring capabilities"}
                    </p>
                    <Button 
                      onClick={() => handleDownloadAgent()}
                      className="w-full glow-button"
                    >
                      <Download className="w-5 h-5 mr-2" />
                      Download Security Agent
                    </Button>
                  </div>
                ) : (
                  <div className="p-4 bg-muted/30 rounded-lg border border-border">
                    <h3 className="font-semibold text-foreground mb-2 flex items-center">
                      <AlertCircle className="w-5 h-5 mr-2 text-muted-foreground" />
                      No Agents Available
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      No security agents are currently available for download. Contact your administrator.
                    </p>
                  </div>
                )}

                <div className="border-t border-border pt-4">
                    <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-foreground flex items-center">
                      <Building2 className="w-5 h-5 mr-2 text-trellix-orange" />
                      Trellix EPO Configuration
                    </h3>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm" onClick={handleSyncConfiguration}>
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Sync
                      </Button>
                      <Dialog open={showEpoConfig} onOpenChange={setShowEpoConfig}>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Settings className="w-4 h-4 mr-2" />
                          Configure
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="bg-card border-border">
                        <DialogHeader>
                          <DialogTitle className="text-foreground">EPO Configuration</DialogTitle>
                        </DialogHeader>
                        <Form {...epoForm}>
                          <form onSubmit={epoForm.handleSubmit(handleSaveEpoConfig)} className="space-y-4">
                            <FormField
                              control={epoForm.control}
                              name="groupName"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-foreground">Group Name</FormLabel>
                                  <FormControl>
                                    <Input {...field} placeholder="e.g., Finance_Workstations" className="bg-background border-input" />
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
                                  <FormLabel className="text-foreground">Organizational Unit (OU)</FormLabel>
                                  <FormControl>
                                    <Input {...field} placeholder="e.g., Finance_Department" className="bg-background border-input" />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <Button type="submit" className="w-full">Save Configuration</Button>
                          </form>
                        </Form>
                      </DialogContent>
                    </Dialog>
                    </div>
                  </div>
                  
                  <div className="bg-muted/30 p-4 rounded-lg space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Group:</span>
                      <span className="text-sm font-medium text-foreground">
                        {agentConfiguration?.group_name || organization?.group_name || 'Not configured'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">OU:</span>
                      <span className="text-sm font-medium text-foreground">
                        {agentConfiguration?.ou_name || organization?.organization_name || 'Not configured'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Agent Version:</span>
                      <span className="text-sm font-medium text-foreground">
                        {agentConfiguration?.agent_version || 'Not synced'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Last Sync:</span>
                      <span className="text-sm font-medium text-foreground">
                        {agentConfiguration ? new Date(agentConfiguration.last_sync_at).toLocaleString() : 'Never'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Machine Management */}
          <Card className="modern-card">
            <CardHeader>
              <CardTitle className="flex items-center space-x-3">
                <Monitor className="w-6 h-6 text-green-500" />
                <span>Machine Management</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Dialog open={showAddEndpoint} onOpenChange={setShowAddEndpoint}>
                  <DialogTrigger asChild>
                    <Button className="w-full bg-green-600 hover:bg-green-700">
                      <Plus className="w-4 h-4 mr-2" />
                      Add New Machine
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-card border-border">
                    <DialogHeader>
                      <DialogTitle className="text-foreground">Add New Machine</DialogTitle>
                    </DialogHeader>
                    <Form {...endpointForm}>
                      <form onSubmit={endpointForm.handleSubmit(handleAddEndpoint)} className="space-y-4">
                        <FormField
                          control={endpointForm.control}
                          name="machineName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-foreground">Machine Name</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="e.g., WS-IT-01" className="bg-background border-input" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={endpointForm.control}
                          name="description"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-foreground">Description (Optional)</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="Brief description" className="bg-background border-input" />
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
                              <FormLabel className="text-foreground">Operating System</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger className="bg-background border-input">
                                    <SelectValue placeholder="Select OS type" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent className="bg-popover border-border">
                                  <SelectItem value="windows">Windows</SelectItem>
                                  <SelectItem value="macos">macOS</SelectItem>
                                  <SelectItem value="linux">Linux</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <Button type="submit" className="w-full">Add Machine</Button>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>

                {userPlan.endpointLimit > 0 && (
                  <div className="bg-muted/30 p-3 rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Endpoint Usage:</span>
                      <span className="text-sm font-medium text-foreground">
                        {endpoints.length}/{userPlan.endpointLimit}
                      </span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2 mt-2">
                      <div 
                        className="bg-primary h-2 rounded-full transition-all duration-300" 
                        style={{ width: `${Math.min((endpoints.length / userPlan.endpointLimit) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Stats Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="modern-card border-blue-500/20">
            <CardContent className="p-6 text-center">
              <div className="flex items-center justify-center mb-2">
                <CheckCircle className="w-8 h-8 text-blue-500 mr-2" />
                <div className="text-3xl font-bold text-blue-500">{activeEndpoints}</div>
              </div>
              <div className="text-sm text-muted-foreground">Active Machines</div>
            </CardContent>
          </Card>
          <Card className="modern-card border-yellow-500/20">
            <CardContent className="p-6 text-center">
              <div className="flex items-center justify-center mb-2">
                <Clock className="w-8 h-8 text-yellow-500 mr-2" />
                <div className="text-3xl font-bold text-yellow-500">{pendingEndpoints}</div>
              </div>
              <div className="text-sm text-muted-foreground">Pending Installs</div>
            </CardContent>
          </Card>
          <Card className="modern-card border-green-500/20">
            <CardContent className="p-6 text-center">
              <div className="flex items-center justify-center mb-2">
                <FileText className="w-8 h-8 text-green-500 mr-2" />
                <div className="text-3xl font-bold text-green-500">${monthlyBilling}</div>
              </div>
              <div className="text-sm text-muted-foreground">Monthly Billing</div>
            </CardContent>
          </Card>
        </div>

        {/* Machine Inventory & Billing */}
        <Card className="modern-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center space-x-3">
                <Server className="w-6 h-6 text-purple-600" />
                <span>Machine Inventory & Billing</span>
              </CardTitle>
              <div className="flex items-center space-x-4">
                <Badge variant="outline" className="text-muted-foreground">
                  Total: {endpoints.length} machines
                </Badge>
                <Button variant="outline" size="sm">
                  <FileText className="w-4 h-4 mr-2" />
                  Export Report
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {endpoints.length > 0 ? (
              <div className="rounded-lg border border-border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="text-foreground">Machine Name</TableHead>
                      <TableHead className="text-foreground">OS Type</TableHead>
                      <TableHead className="text-foreground">Date Added</TableHead>
                      <TableHead className="text-foreground">Status</TableHead>
                      <TableHead className="text-foreground">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {endpoints.map((endpoint) => (
                      <TableRow key={endpoint.id} className="hover:bg-muted/30">
                        <TableCell className="font-medium text-foreground">{endpoint.machine_name}</TableCell>
                        <TableCell className="capitalize text-muted-foreground">{endpoint.os_type}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {new Date(endpoint.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>{getStatusBadge(endpoint.deployment_status)}</TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteEndpoint(endpoint.id)}
                            className="text-red-500 hover:text-red-400 hover:bg-red-500/10"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-12">
                <Monitor className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
                <h3 className="text-lg font-medium text-foreground mb-2">No machines added yet</h3>
                <p className="text-muted-foreground mb-4">Get started by adding your first machine above</p>
                <Button onClick={() => setShowAddEndpoint(true)} variant="outline">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Your First Machine
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
