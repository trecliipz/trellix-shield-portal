import { useState } from "react";
import { Button } from "@/components/ui/button";
import { AuthModal } from "./AuthModal";

interface HeaderProps {
  isLoggedIn: boolean;
  currentUser: { email: string; name: string; role: 'admin' | 'user' } | null;
  onLogin: (email: string, password: string) => boolean;
  onLogout: () => void;
}

export const Header = ({ isLoggedIn, currentUser, onLogin, onLogout }: HeaderProps) => {
  const [authModalType, setAuthModalType] = useState<'login' | 'register' | null>(null);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <>
      <header className="fixed top-0 w-full bg-background/80 backdrop-blur-lg border-b border-border z-50">
        <nav className="container mx-auto px-4 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <a href="#" className="text-2xl font-bold text-primary">
              Trellix
            </a>
            
            <div className="hidden md:flex space-x-8">
              <button 
                onClick={() => scrollToSection('features')}
                className="text-foreground hover:text-primary transition-colors"
              >
                Features
              </button>
              <button 
                onClick={() => scrollToSection('architecture')}
                className="text-foreground hover:text-primary transition-colors"
              >
                Architecture
              </button>
              <button 
                onClick={() => scrollToSection('support')}
                className="text-foreground hover:text-primary transition-colors"
              >
                Support
              </button>
              <button className="text-foreground hover:text-primary transition-colors">
                Documentation
              </button>
            </div>

            <div className="flex items-center space-x-4">
              {isLoggedIn ? (
                <>
                  <span className="text-primary mr-4 hidden sm:block">
                    Welcome, {currentUser?.name}!
                  </span>
                  <Button variant="outline" onClick={onLogout}>
                    Logout
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="outline" onClick={() => setAuthModalType('login')}>
                    Login
                  </Button>
                  <Button onClick={() => setAuthModalType('register')}>
                    Get Started
                  </Button>
                </>
              )}
            </div>
          </div>
        </nav>
      </header>

      <AuthModal 
        type={authModalType}
        onClose={() => setAuthModalType(null)}
        onLogin={onLogin}
      />
    </>
  );
};