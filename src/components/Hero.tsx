import { Button } from "@/components/ui/button";

interface HeroProps {
  onGetStarted: () => void;
}

export const Hero = ({ onGetStarted }: HeroProps) => {
  return (
    <section className="relative min-h-[80vh] flex items-center justify-center gradient-bg">
      <div className="absolute inset-0 bg-gradient-primary opacity-80" />
      <div className="relative z-10 container mx-auto px-4 lg:px-8 text-center">
        <h1 className="text-4xl lg:text-6xl font-bold mb-6 bg-gradient-to-r from-primary to-foreground bg-clip-text text-transparent">
          Advanced Endpoint Protection
        </h1>
        <p className="text-lg lg:text-xl mb-8 text-muted-foreground max-w-3xl mx-auto leading-relaxed">
          Deploy Trellix Agent and ENS (Endpoint Security) for comprehensive threat detection, 
          prevention, and response across your enterprise infrastructure.
        </p>
        <Button size="lg" onClick={onGetStarted} className="glow-button text-lg px-8 py-6 hover:scale-105 transition-all duration-300">
          Start Free Trial
        </Button>
      </div>
    </section>
  );
};