import { useState } from "react";
import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { Dashboard } from "@/components/Dashboard";
import { AnimatedArchitecture } from "@/components/AnimatedArchitecture";
import { Features } from "@/components/Features";

const Index = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState<{ email: string; name: string; role: 'admin' | 'user' } | null>(null);

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
          </>
        ) : (
          <Dashboard currentUser={currentUser} />
        )}
      </main>
    </div>
  );
};

export default Index;
