import { useState } from "react";
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

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

const registerSchema = z.object({
  name: z.string().min(1, "Full name is required"),
  email: z.string().email("Invalid email address"),
  company: z.string().min(1, "Company is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

interface AuthModalProps {
  type: 'login' | 'register' | null;
  onClose: () => void;
  onLogin: (email: string, password: string) => boolean;
}

export const AuthModal = ({ type, onClose, onLogin }: AuthModalProps) => {
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

  const handleRegister = async (values: z.infer<typeof registerSchema>) => {
    setIsSubmitting(true);
    try {
      toast.success("Account created successfully! You can now login.");
      registerForm.reset();
      onClose();
      // In a real app, you would register the user here
    } catch (error) {
      toast.error("An error occurred during registration.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!resetEmail) {
      toast.error("Please enter your email address.");
      return;
    }

    setIsSubmitting(true);
    try {
      // Simulate password reset
      const tempPassword = Math.random().toString(36).slice(-8);
      
      // Save temp password to localStorage for demo
      const users = JSON.parse(localStorage.getItem('admin_users') || '[]');
      const updatedUsers = users.map((user: any) =>
        user.email === resetEmail ? { ...user, tempPassword } : user
      );
      localStorage.setItem('admin_users', JSON.stringify(updatedUsers));
      
      toast.success(`Password reset successful! Temporary password: ${tempPassword}`, {
        duration: 10000,
      });
      setShowForgotPassword(false);
      setResetEmail("");
    } catch (error) {
      toast.error("An error occurred during password reset.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={type !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[400px] bg-card border-border">
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
                {isSubmitting ? "Resetting..." : "Reset Password"}
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
                      <Input {...field} type="password" placeholder="Enter your password" />
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