import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { 
  User, 
  Building, 
  Monitor, 
  Users, 
  Settings, 
  Bell, 
  Key, 
  FileText, 
  CreditCard,
  Shield,
  Upload,
  Download,
  AlertCircle,
  CheckCircle,
  Clock,
  Edit,
  Plus,
  Crown,
  Zap,
  TrendingUp,
  Activity,
  Globe,
  Lock
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const endpointSchema = z.object({
  machineName: z.string().min(1, "Machine name is required"),
  osType: z.string().min(1, "OS type is required"),
});

const profileUpdateSchema = z.object({
  name: z.string().min(1, "Name is required"),
  phone: z.string().optional(),
  organizationName: z.string().min(1, "Organization name is required"),
  groupName: z.string().min(1, "Group name is required"),
  industry: z.string().optional(),
  organizationSize: z.string().min(1, "Organization size is required"),
});

interface UserPlan {
  name: 'starter' | 'professional' | 'enterprise';
  displayName: string;
  endpointLimit: number;
  features: string[];
  price: number;
  color: string;
}

const PLAN_FEATURES = {
  starter: [
    'Basic endpoint management',
    'Standard reporting',
    'Email support',
    'Up to 5 endpoints'
  ],
  professional: [
    'Advanced endpoint management',
    'Custom policies',
    'Bulk operations',
    'Advanced reporting',
    'Priority support',
    'API access',
    'Unlimited endpoints'
  ],
  enterprise: [
    'Full analytics dashboard',
    'Advanced threat detection',
    'Compliance reporting',
    'Dedicated support',
    'Custom integrations',
    'SSO integration',
    'Advanced API access',
    'Unlimited endpoints'
  ]
};

export const UserProfile = () => {
  const [user, setUser] = useState<any>(null);
  const [organization, setOrganization] = useState<any>(null);
  const [endpoints, setEndpoints] = useState<any[]>([]);
  const [bulkOperations, setBulkOperations] = useState<any[]>([]);
  const [showAddEndpoint, setShowAddEndpoint] = useState(false);
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [bulkData, setBulkData] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [userPlan, setUserPlan] = useState<UserPlan>({
    name: 'professional',
    displayName: 'Professional',
    endpointLimit: -1,
    features: PLAN_FEATURES.professional,
    price: 19.99,
    color: 'text-blue-600'
  });

  const endpointForm = useForm<z.infer<typeof endpointSchema>>({
    resolver: zodResolver(endpointSchema),
    defaultValues: { machineName: "", osType: "" },
  });

  const profileForm = useForm<z.infer<typeof profileUpdateSchema>>({
    resolver: zodResolver(profileUpdateSchema),
  });

  useEffect(() => {
    loadUserData();
  }, []);

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
        profileForm.reset({
          name: user.user_metadata?.name || '',
          organizationName: orgData.organization_name,
          groupName: orgData.group_name,
          industry: orgData.industry || '',
          organizationSize: orgData.organization_size,
        });
      }

      // Load endpoints
      const { data: endpointsData } = await supabase
        .from('endpoints')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (endpointsData) setEndpoints(endpointsData);

      // Load bulk operations
      const { data: bulkData } = await supabase
        .from('bulk_operations')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (bulkData) setBulkOperations(bulkData);

    } catch (error) {
      toast.error("Error loading profile data");
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddEndpoint = async (values: z.infer<typeof endpointSchema>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !organization) return;

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

      toast.success("Endpoint added successfully!");
      setShowAddEndpoint(false);
      endpointForm.reset();
      loadUserData();
    } catch (error) {
      toast.error("Error adding endpoint");
      console.error('Error:', error);
    }
  };

  const handleBulkImport = async () => {
    if (!bulkData.trim()) {
      toast.error("Please enter machine names");
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !organization) return;

      const machineNames = bulkData
        .split('\n')
        .map(name => name.trim())
        .filter(name => name.length > 0);

      if (machineNames.length === 0) {
        toast.error("Please enter valid machine names");
        return;
      }

      // Create bulk operation record
      const { data: bulkOp, error: bulkError } = await supabase
        .from('bulk_operations')
        .insert([{
          user_id: user.id,
          operation_type: 'import',
          status: 'in_progress',
          total_items: machineNames.length,
          operation_data: { machine_names: machineNames }
        }])
        .select()
        .single();

      if (bulkError) throw bulkError;

      // Create endpoint records
      const endpoints = machineNames.map(machineName => ({
        user_id: user.id,
        organization_id: organization.id,
        machine_name: machineName,
        os_type: 'windows',
        deployment_status: 'pending',
        health_status: 'unknown',
      }));

      const { error: endpointsError } = await supabase
        .from('endpoints')
        .insert(endpoints);

      if (endpointsError) {
        // Update bulk operation status to failed
        await supabase
          .from('bulk_operations')
          .update({ status: 'failed', error_log: [endpointsError.message] })
          .eq('id', bulkOp.id);
        throw endpointsError;
      }

      // Update bulk operation status to completed
      await supabase
        .from('bulk_operations')
        .update({ 
          status: 'completed',
          completed_items: machineNames.length 
        })
        .eq('id', bulkOp.id);

      toast.success(`Successfully imported ${machineNames.length} endpoints!`);
      setShowBulkImport(false);
      setBulkData("");
      loadUserData();
    } catch (error) {
      toast.error("Error importing endpoints");
      console.error('Error:', error);
    }
  };

  const handleUpdateProfile = async (values: z.infer<typeof profileUpdateSchema>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !organization) return;

      // Update organization
      const { error: orgError } = await supabase
        .from('user_organizations')
        .update({
          organization_name: values.organizationName,
          group_name: values.groupName,
          industry: values.industry,
          organization_size: values.organizationSize,
        })
        .eq('id', organization.id);

      if (orgError) throw orgError;

      // Update auth metadata
      const { error: userError } = await supabase.auth.updateUser({
        data: { name: values.name }
      });

      if (userError) throw userError;

      toast.success("Profile updated successfully!");
      loadUserData();
    } catch (error) {
      toast.error("Error updating profile");
      console.error('Error:', error);
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

  const getPlanBadge = () => {
    const planConfig = {
      starter: { icon: Shield, color: "text-green-600", bg: "bg-green-100" },
      professional: { icon: Crown, color: "text-blue-600", bg: "bg-blue-100" },
      enterprise: { icon: Zap, color: "text-purple-600", bg: "bg-purple-100" },
    };

    const config = planConfig[userPlan.name];
    const Icon = config.icon;

    return (
      <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full ${config.bg}`}>
        <Icon className={`h-4 w-4 ${config.color}`} />
        <span className={`font-medium ${config.color}`}>{userPlan.displayName} Plan</span>
      </div>
    );
  };

  const canAccessFeature = (feature: string) => {
    return userPlan.features.some(f => f.toLowerCase().includes(feature.toLowerCase()));
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">Loading profile...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Manage your endpoints and security infrastructure</p>
        </div>
        <div className="flex items-center gap-4">
          {getPlanBadge()}
          <Badge variant="outline" className="flex items-center gap-2">
            <Monitor className="h-4 w-4" />
            {endpoints.length} Endpoint{endpoints.length !== 1 ? 's' : ''}
          </Badge>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="endpoints">Endpoints</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="organization">Organization</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Endpoints</CardTitle>
                <Monitor className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{endpoints.length}</div>
                <div className="text-xs text-muted-foreground mt-1">
                  {userPlan.endpointLimit > 0 ? `${endpoints.length}/${userPlan.endpointLimit} used` : 'Unlimited'}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Healthy</CardTitle>
                <Shield className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {endpoints.filter(e => e.health_status === 'healthy' || e.deployment_status === 'deployed').length}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Threats Blocked</CardTitle>
                <AlertCircle className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">247</div>
                <div className="text-xs text-muted-foreground">Last 30 days</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Uptime</CardTitle>
                <TrendingUp className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">99.8%</div>
                <div className="text-xs text-muted-foreground">This month</div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {endpoints.slice(0, 5).map((endpoint) => (
                    <div key={endpoint.id} className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <Monitor className="h-4 w-4" />
                        <div>
                          <p className="text-sm font-medium">{endpoint.machine_name}</p>
                          <p className="text-sm text-muted-foreground">{endpoint.os_type}</p>
                        </div>
                      </div>
                      {getStatusBadge(endpoint.deployment_status)}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Plan Features</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {userPlan.features.map((feature, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm">{feature}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="endpoints" className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Endpoint Management</h3>
            <div className="space-x-2">
              {canAccessFeature('endpoint') && (
                <>
                  <Dialog open={showAddEndpoint} onOpenChange={setShowAddEndpoint}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Endpoint
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add New Endpoint</DialogTitle>
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
                                  <Input {...field} placeholder="Enter machine name" />
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
                                    <SelectItem value="macos">macOS</SelectItem>
                                    <SelectItem value="linux">Linux</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <Button type="submit" className="w-full">Add Endpoint</Button>
                        </form>
                      </Form>
                    </DialogContent>
                  </Dialog>

                  {canAccessFeature('bulk') && (
                    <Dialog open={showBulkImport} onOpenChange={setShowBulkImport}>
                      <DialogTrigger asChild>
                        <Button size="sm">
                          <Upload className="h-4 w-4 mr-2" />
                          Bulk Import
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>Bulk Import Endpoints</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <label className="text-sm font-medium">Machine Names (one per line)</label>
                            <Textarea
                              placeholder={`DESKTOP-001\nLAPTOP-HR-01\nSERVER-DB-01`}
                              value={bulkData}
                              onChange={(e) => setBulkData(e.target.value)}
                              rows={10}
                              className="mt-1"
                            />
                          </div>
                          <Button onClick={handleBulkImport} className="w-full">
                            Import Endpoints
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  )}
                </>
              )}
            </div>
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Machine Name</TableHead>
                    <TableHead>OS</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Health</TableHead>
                    <TableHead>Last Seen</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {endpoints.map((endpoint) => (
                    <TableRow key={endpoint.id}>
                      <TableCell className="font-medium">{endpoint.machine_name}</TableCell>
                      <TableCell className="capitalize">{endpoint.os_type}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={userPlan.color}>
                          {userPlan.displayName}
                        </Badge>
                      </TableCell>
                      <TableCell>{getStatusBadge(endpoint.deployment_status)}</TableCell>
                      <TableCell>{getStatusBadge(endpoint.health_status || 'healthy')}</TableCell>
                      <TableCell>
                        {endpoint.last_check_in 
                          ? new Date(endpoint.last_check_in).toLocaleDateString()
                          : 'Never'
                        }
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button variant="ghost" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                          {canAccessFeature('advanced') && (
                            <Button variant="ghost" size="sm">
                              <Settings className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-green-600" />
                  Threat Protection
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Real-time Scanning</span>
                    <Badge variant="default">Active</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Behavioral Analysis</span>
                    <Badge variant="default">Active</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Machine Learning</span>
                    <Badge variant={canAccessFeature('advanced') ? "default" : "secondary"}>
                      {canAccessFeature('advanced') ? "Active" : "Upgrade Required"}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-blue-600" />
                  Recent Threats
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Malware</span>
                    <span className="text-red-600">12 blocked</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Phishing</span>
                    <span className="text-red-600">5 blocked</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Suspicious Activity</span>
                    <span className="text-yellow-600">3 detected</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5 text-purple-600" />
                  Network Security
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Firewall</span>
                    <Badge variant="default">Protected</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">VPN Detection</span>
                    <Badge variant={canAccessFeature('enterprise') ? "default" : "secondary"}>
                      {canAccessFeature('enterprise') ? "Active" : "Pro Feature"}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          {canAccessFeature('analytics') || canAccessFeature('advanced') ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Security Metrics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span>Endpoint Health Score</span>
                        <span>94%</span>
                      </div>
                      <Progress value={94} />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span>Threat Detection Rate</span>
                        <span>98.7%</span>
                      </div>
                      <Progress value={98.7} />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span>Policy Compliance</span>
                        <span>91%</span>
                      </div>
                      <Progress value={91} />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Usage Statistics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-center">
                      <div>
                        <div className="text-2xl font-bold text-blue-600">15.2GB</div>
                        <div className="text-xs text-muted-foreground">Data Scanned</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-green-600">247</div>
                        <div className="text-xs text-muted-foreground">Threats Blocked</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-purple-600">1.2M</div>
                        <div className="text-xs text-muted-foreground">Files Analyzed</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-orange-600">99.8%</div>
                        <div className="text-xs text-muted-foreground">Uptime</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-8">
                <Lock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Advanced Analytics</h3>
                <p className="text-muted-foreground mb-4">
                  Upgrade to Professional or Enterprise plan to access detailed analytics and reporting.
                </p>
                <Button>
                  <Crown className="h-4 w-4 mr-2" />
                  Upgrade Plan
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="organization" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5" />
                Organization Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              {organization && (
                <Form {...profileForm}>
                  <form onSubmit={profileForm.handleSubmit(handleUpdateProfile)} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={profileForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Full Name</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={profileForm.control}
                        name="organizationName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Organization Name</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={profileForm.control}
                        name="groupName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Group Name (EPO Console)</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={profileForm.control}
                        name="industry"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Industry</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select industry" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="technology">Technology</SelectItem>
                                <SelectItem value="healthcare">Healthcare</SelectItem>
                                <SelectItem value="finance">Finance</SelectItem>
                                <SelectItem value="education">Education</SelectItem>
                                <SelectItem value="manufacturing">Manufacturing</SelectItem>
                                <SelectItem value="retail">Retail</SelectItem>
                                <SelectItem value="government">Government</SelectItem>
                                <SelectItem value="other">Other</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={profileForm.control}
                        name="organizationSize"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Organization Size</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select size" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="1-10">1-10 employees</SelectItem>
                                <SelectItem value="11-50">11-50 employees</SelectItem>
                                <SelectItem value="51-200">51-200 employees</SelectItem>
                                <SelectItem value="201-500">201-500 employees</SelectItem>
                                <SelectItem value="500+">500+ employees</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <Button type="submit">Update Profile</Button>
                  </form>
                </Form>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Notification Preferences
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">Notification settings coming soon...</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Key className="h-5 w-5" />
                  API Keys
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">API key management coming soon...</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Billing
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">Billing management coming soon...</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
