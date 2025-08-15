import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Building, Shield, CreditCard, ArrowRight, ArrowLeft } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface SubscriptionPlan {
  id: string;
  plan_name: string;
  display_name: string;
  price_per_endpoint_monthly: number;
  price_per_endpoint_yearly: number;
  max_endpoints: number;
  features: any; // Using any to handle JSONB from Supabase
}

interface OnboardingFormData {
  companyName: string;
  ouGroupName: string;
  contactName: string;
  contactEmail: string;
  phone: string;
  planId: string;
  billingCycle: 'monthly' | 'yearly';
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
}

interface CustomerOnboardingProps {
  onComplete: (customerId: string) => void;
  onCancel: () => void;
}

export const CustomerOnboarding: React.FC<CustomerOnboardingProps> = ({
  onComplete,
  onCancel
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<OnboardingFormData>({
    companyName: '',
    ouGroupName: '',
    contactName: '',
    contactEmail: '',
    phone: '',
    planId: '',
    billingCycle: 'monthly',
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'US'
    }
  });
  const { toast } = useToast();

  useEffect(() => {
    loadSubscriptionPlans();
  }, []);

  const loadSubscriptionPlans = async () => {
    try {
      const { data, error } = await supabase
        .from('subscription_plans_epo')
        .select('*')
        .eq('is_active', true)
        .order('price_per_endpoint_monthly');

      if (error) throw error;
      setPlans(data || []);
    } catch (error) {
      console.error('Error loading plans:', error);
      toast({
        title: 'Error',
        description: 'Failed to load subscription plans',
        variant: 'destructive'
      });
    }
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        return !!(formData.companyName && formData.ouGroupName && formData.contactName && formData.contactEmail);
      case 2:
        return !!formData.planId;
      case 3:
        return !!(formData.address.street && formData.address.city && formData.address.state && formData.address.zipCode);
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => prev + 1);
    } else {
      toast({
        title: 'Incomplete Information',
        description: 'Please fill in all required fields before continuing.',
        variant: 'destructive'
      });
    }
  };

  const handleBack = () => {
    setCurrentStep(prev => prev - 1);
  };

  const handleSubmit = async () => {
    if (!validateStep(3)) {
      toast({
        title: 'Incomplete Information',
        description: 'Please fill in all required fields.',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('customer-onboarding', {
        body: formData
      });

      if (error) throw error;

      if (data.success) {
        toast({
          title: 'Success!',
          description: 'Your account has been created successfully. Setting up your environment...'
        });

        // Trigger ePO OU creation
        await supabase.functions.invoke('epo-integration', {
          body: {
            customerOU: formData.ouGroupName,
            companyName: formData.companyName,
            customerId: data.customer_id
          }
        });

        onComplete(data.customer_id);
      }
    } catch (error: any) {
      console.error('Onboarding error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to create account',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const updateFormData = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const updateAddressData = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      address: {
        ...prev.address,
        [field]: value
      }
    }));
  };

  const selectedPlan = plans.find(p => p.id === formData.planId);
  const steps = ['Company Information', 'Select Plan', 'Billing Information', 'Review & Complete'];

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-center mb-2">Welcome to Trellix ePO SaaS</h1>
        <p className="text-muted-foreground text-center">Let's get your endpoint protection set up in minutes</p>
      </div>

      {/* Progress Indicator */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-2">
          {steps.map((step, index) => (
            <div key={index} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                index + 1 <= currentStep 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-muted text-muted-foreground'
              }`}>
                {index + 1 < currentStep ? <CheckCircle className="w-4 h-4" /> : index + 1}
              </div>
              {index < steps.length - 1 && (
                <div className={`w-full h-1 mx-2 ${
                  index + 1 < currentStep ? 'bg-primary' : 'bg-muted'
                }`} />
              )}
            </div>
          ))}
        </div>
        <Progress value={(currentStep / steps.length) * 100} className="w-full" />
      </div>

      {/* Step Content */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {currentStep === 1 && <Building className="w-5 h-5" />}
            {currentStep === 2 && <Shield className="w-5 h-5" />}
            {currentStep === 3 && <CreditCard className="w-5 h-5" />}
            {steps[currentStep - 1]}
          </CardTitle>
          <CardDescription>
            {currentStep === 1 && "Tell us about your organization"}
            {currentStep === 2 && "Choose the plan that fits your needs"}
            {currentStep === 3 && "Provide billing and address information"}
            {currentStep === 4 && "Review your configuration before we set everything up"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">

          {/* Step 1: Company Information */}
          {currentStep === 1 && (
            <div className="grid gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="companyName">Company Name *</Label>
                  <Input
                    id="companyName"
                    value={formData.companyName}
                    onChange={(e) => updateFormData('companyName', e.target.value)}
                    placeholder="Your Company Name"
                  />
                </div>
                <div>
                  <Label htmlFor="ouGroupName">ePO Group Name *</Label>
                  <Input
                    id="ouGroupName"
                    value={formData.ouGroupName}
                    onChange={(e) => updateFormData('ouGroupName', e.target.value)}
                    placeholder="e.g., ACME-Corp-Security"
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    This will be your unique organizational unit in ePO
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="contactName">Primary Contact *</Label>
                  <Input
                    id="contactName"
                    value={formData.contactName}
                    onChange={(e) => updateFormData('contactName', e.target.value)}
                    placeholder="John Doe"
                  />
                </div>
                <div>
                  <Label htmlFor="contactEmail">Email Address *</Label>
                  <Input
                    id="contactEmail"
                    type="email"
                    value={formData.contactEmail}
                    onChange={(e) => updateFormData('contactEmail', e.target.value)}
                    placeholder="john@company.com"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => updateFormData('phone', e.target.value)}
                  placeholder="+1 (555) 123-4567"
                />
              </div>
            </div>
          )}

          {/* Step 2: Plan Selection */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div>
                <Label className="text-base font-medium">Billing Cycle</Label>
                <RadioGroup
                  value={formData.billingCycle}
                  onValueChange={(value) => updateFormData('billingCycle', value)}
                  className="flex gap-6 mt-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="monthly" id="monthly" />
                    <Label htmlFor="monthly">Monthly</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="yearly" id="yearly" />
                    <Label htmlFor="yearly">Yearly (Save 17%)</Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="grid gap-4">
                {plans.map((plan) => {
                  const price = formData.billingCycle === 'yearly' 
                    ? plan.price_per_endpoint_yearly 
                    : plan.price_per_endpoint_monthly;
                  const isSelected = formData.planId === plan.id;
                  
                  return (
                    <Card
                      key={plan.id}
                      className={`cursor-pointer transition-all ${
                        isSelected ? 'ring-2 ring-primary' : 'hover:shadow-md'
                      }`}
                      onClick={() => updateFormData('planId', plan.id)}
                    >
                      <CardContent className="p-6">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="text-lg font-semibold">{plan.display_name}</h3>
                              {plan.plan_name === 'pro' && (
                                <Badge variant="secondary">Most Popular</Badge>
                              )}
                            </div>
                            <div className="text-2xl font-bold mb-2">
                              ${price.toFixed(2)}
                              <span className="text-sm font-normal text-muted-foreground">
                                /endpoint/{formData.billingCycle === 'yearly' ? 'year' : 'month'}
                              </span>
                            </div>
                            <div className="space-y-1">
                              {plan.features.map((feature, index) => (
                                <div key={index} className="flex items-center gap-2 text-sm">
                                  <CheckCircle className="w-4 h-4 text-green-500" />
                                  {feature}
                                </div>
                              ))}
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-muted-foreground">
                              {plan.max_endpoints === -1 ? 'Unlimited' : `Up to ${plan.max_endpoints}`} endpoints
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

          {/* Step 3: Billing Information */}
          {currentStep === 3 && (
            <div className="grid gap-4">
              <div>
                <Label htmlFor="street">Street Address *</Label>
                <Input
                  id="street"
                  value={formData.address.street}
                  onChange={(e) => updateAddressData('street', e.target.value)}
                  placeholder="123 Main Street"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="city">City *</Label>
                  <Input
                    id="city"
                    value={formData.address.city}
                    onChange={(e) => updateAddressData('city', e.target.value)}
                    placeholder="New York"
                  />
                </div>
                <div>
                  <Label htmlFor="state">State *</Label>
                  <Input
                    id="state"
                    value={formData.address.state}
                    onChange={(e) => updateAddressData('state', e.target.value)}
                    placeholder="NY"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="zipCode">ZIP Code *</Label>
                  <Input
                    id="zipCode"
                    value={formData.address.zipCode}
                    onChange={(e) => updateAddressData('zipCode', e.target.value)}
                    placeholder="10001"
                  />
                </div>
                <div>
                  <Label htmlFor="country">Country *</Label>
                  <Select
                    value={formData.address.country}
                    onValueChange={(value) => updateAddressData('country', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="US">United States</SelectItem>
                      <SelectItem value="CA">Canada</SelectItem>
                      <SelectItem value="UK">United Kingdom</SelectItem>
                      <SelectItem value="AU">Australia</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Review */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <div className="grid gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Company Information</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div><strong>Company:</strong> {formData.companyName}</div>
                      <div><strong>ePO Group:</strong> {formData.ouGroupName}</div>
                      <div><strong>Contact:</strong> {formData.contactName}</div>
                      <div><strong>Email:</strong> {formData.contactEmail}</div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Subscription Plan</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {selectedPlan && (
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="font-medium">{selectedPlan.display_name}</span>
                          <span className="text-lg font-bold">
                            ${(formData.billingCycle === 'yearly' 
                              ? selectedPlan.price_per_endpoint_yearly 
                              : selectedPlan.price_per_endpoint_monthly
                            ).toFixed(2)}/endpoint/{formData.billingCycle === 'yearly' ? 'year' : 'month'}
                          </span>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Billing: {formData.billingCycle}
                        </div>
                        <div className="text-sm text-green-600 font-medium">
                          30-day free trial included
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between pt-6">
            <div>
              {currentStep > 1 && (
                <Button variant="outline" onClick={handleBack}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onCancel}>
                Cancel
              </Button>
              {currentStep < 4 ? (
                <Button onClick={handleNext}>
                  Next
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <Button onClick={handleSubmit} disabled={loading}>
                  {loading ? 'Creating Account...' : 'Complete Setup'}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};