import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  Shield, 
  Monitor, 
  Download, 
  CreditCard, 
  Activity, 
  AlertTriangle,
  CheckCircle,
  Clock,
  Users,
  TrendingUp,
  Settings,
  FileDown
} from 'lucide-react';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface DashboardData {
  customer: {
    id: string;
    company_name: string;
    ou_group_name: string;
    contact_name: string;
    contact_email: string;
    status: string;
    role: string;
    created_at: string;
  };
  subscription: {
    id: string;
    status: string;
    billing_cycle: string;
    current_period_end: string;
    trial_end?: string;
    endpoint_count: number;
    subscription_plans_epo: {
      plan_name: string;
      display_name: string;
      features: string[];
      price_per_endpoint_monthly: number;
      price_per_endpoint_yearly: number;
    };
  };
  endpoints: {
    count: number;
    recent: Array<{
      hostname: string;
      status: string;
      last_seen: string;
      threat_status: string;
      created_at: string;
    }>;
  };
  installers: Array<{
    id: string;
    installer_name: string;
    platform: string;
    download_count: number;
    created_at: string;
    expires_at: string;
  }>;
  recentActivity: Array<{
    action: string;
    resource_type: string;
    details: any;
    created_at: string;
  }>;
}

interface CustomerPortalProps {
  onLogout: () => void;
}

