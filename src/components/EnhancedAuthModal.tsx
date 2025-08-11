import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { ChevronLeft, ChevronRight, Building, Users, Monitor, CheckCircle } from "lucide-react";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

const basicInfoSchema = z.object({
  name: z.string().min(1, "Full name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const organizationSchema = z.object({
  organizationName: z.string().min(1, "Organization name is required"),
  groupName: z.string().min(1, "Group name is required"),
  industry: z.string().optional(),
  organizationSize: z.string().min(1, "Organization size is required"),
  primaryContactPhone: z.string().optional(),
});

const planSelectionSchema = z.object({
  selectedPlan: z.string().min(1, "Please select a plan"),
  billingCycle: z.enum(['monthly', 'yearly']).default('monthly'),
});

const endpointPlanningSchema = z.object({
  expectedEndpoints: z.string().min(1, "Please specify expected endpoint count"),
  enableBulkImport: z.boolean().optional(),
  machineNames: z.string().optional(),
});

interface EnhancedAuthModalProps {
  type: 'login' | 'register' | null;
  onClose: () => void;
  onLogin: (email: string, password: string) => boolean;
}

type RegistrationStep = 'basic' | 'organization' | 'plan' | 'endpoints' | 'bulk';

export const EnhancedAuthModal = ({ type, onClose, onLogin }: EnhancedAuthModalProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [registrationStep, setRegistrationStep] = useState<RegistrationStep>('basic');
  const [registrationData, setRegistrationData] = useState<any>({});
  const [subscriptionPlans, setSubscriptionPlans] = useState<any[]>([]);

  const loginForm = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const basicInfoForm = useForm<z.infer<typeof basicInfoSchema>>({
    resolver: zodResolver(basicInfoSchema),
    defaultValues: { name: "", email: "", password: "" },
  });

  const organizationForm = useForm<z.infer<typeof organizationSchema>>({
    resolver: zodResolver(organizationSchema),
    defaultValues: {
      organizationName: "",
      groupName: "",
      industry: "",
      organizationSize: "",
      primaryContactPhone: "",
    },
  });

  const planSelectionForm = useForm({
    resolver: zodResolver(planSelectionSchema),
    defaultValues: {
      selectedPlan: "",
      billingCycle: "monthly" as const,
    },
  });

  const endpointPlanningForm = useForm<z.infer<typeof endpointPlanningSchema>>({
    resolver: zodResolver(endpointPlanningSchema),
    defaultValues: {
      expectedEndpoints: "",
      enableBulkImport: false,
      machineNames: "",
    },
  });

  const handleLogin = async (values: z.infer<typeof loginSchema>) => {
    setIsSubmitting(true);
    try {
      const success = onLogin(values.email, values.password);
      if (success) {
        toast.success("Login successful! Welcome to Trellix Agent Portal.");
        onClose();
      } else {
        toast.error("Invalid credentials. Please try again.");
      }
    } catch (error) {
      toast.error("An error occurred during login.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBasicInfo = async (values: z.infer<typeof basicInfoSchema>) => {
    setRegistrationData({ ...registrationData, ...values });
    setRegistrationStep('organization');
  };

  const handleOrganization = async (values: z.infer<typeof organizationSchema>) => {
    setRegistrationData({ ...registrationData, ...values });
    setRegistrationStep('plan');
  };

  const handlePlanSelection = async (values: z.infer<typeof planSelectionSchema>) => {
    setRegistrationData({ ...registrationData, ...values });
    setRegistrationStep('endpoints');
  };

  const handleEndpointPlanning = async (values: z.infer<typeof endpointPlanningSchema>) => {
    const updatedData = { ...registrationData, ...values };
    setRegistrationData(updatedData);

    const expectedCount = parseInt(values.expectedEndpoints?.split('-')[0] || '0');
    if (expectedCount > 2 && values.enableBulkImport) {
      setRegistrationStep('bulk');
    } else {
      await completeRegistration(updatedData);
    }
  };

  const completeRegistration = async (data: any) => {
    setIsSubmitting(true);
    try {
      // Register user with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            name: data.name,
          }
        }
      });

      if (authError) {
        toast.error("Registration failed: " + authError.message);
        return;
      }

      if (authData.user) {
        // Create user organization
        const { error: orgError } = await supabase
          .from('user_organizations')
          .insert([{
            user_id: authData.user.id,
            organization_name: data.organizationName,
            group_name: data.groupName,
            industry: data.industry,
            organization_size: data.organizationSize,
            primary_contact_phone: data.primaryContactPhone,
          }]);

        if (orgError) {
          console.error('Error creating organization:', orgError);
        }

        // Assign subscription plan
        if (data.selectedPlan) {
          try {
            if (data.selectedPlan === 'free') {
              await supabase.rpc('assign_free_trial', { p_user_id: authData.user.id });
            } else {
              await supabase.rpc('upgrade_user_subscription', {
                p_user_id: authData.user.id,
                p_plan_name: data.selectedPlan,
                p_billing_cycle: data.billingCycle || 'monthly'
              });
            }
          } catch (subscriptionError) {
            console.error('Error creating subscription:', subscriptionError);
          }
        }

        // If machine names provided, create endpoint records
        if (data.machineNames) {
          const machineList = data.machineNames
            .split('\n')
            .map((name: string) => name.trim())
            .filter((name: string) => name.length > 0);

          if (machineList.length > 0) {
            // Get the organization ID first
            const { data: orgData } = await supabase
              .from('user_organizations')
              .select('id')
              .eq('user_id', authData.user.id)
              .single();

            if (orgData) {
              const endpoints = machineList.map((machineName: string) => ({
                user_id: authData.user.id,
                organization_id: orgData.id,
                machine_name: machineName,
                os_type: 'windows',
                deployment_status: 'pending',
                health_status: 'unknown',
              }));

              const { error: endpointsError } = await supabase
                .from('endpoints')
                .insert(endpoints);

              if (endpointsError) {
                console.error('Error creating endpoints:', endpointsError);
              }
            }
          }
        }

        toast.success("Account created successfully! Please check your email to verify your account.");
        onClose();
        resetForms();
      }
    } catch (error) {
      toast.error("An error occurred during registration.");
      console.error('Registration error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBulkComplete = async (values: { machineNames: string }) => {
    const finalData = { ...registrationData, machineNames: values.machineNames };
    await completeRegistration(finalData);
  };

  const resetForms = () => {
    setRegistrationStep('basic');
    setRegistrationData({});
    basicInfoForm.reset();
    organizationForm.reset();
    planSelectionForm.reset();
    endpointPlanningForm.reset();
  };

  // Load subscription plans when modal opens
  useEffect(() => {
    if (type === 'register') {
      loadSubscriptionPlans();
    }
  }, [type]);

  const loadSubscriptionPlans = async () => {
    try {
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('is_active', true)
        .order('price_monthly', { ascending: true });

      if (error) throw error;
      setSubscriptionPlans(data || []);
    } catch (error) {
      console.error('Error loading subscription plans:', error);
    }
  };

  const handleForgotPassword = async () => {
    if (!resetEmail) {
      toast.error("Please enter your email address.");
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail);
      if (error) {
        toast.error("Error sending reset email: " + error.message);
      } else {
        toast.success("Password reset email sent! Check your inbox.");
        setShowForgotPassword(false);
        setResetEmail("");
      }
    } catch (error) {
      toast.error("An error occurred during password reset.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderRegistrationStep = () => {
    switch (registrationStep) {
      case 'basic':
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Badge variant="outline">1/3</Badge>
                Account Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...basicInfoForm}>
                <form onSubmit={basicInfoForm.handleSubmit(handleBasicInfo)} className="space-y-4">
                  <FormField
                    control={basicInfoForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Enter your full name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={basicInfoForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input {...field} type="email" placeholder="Enter your email" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={basicInfoForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <Input {...field} type="password" placeholder="Enter your password" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full" disabled={isSubmitting}>
                    Next: Organization Setup
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        );

      case 'organization':
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Badge variant="outline">2/3</Badge>
                <Building className="h-5 w-5" />
                Organization Setup
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...organizationForm}>
                <form onSubmit={organizationForm.handleSubmit(handleOrganization)} className="space-y-4">
                  <FormField
                    control={organizationForm.control}
                    name="organizationName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Organization Name</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Enter your company name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={organizationForm.control}
                    name="groupName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Group Name (EPO Console)</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Enter group name for EPO console" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={organizationForm.control}
                    name="industry"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Industry (Optional)</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select your industry" />
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
                    control={organizationForm.control}
                    name="organizationSize"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Organization Size</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select organization size" />
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
                  <FormField
                    control={organizationForm.control}
                    name="primaryContactPhone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Primary Contact Phone (Optional)</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Enter phone number" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="flex gap-2">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setRegistrationStep('basic')}
                      className="flex-1"
                    >
                      <ChevronLeft className="h-4 w-4 mr-2" />
                      Back
                    </Button>
                     <Button type="submit" className="flex-1" disabled={isSubmitting}>
                       Next: Plan Selection
                       <ChevronRight className="h-4 w-4 ml-2" />
                     </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        );

      case 'plan':
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Badge variant="outline">3/4</Badge>
                Choose Your Plan
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...planSelectionForm}>
                <form onSubmit={planSelectionForm.handleSubmit(handlePlanSelection)} className="space-y-6">
                  <div className="grid gap-4">
                    {subscriptionPlans.map((plan) => (
                      <FormField
                        key={plan.id}
                        control={planSelectionForm.control}
                        name="selectedPlan"
                        render={({ field }) => (
                          <div
                            className={`relative cursor-pointer rounded-lg border p-4 transition-all ${
                              field.value === plan.plan_name
                                ? 'border-primary bg-primary/5 ring-2 ring-primary'
                                : 'border-border hover:border-primary/50'
                            }`}
                            onClick={() => field.onChange(plan.plan_name)}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <h3 className="font-semibold">{plan.display_name}</h3>
                                  {plan.is_free_trial && (
                                    <Badge variant="secondary">Free Trial</Badge>
                                  )}
                                </div>
                                <div className="mt-2">
                                  {plan.is_free_trial ? (
                                    <div className="text-2xl font-bold">Free</div>
                                  ) : (
                                    <div className="flex items-baseline gap-1">
                                      <span className="text-2xl font-bold">
                                        ${planSelectionForm.watch('billingCycle') === 'yearly' 
                                          ? plan.price_yearly 
                                          : plan.price_monthly}
                                      </span>
                                      <span className="text-sm text-muted-foreground">
                                        /{planSelectionForm.watch('billingCycle') === 'yearly' ? 'year' : 'month'}
                                      </span>
                                    </div>
                                  )}
                                </div>
                                <ul className="mt-3 space-y-1 text-sm text-muted-foreground">
                                  {plan.features.map((feature: string, index: number) => (
                                    <li key={index} className="flex items-center gap-2">
                                      <CheckCircle className="h-3 w-3 text-green-500" />
                                      {feature}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                              <input
                                type="radio"
                                value={plan.plan_name}
                                checked={field.value === plan.plan_name}
                                onChange={() => field.onChange(plan.plan_name)}
                                className="h-4 w-4"
                              />
                            </div>
                          </div>
                        )}
                      />
                    ))}
                  </div>

                  {!subscriptionPlans.find(p => p.plan_name === planSelectionForm.watch('selectedPlan'))?.is_free_trial && (
                    <FormField
                      control={planSelectionForm.control}
                      name="billingCycle"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Billing Cycle</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select billing cycle" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="monthly">Monthly</SelectItem>
                              <SelectItem value="yearly">Yearly (Save 20%)</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  <div className="flex gap-2">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setRegistrationStep('organization')}
                      className="flex-1"
                    >
                      <ChevronLeft className="h-4 w-4 mr-2" />
                      Back
                    </Button>
                    <Button type="submit" className="flex-1" disabled={isSubmitting}>
                      Next: Endpoint Planning
                      <ChevronRight className="h-4 w-4 ml-2" />
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        );

      case 'endpoints':
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Badge variant="outline">4/4</Badge>
                <Monitor className="h-5 w-5" />
                Endpoint Planning
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...endpointPlanningForm}>
                <form onSubmit={endpointPlanningForm.handleSubmit(handleEndpointPlanning)} className="space-y-4">
                  <FormField
                    control={endpointPlanningForm.control}
                    name="expectedEndpoints"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Expected Number of Endpoints</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select expected endpoint count" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="1-5">1-5 endpoints</SelectItem>
                            <SelectItem value="6-20">6-20 endpoints</SelectItem>
                            <SelectItem value="21-50">21-50 endpoints</SelectItem>
                            <SelectItem value="51-100">51-100 endpoints</SelectItem>
                            <SelectItem value="100+">100+ endpoints</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {(() => {
                    const watchedValue = endpointPlanningForm.watch('expectedEndpoints');
                    const expectedCount = parseInt(watchedValue?.split('-')[0] || '0');
                    return expectedCount > 2;
                  })() && (
                    <div className="bg-muted p-4 rounded-lg">
                      <h4 className="font-medium mb-2">Bulk Import Available</h4>
                      <p className="text-sm text-muted-foreground mb-3">
                        Since you're planning to deploy on multiple endpoints, would you like to import machine names in bulk?
                      </p>
                      <FormField
                        control={endpointPlanningForm.control}
                        name="enableBulkImport"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                            <FormControl>
                              <input
                                type="checkbox"
                                checked={field.value}
                                onChange={field.onChange}
                                className="h-4 w-4"
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel>
                                Yes, I want to import machine names in bulk
                              </FormLabel>
                            </div>
                          </FormItem>
                        )}
                      />
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setRegistrationStep('plan')}
                      className="flex-1"
                    >
                      <ChevronLeft className="h-4 w-4 mr-2" />
                      Back
                    </Button>
                    <Button type="submit" className="flex-1" disabled={isSubmitting}>
                      {(() => {
                        const watchedValue = endpointPlanningForm.watch('expectedEndpoints');
                        const expectedCount = parseInt(watchedValue?.split('-')[0] || '0');
                        const enableBulk = endpointPlanningForm.watch('enableBulkImport');
                        return expectedCount > 2 && enableBulk ? 'Next: Bulk Import' : 'Complete Registration';
                      })()}
                      <ChevronRight className="h-4 w-4 ml-2" />
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        );

      case 'bulk':
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Badge variant="outline">Bonus</Badge>
                <Users className="h-5 w-5" />
                Bulk Machine Import
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-muted p-4 rounded-lg">
                <h4 className="font-medium mb-2">Machine Names</h4>
                <p className="text-sm text-muted-foreground mb-3">
                  Enter machine names (one per line) that you plan to install the agent on:
                </p>
              </div>
              
              <Textarea
                placeholder={`DESKTOP-001\nLAPTOP-HR-01\nSERVER-DB-01\nWORKSTATION-DEV-01`}
                rows={8}
                onChange={(e) => setRegistrationData({...registrationData, machineNames: e.target.value})}
                value={registrationData.machineNames || ''}
              />

              <div className="flex gap-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setRegistrationStep('endpoints')}
                  className="flex-1"
                >
                  <ChevronLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
                <Button 
                  onClick={() => handleBulkComplete({ machineNames: registrationData.machineNames || '' })}
                  className="flex-1" 
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Creating Account..." : "Complete Registration"}
                </Button>
              </div>
            </CardContent>
          </Card>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={type !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px] bg-card border-border max-h-[90vh] overflow-y-auto" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle className="text-primary">
            {type === 'login' ? 'Login to Your Account' : 'Create Your Account'}
          </DialogTitle>
        </DialogHeader>

        {type === 'login' ? (
          showForgotPassword ? (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Email Address</label>
                <Input
                  type="email"
                  placeholder="Enter your email"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                />
              </div>
              <Button onClick={handleForgotPassword} className="w-full" disabled={isSubmitting}>
                {isSubmitting ? "Sending Reset Email..." : "Reset Password"}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setShowForgotPassword(false)} 
                className="w-full"
              >
                Back to Login
              </Button>
            </div>
          ) : (
            <Form {...loginForm}>
              <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-4">
                <FormField
                  control={loginForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input {...field} type="email" placeholder="Enter your email" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={loginForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input {...field} type="password" placeholder="Enter your password" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? "Logging in..." : "Login"}
                </Button>
                <Button 
                  type="button"
                  variant="link" 
                  onClick={() => setShowForgotPassword(true)}
                  className="w-full text-sm"
                >
                  Forgot Password?
                </Button>
              </form>
            </Form>
          )
        ) : (
          renderRegistrationStep()
        )}
      </DialogContent>
    </Dialog>
  );
};