import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Shield, Zap, Crown, ArrowLeft, Loader2 } from 'lucide-react';
import { EnhancedAuthModal } from '@/components/EnhancedAuthModal';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const PlanSetup = () => {
  const { plan } = useParams();
  const navigate = useNavigate();
  const [authModalType, setAuthModalType] = useState<'login' | 'register' | null>(null);
  const [subscribing, setSubscribing] = useState(false);
  const { toast } = useToast();

  const plans = {
    starter: {
      name: 'Starter',
      icon: Shield,
      description: 'Perfect for small businesses getting started with endpoint security',
      monthlyPrice: 9.99,
      yearlyPrice: 99.99,
      unit: 'per 5 endpoints',
      popular: false,
      features: [
        'Basic malware protection',
        'Real-time scanning',
        'Email support',
        'Basic reporting dashboard',
        'Automatic updates',
        'Windows & Mac support'
      ],
      gradient: 'from-blue-500/10 to-cyan-500/10'
    },
    professional: {
      name: 'Professional',
      icon: Zap,
      description: 'Advanced protection for growing businesses',
      monthlyPrice: 19.99,
      yearlyPrice: 199.99,
      unit: 'per endpoint',
      popular: true,
      features: [
        'Advanced threat detection',
        'TIE Intelligence integration',
        'Behavioral analysis',
        'Priority support (24/5)',
        'Advanced reporting & analytics',
        'Custom policy management',
        'Multi-platform support'
      ],
      gradient: 'from-primary/20 to-orange-500/20'
    },
    enterprise: {
      name: 'Enterprise',
      icon: Crown,
      description: 'Complete security solution for large organizations',
      monthlyPrice: 39.99,
      yearlyPrice: 399.99,
      unit: 'per endpoint',
      popular: false,
      features: [
        'AI-powered behavioral analysis',
        'Zero-day exploit protection',
        'Advanced persistent threat detection',
        '24/7 phone & chat support',
        'Compliance reporting (SOX, HIPAA)',
        'Dedicated security analyst'
      ],
      gradient: 'from-purple-500/10 to-pink-500/10'
    }
  };

  const selectedPlan = plan && plans[plan as keyof typeof plans];

  useEffect(() => {
    // Check if user is already logged in and redirect admin users
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.email === 'admin@trellix.com') {
        navigate('/portal');
      }
    };
    checkAuth();
  }, [navigate]);

  const handleSubscribe = async () => {
    setSubscribing(true);
    try {
      // Check if user is authenticated
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        // Not authenticated, show register modal
        setAuthModalType('register');
        return;
      }

      // User is authenticated, proceed with checkout
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: {
          planType: plan,
          priceAmount: selectedPlan?.monthlyPrice ? Math.round(selectedPlan.monthlyPrice * 100) : undefined
        }
      });

      if (error) throw error;

      if (data?.url) {
        // Open Stripe checkout in current tab
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Subscription error:', error);
      toast({
        title: "Subscription Error",
        description: error instanceof Error ? error.message : "Failed to start subscription process",
        variant: "destructive",
      });
    } finally {
      setSubscribing(false);
    }
  };

  if (!selectedPlan) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-card flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Plan Not Found</CardTitle>
            <CardDescription>
              The selected plan could not be found. Please choose a valid plan.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate('/')} className="w-full">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Plans
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const Icon = selectedPlan.icon;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-card">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/')}
            className="mb-6"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to All Plans
          </Button>

          <div className="text-center mb-8">
            <h1 className="text-3xl lg:text-4xl font-bold mb-4">
              Get Started with {selectedPlan.name}
            </h1>
            <p className="text-xl text-muted-foreground">
              Set up your account and secure your endpoints today
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Plan Details */}
            <Card className={`relative overflow-hidden ${selectedPlan.popular ? 'ring-2 ring-primary' : ''}`}>
              {selectedPlan.popular && (
                <div className="absolute -top-1 -right-1">
                  <Badge className="rounded-bl-lg rounded-tr-lg bg-primary text-primary-foreground px-3 py-1">
                    Most Popular
                  </Badge>
                </div>
              )}
              
              <div className={`absolute inset-0 bg-gradient-to-br ${selectedPlan.gradient} opacity-50`} />
              
              <CardHeader className="relative z-10 text-center">
                <div className="flex justify-center mb-4">
                  <div className="p-4 rounded-full bg-primary/10 border border-primary/20">
                    <Icon className="h-12 w-12 text-primary" />
                  </div>
                </div>
                <CardTitle className="text-2xl font-bold">{selectedPlan.name}</CardTitle>
                <CardDescription className="text-base mt-2">
                  {selectedPlan.description}
                </CardDescription>
                
                <div className="mt-6">
                  <div className="flex flex-col items-center justify-center">
                    <div className="flex items-baseline">
                      <span className="text-4xl font-bold">${selectedPlan.monthlyPrice}</span>
                      <span className="text-muted-foreground ml-1">/month</span>
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      {selectedPlan.unit}
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="relative z-10">
                <div className="space-y-3">
                  <h4 className="font-semibold text-foreground mb-3">Everything included:</h4>
                  {selectedPlan.features.map((feature, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <Check className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                      <span className="text-sm text-muted-foreground">{feature}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Setup Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Choose Your Next Step</CardTitle>
                <CardDescription>
                  Create a new account or sign in to your existing account to get started
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button 
                  size="lg" 
                  className="w-full"
                  onClick={handleSubscribe}
                  disabled={subscribing}
                >
                  {subscribing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Setting up subscription...
                    </>
                  ) : (
                    'Subscribe Now'
                  )}
                </Button>
                
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-muted-foreground">
                      Already have an account?
                    </span>
                  </div>
                </div>

                <Button 
                  variant="outline" 
                  size="lg" 
                  className="w-full"
                  onClick={() => setAuthModalType('login')}
                >
                  Sign In
                </Button>

                <div className="text-center mt-6 p-4 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    ✅ 14-day free trial included<br />
                    ✅ No credit card required<br />
                    ✅ Cancel anytime
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <EnhancedAuthModal
        type={authModalType}
        onClose={() => setAuthModalType(null)}
        planType={plan}
      />
    </div>
  );
};