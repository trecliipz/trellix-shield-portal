
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
  Edit
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
  const [showAddEndpoint, setShowAddEndpoint] = useState(false);
  const [showEpoConfig, setShowEpoConfig] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [userPlan, setUserPlan] = useState<UserPlan>(PLAN_CONFIG.professional);

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
        // Set EPO config if exists
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

      // Check endpoint limit for starter plan
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

  const handleDownloadAgent = () => {
    // This would typically generate a download link or initiate download
    toast.success("Security agent download initiated. Check your downloads folder.");
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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
        <div className="container mx-auto">
          <div className="text-center">Loading profile...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center">
                <User className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">
                  {user?.user_metadata?.name || 'User'}
                </h1>
                <p className="text-gray-600">{user?.email}</p>
                <p className="text-sm text-blue-600">
                  {organization?.industry || 'IT Security'} • Security Administrator
                </p>
              </div>
              <div className="ml-auto">
                <div className="flex items-center space-x-2 text-green-600">
                  <Shield className="w-5 h-5" />
                  <span className="font-semibold">Security Clearance: Active</span>
                </div>
                <div className="text-sm text-blue-600 mt-1">
                  Plan: {userPlan.displayName}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Agent Download & Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-3">
                <Download className="w-6 h-6 text-blue-600" />
                <span>Security Agent</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                onClick={handleDownloadAgent}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                <Download className="w-5 h-5 mr-2" />
                Download Latest Security Agent
              </Button>

              <div className="border-t pt-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-medium text-gray-700 flex items-center">
                    <Building2 className="w-5 h-5 mr-2" />
                    Trellix EPO Configuration
                  </h3>
                  <Dialog open={showEpoConfig} onOpenChange={setShowEpoConfig}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Edit className="w-4 h-4 mr-2" />
                        Configure
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
                                <FormLabel>Group Name</FormLabel>
                                <FormControl>
                                  <Input {...field} placeholder="e.g., Finance_Workstations" />
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
                                <FormLabel>Organizational Unit (OU)</FormLabel>
                                <FormControl>
                                  <Input {...field} placeholder="e.g., Finance_Department" />
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
                
                <div className="bg-gray-50 p-3 rounded-md">
                  <p className="text-sm text-gray-600">
                    <strong>Group:</strong> {organization?.group_name || 'Not configured'}
                  </p>
                  <p className="text-sm text-gray-600">
                    <strong>OU:</strong> {organization?.organization_name || 'Not configured'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Machine Management */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-3">
                <Monitor className="w-6 h-6 text-green-600" />
                <span>Machine Management</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Dialog open={showAddEndpoint} onOpenChange={setShowAddEndpoint}>
                <DialogTrigger asChild>
                  <Button className="w-full bg-green-600 hover:bg-green-700">
                    <Plus className="w-4 h-4 mr-2" />
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
                              <Input {...field} placeholder="e.g., WS-IT-01" />
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
                            <FormLabel>Description (Optional)</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="Brief description of the machine" />
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
                      <Button type="submit" className="w-full">Add Machine</Button>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>

              {userPlan.endpointLimit > 0 && (
                <div className="mt-3 text-sm text-gray-600">
                  {endpoints.length}/{userPlan.endpointLimit} machines used
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Machine Inventory */}
        <Card className="mt-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center space-x-3">
                <Server className="w-6 h-6 text-purple-600" />
                <span>Machine Inventory & Billing</span>
              </CardTitle>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">Total Machines: {endpoints.length}</span>
                <Button variant="outline" size="sm">
                  <FileText className="w-4 h-4 mr-2" />
                  Export Report
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {endpoints.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Machine Name</TableHead>
                    <TableHead>OS</TableHead>
                    <TableHead>Date Added</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {endpoints.map((endpoint) => (
                    <TableRow key={endpoint.id}>
                      <TableCell className="font-medium">{endpoint.machine_name}</TableCell>
                      <TableCell className="capitalize">{endpoint.os_type}</TableCell>
                      <TableCell>
                        {new Date(endpoint.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>{getStatusBadge(endpoint.deployment_status)}</TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteEndpoint(endpoint.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Monitor className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>No machines added yet. Add your first machine above.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{activeEndpoints}</div>
              <div className="text-sm text-gray-600">Active Machines</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-yellow-600">{pendingEndpoints}</div>
              <div className="text-sm text-gray-600">Pending Installs</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">${monthlyBilling}/month</div>
              <div className="text-sm text-gray-600">Estimated Billing</div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
