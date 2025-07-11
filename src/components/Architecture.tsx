import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, Monitor, Server, Cloud } from "lucide-react";

export const Architecture = () => {
  return (
    <section id="architecture" className="py-20 bg-secondary/20">
      <div className="container mx-auto px-4 lg:px-8">
        <h2 className="text-4xl font-bold text-center text-primary mb-12">
          Trellix Security Architecture
        </h2>
        
        <div className="flex flex-col items-center space-y-8">
          {/* Main Architecture Flow */}
          <div className="flex flex-col lg:flex-row items-center space-y-6 lg:space-y-0 lg:space-x-8 w-full max-w-6xl">
            <Card className="bg-card border-border hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/20 flex-1">
              <CardContent className="p-6 text-center">
                <Monitor className="h-12 w-12 text-primary mx-auto mb-4" />
                <h4 className="text-xl font-semibold text-card-foreground mb-2">
                  Endpoint Devices
                </h4>
                <p className="text-muted-foreground mb-4">
                  Workstations, Laptops, Servers
                </p>
                <div className="text-sm space-y-1">
                  <div className="flex items-center justify-center space-x-2">
                    <span className="w-1.5 h-1.5 bg-primary rounded-full" />
                    <span>Trellix Agent</span>
                  </div>
                  <div className="flex items-center justify-center space-x-2">
                    <span className="w-1.5 h-1.5 bg-primary rounded-full" />
                    <span>ENS Protection</span>
                  </div>
                  <div className="flex items-center justify-center space-x-2">
                    <span className="w-1.5 h-1.5 bg-primary rounded-full" />
                    <span>Real-time Monitoring</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <ArrowRight className="h-8 w-8 text-primary flex-shrink-0 rotate-90 lg:rotate-0" />

            <Card className="bg-card border-border hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/20 flex-1">
              <CardContent className="p-6 text-center">
                <Server className="h-12 w-12 text-primary mx-auto mb-4" />
                <h4 className="text-xl font-semibold text-card-foreground mb-2">
                  EPO Server
                </h4>
                <p className="text-muted-foreground mb-4">
                  Central Management Console
                </p>
                <div className="text-sm space-y-1">
                  <div className="flex items-center justify-center space-x-2">
                    <span className="w-1.5 h-1.5 bg-primary rounded-full" />
                    <span>Policy Management</span>
                  </div>
                  <div className="flex items-center justify-center space-x-2">
                    <span className="w-1.5 h-1.5 bg-primary rounded-full" />
                    <span>Agent Deployment</span>
                  </div>
                  <div className="flex items-center justify-center space-x-2">
                    <span className="w-1.5 h-1.5 bg-primary rounded-full" />
                    <span>Threat Intelligence</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <ArrowRight className="h-8 w-8 text-primary flex-shrink-0 rotate-90 lg:rotate-0" />

            <Card className="bg-card border-border hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/20 flex-1">
              <CardContent className="p-6 text-center">
                <Cloud className="h-12 w-12 text-primary mx-auto mb-4" />
                <h4 className="text-xl font-semibold text-card-foreground mb-2">
                  Trellix Cloud
                </h4>
                <p className="text-muted-foreground mb-4">
                  Global Threat Intelligence
                </p>
                <div className="text-sm space-y-1">
                  <div className="flex items-center justify-center space-x-2">
                    <span className="w-1.5 h-1.5 bg-primary rounded-full" />
                    <span>Signature Updates</span>
                  </div>
                  <div className="flex items-center justify-center space-x-2">
                    <span className="w-1.5 h-1.5 bg-primary rounded-full" />
                    <span>Behavioral Analytics</span>
                  </div>
                  <div className="flex items-center justify-center space-x-2">
                    <span className="w-1.5 h-1.5 bg-primary rounded-full" />
                    <span>Threat Research</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Communication Flow */}
          <div className="w-full max-w-4xl">
            <h3 className="text-2xl font-semibold text-center text-primary mb-6">
              Communication Flow
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="bg-primary/10 border-primary">
                <CardContent className="p-4 text-center">
                  <h4 className="font-semibold text-primary mb-2">Agent → EPO</h4>
                  <p className="text-sm text-muted-foreground">
                    Status, Events, Logs
                  </p>
                </CardContent>
              </Card>
              <Card className="bg-primary/10 border-primary">
                <CardContent className="p-4 text-center">
                  <h4 className="font-semibold text-primary mb-2">EPO → Agent</h4>
                  <p className="text-sm text-muted-foreground">
                    Policies, Updates, Commands
                  </p>
                </CardContent>
              </Card>
              <Card className="bg-primary/10 border-primary">
                <CardContent className="p-4 text-center">
                  <h4 className="font-semibold text-primary mb-2">EPO → Cloud</h4>
                  <p className="text-sm text-muted-foreground">
                    Threat Intelligence, Updates
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};