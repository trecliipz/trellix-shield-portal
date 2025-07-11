import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, Zap, Globe, TrendingUp, Monitor, Apple, Smartphone, AlertTriangle, Clock, CheckCircle } from "lucide-react";

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
    urgency: "critical",
    platforms: [
      { name: "Windows", version: "3.1456.7890", date: "Jan 11, 2025", size: "45.2 MB", icon: <Monitor className="h-4 w-4" />, status: "new" },
      { name: "macOS", version: "3.1456.7890", date: "Jan 11, 2025", size: "42.8 MB", icon: <Apple className="h-4 w-4" />, status: "new" },
      { name: "Linux", version: "3.1456.7890", date: "Jan 11, 2025", size: "48.1 MB", icon: <Smartphone className="h-4 w-4" />, status: "new" }
    ],
    description: "Latest DAT V3 definition files with enhanced machine learning detection patterns and behavioral analysis.",
    frequency: "Daily updates"
  },
  {
    type: "MEDDAT Mobile Endpoint",
    urgency: "important",
    platforms: [
      { name: "Windows", version: "2025.01.11.001", date: "Jan 11, 2025", size: "28.5 MB", icon: <Monitor className="h-4 w-4" />, status: "updated" },
      { name: "macOS", version: "2025.01.11.001", date: "Jan 11, 2025", size: "24.8 MB", icon: <Apple className="h-4 w-4" />, status: "updated" },
      { name: "Linux", version: "2025.01.11.001", date: "Jan 11, 2025", size: "31.2 MB", icon: <Smartphone className="h-4 w-4" />, status: "updated" }
    ],
    description: "Mobile and endpoint detection files for advanced threat hunting and mobile device security.",
    frequency: "Weekly updates"
  },
  {
    type: "Security Engines",
    urgency: "important",
    platforms: [
      { name: "Windows", version: "6912.1000", date: "Jan 10, 2025", size: "8.35 MB", icon: <Monitor className="h-4 w-4" />, status: "stable" },
      { name: "macOS", version: "6912.1000", date: "Jan 10, 2025", size: "7.14 MB", icon: <Apple className="h-4 w-4" />, status: "stable" },
      { name: "Linux", version: "6912.1000", date: "Jan 10, 2025", size: "10.8 MB", icon: <Smartphone className="h-4 w-4" />, status: "stable" }
    ],
    description: "Core scanning engines with enhanced detection capabilities and performance improvements.",
    frequency: "Monthly updates"
  },
  {
    type: "TIE Threat Intelligence",
    urgency: "critical",
    platforms: [
      { name: "Windows", version: "7.2.1.456", date: "Jan 11, 2025", size: "85.3 MB", icon: <Monitor className="h-4 w-4" />, status: "new" },
      { name: "macOS", version: "7.2.1.456", date: "Jan 11, 2025", size: "76.8 MB", icon: <Apple className="h-4 w-4" />, status: "new" },
      { name: "Linux", version: "7.2.1.456", date: "Jan 11, 2025", size: "82.1 MB", icon: <Smartphone className="h-4 w-4" />, status: "new" }
    ],
    description: "Threat Intelligence Exchange content with global reputation data and file intelligence services.",
    frequency: "Real-time updates"
  },
  {
    type: "Exploit Prevention Content",
    urgency: "critical",
    platforms: [
      { name: "Windows", version: "12.8.2025.0111", date: "Jan 11, 2025", size: "156.7 MB", icon: <Monitor className="h-4 w-4" />, status: "new" },
      { name: "macOS", version: "12.8.2025.0111", date: "Jan 11, 2025", size: "124.3 MB", icon: <Apple className="h-4 w-4" />, status: "new" },
      { name: "Linux", version: "12.8.2025.0111", date: "Jan 11, 2025", size: "143.9 MB", icon: <Smartphone className="h-4 w-4" />, status: "new" }
    ],
    description: "Advanced exploit prevention signatures and behavioral rules for comprehensive endpoint protection.",
    frequency: "As needed"
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
            <Card key={index} className="bg-card border-border hover:border-primary/30 transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xl font-semibold text-card-foreground">
                    {update.type}
                  </h3>
                  <div className="flex items-center space-x-2">
                    {update.urgency === 'critical' && (
                      <Badge variant="destructive" className="flex items-center space-x-1">
                        <AlertTriangle className="h-3 w-3" />
                        <span>Critical</span>
                      </Badge>
                    )}
                    {update.urgency === 'important' && (
                      <Badge variant="default" className="flex items-center space-x-1">
                        <Clock className="h-3 w-3" />
                        <span>Important</span>
                      </Badge>
                    )}
                  </div>
                </div>
                <p className="text-muted-foreground text-sm mb-4">
                  {update.description}
                </p>
                <div className="flex items-center justify-center mb-6">
                  <Badge variant="outline" className="text-xs">
                    {update.frequency}
                  </Badge>
                </div>
                
                <div className="space-y-4">
                  {update.platforms.map((platform, platformIndex) => (
                    <div key={platformIndex} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted/70 transition-colors">
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center space-x-2">
                          {platform.icon}
                          <span className="font-medium text-card-foreground">{platform.name}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          {platform.status === 'new' && (
                            <Badge variant="default" className="text-xs px-2 py-0">NEW</Badge>
                          )}
                          {platform.status === 'updated' && (
                            <Badge variant="secondary" className="text-xs px-2 py-0">UPDATED</Badge>
                          )}
                          {platform.status === 'stable' && (
                            <CheckCircle className="h-3 w-3 text-green-500" />
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col text-right">
                        <span className="text-xs text-muted-foreground font-mono">{platform.version}</span>
                        <span className="text-xs text-muted-foreground">{platform.date}</span>
                        <span className="text-xs text-muted-foreground font-medium">{platform.size}</span>
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