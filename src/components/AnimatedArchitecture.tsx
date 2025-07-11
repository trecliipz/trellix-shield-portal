import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, Monitor, Server, Cloud, Play, Pause, RotateCcw } from "lucide-react";

interface DataPacket {
  id: string;
  type: 'status' | 'policy' | 'threat' | 'update';
  source: 'agent' | 'epo' | 'cloud';
  target: 'agent' | 'epo' | 'cloud';
  delay: number;
}

const communicationScenarios = {
  normal: {
    name: "Normal Operations",
    description: "Regular heartbeat and status reporting",
    packets: [
      { id: '1', type: 'status', source: 'agent', target: 'epo', delay: 0 },
      { id: '2', type: 'policy', source: 'epo', target: 'agent', delay: 1000 },
      { id: '3', type: 'update', source: 'cloud', target: 'epo', delay: 2000 },
    ]
  },
  threat: {
    name: "Threat Detection",
    description: "Real-time threat response workflow",
    packets: [
      { id: '1', type: 'threat', source: 'agent', target: 'epo', delay: 0 },
      { id: '2', type: 'policy', source: 'epo', target: 'agent', delay: 500 },
      { id: '3', type: 'update', source: 'cloud', target: 'epo', delay: 1000 },
      { id: '4', type: 'policy', source: 'epo', target: 'agent', delay: 1500 },
    ]
  },
  update: {
    name: "Policy Deployment",
    description: "Mass policy update across endpoints",
    packets: [
      { id: '1', type: 'update', source: 'cloud', target: 'epo', delay: 0 },
      { id: '2', type: 'policy', source: 'epo', target: 'agent', delay: 800 },
      { id: '3', type: 'status', source: 'agent', target: 'epo', delay: 1600 },
    ]
  }
} as const;

const packetColors = {
  status: 'bg-blue-500',
  policy: 'bg-primary',
  threat: 'bg-red-500',
  update: 'bg-green-500'
};

const packetLabels = {
  status: 'Status Report',
  policy: 'Policy Update',
  threat: 'Threat Alert',
  update: 'Signature Update'
};

