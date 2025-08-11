import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Download, 
  Settings, 
  Monitor, 
  Users, 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  Server,
  Plus,
  Trash2,
  RefreshCw,
  HelpCircle,
  Package,
  Tag,
  Building,
  User,
  Activity,
  Star,
  Shield
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

// Schema definitions
const endpointSchema = z.object({
  machineName: z.string().min(1, "Machine name is required"),
  osType: z.enum(["windows", "linux", "mac"]),
  description: z.string().optional()
});

const epoConfigSchema = z.object({
  groupName: z.string().min(1, "Group name is required"),
  ouName: z.string().min(1, "OU name is required"),
  customTags: z.string().optional(),
  ouGroups: z.string().optional()
});

const customPackageSchema = z.object({
  packageName: z.string().min(1, "Package name is required"),
  customTags: z.string().optional(),
  ouGroup: z.string().optional()
});

const PLAN_CONFIG = {
  free: { name: 'free', displayName: 'Free Trial', endpointLimit: 5, pricePerEndpoint: 0 },
  professional: { name: 'professional', displayName: 'Professional', endpointLimit: -1, pricePerEndpoint: 25 },
  enterprise: { name: 'enterprise', displayName: 'Enterprise', endpointLimit: -1, pricePerEndpoint: 35 }
};

