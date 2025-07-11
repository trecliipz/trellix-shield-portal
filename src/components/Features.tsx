import { Card, CardContent } from "@/components/ui/card";
import { Search, Zap, Globe, TrendingUp } from "lucide-react";

const features = [
  {
    icon: <Search className="h-12 w-12" />,
    title: "Advanced Threat Detection",
    description: "Machine learning-powered detection of known and unknown threats with behavioral analysis."
  },
  {
    icon: <Zap className="h-12 w-12" />,
    title: "Real-time Response",
    description: "Automated threat response and remediation to minimize impact and recovery time."
  },
  {
    icon: <Globe className="h-12 w-12" />,
    title: "Centralized Management",
    description: "Single console for managing security policies across all endpoints in your organization."
  },
  {
    icon: <TrendingUp className="h-12 w-12" />,
    title: "Compliance Reporting",
    description: "Comprehensive reporting and auditing capabilities for regulatory compliance."
  }
];

export const Features = () => {
  return (
    <section id="features" className="py-20">
      <div className="container mx-auto px-4 lg:px-8">
        <h2 className="text-4xl font-bold text-center text-primary mb-12">
          Enterprise Security Features
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <Card 
              key={index} 
              className="bg-card border-border hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/20 text-center"
            >
              <CardContent className="p-6">
                <div className="text-primary mb-4 flex justify-center">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-card-foreground mb-3">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};