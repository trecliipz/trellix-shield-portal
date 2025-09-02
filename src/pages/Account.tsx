import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { User, Crown, Calendar, Download, History, Settings, LogOut } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { FileConverter } from '@/components/FileConverter';
import { toast } from 'sonner';

interface ConversionLog {
  id: string;
  original_filename: string;
  input_format: string;
  output_format: string;
  status: string;
  created_at: string;
  file_size: number;
}

interface UserProfile {
  id: string;
  email: string;
  name: string;
  planType: string;
  dailyUsage: number;
  dailyLimit: number;
}

export const Account: React.FC = () => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [conversions, setConversions] = useState<ConversionLog[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      // Get current user
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !authUser) {
        navigate('/');
        return;
      }

      // Get user subscription
      const { data: subscription } = await supabase
        .from('user_subscriptions')
        .select('plan_type')
        .eq('user_id', authUser.id)
        .eq('status', 'active')
        .single();

      // Get daily usage count
      const { data: dailyConversions } = await supabase
        .from('conversion_logs')
        .select('id')
        .eq('user_id', authUser.id)
        .gte('created_at', new Date().toISOString().split('T')[0])
        .eq('status', 'completed');

      // Get conversion limits
      const planType = subscription?.plan_type || 'starter';
      const { data: limits } = await supabase
        .from('conversion_limits')
        .select('daily_limit')
        .eq('plan_type', planType)
        .single();

      setUser({
        id: authUser.id,
        email: authUser.email || '',
        name: authUser.user_metadata?.name || authUser.email?.split('@')[0] || 'User',
        planType,
        dailyUsage: dailyConversions?.length || 0,
        dailyLimit: limits?.daily_limit || 10
      });

      // Load conversion history
      const { data: conversionHistory } = await supabase
        .from('conversion_logs')
        .select('*')
        .eq('user_id', authUser.id)
        .order('created_at', { ascending: false })
        .limit(20);

      setConversions(conversionHistory || []);
    } catch (error) {
      console.error('Error loading user data:', error);
      toast.error('Failed to load account data');
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { planType: 'professional' }
      });

      if (error) throw error;

      if (data.url) {
        window.open(data.url, '_blank');
      }
    } catch (error) {
      console.error('Error creating checkout:', error);
      toast.error('Failed to start upgrade process');
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
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

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your account...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Please log in to access your account.</p>
          <Button onClick={() => navigate('/')} className="mt-4">
            Go Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">File Converter</h1>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-muted-foreground">Welcome, {user.name}</span>
              <Button onClick={handleLogout} variant="ghost" size="sm">
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* User Profile Sidebar */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader className="text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <User className="h-8 w-8 text-primary" />
                </div>
                <CardTitle>{user.name}</CardTitle>
                <p className="text-sm text-muted-foreground">{user.email}</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Plan</span>
                  <Badge variant={user.planType === 'professional' ? 'default' : 'secondary'}>
                    {user.planType === 'professional' && <Crown className="h-3 w-3 mr-1" />}
                    {user.planType.charAt(0).toUpperCase() + user.planType.slice(1)}
                  </Badge>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Daily Usage</span>
                    <span className="text-sm text-muted-foreground">
                      {user.dailyUsage}/{user.dailyLimit}
                    </span>
                  </div>
                  <Progress 
                    value={(user.dailyUsage / user.dailyLimit) * 100} 
                    className="h-2"
                  />
                </div>

                {user.planType === 'starter' && (
                  <Button onClick={handleUpgrade} className="w-full" size="sm">
                    <Crown className="h-4 w-4 mr-2" />
                    Upgrade to Pro
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <Tabs defaultValue="convert" className="space-y-6">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="convert" className="flex items-center space-x-2">
                  <Download className="h-4 w-4" />
                  <span>Convert Files</span>
                </TabsTrigger>
                <TabsTrigger value="history" className="flex items-center space-x-2">
                  <History className="h-4 w-4" />
                  <span>History</span>
                </TabsTrigger>
                <TabsTrigger value="settings" className="flex items-center space-x-2">
                  <Settings className="h-4 w-4" />
                  <span>Settings</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="convert" className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold mb-2">Convert Your Files</h2>
                  <p className="text-muted-foreground mb-6">
                    Upload and convert your files locally for maximum privacy and speed.
                  </p>
                  <FileConverter userId={user.id} userPlan={user.planType} />
                </div>
              </TabsContent>

              <TabsContent value="history" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Conversion History</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {conversions.length === 0 ? (
                      <div className="text-center py-8">
                        <History className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                        <p className="text-muted-foreground">No conversions yet</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {conversions.map((conversion) => (
                          <div key={conversion.id} className="border rounded-lg p-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <h3 className="font-medium">{conversion.original_filename}</h3>
                                <p className="text-sm text-muted-foreground">
                                  {conversion.input_format.toUpperCase()} → {conversion.output_format.toUpperCase()}
                                </p>
                              </div>
                              <div className="text-right">
                                <Badge 
                                  variant={conversion.status === 'completed' ? 'default' : 'secondary'}
                                >
                                  {conversion.status}
                                </Badge>
                                <p className="text-sm text-muted-foreground mt-1">
                                  {formatFileSize(conversion.file_size)}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center justify-between mt-2">
                              <span className="text-sm text-muted-foreground">
                                {formatDate(conversion.created_at)}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="settings" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Account Settings</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div>
                      <h3 className="text-lg font-medium mb-4">Plan Information</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium">Current Plan</label>
                          <p className="text-sm text-muted-foreground">
                            {user.planType.charAt(0).toUpperCase() + user.planType.slice(1)}
                          </p>
                        </div>
                        <div>
                          <label className="text-sm font-medium">Daily Limit</label>
                          <p className="text-sm text-muted-foreground">
                            {user.dailyLimit} conversions per day
                          </p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-medium mb-4">Privacy & Security</h3>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">Local Processing</p>
                            <p className="text-sm text-muted-foreground">
                              All file conversions happen in your browser
                            </p>
                          </div>
                          <Badge variant="outline" className="text-green-600">
                            Enabled
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">Data Storage</p>
                            <p className="text-sm text-muted-foreground">
                              Files are never uploaded to our servers
                            </p>
                          </div>
                          <Badge variant="outline" className="text-green-600">
                            Private
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
};