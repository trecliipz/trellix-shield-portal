
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { CreditCard, Crown, Calendar, Download, RefreshCw } from 'lucide-react';

interface Subscription {
  subscribed: boolean;
  subscription_tier: string | null;
  subscription_end: string | null;
}

interface UserSubscription {
  id: string;
  plan_type: string;
  status: string;
  max_downloads: number;
  downloads_used: number;
  trial_ends_at: string | null;
  created_at: string;
}

export const MembershipCard = ({ userId }: { userId: string }) => {
  const [subscription, setSubscription] = useState<Subscription>({
    subscribed: false,
    subscription_tier: null,
    subscription_end: null
  });
  const [localSubscription, setLocalSubscription] = useState<UserSubscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState('professional');
  const { toast } = useToast();

  useEffect(() => {
    loadSubscriptionData();
  }, [userId]);

  const loadSubscriptionData = async () => {
    setLoading(true);
    try {
      // Check Stripe subscription status
      const { data: stripeData, error: stripeError } = await supabase.functions.invoke('check-subscription');
      if (stripeError) {
        console.error('Stripe subscription check error:', stripeError);
      } else {
        setSubscription(stripeData);
      }

      // Get local subscription data
      const { data: localData, error: localError } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (localError && localError.code !== 'PGRST116') {
        console.error('Local subscription error:', localError);
      } else if (localData) {
        setLocalSubscription(localData);
      }

    } catch (error) {
      console.error('Error loading subscription data:', error);
      toast({
        title: "Error",
        description: "Failed to load subscription data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpgradePlan = async () => {
    setUpgrading(true);
    try {
      const planPrices = {
        starter: 999,
        professional: 1999,
        enterprise: 3999
      };

      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: {
          planType: selectedPlan,
          priceAmount: planPrices[selectedPlan as keyof typeof planPrices]
        }
      });

      if (error) throw error;

      if (data?.url) {
        window.open(data.url, '_blank');
        toast({
          title: "Redirecting to Checkout",
          description: "Please complete your subscription upgrade",
        });
      }
    } catch (error) {
      console.error('Upgrade error:', error);
      toast({
        title: "Upgrade Error",
        description: error instanceof Error ? error.message : "Failed to start upgrade process",
        variant: "destructive",
      });
    } finally {
      setUpgrading(false);
    }
  };

  const handleManageSubscription = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('customer-portal');
      if (error) throw error;
      
      if (data?.url) {
        window.open(data.url, '_blank');
        toast({
          title: "Opening Billing Portal",
          description: "Manage your subscription, payment method, and billing history",
        });
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

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'default';
      case 'trialing':
        return 'secondary';
      case 'canceled':
      case 'inactive':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const getPlanIcon = (tier: string | null) => {
    if (tier === 'enterprise') return <Crown className="h-4 w-4" />;
    return <CreditCard className="h-4 w-4" />;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Membership
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Membership
          </span>
          <Button variant="outline" size="sm" onClick={loadSubscriptionData}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current Plan Status */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Current Plan:</span>
            <div className="flex items-center gap-2">
              {subscription.subscription_tier && getPlanIcon(subscription.subscription_tier)}
              <Badge variant={getStatusColor(subscription.subscribed ? 'active' : 'inactive')}>
                {subscription.subscription_tier ? 
                  `${subscription.subscription_tier.charAt(0).toUpperCase()}${subscription.subscription_tier.slice(1)}` : 
                  localSubscription?.plan_type || 'Free'
                }
              </Badge>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Status:</span>
            <Badge variant={getStatusColor(localSubscription?.status || 'inactive')}>
              {localSubscription?.status || 'Inactive'}
            </Badge>
          </div>

          {subscription.subscription_end && (
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Next Billing:</span>
              <div className="flex items-center gap-1 text-sm">
                <Calendar className="h-4 w-4" />
                {new Date(subscription.subscription_end).toLocaleDateString()}
              </div>
            </div>
          )}

          {localSubscription?.trial_ends_at && (
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Trial Ends:</span>
              <div className="flex items-center gap-1 text-sm">
                <Calendar className="h-4 w-4" />
                {new Date(localSubscription.trial_ends_at).toLocaleDateString()}
              </div>
            </div>
          )}

          {localSubscription && (
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Downloads:</span>
              <div className="flex items-center gap-1 text-sm">
                <Download className="h-4 w-4" />
                {localSubscription.downloads_used} / {localSubscription.max_downloads === -1 ? '∞' : localSubscription.max_downloads}
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="space-y-3">
          {!subscription.subscribed && (
            <>
              <div className="space-y-2">
                <label className="text-sm font-medium">Upgrade to:</label>
                <Select value={selectedPlan} onValueChange={setSelectedPlan}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="starter">Starter Plan - $9.99/month</SelectItem>
                    <SelectItem value="professional">Professional Plan - $19.99/month</SelectItem>
                    <SelectItem value="enterprise">Enterprise Plan - $39.99/month</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button 
                onClick={handleUpgradePlan} 
                disabled={upgrading}
                className="w-full"
              >
                {upgrading ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Processing...
                  </div>
                ) : (
                  <>
                    <Crown className="h-4 w-4 mr-2" />
                    Upgrade Plan
                  </>
                )}
              </Button>
            </>
          )}

          {subscription.subscribed && (
            <Button 
              onClick={handleManageSubscription}
              variant="outline"
              className="w-full"
            >
              <CreditCard className="h-4 w-4 mr-2" />
              Manage Subscription
            </Button>
          )}
        </div>

        {/* Plan Benefits */}
        <div className="pt-4 border-t">
          <p className="text-xs text-muted-foreground">
            {subscription.subscribed ? 
              "Manage your subscription, payment method, and billing history through the customer portal." :
              "Upgrade to unlock unlimited downloads, priority support, and advanced features."
            }
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