export const AnimatedArchitecture = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentScenario, setCurrentScenario] = useState<keyof typeof communicationScenarios>('normal');
  const [activePackets, setActivePackets] = useState<DataPacket[]>([]);
  const [cycleCount, setCycleCount] = useState(0);

  useEffect(() => {
    if (!isPlaying) return;

    const scenario = communicationScenarios[currentScenario];
    const interval = setInterval(() => {
      scenario.packets.forEach((packet) => {
        setTimeout(() => {
          setActivePackets(prev => [...prev, { ...packet, id: `${packet.id}-${cycleCount}` }]);
          
          // Remove packet after animation completes
          setTimeout(() => {
            setActivePackets(prev => prev.filter(p => p.id !== `${packet.id}-${cycleCount}`));
          }, 3000);
        }, packet.delay);
      });
      
      setCycleCount(prev => prev + 1);
    }, 4000);

    return () => clearInterval(interval);
  }, [isPlaying, currentScenario, cycleCount]);

  const handleReset = () => {
    setIsPlaying(false);
    setActivePackets([]);
    setCycleCount(0);
  };

  const getPacketPosition = (source: string, target: string) => {
    const positions = {
      'agent-epo': 'left-[33%] top-1/2',
      'epo-agent': 'left-[33%] top-1/2',
      'epo-cloud': 'left-[66%] top-1/2',
      'cloud-epo': 'left-[66%] top-1/2'
    };
    return positions[`${source}-${target}` as keyof typeof positions] || 'left-1/2 top-1/2';
  };

  const getPacketAnimation = (source: string, target: string) => {
    if (source === 'agent' && target === 'epo') return 'animate-flow-right';
    if (source === 'epo' && target === 'agent') return 'animate-flow-left';
    if (source === 'epo' && target === 'cloud') return 'animate-flow-right';
    if (source === 'cloud' && target === 'epo') return 'animate-flow-left';
    return '';
  };

  return (
    <section id="architecture" className="py-20 bg-secondary/20">
      <div className="container mx-auto px-4 lg:px-8">
        <h2 className="text-4xl font-bold text-center text-primary mb-8">
          Trellix Security Architecture
        </h2>
        
        {/* Animation Controls */}
        <div className="flex justify-center items-center gap-4 mb-8">
          <Button
            onClick={() => setIsPlaying(!isPlaying)}
            variant={isPlaying ? "secondary" : "default"}
            className="flex items-center gap-2"
          >
            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            {isPlaying ? 'Pause' : 'Play'}
          </Button>
          
          <Button onClick={handleReset} variant="outline" className="flex items-center gap-2">
            <RotateCcw className="h-4 w-4" />
            Reset
          </Button>
          
          <select
            value={currentScenario}
            onChange={(e) => setCurrentScenario(e.target.value as keyof typeof communicationScenarios)}
            className="px-3 py-2 bg-card border border-border rounded-md text-card-foreground"
          >
            {Object.entries(communicationScenarios).map(([key, scenario]) => (
              <option key={key} value={key}>{scenario.name}</option>
            ))}
          </select>
        </div>

        {/* Scenario Description */}
        <div className="text-center mb-8">
          <p className="text-muted-foreground">
            {communicationScenarios[currentScenario].description}
          </p>
        </div>
        
        <div className="flex flex-col items-center space-y-8">
          {/* Main Architecture Flow with Animation */}
          <div className="relative flex flex-col lg:flex-row items-center space-y-6 lg:space-y-0 lg:space-x-8 w-full max-w-6xl">
            
            {/* Animated Data Packets */}
            {activePackets.map((packet) => (
              <div
                key={packet.id}
                className={`absolute w-3 h-3 rounded-full ${packetColors[packet.type]} ${getPacketPosition(packet.source, packet.target)} ${getPacketAnimation(packet.source, packet.target)} z-20`}
                title={packetLabels[packet.type]}
              />
            ))}
            
            <Card className={`bg-card border-border hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/20 flex-1 ${isPlaying ? 'animate-pulse-glow' : ''}`}>
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
                    <span className="w-1.5 h-1.5 bg-primary rounded-full animate-data-packet" />
                    <span>Trellix Agent</span>
                  </div>
                  <div className="flex items-center justify-center space-x-2">
                    <span className="w-1.5 h-1.5 bg-primary rounded-full animate-data-packet" style={{ animationDelay: '0.5s' }} />
                    <span>ENS Protection</span>
                  </div>
                  <div className="flex items-center justify-center space-x-2">
                    <span className="w-1.5 h-1.5 bg-primary rounded-full animate-data-packet" style={{ animationDelay: '1s' }} />
                    <span>Real-time Monitoring</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="relative flex items-center">
              <ArrowRight className="h-8 w-8 text-primary flex-shrink-0 rotate-90 lg:rotate-0" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-2 h-2 bg-primary rounded-full animate-flow-right opacity-75" />
              </div>
            </div>

            <Card className={`bg-card border-border hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/20 flex-1 ${isPlaying ? 'animate-pulse-glow' : ''}`}>
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
                    <span className="w-1.5 h-1.5 bg-primary rounded-full animate-data-packet" style={{ animationDelay: '0.3s' }} />
                    <span>Policy Management</span>
                  </div>
                  <div className="flex items-center justify-center space-x-2">
                    <span className="w-1.5 h-1.5 bg-primary rounded-full animate-data-packet" style={{ animationDelay: '0.8s' }} />
                    <span>Agent Deployment</span>
                  </div>
                  <div className="flex items-center justify-center space-x-2">
                    <span className="w-1.5 h-1.5 bg-primary rounded-full animate-data-packet" style={{ animationDelay: '1.3s' }} />
                    <span>Threat Intelligence</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="relative flex items-center">
              <ArrowRight className="h-8 w-8 text-primary flex-shrink-0 rotate-90 lg:rotate-0" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-2 h-2 bg-primary rounded-full animate-flow-right opacity-75" style={{ animationDelay: '1s' }} />
              </div>
            </div>

            <Card className={`bg-card border-border hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/20 flex-1 ${isPlaying ? 'animate-pulse-glow' : ''}`}>
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
                    <span className="w-1.5 h-1.5 bg-primary rounded-full animate-data-packet" style={{ animationDelay: '0.7s' }} />
                    <span>Signature Updates</span>
                  </div>
                  <div className="flex items-center justify-center space-x-2">
                    <span className="w-1.5 h-1.5 bg-primary rounded-full animate-data-packet" style={{ animationDelay: '1.2s' }} />
                    <span>Behavioral Analytics</span>
                  </div>
                  <div className="flex items-center justify-center space-x-2">
                    <span className="w-1.5 h-1.5 bg-primary rounded-full animate-data-packet" style={{ animationDelay: '1.7s' }} />
                    <span>Threat Research</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Communication Flow Legend */}
          <div className="w-full max-w-4xl">
            <h3 className="text-2xl font-semibold text-center text-primary mb-6">
              Live Communication Flow
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {Object.entries(packetColors).map(([type, color]) => (
                <div key={type} className="flex items-center gap-2 p-2 bg-card rounded-lg border border-border">
                  <div className={`w-3 h-3 rounded-full ${color}`} />
                  <span className="text-sm text-card-foreground">{packetLabels[type as keyof typeof packetLabels]}</span>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="bg-primary/10 border-primary">
                <CardContent className="p-4 text-center">
                  <h4 className="font-semibold text-primary mb-2">Agent → EPO</h4>
                  <p className="text-sm text-muted-foreground">
                    Status, Events, Logs
                  </p>
                  <div className="mt-2 h-1 bg-primary/20 rounded overflow-hidden">
                    <div className="h-full bg-primary animate-flow-right w-8" />
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-primary/10 border-primary">
                <CardContent className="p-4 text-center">
                  <h4 className="font-semibold text-primary mb-2">EPO → Agent</h4>
                  <p className="text-sm text-muted-foreground">
                    Policies, Updates, Commands
                  </p>
                  <div className="mt-2 h-1 bg-primary/20 rounded overflow-hidden">
                    <div className="h-full bg-primary animate-flow-left w-8" />
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-primary/10 border-primary">
                <CardContent className="p-4 text-center">
                  <h4 className="font-semibold text-primary mb-2">EPO → Cloud</h4>
                  <p className="text-sm text-muted-foreground">
                    Threat Intelligence, Updates
                  </p>
                  <div className="mt-2 h-1 bg-primary/20 rounded overflow-hidden">
                    <div className="h-full bg-primary animate-flow-right w-8" style={{ animationDelay: '1s' }} />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};