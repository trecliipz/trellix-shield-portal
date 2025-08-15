
import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { Dashboard } from "@/components/Dashboard";
import { AnimatedArchitecture } from "@/components/AnimatedArchitecture";
import { Features } from "@/components/Features";
import { PricingSection } from "@/components/PricingSection";
import { Support } from "@/components/Support";
import { Documentation } from "@/components/Documentation";
import { CustomerOnboarding } from "@/components/CustomerOnboarding";
import { CustomerPortal } from "@/components/CustomerPortal";
import { supabase } from "@/integrations/supabase/client";

const Index = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [hasCustomerProfile, setHasCustomerProfile] = useState(false);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setIsLoggedIn(true);
        setCurrentUser(session.user);
        
        const { data: customerUser } = await supabase
          .from('customer_users')
          .select('customer_id')
          .eq('user_id', session.user.id)
          .single();
        
        setHasCustomerProfile(!!customerUser);
      }
    } catch (error) {
      console.error('Auth check error:', error);
    }
  };

  const handleLogin = (email: string, password: string): boolean => {
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
    
    // Check for users with temp passwords
    const users = JSON.parse(localStorage.getItem('admin_users') || '[]');
    const user = users.find((u: any) => u.email === email);
    if (user && user.tempPassword === password) {
      setIsLoggedIn(true);
      setCurrentUser({ 
        email: email, 
        name: user.name,
        role: user.role
      });
      return true;
    }
    
    // Regular user authentication
    if (email && password) {
      setIsLoggedIn(true);
      setCurrentUser({ 
        email: email, 
        name: email.split('@')[0],
        role: 'user'
      });
      return true;
    }
    return false;
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setCurrentUser(null);
  };

  const handleGetStarted = () => {
    if (!isLoggedIn) {
      // This will be handled by the AuthModal in Header
      const event = new CustomEvent('openAuthModal', { detail: 'register' });
      window.dispatchEvent(event);
    }
  };

  if (showOnboarding) {
    return (
      <CustomerOnboarding
        onComplete={() => {
          setShowOnboarding(false);
          setHasCustomerProfile(true);
          checkAuthStatus();
        }}
        onCancel={() => setShowOnboarding(false)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header 
        isLoggedIn={isLoggedIn}
        currentUser={currentUser}
        onLogin={handleLogin}
        onLogout={handleLogout}
      />
      
      <main className="pt-20">
        {isLoggedIn && hasCustomerProfile ? (
          <CustomerPortal onLogout={handleLogout} />
        ) : isLoggedIn ? (
          <div className="container mx-auto px-6 py-12 text-center">
            <h2 className="text-2xl font-bold mb-4">Welcome to Trellix ePO SaaS</h2>
            <p className="text-muted-foreground mb-6">Complete your organization setup to get started</p>
            <button 
              onClick={() => setShowOnboarding(true)}
              className="bg-primary text-primary-foreground px-6 py-2 rounded-md hover:bg-primary/90"
            >
              Complete Setup
            </button>
          </div>
        ) : (
          <>
            <Hero onGetStarted={handleGetStarted} />
            <AnimatedArchitecture />
            <Features />
            <PricingSection />
            <Support />
            <Documentation />
          </>
        )}
      </main>
    </div>
  );
};

export default Index;
