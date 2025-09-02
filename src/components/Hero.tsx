
import { Button } from "@/components/ui/button";
import { SecurityBadge } from "./SecurityBadge";

interface HeroProps {
  onGetStarted: () => void;
}

export const Hero = ({ onGetStarted }: HeroProps) => {
  return (
    <section className="relative min-h-[80vh] flex items-center justify-center gradient-bg">
      <div className="absolute inset-0 bg-gradient-primary opacity-80" />
      <div className="relative z-10 container mx-auto px-4 lg:px-8 text-center">
        <div className="mb-4">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-destructive/10 text-destructive border border-destructive/20">
            🚨 Cyber threats increase by 300% annually
          </span>
        </div>
        <h1 className="text-4xl lg:text-6xl font-bold mb-6 bg-gradient-to-r from-primary to-foreground bg-clip-text text-transparent">
          Convert Files Locally in Your Browser
        </h1>
        <p className="text-lg lg:text-xl mb-8 text-muted-foreground max-w-3xl mx-auto leading-relaxed">
          Transform any file format with complete privacy and lightning speed. 
          <strong className="text-foreground"> Zero uploads, maximum security</strong> - all conversions 
          happen directly in your browser using cutting-edge Web Workers.
        </p>
        
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
          <div className="flex items-center text-sm text-muted-foreground">
            <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
            <span>100% Local Processing</span>
          </div>
          <div className="flex items-center text-sm text-muted-foreground">
            <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
            <span>No Files Leave Your Device</span>
          </div>
          <div className="flex items-center text-sm text-muted-foreground">
            <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
            <span>Lightning Fast Conversion</span>
          </div>
        </div>

        <SecurityBadge />

        <p className="text-sm text-muted-foreground mt-4">
          Start converting instantly • No credit card required • Upgrade anytime
        </p>
      </div>
    </section>
  );
};
