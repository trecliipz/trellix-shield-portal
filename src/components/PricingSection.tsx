
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Check, Zap, Shield, Crown } from 'lucide-react';

export const PricingSection = () => {
  const [isYearly, setIsYearly] = useState(false);

  const plans = [
    {
      name: 'Starter',
      icon: Shield,
      description: 'Perfect for small businesses getting started with endpoint security',
      monthlyPrice: 9.99,
      yearlyPrice: 99.99,
      popular: false,
      features: [
        'Up to 10 endpoints',
        'Basic malware protection',
        'Real-time scanning',
        'Email support',
        'Basic reporting dashboard',
        'Automatic updates',
        'Windows & Mac support'
      ],
      ctaText: 'Start Free Trial',
      gradient: 'from-blue-500/10 to-cyan-500/10'
    },
    {
      name: 'Professional',
      icon: Zap,
      description: 'Advanced protection for growing businesses',
      monthlyPrice: 19.99,
      yearlyPrice: 199.99,
      popular: true,
      features: [
        'Up to 100 endpoints',
        'Advanced threat detection',
        'TIE Intelligence integration',
        'Behavioral analysis',
        'Priority support (24/5)',
        'Advanced reporting & analytics',
        'Custom policy management',
        'Multi-platform support'
      ],
      ctaText: 'Start Free Trial',
      gradient: 'from-primary/20 to-orange-500/20'
    },
    {
      name: 'Enterprise',
      icon: Crown,
      description: 'Complete security solution for large organizations',
      monthlyPrice: 39.99,
      yearlyPrice: 399.99,
      popular: false,
      features: [
        'Unlimited endpoints',
        'AI-powered behavioral analysis',
        'Zero-day exploit protection',
        'Advanced persistent threat detection',
        '24/7 phone & chat support',
        'Compliance reporting (SOX, HIPAA)',
        'Dedicated security analyst',
        'API integrations'
      ],
      ctaText: 'Contact Sales',
      gradient: 'from-purple-500/10 to-pink-500/10'
    }
  ];

  const calculateSavings = (monthly: number, yearly: number) => {
    const monthlyCost = monthly * 12;
    const savings = monthlyCost - yearly;
    return Math.round((savings / monthlyCost) * 100);
  };

  return (
    <section className="py-24 bg-gradient-to-br from-background via-background to-card">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="text-center mb-16">
          <Badge variant="outline" className="mb-4">
            💰 Limited Time Offer
          </Badge>
          <h2 className="text-3xl lg:text-5xl font-bold mb-6 bg-gradient-to-r from-primary to-foreground bg-clip-text text-transparent">
            Choose Your Protection Level
          </h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            From startups to enterprises, we have the perfect security solution for your business size and needs
          </p>
          
          <div className="flex items-center justify-center gap-4 mb-8">
            <span className={`text-sm font-medium ${!isYearly ? 'text-foreground' : 'text-muted-foreground'}`}>
              Monthly
            </span>
            <Switch
              checked={isYearly}
              onCheckedChange={setIsYearly}
              className="data-[state=checked]:bg-primary"
            />
            <span className={`text-sm font-medium ${isYearly ? 'text-foreground' : 'text-muted-foreground'}`}>
              Yearly
            </span>
            <Badge variant="secondary" className="ml-2">
              Save up to 17%
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {plans.map((plan, index) => {
            const Icon = plan.icon;
            const price = isYearly ? plan.yearlyPrice : plan.monthlyPrice;
            const savings = calculateSavings(plan.monthlyPrice, plan.yearlyPrice);
            
            return (
              <Card 
                key={plan.name}
                className={`relative overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-xl ${
                  plan.popular 
                    ? 'ring-2 ring-primary shadow-lg scale-105' 
                    : 'hover:shadow-lg'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-1 -right-1">
                    <Badge className="rounded-bl-lg rounded-tr-lg bg-primary text-primary-foreground px-3 py-1">
                      Most Popular
                    </Badge>
                  </div>
                )}
                
                <div className={`absolute inset-0 bg-gradient-to-br ${plan.gradient} opacity-50`} />
                
                <CardHeader className="relative z-10 text-center pb-4">
                  <div className="flex justify-center mb-4">
                    <div className="p-3 rounded-full bg-primary/10 border border-primary/20">
                      <Icon className="h-8 w-8 text-primary" />
                    </div>
                  </div>
                  <CardTitle className="text-2xl font-bold">{plan.name}</CardTitle>
                  <CardDescription className="text-base mt-2">
                    {plan.description}
                  </CardDescription>
                  
                  <div className="mt-6">
                    <div className="flex items-baseline justify-center">
                      <span className="text-4xl font-bold">${price}</span>
                      <span className="text-muted-foreground ml-1">
                        /{isYearly ? 'year' : 'month'}
                      </span>
                    </div>
                    {isYearly && (
                      <div className="text-sm text-green-600 font-medium mt-1">
                        Save {savings}% vs monthly
                      </div>
                    )}
                    {!isYearly && (
                      <div className="text-sm text-muted-foreground mt-1">
                        or ${plan.yearlyPrice}/year
                      </div>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="relative z-10">
                  <Button 
                    className={`w-full mb-6 ${
                      plan.popular 
                        ? 'glow-button' 
                        : ''
                    }`}
                    variant={plan.popular ? 'default' : 'outline'}
                    size="lg"
                  >
                    {plan.ctaText}
                  </Button>

                  <div className="space-y-3">
                    <h4 className="font-semibold text-foreground mb-3">Everything included:</h4>
                    {plan.features.map((feature, featureIndex) => (
                      <div key={featureIndex} className="flex items-start gap-3">
                        <Check className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                        <span className="text-sm text-muted-foreground">{feature}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="text-center mt-12">
          <p className="text-sm text-muted-foreground mb-4">
            All plans include 14-day free trial • No setup fees • Cancel anytime
          </p>
          <div className="flex flex-wrap justify-center gap-8 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-green-500" />
              <span>SOC 2 Type II Certified</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-green-500" />
              <span>GDPR Compliant</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-green-500" />
              <span>99.9% Uptime SLA</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