export default function UserProfile() {
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [organization, setOrganization] = useState<any>(null);
  const [endpoints, setEndpoints] = useState<any[]>([]);
  const [subscription, setSubscription] = useState<any>(null);
  const [agentConfig, setAgentConfig] = useState<any>(null);
  const [assignedDownloads, setAssignedDownloads] = useState<any[]>([]);
  const [availablePackages, setAvailablePackages] = useState<any[]>([]);
  const [customPackages, setCustomPackages] = useState<any[]>([]);
  const [hasPaidSubscription, setHasPaidSubscription] = useState(false);
  const [isTestAccount, setIsTestAccount] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize forms
  const endpointForm = useForm({
    resolver: zodResolver(endpointSchema),
    defaultValues: {
      machineName: "",
      osType: "windows" as const,
      description: ""
    }
  });

  const epoForm = useForm({
    resolver: zodResolver(epoConfigSchema),
    defaultValues: {
      groupName: "",
      ouName: "",
      customTags: "",
      ouGroups: ""
    }
  });

  const customPackageForm = useForm({
    resolver: zodResolver(customPackageSchema),
    defaultValues: {
      packageName: "",
      customTags: "",
      ouGroup: ""
    }
  });

  useEffect(() => {
    loadUserData();
    setupRealtimeSubscription();
  }, []);

  const setupRealtimeSubscription = () => {
    const channel = supabase
      .channel('user-profile-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'agent_configurations'
      }, () => {
        loadAgentConfiguration();
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'agent_downloads'
      }, () => {
        loadAssignedAgentDownloads();
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

      // Load organization
      const { data: orgData } = await supabase
        .from('user_organizations')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      if (orgData) {
        setOrganization(orgData);
        epoForm.reset({
          groupName: orgData.group_name || "",
          ouName: orgData.organization_name || "",
          customTags: "",
          ouGroups: ""
        });
      }

      // Load endpoints
      const { data: endpointsData } = await supabase
        .from('endpoints')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (endpointsData) setEndpoints(endpointsData);

      await loadUserSubscription();
      await loadAgentConfiguration();
      await loadAssignedAgentDownloads();
      await loadAvailablePackages();
      await loadCustomPackages();
      
      setupRealtimeSubscription();

    } catch (error) {
      console.error('Error loading user data:', error);
      toast({
        title: "Error",
        description: "Failed to load profile data",
        variant: "destructive"
      });
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
      setSubscription(data);
    } catch (error) {
      console.error('Error loading subscription:', error);
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
      setAgentConfig(data);
      
      if (data) {
      epoForm.reset({
        groupName: data.group_name || "",
        ouName: data.ou_name || "",
        customTags: Array.isArray(data.custom_tags) ? data.custom_tags.join(', ') : "",
        ouGroups: Array.isArray(data.ou_groups) ? data.ou_groups.join(', ') : ""
      });
      }
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
      setAssignedDownloads(data || []);
    } catch (error) {
      console.error('Error loading assigned downloads:', error);
      toast({
        title: "Error",
        description: "Failed to load assigned agent downloads",
        variant: "destructive"
      });
    }
  };

  const loadAvailablePackages = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Check if user has paid subscription or is test account
      const { data: hasPaid } = await supabase.rpc('user_has_paid_subscription', {
        p_user_id: user.id
      });

      setHasPaidSubscription(hasPaid || false);
      setIsTestAccount(user.email?.includes('test') || false);

      if (hasPaid) {
        const { data, error } = await supabase
          .from('admin_agent_packages')
          .select('*')
          .eq('is_active', true)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setAvailablePackages(data || []);
      }
    } catch (error) {
      console.error('Error loading available packages:', error);
      toast({
        title: "Error",
        description: "Failed to load available packages",
        variant: "destructive"
      });
    }
  };

  const loadCustomPackages = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('user_custom_packages')
        .select(`
          *,
          admin_agent_packages (
            name,
            version,
            platform
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCustomPackages(data || []);
    } catch (error) {
      console.error('Error loading custom packages:', error);
      toast({
        title: "Error",
        description: "Failed to load custom packages",
        variant: "destructive"
      });
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const initiateFileDownload = async (fileName: string, agentName: string, version: string, fileSize: number) => {
    // Simulate download
    toast({
      title: "Download Started",
      description: `Downloading ${agentName} v${version} (${formatFileSize(fileSize)})`
    });
    return true;
  };

  const handleDownloadAssignedAgent = async (downloadId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Check download eligibility
      const { data: canDownload } = await supabase.rpc('can_user_download', {
        p_user_id: user.id
      });

      if (!canDownload) {
        toast({
          title: "Download Limit Reached",
          description: "You have reached your download limit for this subscription",
          variant: "destructive"
        });
        return;
      }

      const download = assignedDownloads.find(d => d.id === downloadId);
      if (!download || download.status !== 'available') {
        toast({
          title: "Error",
          description: "This agent is not available for download",
          variant: "destructive"
        });
        return;
      }

      await initiateFileDownload(download.file_name, download.agent_name, download.agent_version, download.file_size);

      // Update status and increment count
      const { error: updateError } = await supabase
        .from('agent_downloads')
        .update({ 
          status: 'downloaded',
          downloaded_at: new Date().toISOString()
        })
        .eq('id', downloadId);

      if (updateError) throw updateError;

      const { error } = await supabase.rpc('increment_download_count', {
        p_user_id: user.id
      });

      if (error) throw error;

      await loadUserSubscription();
      await loadAssignedAgentDownloads();
    } catch (error: any) {
      console.error('Error downloading agent:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to download agent",
        variant: "destructive"
      });
    }
  };

  const handleAddEndpoint = async (data: z.infer<typeof endpointSchema>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !organization) return;

      const planConfig = PLAN_CONFIG[subscription?.plan_type] || PLAN_CONFIG.professional;
      if (planConfig.endpointLimit > 0 && endpoints.length >= planConfig.endpointLimit) {
        toast({
          title: "Endpoint Limit Reached",
          description: `Your plan allows up to ${planConfig.endpointLimit} endpoints. Please upgrade to add more.`,
          variant: "destructive"
        });
        return;
      }

      const { error } = await supabase
        .from('endpoints')
        .insert([{
          user_id: user.id,
          organization_id: organization.id,
          machine_name: data.machineName,
          os_type: data.osType,
          deployment_status: 'pending',
          health_status: 'unknown'
        }]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Endpoint added successfully"
      });

      endpointForm.reset();
      await loadUserData();
    } catch (error: any) {
      console.error('Error adding endpoint:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to add endpoint",
        variant: "destructive"
      });
    }
  };

  const handleDeleteEndpoint = async (id: string) => {
    try {
      const { error } = await supabase
        .from('endpoints')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Endpoint removed successfully"
      });

      await loadUserData();
    } catch (error: any) {
      console.error('Error deleting endpoint:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to remove endpoint",
        variant: "destructive"
      });
    }
  };

  const handleSaveEpoConfig = async (data: z.infer<typeof epoConfigSchema>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Parse custom tags and OU groups
      const customTags = data.customTags ? data.customTags.split(',').map(tag => tag.trim()) : [];
      const ouGroups = data.ouGroups ? data.ouGroups.split(',').map(group => group.trim()) : [];

      // Update organization EPO config
      const { error: orgError } = await supabase
        .from('user_organizations')
        .update({
          group_name: data.groupName
        })
        .eq('user_id', user.id);

      if (orgError) throw orgError;

      // Sync with agent configuration
      const epoConfig = {
        group_name: data.groupName,
        ou_name: data.ouName,
        custom_tags: customTags,
        ou_groups: ouGroups
      };

      const { error: syncError } = await supabase.rpc('sync_user_agent_config', {
        p_user_id: user.id,
        p_agent_version: agentConfig?.agent_version || 'latest',
        p_epo_config: epoConfig
      });

      if (syncError) throw syncError;

      // Update agent configuration with new fields
      const { error: configError } = await supabase
        .from('agent_configurations')
        .update({
          custom_tags: customTags,
          ou_groups: ouGroups
        })
        .eq('user_id', user.id);

      if (configError) throw configError;

      toast({
        title: "Success",
        description: "EPO configuration saved with custom tags and OU groups"
      });

      await loadAgentConfiguration();
      await loadUserData();
    } catch (error: any) {
      console.error('Error saving EPO config:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to save EPO configuration",
        variant: "destructive"
      });
    }
  };

  const handleDownloadAvailableAgent = async (packageId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Check download eligibility
      const { data: canDownload } = await supabase.rpc('can_user_download', {
        p_user_id: user.id
      });

      if (!canDownload) {
        toast({
          title: "Download Limit Reached",
          description: "You have reached your download limit for this subscription",
          variant: "destructive"
        });
        return;
      }

      // Get package details
      const packageToDownload = availablePackages.find(pkg => pkg.id === packageId);
      if (!packageToDownload) return;

      // Simulate download
      toast({
        title: "Download Started",
        description: `Downloading ${packageToDownload.name} v${packageToDownload.version}`
      });

      // Increment download count
      const { error } = await supabase.rpc('increment_download_count', {
        p_user_id: user.id
      });

      if (error) throw error;

      await loadUserSubscription();
    } catch (error: any) {
      console.error('Error downloading agent:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to download agent package",
        variant: "destructive"
      });
    }
  };

  const handleCreateCustomPackage = async (data: z.infer<typeof customPackageSchema>, basePackageId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const customConfig = {
        custom_tags: data.customTags ? data.customTags.split(',').map(tag => tag.trim()) : [],
        ou_group: data.ouGroup || '',
        epo_config: agentConfig?.deployment_policies || {}
      };

      const { error } = await supabase.rpc('create_custom_package', {
        p_user_id: user.id,
        p_base_package_id: basePackageId,
        p_package_name: data.packageName,
        p_custom_config: customConfig
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Custom agent package created successfully"
      });

      customPackageForm.reset();
      await loadCustomPackages();
    } catch (error: any) {
      console.error('Error creating custom package:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create custom package",
        variant: "destructive"
      });
    }
  };

  const handleSyncConfiguration = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const epoConfig = {
        server_url: agentConfig?.epo_server_url,
        group_name: agentConfig?.group_name,
        ou_name: agentConfig?.ou_name,
        custom_tags: agentConfig?.custom_tags,
        ou_groups: agentConfig?.ou_groups
      };

      const { error } = await supabase.rpc('sync_user_agent_config', {
        p_user_id: user.id,
        p_agent_version: agentConfig?.agent_version || 'latest',
        p_epo_config: epoConfig
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Configuration synced successfully"
      });

      await loadAgentConfiguration();
    } catch (error: any) {
      console.error('Error syncing configuration:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to sync configuration",
        variant: "destructive"
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      available: { variant: "default" as const, icon: CheckCircle, color: "text-green-600" },
      downloaded: { variant: "secondary" as const, icon: Download, color: "text-blue-600" },
      installed: { variant: "default" as const, icon: Shield, color: "text-green-600" },
      pending: { variant: "outline" as const, icon: Clock, color: "text-yellow-600" },
      failed: { variant: "destructive" as const, icon: AlertCircle, color: "text-red-600" }
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
        {/* Header */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-6">
              <div className="relative">
                <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center">
                  <User className="w-8 h-8 text-primary-foreground" />
                </div>
                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center border-2 border-background">
                  <Activity className="w-3 h-3 text-white" />
                </div>
              </div>
              <div className="flex-1">
                <h1 className="text-2xl font-bold">
                  {user?.user_metadata?.name || user?.email || 'Welcome'}
                </h1>
                <p className="text-muted-foreground">{user?.email}</p>
                <div className="flex items-center gap-4 mt-2">
                  <div className="flex items-center gap-2">
                    <Star className="h-4 w-4 text-primary" />
                    <span className="text-sm">Plan: {subscription?.plan_type || 'Professional'}</span>
                  </div>
                  {organization && (
                    <div className="flex items-center gap-2">
                      <Building className="h-4 w-4 text-primary" />
                      <span className="text-sm">{organization.organization_name}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Endpoints</CardTitle>
              <Monitor className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{endpoints.length}</div>
              <p className="text-xs text-muted-foreground">
                Total managed endpoints
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Subscription</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold capitalize">
                {subscription?.plan_type || 'None'}
                {isTestAccount && <Badge variant="secondary" className="ml-2">TEST</Badge>}
              </div>
              <p className="text-xs text-muted-foreground">
                Current plan
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Downloads</CardTitle>
              <Download className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {subscription?.downloads_used || 0}
                {subscription?.max_downloads !== -1 && `/${subscription?.max_downloads}`}
              </div>
              <p className="text-xs text-muted-foreground">
                {subscription?.max_downloads === -1 || isTestAccount ? 'Unlimited downloads' : 'Downloads used'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Custom Packages</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{customPackages.length}</div>
              <p className="text-xs text-muted-foreground">
                Created packages
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="downloads" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="downloads">My Downloads</TabsTrigger>
            <TabsTrigger value="available">Available Packages</TabsTrigger>
            <TabsTrigger value="custom">Custom Packages</TabsTrigger>
            <TabsTrigger value="endpoints">Endpoints</TabsTrigger>
            <TabsTrigger value="config">Configuration</TabsTrigger>
          </TabsList>

          {/* My Downloads Tab */}
          <TabsContent value="downloads">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Download className="h-5 w-5" />
                  My Agent Downloads
                </CardTitle>
                <CardDescription>
                  Agent packages assigned to your account
                </CardDescription>
              </CardHeader>
              <CardContent>
                {assignedDownloads.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Download className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No agent downloads assigned yet</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Agent Name</TableHead>
                        <TableHead>Version</TableHead>
                        <TableHead>Platform</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {assignedDownloads.map((download) => (
                        <TableRow key={download.id}>
                          <TableCell className="font-medium">{download.agent_name}</TableCell>
                          <TableCell>{download.agent_version}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{download.platform}</Badge>
                          </TableCell>
                          <TableCell>{getStatusBadge(download.status)}</TableCell>
                          <TableCell>
                            {download.status === 'available' && (
                              <Button
                                size="sm"
                                onClick={() => handleDownloadAssignedAgent(download.id)}
                                className="flex items-center gap-2"
                              >
                                <Download className="h-4 w-4" />
                                Download
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Available Packages Tab */}
          <TabsContent value="available">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Available Agent Packages
                </CardTitle>
                <CardDescription>
                  {hasPaidSubscription || isTestAccount 
                    ? "Download any available agent package" 
                    : "Upgrade to a paid plan to access all available packages"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!hasPaidSubscription && !isTestAccount ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Upgrade to access available packages</p>
                    <Button className="mt-4">Upgrade Plan</Button>
                  </div>
                ) : availablePackages.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No packages available at this time</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Package Name</TableHead>
                        <TableHead>Version</TableHead>
                        <TableHead>Platform</TableHead>
                        <TableHead>Size</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {availablePackages.map((pkg) => (
                        <TableRow key={pkg.id}>
                          <TableCell className="font-medium">{pkg.name}</TableCell>
                          <TableCell>{pkg.version}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{pkg.platform}</Badge>
                          </TableCell>
                          <TableCell>{formatFileSize(pkg.file_size)}</TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={() => handleDownloadAvailableAgent(pkg.id)}
                                className="flex items-center gap-2"
                              >
                                <Download className="h-4 w-4" />
                                Download
                              </Button>
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button size="sm" variant="outline">
                                    <Plus className="h-4 w-4" />
                                    Customize
                                  </Button>
                                </DialogTrigger>
                                <DialogContent aria-describedby={undefined}>
                                  <DialogHeader>
                                    <DialogTitle>Create Custom Package</DialogTitle>
                                    <DialogDescription>
                                      Create a customized version of {pkg.name} with your EPO settings
                                    </DialogDescription>
                                  </DialogHeader>
                                  <Form {...customPackageForm}>
                                    <form onSubmit={customPackageForm.handleSubmit((data) => handleCreateCustomPackage(data, pkg.id))} className="space-y-4">
                                      <FormField
                                        control={customPackageForm.control}
                                        name="packageName"
                                        render={({ field }) => (
                                          <FormItem>
                                            <FormLabel>Package Name</FormLabel>
                                            <FormControl>
                                              <Input placeholder="Custom Package Name" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                          </FormItem>
                                        )}
                                      />
                                      <FormField
                                        control={customPackageForm.control}
                                        name="customTags"
                                        render={({ field }) => (
                                          <FormItem>
                                            <FormLabel>Custom Tags (comma-separated)</FormLabel>
                                            <FormControl>
                                              <Input placeholder="tag1, tag2, tag3" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                          </FormItem>
                                        )}
                                      />
                                      <FormField
                                        control={customPackageForm.control}
                                        name="ouGroup"
                                        render={({ field }) => (
                                          <FormItem>
                                            <FormLabel>OU Group</FormLabel>
                                            <FormControl>
                                              <Input placeholder="Organizational Unit Group" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                          </FormItem>
                                        )}
                                      />
                                      <Button type="submit" className="w-full">Create Custom Package</Button>
                                    </form>
                                  </Form>
                                </DialogContent>
                              </Dialog>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Custom Packages Tab */}
          <TabsContent value="custom">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Custom Agent Packages
                </CardTitle>
                <CardDescription>
                  Your custom agent packages with personalized configurations
                </CardDescription>
              </CardHeader>
              <CardContent>
                {customPackages.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No custom packages created yet</p>
                    <p className="text-sm">Create custom packages from the Available Packages tab</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Package Name</TableHead>
                        <TableHead>Base Package</TableHead>
                        <TableHead>Custom Tags</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {customPackages.map((pkg) => (
                        <TableRow key={pkg.id}>
                          <TableCell className="font-medium">{pkg.package_name}</TableCell>
                          <TableCell>
                            {pkg.admin_agent_packages?.name} v{pkg.admin_agent_packages?.version}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1 flex-wrap">
                              {pkg.custom_config?.custom_tags?.map((tag: string, index: number) => (
                                <Badge key={index} variant="secondary" className="text-xs">
                                  <Tag className="h-3 w-3 mr-1" />
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          </TableCell>
                          <TableCell>{new Date(pkg.created_at).toLocaleDateString()}</TableCell>
                          <TableCell>
                            <Button size="sm" className="flex items-center gap-2">
                              <Download className="h-4 w-4" />
                              Download
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Endpoints Tab */}
          <TabsContent value="endpoints">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Monitor className="h-5 w-5" />
                  Endpoint Management
                </CardTitle>
                <CardDescription>
                  Manage your organization's endpoints and machines
                </CardDescription>
                <div className="flex justify-end">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Endpoint
                      </Button>
                    </DialogTrigger>
                    <DialogContent aria-describedby={undefined}>
                      <DialogHeader>
                        <DialogTitle>Add New Endpoint</DialogTitle>
                        <DialogDescription>
                          Add a new machine to your organization
                        </DialogDescription>
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
                                  <Input placeholder="Enter machine name" {...field} />
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
                                      <SelectValue placeholder="Select OS type" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="windows">Windows</SelectItem>
                                    <SelectItem value="linux">Linux</SelectItem>
                                    <SelectItem value="mac">macOS</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={endpointForm.control}
                            name="description"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Description (Optional)</FormLabel>
                                <FormControl>
                                  <Textarea placeholder="Enter description" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <Button type="submit" className="w-full">Add Endpoint</Button>
                        </form>
                      </Form>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                {endpoints.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Monitor className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No endpoints added yet</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Machine Name</TableHead>
                        <TableHead>OS Type</TableHead>
                        <TableHead>Deployment Status</TableHead>
                        <TableHead>Health Status</TableHead>
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
                          <TableCell>{getStatusBadge(endpoint.deployment_status)}</TableCell>
                          <TableCell>{getStatusBadge(endpoint.health_status)}</TableCell>
                          <TableCell>
                            {endpoint.last_check_in ? new Date(endpoint.last_check_in).toLocaleString() : 'Never'}
                          </TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDeleteEndpoint(endpoint.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Configuration Tab */}
          <TabsContent value="config">
            <div className="space-y-6">
              {/* EPO Configuration */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    EPO Configuration
                  </CardTitle>
                  <CardDescription>
                    Configure your Trellix EPO settings and custom tags
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...epoForm}>
                    <form onSubmit={epoForm.handleSubmit(handleSaveEpoConfig)} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
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
                                      <p>The Trellix EPO group where agents will be organized</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              </FormLabel>
                              <FormControl>
                                <Input placeholder="Enter EPO group name" {...field} />
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
                                OU Name
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger>
                                      <HelpCircle className="h-4 w-4 text-muted-foreground" />
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>The Organizational Unit for agent deployment</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              </FormLabel>
                              <FormControl>
                                <Input placeholder="Enter OU name" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={epoForm.control}
                          name="customTags"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="flex items-center gap-2">
                                Custom Tags
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger>
                                      <HelpCircle className="h-4 w-4 text-muted-foreground" />
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Comma-separated custom tags for agent installations</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              </FormLabel>
                              <FormControl>
                                <Input placeholder="tag1, tag2, tag3" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={epoForm.control}
                          name="ouGroups"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="flex items-center gap-2">
                                OU Groups
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger>
                                      <HelpCircle className="h-4 w-4 text-muted-foreground" />
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Comma-separated OU groups for agent organization</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              </FormLabel>
                              <FormControl>
                                <Input placeholder="group1, group2, group3" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <Button type="submit">Save EPO Configuration</Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>

              {/* Current Agent Configuration */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Server className="h-5 w-5" />
                    Current Agent Configuration
                  </CardTitle>
                  <CardDescription>
                    View your current agent configuration and sync status
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {!agentConfig ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Server className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No agent configuration found</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-sm font-medium">Agent Version</Label>
                          <p className="text-sm text-muted-foreground">{agentConfig.agent_version}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium">EPO Server</Label>
                          <p className="text-sm text-muted-foreground">{agentConfig.epo_server_url || 'Not configured'}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium">Group Name</Label>
                          <p className="text-sm text-muted-foreground">{agentConfig.group_name || 'Not set'}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium">OU Name</Label>
                          <p className="text-sm text-muted-foreground">{agentConfig.ou_name || 'Not set'}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium">Custom Tags</Label>
                          <div className="flex gap-1 flex-wrap">
                            {agentConfig.custom_tags?.length > 0 ? (
                              agentConfig.custom_tags.map((tag: string, index: number) => (
                                <Badge key={index} variant="secondary" className="text-xs">
                                  <Tag className="h-3 w-3 mr-1" />
                                  {tag}
                                </Badge>
                              ))
                            ) : (
                              <span className="text-sm text-muted-foreground">No tags set</span>
                            )}
                          </div>
                        </div>
                        <div>
                          <Label className="text-sm font-medium">OU Groups</Label>
                          <div className="flex gap-1 flex-wrap">
                            {agentConfig.ou_groups?.length > 0 ? (
                              agentConfig.ou_groups.map((group: string, index: number) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                  <Building className="h-3 w-3 mr-1" />
                                  {group}
                                </Badge>
                              ))
                            ) : (
                              <span className="text-sm text-muted-foreground">No groups set</span>
                            )}
                          </div>
                        </div>
                        <div>
                          <Label className="text-sm font-medium">Last Sync</Label>
                          <p className="text-sm text-muted-foreground">
                            {agentConfig.last_sync_at ? new Date(agentConfig.last_sync_at).toLocaleString() : 'Never'}
                          </p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium">Auto Update</Label>
                          <p className="text-sm text-muted-foreground">
                            {agentConfig.auto_update_enabled ? 'Enabled' : 'Disabled'}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleSyncConfiguration}
                          className="flex items-center gap-2"
                        >
                          <RefreshCw className="h-4 w-4" />
                          Sync Now
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}