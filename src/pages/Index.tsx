import { useState } from "react";
import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { Dashboard } from "@/components/Dashboard";
import { AnimatedArchitecture } from "@/components/AnimatedArchitecture";
import { Features } from "@/components/Features";

const Index = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState<{ email: string; name: string } | null>(null);

  const handleLogin = (email: string, password: string): boolean => {
    // Simulate authentication - in a real app, you'd validate against a backend
    if (email && password) {
      setIsLoggedIn(true);
      setCurrentUser({ 
        email: email, 
        name: email.split('@')[0] 
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
