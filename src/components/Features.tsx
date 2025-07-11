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

const securityUpdates = [
  {
    type: "DAT V3 Definition Files",
    platforms: [
      { name: "Windows", version: "v3.1234.5678", date: "Jan 11, 2025", size: "45.2 MB" },
      { name: "macOS", version: "v3.1234.5678", date: "Jan 11, 2025", size: "42.8 MB" },
      { name: "Linux", version: "v3.1234.5678", date: "Jan 11, 2025", size: "48.1 MB" }
    ],
    description: "Latest DAT V3 definition files with enhanced machine learning detection patterns and behavioral analysis."
  },
  {
    type: "MEDDAT Mobile Endpoint",
    platforms: [
      { name: "Windows", version: "MEDDAT.2024.11.15", date: "Jan 10, 2025", size: "28.5 MB" },
      { name: "macOS", version: "MEDDAT.2024.11.15", date: "Jan 10, 2025", size: "24.8 MB" },
      { name: "Linux", version: "MEDDAT.2024.11.15", date: "Jan 10, 2025", size: "31.2 MB" }
    ],
    description: "Mobile and endpoint detection files for advanced threat hunting and mobile device security."
  },
  {
    type: "Security Engines",
    platforms: [
      { name: "Windows", version: "6810", date: "Jun 30, 2025", size: "8.35 MB" },
      { name: "macOS", version: "6810", date: "Jun 30, 2025", size: "7.14 MB" },
      { name: "Linux", version: "6810", date: "Jun 30, 2025", size: "10.8 MB" }
    ],
    description: "Core scanning engines with enhanced detection capabilities and performance improvements."
  },
  {
    type: "TIE Threat Intelligence",
    platforms: [
      { name: "Windows", version: "TIE.2025.01.11", date: "Jan 11, 2025", size: "85.3 MB" },
      { name: "macOS", version: "TIE.2025.01.11", date: "Jan 11, 2025", size: "76.8 MB" },
      { name: "Linux", version: "TIE.2025.01.11", date: "Jan 11, 2025", size: "82.1 MB" }
    ],
    description: "Threat Intelligence Exchange content with global reputation data and file intelligence services."
  },
  {
    type: "Exploit Prevention Content",
    platforms: [
      { name: "Windows", version: "EP.2025.01.10", date: "Jan 10, 2025", size: "156.7 MB" },
      { name: "macOS", version: "EP.2025.01.10", date: "Jan 10, 2025", size: "124.3 MB" },
      { name: "Linux", version: "EP.2025.01.10", date: "Jan 10, 2025", size: "143.9 MB" }
    ],
    description: "Advanced exploit prevention signatures and behavioral rules for comprehensive endpoint protection."
  }
];

export const Features = () => {
  return (
    <section id="features" className="py-20">
      <div className="container mx-auto px-4 lg:px-8">
        <h2 className="text-4xl font-bold text-center text-primary mb-12">
          Enterprise Security Features
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
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

        <h2 className="text-3xl font-bold text-center text-primary mb-12">
          Latest Security Updates by Platform
        </h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
          {securityUpdates.map((update, index) => (
            <Card key={index} className="bg-card border-border">
              <CardContent className="p-6">
                <h3 className="text-xl font-semibold text-card-foreground mb-3 text-center">
                  {update.type}
                </h3>
                <p className="text-muted-foreground text-sm mb-6 text-center">
                  {update.description}
                </p>
                
                <div className="space-y-4">
                  {update.platforms.map((platform, platformIndex) => (
                    <div key={platformIndex} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div className="flex flex-col">
                        <span className="font-medium text-card-foreground">{platform.name}</span>
                        <span className="text-xs text-muted-foreground">v{platform.version}</span>
                      </div>
                      <div className="flex flex-col text-right">
                        <span className="text-sm text-muted-foreground">{platform.date}</span>
                        <span className="text-xs text-muted-foreground">{platform.size}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};