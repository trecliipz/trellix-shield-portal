
import { Button } from "@/components/ui/button";

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
          Stop Cyber Threats Before They Stop Your Business
        </h1>
        <p className="text-lg lg:text-xl mb-8 text-muted-foreground max-w-3xl mx-auto leading-relaxed">
          Don't let ransomware, malware, or zero-day exploits cripple your operations. 
          <strong className="text-foreground"> Trellix Endpoint Security</strong> protects every device, 
          blocks every threat, and keeps your business running 24/7.
        </p>
        
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
          <div className="flex items-center text-sm text-muted-foreground">
            <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
            <span>Deploy in under 5 minutes</span>
          </div>
          <div className="flex items-center text-sm text-muted-foreground">
            <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
            <span>99.9% threat detection rate</span>
          </div>
          <div className="flex items-center text-sm text-muted-foreground">
            <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
            <span>Trusted by 40,000+ companies</span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button size="lg" onClick={onGetStarted} className="glow-button text-lg px-8 py-6 hover:scale-105 transition-all duration-300">
            Start Free Trial - From $9.99/month
          </Button>
          <Button variant="outline" size="lg" className="text-lg px-8 py-6 hover:scale-105 transition-all duration-300">
            See Live Demo
          </Button>
        </div>

        <p className="text-sm text-muted-foreground mt-4">
          No credit card required • 14-day free trial • Cancel anytime
        </p>
      </div>
    </section>
  );
};
