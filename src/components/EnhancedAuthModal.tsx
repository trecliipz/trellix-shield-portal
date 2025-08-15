import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  company: z.string().min(2, "Company name is required"),
  phone: z.string().optional(),
  industry: z.string().optional(),
  organizationSize: z.string().optional(),
  ouGroupName: z.string().min(3, "OU Group name must be at least 3 characters"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

interface EnhancedAuthModalProps {
  type: 'login' | 'register' | null;
  onClose: () => void;
  planType?: string;
}

export const EnhancedAuthModal = ({ type, onClose, planType }: EnhancedAuthModalProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const { toast } = useToast();

  const loginForm = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const registerForm = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      company: "",
      phone: "",
      industry: "",
      organizationSize: "",
      ouGroupName: "",
      password: "",
    },
  });

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          // Close modal and let parent handle navigation
          onClose();
          // Dispatch event for parent to handle auth state
          const authEvent = new CustomEvent('checkAuthStatus');
          window.dispatchEvent(authEvent);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [onClose]);

  const handleLogin = async (data: z.infer<typeof loginSchema>) => {
    setIsSubmitting(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (error) throw error;

      toast({
        title: "Login successful",
        description: "Welcome back!",
      });
    } catch (error: any) {
      toast({
        title: "Login failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegister = async (data: z.infer<typeof registerSchema>) => {
    setIsSubmitting(true);
    try {
      const redirectUrl = `${window.location.origin}/`;
      
      const { error: signUpError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            name: data.name,
            company: data.company,
            phone: data.phone,
            industry: data.industry,
            organizationSize: data.organizationSize,
            ouGroupName: data.ouGroupName,
            planType: planType || 'starter',
          }
        }
      });

      if (signUpError) throw signUpError;

      toast({
        title: "Registration successful",
        description: "Please check your email to confirm your account.",
      });
      
      registerForm.reset();
    } catch (error: any) {
      toast({
        title: "Registration failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForgotPassword = async () => {
    const email = loginForm.getValues("email");
    if (!email) {
      toast({
        title: "Email required",
        description: "Please enter your email address",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;

      toast({
        title: "Password reset sent",
        description: "Check your email for password reset instructions",
      });
      setShowForgotPassword(false);
    } catch (error: any) {
      toast({
        title: "Reset failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (!type) return null;

  return (
    <Dialog open={!!type} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {type === 'login' ? 'Sign In' : 'Create Account'}
            {planType && type === 'register' && (
              <span className="text-sm font-normal text-muted-foreground ml-2">
                - {planType.charAt(0).toUpperCase() + planType.slice(1)} Plan
              </span>
            )}
          </DialogTitle>
        </DialogHeader>

        {type === 'login' ? (
          <Card>
            <CardHeader className="space-y-1">
              <CardTitle className="text-xl">Welcome back</CardTitle>
              <CardDescription>
                Enter your credentials to access your account
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    {...loginForm.register("email")}
                  />
                  {loginForm.formState.errors.email && (
                    <p className="text-sm text-destructive">
                      {loginForm.formState.errors.email.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    {...loginForm.register("password")}
                  />
                  {loginForm.formState.errors.password && (
                    <p className="text-sm text-destructive">
                      {loginForm.formState.errors.password.message}
                    </p>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    'Sign In'
                  )}
                </Button>

                <Button
                  type="button"
                  variant="link"
                  className="w-full text-sm"
                  onClick={() => setShowForgotPassword(!showForgotPassword)}
                >
                  Forgot your password?
                </Button>

                {showForgotPassword && (
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={handleForgotPassword}
                  >
                    Send Reset Email
                  </Button>
                )}
              </form>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader className="space-y-1">
              <CardTitle className="text-xl">Create your account</CardTitle>
              <CardDescription>
                Get started with Trellix ePO SaaS
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={registerForm.handleSubmit(handleRegister)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      placeholder="Enter your full name"
                      {...registerForm.register("name")}
                    />
                    {registerForm.formState.errors.name && (
                      <p className="text-sm text-destructive">
                        {registerForm.formState.errors.name.message}
                      </p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email">Business Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter your business email"
                      {...registerForm.register("email")}
                    />
                    {registerForm.formState.errors.email && (
                      <p className="text-sm text-destructive">
                        {registerForm.formState.errors.email.message}
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="company">Company Name</Label>
                  <Input
                    id="company"
                    placeholder="Enter your company name"
                    {...registerForm.register("company")}
                  />
                  {registerForm.formState.errors.company && (
                    <p className="text-sm text-destructive">
                      {registerForm.formState.errors.company.message}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone (Optional)</Label>
                    <Input
                      id="phone"
                      placeholder="Enter phone number"
                      {...registerForm.register("phone")}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="industry">Industry (Optional)</Label>
                    <Select onValueChange={(value) => registerForm.setValue("industry", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select industry" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="technology">Technology</SelectItem>
                        <SelectItem value="healthcare">Healthcare</SelectItem>
                        <SelectItem value="finance">Finance</SelectItem>
                        <SelectItem value="manufacturing">Manufacturing</SelectItem>
                        <SelectItem value="retail">Retail</SelectItem>
                        <SelectItem value="education">Education</SelectItem>
                        <SelectItem value="government">Government</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="organizationSize">Organization Size (Optional)</Label>
                    <Select onValueChange={(value) => registerForm.setValue("organizationSize", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select size" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1-10">1-10 employees</SelectItem>
                        <SelectItem value="11-50">11-50 employees</SelectItem>
                        <SelectItem value="51-200">51-200 employees</SelectItem>
                        <SelectItem value="201-1000">201-1000 employees</SelectItem>
                        <SelectItem value="1000+">1000+ employees</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="ouGroupName">OU Group Name</Label>
                    <Input
                      id="ouGroupName"
                      placeholder="e.g., CompanyName-Security"
                      {...registerForm.register("ouGroupName")}
                    />
                    {registerForm.formState.errors.ouGroupName && (
                      <p className="text-sm text-destructive">
                        {registerForm.formState.errors.ouGroupName.message}
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Create a strong password"
                    {...registerForm.register("password")}
                  />
                  {registerForm.formState.errors.password && (
                    <p className="text-sm text-destructive">
                      {registerForm.formState.errors.password.message}
                    </p>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating account...
                    </>
                  ) : (
                    'Create Account'
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}
      </DialogContent>
    </Dialog>
  );
};