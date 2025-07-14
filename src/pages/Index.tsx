import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { Dashboard } from "@/components/Dashboard";
import { AnimatedArchitecture } from "@/components/AnimatedArchitecture";
import { Features } from "@/components/Features";
import { Support } from "@/components/Support";
import { Documentation } from "@/components/Documentation";
import { useAuth } from "@/contexts/AuthContext";

const Index = () => {
  const { user, isAdmin, loading } = useAuth();

  const handleGetStarted = () => {
    if (!user) {
      // This will be handled by the AuthModal in Header
      const event = new CustomEvent('openAuthModal', { detail: 'register' });
      window.dispatchEvent(event);
    }
  };

  // Show loading state while checking auth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-20">
        {!user ? (
          <>
            <Hero onGetStarted={handleGetStarted} />
            <AnimatedArchitecture />
            <Features />
            <Support />
            <Documentation />
          </>
        ) : (
          <Dashboard currentUser={{
            email: user.email || '',
            name: user.user_metadata?.name || user.email?.split('@')[0] || '',
            role: isAdmin ? 'admin' : 'user'
          }} />
        )}
      </main>
    </div>
  );
};

export default Index;
