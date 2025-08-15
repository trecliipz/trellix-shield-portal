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
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from '@supabase/supabase-js';

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

const registerSchema = z.object({
  name: z.string().min(1, "Full name is required"),
  email: z.string().email("Invalid email address"),
  company: z.string().min(1, "Company is required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

interface SecureAuthModalProps {
  type: 'login' | 'register' | null;
  onClose: () => void;
  onAuthStateChange: (user: User | null, session: Session | null) => void;
}

export const SecureAuthModal = ({ type, onClose, onAuthStateChange }: SecureAuthModalProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState("");

  const loginForm = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const registerForm = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      company: "",
      password: "",
    },
  });

  // Set up auth state listener
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        // Only synchronous state updates here
        onAuthStateChange(session?.user ?? null, session);
        
        if (event === 'SIGNED_IN' && session?.user) {
          toast.success("Successfully signed in!");
          onClose();
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      onAuthStateChange(session?.user ?? null, session);
    });

    return () => subscription.unsubscribe();
  }, [onAuthStateChange, onClose]);

  const handleLogin = async (values: z.infer<typeof loginSchema>) => {
    setIsSubmitting(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: values.email,
        password: values.password,
      });

      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          toast.error("Invalid email or password. Please try again.");
        } else if (error.message.includes('Email not confirmed')) {
          toast.error("Please check your email and click the confirmation link.");
        } else {
          toast.error("Login failed: " + error.message);
        }
        return;
      }

      if (data.user) {
        // Success toast and close handled by auth state listener
        loginForm.reset();
      }
    } catch (error) {
      console.error('Login error:', error);
      toast.error("An unexpected error occurred during login.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegister = async (values: z.infer<typeof registerSchema>) => {
    setIsSubmitting(true);
    try {
      const redirectUrl = `${window.location.origin}/`;
      
      const { data, error } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            name: values.name,
            company: values.company,
          }
        }
      });

      if (error) {
        if (error.message.includes('User already registered')) {
          toast.error("An account with this email already exists. Please try logging in.");
        } else {
          toast.error("Registration failed: " + error.message);
        }
        return;
      }

      if (data.user) {
        toast.success("Account created successfully! Please check your email to verify your account.");
        registerForm.reset();
        onClose();
      }
    } catch (error) {
      console.error('Registration error:', error);
      toast.error("An unexpected error occurred during registration.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!resetEmail) {
      toast.error("Please enter your email address.");
      return;
    }

    if (!z.string().email().safeParse(resetEmail).success) {
      toast.error("Please enter a valid email address.");
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });

      if (error) {
        toast.error("Error sending reset email: " + error.message);
      } else {
        toast.success("Password reset email sent! Check your inbox.");
        setShowForgotPassword(false);
        setResetEmail("");
      }
    } catch (error) {
      console.error('Password reset error:', error);
      toast.error("An unexpected error occurred during password reset.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={type !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[400px] bg-card border-border" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle className="text-primary">
            {type === 'login' ? 'Login' : 'Create Account'}
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
                {isSubmitting ? "Sending..." : "Send Reset Email"}
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
          <Form {...registerForm}>
            <form onSubmit={registerForm.handleSubmit(handleRegister)} className="space-y-4">
              <FormField
                control={registerForm.control}
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
                control={registerForm.control}
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
                control={registerForm.control}
                name="company"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Enter your company" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={registerForm.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input {...field} type="password" placeholder="Enter your password (min 8 characters)" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? "Creating Account..." : "Create Account"}
              </Button>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
};