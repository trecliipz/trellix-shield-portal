
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { Dashboard } from "@/components/Dashboard";
import { AnimatedArchitecture } from "@/components/AnimatedArchitecture";
import { Features } from "@/components/Features";
import { PricingSection } from "@/components/PricingSection";
import { Support } from "@/components/Support";
import { Documentation } from "@/components/Documentation";
import { EnhancedAuthModal } from "@/components/EnhancedAuthModal";
import { supabase } from "@/integrations/supabase/client";

const Index = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState<{ email: string; name: string; role: 'admin' | 'user' } | null>(null);
  const [authModalType, setAuthModalType] = useState<'login' | 'register' | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<string>('');
  const navigate = useNavigate();

  const handleLogin = async (email: string, password: string): Promise<boolean> => {
    try {
      // Check for admin credentials
      if (email === 'admin@trellix.com' && password === '12345678') {
        setIsLoggedIn(true);
        setCurrentUser({ 
          email: email, 
          name: 'Admin',
          role: 'admin'
        });
        return true;
      }
      
      // Use Supabase auth for regular authentication
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        console.error('Authentication error:', error);
        return false;
      }

      if (data.user) {
        // Check if user has admin role
        const { data: userRoles } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', data.user.id);

        const isAdmin = userRoles?.some(role => role.role === 'admin');

        setIsLoggedIn(true);
        setCurrentUser({ 
          email: data.user.email || email, 
          name: data.user.user_metadata?.name || email.split('@')[0],
          role: isAdmin ? 'admin' : 'user'
        });
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setCurrentUser(null);
  };

  useEffect(() => {
    // Listen for custom events from pricing/hero components
    const handleOpenAuth = (event: CustomEvent) => {
      const { type, plan } = event.detail;
      setSelectedPlan(plan || '');
      setAuthModalType(type);
    };

    const handleCheckAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        // Check if admin account
        if (session.user.email === 'admin@trellix.com') {
          handleLogin(session.user.email, '12345678');
        } else {
          // Regular customer - redirect to portal
          navigate('/portal');
        }
      }
    };

    window.addEventListener('openAuthModal', handleOpenAuth as EventListener);
    window.addEventListener('checkAuthStatus', handleCheckAuth);
    
    // Check initial auth state
    handleCheckAuth();

    return () => {
      window.removeEventListener('openAuthModal', handleOpenAuth as EventListener);
      window.removeEventListener('checkAuthStatus', handleCheckAuth);
    };
  }, [navigate]);

  const handleAuthStateChange = (user: any) => {
    if (user?.email === 'admin@trellix.com') {
      // Admin account - use existing logic
      setIsLoggedIn(true);
      setCurrentUser({ 
        email: user.email, 
        name: 'Admin',
        role: 'admin'
      });
    } else {
      // Regular customer - redirect to portal
      navigate('/portal');
    }
  };

  const handleGetStarted = () => {
    if (!isLoggedIn) {
      setAuthModalType('register');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header 
        isLoggedIn={isLoggedIn}
        currentUser={currentUser}
        onLogin={handleLogin}
        onLogout={handleLogout}
      />
      
      <main className="pt-20">
        {!isLoggedIn ? (
          <>
            <Hero onGetStarted={handleGetStarted} />
            <AnimatedArchitecture />
            <Features />
            <PricingSection />
            <Support />
            <Documentation />
            
            <EnhancedAuthModal 
              type={authModalType}
              onClose={() => setAuthModalType(null)}
              planType={selectedPlan}
            />
          </>
        ) : (
          <Dashboard currentUser={currentUser} />
        )}
      </main>
    </div>
  );
};

export default Index;