export const CustomerPortal: React.FC<CustomerPortalProps> = ({ onLogout }) => {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const { toast } = useToast();

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke('customer-portal');

      if (error) throw error;
      setDashboardData(data);
    } catch (error: any) {
      console.error('Error loading dashboard:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to load dashboard data',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const generateInstaller = async (platform: 'windows' | 'macos' | 'linux') => {
    try {
      const installerName = `${dashboardData?.customer.company_name}-${platform}-agent`;
      
      const { data, error } = await supabase.functions.invoke('epo-integration', {
        body: {
          customerId: dashboardData?.customer.id,
          platform,
          installerName
        }
      });

      if (error) throw error;

      if (data.success) {
        toast({
          title: 'Success',
          description: `${platform} installer generated successfully`
        });
        loadDashboardData(); // Refresh data
      }
    } catch (error: any) {
      console.error('Error generating installer:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to generate installer',
        variant: 'destructive'
      });
    }
  };

  const downloadInstaller = async (installerId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('customer-portal', {
        body: {
          action: 'download-installer',
          installer_id: installerId
        }
      });

      if (error) throw error;

      // Open download URL in new tab
      window.open(data.download_url, '_blank');
      
      toast({
        title: 'Download Started',
        description: `Downloading ${data.installer_name}`
      });
      
      loadDashboardData(); // Refresh download count
    } catch (error: any) {
      console.error('Error downloading installer:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to download installer',
        variant: 'destructive'
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-destructive mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Unable to Load Dashboard</h2>
          <p className="text-muted-foreground mb-4">There was an error loading your customer data.</p>
          <Button onClick={loadDashboardData}>Try Again</Button>
        </div>
      </div>
    );
  }

  const { customer, subscription, endpoints, installers, recentActivity } = dashboardData;

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'online': return 'bg-green-500';
      case 'offline': return 'bg-red-500';
      case 'clean': return 'bg-green-500';
      case 'infected': return 'bg-red-500';
      case 'suspicious': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isTrialActive = subscription.trial_end && new Date(subscription.trial_end) > new Date();
  const trialDaysRemaining = isTrialActive ? 
    Math.ceil((new Date(subscription.trial_end!).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : 0;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold">Trellix ePO Portal</h1>
              <p className="text-muted-foreground">{customer.company_name}</p>
            </div>
            <div className="flex items-center gap-4">
              <Badge variant={customer.status === 'active' ? 'default' : 'destructive'}>
                {customer.status}
              </Badge>
              <Button variant="outline" onClick={onLogout}>
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-6">
        {/* Trial Notice */}
        {isTrialActive && (
          <Card className="mb-6 border-orange-200 bg-orange-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-orange-600" />
                <div>
                  <p className="font-medium text-orange-800">
                    Free Trial Active
                  </p>
                  <p className="text-sm text-orange-600">
                    {trialDaysRemaining} days remaining. Your trial ends on {formatDate(subscription.trial_end!)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="endpoints">Endpoints</TabsTrigger>
            <TabsTrigger value="deployment">Deployment</TabsTrigger>
            <TabsTrigger value="billing">Billing</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Total Endpoints</p>
                      <p className="text-2xl font-bold">{endpoints.count}</p>
                    </div>
                    <Monitor className="w-8 h-8 text-primary" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Protection Status</p>
                      <p className="text-2xl font-bold text-green-600">
                        {endpoints.recent.filter(e => e.status === 'online').length}
                      </p>
                      <p className="text-xs text-muted-foreground">Online</p>
                    </div>
                    <Shield className="w-8 h-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Subscription</p>
                      <p className="text-2xl font-bold">{subscription.subscription_plans_epo.plan_name}</p>
                      <p className="text-xs text-muted-foreground capitalize">{subscription.billing_cycle}</p>
                    </div>
                    <CreditCard className="w-8 h-8 text-primary" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Installers</p>
                      <p className="text-2xl font-bold">{installers.length}</p>
                      <p className="text-xs text-muted-foreground">Available</p>
                    </div>
                    <Download className="w-8 h-8 text-primary" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Endpoints */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Endpoints</CardTitle>
                <CardDescription>Latest endpoints added to your organization</CardDescription>
              </CardHeader>
              <CardContent>
                {endpoints.recent.length > 0 ? (
                  <div className="space-y-4">
                    {endpoints.recent.slice(0, 5).map((endpoint, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className={`w-3 h-3 rounded-full ${getStatusColor(endpoint.status)}`} />
                          <div>
                            <p className="font-medium">{endpoint.hostname}</p>
                            <p className="text-sm text-muted-foreground">
                              Last seen: {formatDate(endpoint.last_seen)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={endpoint.threat_status === 'clean' ? 'default' : 'destructive'}>
                            {endpoint.threat_status}
                          </Badge>
                          <Badge variant="outline">
                            {endpoint.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Monitor className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No endpoints registered yet</p>
                    <p className="text-sm text-muted-foreground">Deploy agents to start seeing your endpoints here</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Latest actions in your account</CardDescription>
              </CardHeader>
              <CardContent>
                {recentActivity.length > 0 ? (
                  <div className="space-y-3">
                    {recentActivity.slice(0, 10).map((activity, index) => (
                      <div key={index} className="flex items-center gap-3 text-sm">
                        <Activity className="w-4 h-4 text-muted-foreground" />
                        <div className="flex-1">
                          <span className="font-medium">{activity.action.replace(/_/g, ' ')}</span>
                          <span className="text-muted-foreground ml-2">
                            on {activity.resource_type}
                          </span>
                        </div>
                        <span className="text-muted-foreground">
                          {formatDate(activity.created_at)}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-4">No recent activity</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Deployment Tab */}
          <TabsContent value="deployment" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Agent Deployment</CardTitle>
                <CardDescription>
                  Generate and download agent installers for your endpoints
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="p-6 text-center">
                      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                        <Monitor className="w-6 h-6 text-blue-600" />
                      </div>
                      <h3 className="font-medium mb-2">Windows Agent</h3>
                      <p className="text-sm text-muted-foreground mb-4">For Windows endpoints</p>
                      <Button 
                        onClick={() => generateInstaller('windows')}
                        className="w-full"
                      >
                        Generate Installer
                      </Button>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-6 text-center">
                      <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                        <Monitor className="w-6 h-6 text-gray-600" />
                      </div>
                      <h3 className="font-medium mb-2">macOS Agent</h3>
                      <p className="text-sm text-muted-foreground mb-4">For Mac endpoints</p>
                      <Button 
                        onClick={() => generateInstaller('macos')}
                        variant="outline"
                        className="w-full"
                      >
                        Generate Installer
                      </Button>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-6 text-center">
                      <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                        <Monitor className="w-6 h-6 text-orange-600" />
                      </div>
                      <h3 className="font-medium mb-2">Linux Agent</h3>
                      <p className="text-sm text-muted-foreground mb-4">For Linux endpoints</p>
                      <Button 
                        onClick={() => generateInstaller('linux')}
                        variant="outline"
                        className="w-full"
                      >
                        Generate Installer
                      </Button>
                    </CardContent>
                  </Card>
                </div>

                {/* Available Installers */}
                {installers.length > 0 && (
                  <div>
                    <h3 className="text-lg font-medium mb-4">Available Installers</h3>
                    <div className="space-y-2">
                      {installers.map((installer) => (
                        <div key={installer.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <FileDown className="w-5 h-5 text-primary" />
                            <div>
                              <p className="font-medium">{installer.installer_name}</p>
                              <p className="text-sm text-muted-foreground">
                                {installer.platform} • Created {formatDate(installer.created_at)}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-sm text-muted-foreground">
                              Downloaded {installer.download_count} times
                            </div>
                            <Button 
                              size="sm"
                              onClick={() => downloadInstaller(installer.id)}
                            >
                              Download
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Billing Tab */}
          <TabsContent value="billing" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Current Subscription</CardTitle>
                <CardDescription>Manage your subscription and billing</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-medium">{subscription.subscription_plans_epo.display_name}</h3>
                    <p className="text-muted-foreground">
                      ${(subscription.billing_cycle === 'yearly' 
                        ? subscription.subscription_plans_epo.price_per_endpoint_yearly 
                        : subscription.subscription_plans_epo.price_per_endpoint_monthly
                      ).toFixed(2)} per endpoint per {subscription.billing_cycle === 'yearly' ? 'year' : 'month'}
                    </p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Next billing: {formatDate(subscription.current_period_end)}
                    </p>
                  </div>
                  <Badge variant={subscription.status === 'active' ? 'default' : 'destructive'}>
                    {subscription.status}
                  </Badge>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium">Plan Features</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {subscription.subscription_plans_epo.features.map((feature, index) => (
                      <div key={index} className="flex items-center gap-2 text-sm">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        {feature}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <Button variant="outline">Manage Subscription</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Organization Settings</CardTitle>
                <CardDescription>Manage your organization information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Company Name</Label>
                    <p className="text-sm text-muted-foreground">{customer.company_name}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">ePO Group Name</Label>
                    <p className="text-sm text-muted-foreground">{customer.ou_group_name}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Primary Contact</Label>
                    <p className="text-sm text-muted-foreground">{customer.contact_name}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Email</Label>
                    <p className="text-sm text-muted-foreground">{customer.contact_email}</p>
                  </div>
                </div>
                <div className="pt-4">
                  <Button variant="outline">Edit Organization</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Endpoints Tab */}
          <TabsContent value="endpoints" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Endpoint Management</CardTitle>
                <CardDescription>View and manage all your protected endpoints</CardDescription>
              </CardHeader>
              <CardContent>
                {endpoints.recent.length > 0 ? (
                  <div className="space-y-4">
                    {endpoints.recent.map((endpoint, index) => (
                      <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-4">
                          <div className={`w-4 h-4 rounded-full ${getStatusColor(endpoint.status)}`} />
                          <div>
                            <p className="font-medium">{endpoint.hostname}</p>
                            <p className="text-sm text-muted-foreground">
                              Last seen: {formatDate(endpoint.last_seen)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={endpoint.threat_status === 'clean' ? 'default' : 'destructive'}>
                            {endpoint.threat_status}
                          </Badge>
                          <Badge variant="outline">
                            {endpoint.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Monitor className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">No Endpoints Yet</h3>
                    <p className="text-muted-foreground mb-4">
                      Deploy agents to your endpoints to start monitoring them
                    </p>
                    <Button onClick={() => setActiveTab('deployment')}>
                      Go to Deployment
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};