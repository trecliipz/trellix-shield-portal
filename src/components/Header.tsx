import { useState } from "react";
import { Button } from "@/components/ui/button";
import { AuthModal } from "./AuthModal";
import { ContactForm } from "./ContactForm";
import { MessageSquare, ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

interface HeaderProps {
  isLoggedIn: boolean;
  currentUser: { email: string; name: string; role: 'admin' | 'user' } | null;
  onLogin: (email: string, password: string) => boolean;
  onLogout: () => void;
}

export const Header = ({ isLoggedIn, currentUser, onLogin, onLogout }: HeaderProps) => {
  const [authModalType, setAuthModalType] = useState<'login' | 'register' | null>(null);
  const [isContactFormOpen, setIsContactFormOpen] = useState(false);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const scrollToDocumentationSection = (subsection: string) => {
    // First scroll to documentation section, then find the tab
    const documentationElement = document.getElementById('documentation');
    if (documentationElement) {
      documentationElement.scrollIntoView({ behavior: 'smooth' });
      // Small delay to ensure scroll happens first
      setTimeout(() => {
        const tabTrigger = document.querySelector(`[data-state="inactive"][value="${subsection}"]`) as HTMLElement;
        if (tabTrigger) {
          tabTrigger.click();
        }
      }, 300);
    }
  };

  const scrollToSupportSection = (subsection: string) => {
    // First scroll to support section, then find the tab
    const supportElement = document.getElementById('support');
    if (supportElement) {
      supportElement.scrollIntoView({ behavior: 'smooth' });
      // Small delay to ensure scroll happens first
      setTimeout(() => {
        const tabTrigger = document.querySelector(`[data-state="inactive"][value="${subsection}"]`) as HTMLElement;
        if (tabTrigger) {
          tabTrigger.click();
        }
      }, 300);
    }
  };

  return (
    <>
      <header className="fixed top-0 w-full glass-header z-50">
        <nav className="container mx-auto px-4 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <a href="#" className="text-2xl font-bold text-primary">
              Trellix
            </a>
            
            <div className="hidden md:flex space-x-8">
              <button 
                onClick={() => scrollToSection('features')}
                className="text-foreground hover:text-primary transition-all duration-300 hover:scale-105 relative group"
              >
                Features
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full"></span>
              </button>
              <button 
                onClick={() => scrollToSection('architecture')}
                className="text-foreground hover:text-primary transition-all duration-300 hover:scale-105 relative group"
              >
                Architecture
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full"></span>
              </button>
              
              <DropdownMenu>
                <DropdownMenuTrigger className="flex items-center text-foreground hover:text-primary transition-all duration-300 hover:scale-105 relative group">
                  Documentation
                  <ChevronDown className="ml-1 h-4 w-4 transition-transform duration-300 group-hover:rotate-180" />
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full"></span>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-48">
                  <DropdownMenuItem onClick={() => scrollToDocumentationSection('installation')}>
                    Installation
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => scrollToDocumentationSection('api')}>
                    API Docs
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => scrollToDocumentationSection('integration')}>
                    Integration
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => scrollToDocumentationSection('best-practices')}>
                    Best Practices
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => scrollToDocumentationSection('troubleshooting')}>
                    Troubleshooting
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => scrollToDocumentationSection('downloads')}>
                    Downloads
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger className="flex items-center text-foreground hover:text-primary transition-all duration-300 hover:scale-105 relative group">
                  Support & Resources
                  <ChevronDown className="ml-1 h-4 w-4 transition-transform duration-300 group-hover:rotate-180" />
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full"></span>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-48">
                  <DropdownMenuItem onClick={() => scrollToSupportSection('contact')}>
                    Contact Support
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => scrollToSupportSection('knowledge')}>
                    Knowledge Base
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => scrollToSupportSection('requirements')}>
                    System Requirements
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => scrollToSupportSection('training')}>
                    Training
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => scrollToSupportSection('community')}>
                    Community
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="flex items-center space-x-4">
              {isLoggedIn ? (
                <>
                  {currentUser?.role === 'admin' && (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => window.location.href = '/admin/dat'}
                      className="hidden sm:flex"
                    >
                      Admin DAT
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsContactFormOpen(true)}
                    className="hidden sm:flex"
                  >
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Contact Admin
                  </Button>
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
                  <Button onClick={() => setAuthModalType('register')} className="glow-button">
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
      
      <ContactForm
        isOpen={isContactFormOpen}
        onClose={() => setIsContactFormOpen(false)}
        currentUser={currentUser}
      />
    </>
  );
};