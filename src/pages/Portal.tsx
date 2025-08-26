import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Download, RefreshCw, CreditCard, Settings, Users, Shield, BarChart3 } from "lucide-react";
import { Header } from "@/components/Header";

interface Customer {
  id: string;
  company_name: string;
  ou_group_name: string;
  contact_email: string;
  status: string;
}

interface Endpoint {
  id: string;
  hostname: string;
  ip_address: string | null;
  status: string;
  last_seen: string;
  agent_version: string | null;
  threat_status?: string;
}

interface Installer {
  id: string;
  installer_name: string;
  platform: string;
  created_at: string;
  download_count: number;
}

interface Subscription {
  subscribed: boolean;
  subscription_tier: string | null;
  subscription_end: string | null;
}

export const Portal = () => {
  const [user, setUser] = useState<any>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [endpoints, setEndpoints] = useState<Endpoint[]>([]);
  const [installers, setInstallers] = useState<Installer[]>([]);
  const [subscription, setSubscription] = useState<Subscription>({ subscribed: false, subscription_tier: null, subscription_end: null });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [availableAgents, setAvailableAgents] = useState<any[]>([]);
  const [grantingAgent, setGrantingAgent] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/');
        return;
      }

      setUser(session.user);
      await loadCustomerData(session.user);
    } catch (error) {
      console.error('Auth check error:', error);
      navigate('/');
    }
  };

  const loadCustomerData = async (user: any) => {
    setLoading(true);
    try {
      // Get customer data
      const { data: customerData, error: customerError } = await supabase
        .from('customers')
        .select('*')
        .eq('contact_email', user.email)
        .single();

      if (customerError) {
        console.error('Customer error:', customerError);
        // Trigger customer onboarding if not found
        if (customerError.code === 'PGRST116') {
          await triggerOnboarding();
          return;
        }
      } else {
        setCustomer(customerData);
        await loadEndpoints(customerData.id);
        await loadInstallers(customerData.id);
      }

      // Check subscription status
      await checkSubscription();
      
      // Load available agents for the user
      await loadAvailableAgents();
    } catch (error) {
      console.error('Error loading customer data:', error);
      toast({
        title: "Error",
        description: "Failed to load customer data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const triggerOnboarding = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('customer-onboarding', {
        body: {
          company: user?.user_metadata?.company || 'Default Company',
          ouGroupName: user?.user_metadata?.ouGroupName || 'Default-OU',
          planType: 'starter'
        }
      });

      if (error) throw error;

      toast({
        title: "Account Setup",
        description: "Your account has been set up successfully",
      });

      // Reload data
      await loadCustomerData(user);
    } catch (error) {
      console.error('Onboarding error:', error);
      toast({
        title: "Setup Error",
        description: "Failed to set up your account. Please contact support.",
        variant: "destructive",
      });
    }
  };

  const loadEndpoints = async (customerId: string) => {
    try {
      const { data, error } = await supabase
        .from('customer_endpoints')
        .select('*')
        .eq('customer_id', customerId);

      if (error) throw error;
      setEndpoints((data || []).map(item => ({
        ...item,
        ip_address: item.ip_address as string | null,
        agent_version: item.agent_version as string | null
      })));
    } catch (error) {
      console.error('Error loading endpoints:', error);
    }
  };

  const loadInstallers = async (customerId: string) => {
    try {
      const { data, error } = await supabase
        .from('agent_installers')
        .select('*')
        .eq('customer_id', customerId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setInstallers(data || []);
    } catch (error) {
      console.error('Error loading installers:', error);
    }
  };

  const checkSubscription = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('check-subscription');
      if (error) throw error;
      setSubscription(data);
      
      // If user is subscribed, try to grant latest agent
      if (data.subscribed) {
        await tryGrantLatestAgent();
      }
    } catch (error) {
      console.error('Error checking subscription:', error);
    }
  };

  const loadAvailableAgents = async () => {
    try {
      const { data, error } = await supabase
        .from('agent_downloads')
        .select('*')
        .eq('user_id', user?.id)
        .eq('status', 'available')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAvailableAgents(data || []);
    } catch (error) {
      console.error('Error loading available agents:', error);
    }
  };

  const tryGrantLatestAgent = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('grant-latest-agent');
      if (error) throw error;
      
      if (data.success) {
        // Reload available agents
        await loadAvailableAgents();
      }
    } catch (error) {
      console.error('Error granting latest agent:', error);
    }
  };

  const handleGrantLatestAgent = async () => {
    setGrantingAgent(true);
    try {
      const { data, error } = await supabase.functions.invoke('grant-latest-agent');
      if (error) throw error;
      
      if (data.success) {
        toast({
          title: "Agent Granted",
          description: data.message,
        });
        await loadAvailableAgents();
      } else {
        toast({
          title: "Notice",
          description: data.message,
          variant: "default",
        });
      }
    } catch (error) {
      console.error('Error granting agent:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to grant agent",
        variant: "destructive",
      });
    } finally {
      setGrantingAgent(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    if (customer) {
      await loadEndpoints(customer.id);
      await loadInstallers(customer.id);
    }
    await checkSubscription();
    await loadAvailableAgents();
    setRefreshing(false);
    toast({
      title: "Refreshed",
      description: "Data has been updated",
    });
  };

  const handleManageSubscription = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('customer-portal');
      if (error) throw error;
      
      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (error) {
      console.error('Error opening customer portal:', error);
      toast({
        title: "Error",
        description: "Failed to open subscription management",
        variant: "destructive",
      });
    }
  };

  const handleGenerateInstaller = async () => {
    if (!customer) return;

    try {
      const { data, error } = await supabase.functions.invoke('epo-integration', {
        body: {
          action: 'generate-installer',
          customerId: customer.id
        }
      });

      if (error) throw error;

      toast({
        title: "Installer Generated",
        description: "A new agent installer has been created",
      });

      await loadInstallers(customer.id);
    } catch (error) {
      console.error('Error generating installer:', error);
      toast({
        title: "Error",
        description: "Failed to generate installer",
        variant: "destructive",
      });
    }
  };

  const handleSyncEndpoints = async () => {
    if (!customer) return;
    
    setRefreshing(true);
    try {
      const { data, error } = await supabase.functions.invoke('epo-integration', {
        body: {
          action: 'sync-endpoints',
          customerId: customer.id
        }
      });

      if (error) throw error;

      toast({
        title: "Endpoints Synced",
        description: "Endpoint data has been synchronized from ePO",
      });

      // Reload endpoints data
      await loadEndpoints(customer.id);
    } catch (error) {
      console.error('Sync error:', error);
      toast({
        title: "Sync Error",
        description: error instanceof Error ? error.message : "Failed to sync endpoints",
        variant: "destructive",
      });
    } finally {
      setRefreshing(false);
    }
  };

  const handleStartSubscription = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: {
          planType: 'professional', // Default to professional plan
          priceAmount: 1999 // $19.99
        }
      });

      if (error) throw error;

      if (data?.url) {
        // Open Stripe checkout in new tab
        window.open(data.url, '_blank');
      }
    } catch (error) {
      console.error('Subscription error:', error);
      toast({
        title: "Subscription Error",
        description: error instanceof Error ? error.message : "Failed to start subscription process",
        variant: "destructive",
      });
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header 
          isLoggedIn={true}
          currentUser={user}
          onLogin={async () => true}
          onLogout={handleLogout}
        />
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header 
        isLoggedIn={true}
        currentUser={user}
        onLogin={async () => true}
        onLogout={handleLogout}
      />
      
      <main className="container mx-auto px-4 pt-24 pb-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Customer Portal</h1>
            {customer && (
              <p className="text-muted-foreground mt-2">
                {customer.company_name} • {customer.ou_group_name}
              </p>
            )}
          </div>
          <div className="flex items-center gap-4">
            <Button 
              variant="outline" 
              onClick={handleRefresh}
              disabled={refreshing}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            {customer && (
              <Button 
                variant="outline" 
                onClick={handleSyncEndpoints}
                disabled={refreshing}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                Sync Endpoints
              </Button>
            )}
            {subscription.subscribed && (
              <Button onClick={handleManageSubscription}>
                <CreditCard className="h-4 w-4 mr-2" />
                Manage Subscription
              </Button>
            )}
          </div>
        </div>

        {/* Subscription Status */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Subscription Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant={subscription.subscribed ? "default" : "destructive"}>
                    {subscription.subscribed ? "Active" : "Inactive"}
                  </Badge>
                  {subscription.subscription_tier && (
                    <Badge variant="outline">
                      {subscription.subscription_tier.charAt(0).toUpperCase() + subscription.subscription_tier.slice(1)} Plan
                    </Badge>
                  )}
                </div>
                {subscription.subscription_end && (
                  <p className="text-sm text-muted-foreground">
                    Next billing: {new Date(subscription.subscription_end).toLocaleDateString()}
                  </p>
                )}
              </div>
              {!subscription.subscribed && (
                <Button onClick={handleStartSubscription}>
                  Subscribe Now
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Status Cards Grid */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Provisioning Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span>Setup Progress:</span>
                  <span className="font-medium">100%</span>
                </div>
                <div className="flex justify-between">
                  <span>Current Step:</span>
                  <span className="text-green-600 font-medium">Completed</span>
                </div>
                <div className="flex justify-between">
                  <span>ePO Environment:</span>
                  <span className="text-green-600 font-medium">Ready</span>
                </div>
                <div className="flex justify-between">
                  <span>Agent Installer:</span>
                  <span className="text-green-600 font-medium">Available</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Usage Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span>Active Endpoints:</span>
                  <span className="font-medium">{endpoints.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Protected Endpoints:</span>
                  <span className="text-green-600 font-medium">{endpoints.filter(e => e.threat_status === 'clean').length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Plan Limit:</span>
                  <span className="font-medium">Unlimited</span>
                </div>
                <div className="flex justify-between">
                  <span>Last Sync:</span>
                  <span className="text-muted-foreground text-sm">
                    {new Date().toLocaleString()}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Agent Downloads - Only show if subscribed */}
        {subscription.subscribed && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Download className="h-5 w-5" />
                  Available Agent Downloads
                </span>
                <Button 
                  variant="outline" 
                  onClick={handleGrantLatestAgent}
                  disabled={grantingAgent}
                >
                  {grantingAgent ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4 mr-2" />
                  )}
                  Get Latest Agent
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {availableAgents.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">No agents available for download</p>
                  <p className="text-sm text-muted-foreground">
                    Click "Get Latest Agent" to access the newest agent package
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {availableAgents.map((agent) => (
                    <div key={agent.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h4 className="font-medium">{agent.agent_name}</h4>
                        <p className="text-sm text-muted-foreground">
                          Version: {agent.agent_version} • Platform: {agent.platform}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          File: {agent.file_name} • Size: {agent.file_size ? Math.round(agent.file_size / (1024 * 1024)) : 0} MB
                        </p>
                      </div>
                      <Button variant="outline">
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue="endpoints" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="endpoints" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Endpoints
            </TabsTrigger>
            <TabsTrigger value="installers" className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Installers
            </TabsTrigger>
            <TabsTrigger value="reports" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Reports
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="endpoints" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Endpoint Management</CardTitle>
                <CardDescription>
                  View and manage your protected endpoints
                </CardDescription>
              </CardHeader>
              <CardContent>
                {endpoints.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground mb-4">No endpoints detected yet</p>
                    <p className="text-sm text-muted-foreground">
                      Deploy the agent installer to start protecting your endpoints
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {endpoints.map((endpoint) => (
                      <div key={endpoint.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <h4 className="font-medium">{endpoint.hostname}</h4>
                          <p className="text-sm text-muted-foreground">{endpoint.ip_address}</p>
                          <p className="text-xs text-muted-foreground">
                            Last seen: {new Date(endpoint.last_seen).toLocaleString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <Badge variant={endpoint.status === 'online' ? 'default' : 'secondary'}>
                            {endpoint.status}
                          </Badge>
                          <p className="text-xs text-muted-foreground mt-1">
                            Agent: {endpoint.agent_version}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="installers" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Agent Installers</CardTitle>
                  <CardDescription>
                    Download and deploy Trellix agents to your endpoints
                  </CardDescription>
                </div>
                <Button onClick={handleGenerateInstaller}>
                  Generate New Installer
                </Button>
              </CardHeader>
              <CardContent>
                {installers.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No installers available</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {installers.map((installer) => (
                      <div key={installer.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <h4 className="font-medium">{installer.installer_name}</h4>
                          <p className="text-sm text-muted-foreground">
                            Platform: {installer.platform} • Created: {new Date(installer.created_at).toLocaleDateString()}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Downloaded {installer.download_count} times
                          </p>
                        </div>
                        <Button variant="outline">
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reports" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Security Reports</CardTitle>
                <CardDescription>
                  View your security posture and compliance status
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Reports will be available soon</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Account Settings</CardTitle>
                <CardDescription>
                  Manage your account and organization settings
                </CardDescription>
              </CardHeader>
              <CardContent>
                {customer && (
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium">Company Name</label>
                      <p className="text-muted-foreground">{customer.company_name}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium">OU Group Name</label>
                      <p className="text-muted-foreground">{customer.ou_group_name}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Contact Email</label>
                      <p className="text-muted-foreground">{customer.contact_email}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Status</label>
                      <Badge>{customer.status}</Badge>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};