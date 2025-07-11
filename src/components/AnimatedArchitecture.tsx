import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, Monitor, Server, Cloud, Play, Pause, RotateCcw, Wifi, Shield, Activity, Zap, Database, Network } from "lucide-react";

interface DataPacket {
  id: string;
  type: 'status' | 'policy' | 'threat' | 'update';
  source: 'agent' | 'epo' | 'cloud';
  target: 'agent' | 'epo' | 'cloud';
  delay: number;
}

const communicationScenarios = {
  monitoring: {
    name: "Real-time Monitoring",
    description: "Agent heartbeat, status reporting, system health checks via ports 443/8443",
    packets: [
      { id: '1', type: 'status', source: 'agent', target: 'epo', delay: 0 },
      { id: '2', type: 'policy', source: 'epo', target: 'agent', delay: 1000 },
      { id: '3', type: 'update', source: 'cloud', target: 'epo', delay: 2000 },
    ]
  },
  threat: {
    name: "Threat Detection",
    description: "Malware scanning, behavioral analysis, threat response via secure channels",
    packets: [
      { id: '1', type: 'threat', source: 'agent', target: 'epo', delay: 0 },
      { id: '2', type: 'policy', source: 'epo', target: 'agent', delay: 500 },
      { id: '3', type: 'update', source: 'cloud', target: 'epo', delay: 1000 },
      { id: '4', type: 'policy', source: 'epo', target: 'agent', delay: 1500 },
    ]
  },
  policy: {
    name: "Policy Management",
    description: "Policy deployment, configuration updates, compliance checks via port 8443",
    packets: [
      { id: '1', type: 'update', source: 'cloud', target: 'epo', delay: 0 },
      { id: '2', type: 'policy', source: 'epo', target: 'agent', delay: 800 },
      { id: '3', type: 'status', source: 'agent', target: 'epo', delay: 1600 },
    ]
  },
  signatures: {
    name: "Signature Updates",
    description: "Virus definitions, threat intelligence, rule updates via HTTPS/445",
    packets: [
      { id: '1', type: 'update', source: 'cloud', target: 'epo', delay: 0 },
      { id: '2', type: 'update', source: 'epo', target: 'agent', delay: 600 },
      { id: '3', type: 'status', source: 'agent', target: 'epo', delay: 1200 },
    ]
  },
  correlation: {
    name: "Event Correlation",
    description: "Log aggregation, incident response, forensic analysis via multiple ports",
    packets: [
      { id: '1', type: 'threat', source: 'agent', target: 'epo', delay: 0 },
      { id: '2', type: 'status', source: 'agent', target: 'epo', delay: 400 },
      { id: '3', type: 'update', source: 'cloud', target: 'epo', delay: 800 },
      { id: '4', type: 'policy', source: 'epo', target: 'agent', delay: 1200 },
    ]
  },
  protection: {
    name: "Network Protection",
    description: "Firewall rules, web filtering, intrusion prevention via ports 80/443",
    packets: [
      { id: '1', type: 'policy', source: 'epo', target: 'agent', delay: 0 },
      { id: '2', type: 'threat', source: 'agent', target: 'epo', delay: 500 },
      { id: '3', type: 'policy', source: 'epo', target: 'agent', delay: 1000 },
    ]
  }
} as const;

const packetColors = {
  status: 'bg-blue-400 shadow-[0_0_8px_rgb(96,165,250)]',
  policy: 'bg-trellix-orange shadow-[0_0_8px_hsl(var(--trellix-orange))]',
  threat: 'bg-red-400 shadow-[0_0_8px_rgb(248,113,113)]',
  update: 'bg-emerald-400 shadow-[0_0_8px_rgb(52,211,153)]'
};

const packetLabels = {
  status: 'Status Report',
  policy: 'Policy Update',
  threat: 'Threat Alert',
  update: 'Signature Update'
};

export const AnimatedArchitecture = () => {
  const [currentScenario, setCurrentScenario] = useState<keyof typeof communicationScenarios>('monitoring');
  const [activePackets, setActivePackets] = useState<DataPacket[]>([]);
  const [cycleCount, setCycleCount] = useState(0);

  useEffect(() => {
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
  }, [currentScenario, cycleCount]);

  const handleScenarioChange = (newScenario: keyof typeof communicationScenarios) => {
    setCurrentScenario(newScenario);
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
    <section id="architecture" className="py-20 bg-gradient-to-br from-background via-secondary/10 to-background relative overflow-hidden">
      {/* Technical Grid Background */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute inset-0" style={{
          backgroundImage: 'radial-gradient(circle at 25px 25px, hsl(var(--primary)) 2px, transparent 0), radial-gradient(circle at 75px 75px, hsl(var(--primary)) 1px, transparent 0)',
          backgroundSize: '50px 50px'
        }} />
        <div className="absolute inset-0 animate-digital-noise" style={{
          backgroundImage: 'linear-gradient(90deg, transparent 79px, hsl(var(--primary) / 0.1) 81px, hsl(var(--primary) / 0.1) 82px, transparent 84px), linear-gradient(0deg, transparent 79px, hsl(var(--primary) / 0.1) 81px, hsl(var(--primary) / 0.1) 82px, transparent 84px)',
          backgroundSize: '84px 84px'
        }} />
      </div>
      
      {/* Scanning Line Effect */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-trellix-orange to-transparent animate-scan-line opacity-60" />
      
      <div className="container mx-auto px-4 lg:px-8 relative z-10">
        <h2 className="text-4xl font-bold text-center text-primary mb-8">
          Trellix Security Architecture
        </h2>
        
        {/* Function Selector */}
        <div className="flex justify-center items-center gap-4 mb-8">
          <div className="flex items-center gap-2">
            <Network className="h-4 w-4 text-trellix-orange" />
            <label className="text-sm font-medium">Active Function:</label>
          </div>
          <select
            value={currentScenario}
            onChange={(e) => handleScenarioChange(e.target.value as keyof typeof communicationScenarios)}
            className="px-4 py-2 bg-card border border-border rounded-md text-card-foreground min-w-[250px] font-mono text-sm"
          >
            {Object.entries(communicationScenarios).map(([key, scenario]) => (
              <option key={key} value={key}>{scenario.name}</option>
            ))}
          </select>
        </div>

        {/* Function Description */}
        <div className="text-center mb-8">
          <p className="text-muted-foreground text-sm">
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
                className={`absolute w-4 h-4 rounded-full ${packetColors[packet.type]} ${getPacketPosition(packet.source, packet.target)} ${getPacketAnimation(packet.source, packet.target)} z-20 border border-white/30`}
                title={packetLabels[packet.type]}
              >
                <div className="absolute inset-0 rounded-full bg-white/20 animate-network-pulse" />
                <div className="absolute -inset-2 rounded-full border border-current opacity-50 animate-ping" />
              </div>
            ))}
            
            <Card className="bg-gradient-to-br from-card via-card to-card/80 border-2 border-border hover:border-trellix-orange/50 transition-all duration-500 hover:shadow-2xl hover:shadow-trellix-orange/20 flex-1 relative overflow-hidden animate-pulse-glow">
              {/* Circuit Pattern Overlay */}
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-2 left-2 w-4 h-4 border-l-2 border-t-2 border-trellix-orange" />
                <div className="absolute top-2 right-2 w-4 h-4 border-r-2 border-t-2 border-trellix-orange" />
                <div className="absolute bottom-2 left-2 w-4 h-4 border-l-2 border-b-2 border-trellix-orange" />
                <div className="absolute bottom-2 right-2 w-4 h-4 border-r-2 border-b-2 border-trellix-orange" />
              </div>
              
              <CardContent className="p-6 text-center relative z-10">
                <div className="relative mb-4">
                  <Monitor className="h-12 w-12 text-trellix-orange mx-auto" />
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full animate-network-pulse" />
                </div>
                <h4 className="text-xl font-semibold text-card-foreground mb-2 font-mono">
                  ENDPOINT DEVICES
                </h4>
                <p className="text-muted-foreground mb-4 text-xs uppercase tracking-wider">
                  Workstations • Laptops • Servers
                </p>
                
                {/* Technical Status Display */}
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between bg-background/50 rounded px-2 py-1">
                    <div className="flex items-center space-x-2">
                      <Shield className="w-3 h-3 text-emerald-400" />
                      <span className="font-mono">TRELLIX_AGENT</span>
                    </div>
                    <div className="flex space-x-1">
                      <div className="w-1 h-1 bg-emerald-400 rounded-full animate-data-packet" />
                      <div className="w-1 h-1 bg-emerald-400 rounded-full animate-data-packet" style={{ animationDelay: '0.3s' }} />
                      <div className="w-1 h-1 bg-emerald-400 rounded-full animate-data-packet" style={{ animationDelay: '0.6s' }} />
                    </div>
                  </div>
                  <div className="flex items-center justify-between bg-background/50 rounded px-2 py-1">
                    <div className="flex items-center space-x-2">
                      <Activity className="w-3 h-3 text-blue-400" />
                      <span className="font-mono">ENS_PROTECTION</span>
                    </div>
                    <span className="text-emerald-400 font-mono text-xs">ACTIVE</span>
                  </div>
                  <div className="flex items-center justify-between bg-background/50 rounded px-2 py-1">
                    <div className="flex items-center space-x-2">
                      <Wifi className="w-3 h-3 text-trellix-orange" />
                      <span className="font-mono">MONITORING</span>
                    </div>
                    <div className="w-12 h-1 bg-background rounded overflow-hidden">
                      <div className="h-full bg-trellix-orange animate-flow-right" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="relative flex items-center">
              <div className="relative w-16 h-8 lg:w-24 lg:h-8">
                {/* Connection Lines */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-full h-0.5 bg-gradient-to-r from-trellix-orange/20 via-trellix-orange to-trellix-orange/20" />
                </div>
                {/* Animated Data Flow */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-3 h-3 bg-trellix-orange rounded-full animate-flow-right opacity-90 shadow-[0_0_8px_hsl(var(--trellix-orange))]" />
                </div>
                {/* Direction Indicator */}
                <ArrowRight className="absolute right-0 top-1/2 transform -translate-y-1/2 h-4 w-4 text-trellix-orange rotate-90 lg:rotate-0" />
                {/* Port Information */}
                <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 text-center">
                  <div className="text-xs text-muted-foreground font-mono">PORT 443</div>
                  <div className="text-xs text-emerald-400 font-mono">HTTPS/TLS</div>
                  <div className="w-2 h-2 bg-emerald-400 rounded-full mx-auto mt-1 animate-network-pulse" title="Port Status: Secure" />
                </div>
              </div>
            </div>

            <Card className="bg-gradient-to-br from-card via-card to-card/80 border-2 border-border hover:border-trellix-orange/50 transition-all duration-500 hover:shadow-2xl hover:shadow-trellix-orange/20 flex-1 relative overflow-hidden animate-pulse-glow">
              {/* Server Rack Visual Effect */}
              <div className="absolute right-2 top-2 bottom-2 w-1 bg-gradient-to-b from-trellix-orange/20 via-trellix-orange/50 to-trellix-orange/20 opacity-60" />
              <div className="absolute right-5 top-4 bottom-4 w-px bg-trellix-orange/30" />
              
              <CardContent className="p-6 text-center relative">
                <div className="relative mb-4">
                  <Server className="h-12 w-12 text-trellix-orange mx-auto" />
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-400 rounded-full animate-radar-sweep" />
                  <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-emerald-400 rounded-full animate-network-pulse" />
                </div>
                <h4 className="text-xl font-semibold text-card-foreground mb-2 font-mono">
                  EPO SERVER
                </h4>
                <p className="text-muted-foreground mb-4 text-xs uppercase tracking-wider">
                  Central Management Console
                </p>
                
                {/* Server Metrics */}
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between bg-background/50 rounded px-2 py-1">
                    <div className="flex items-center space-x-2">
                      <Database className="w-3 h-3 text-blue-400" />
                      <span className="font-mono">POLICY_ENGINE</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <div className="w-8 h-1 bg-background rounded overflow-hidden">
                        <div className="h-full bg-blue-400 animate-flow-right" style={{ animationDelay: '0.3s' }} />
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between bg-background/50 rounded px-2 py-1">
                    <div className="flex items-center space-x-2">
                      <Network className="w-3 h-3 text-emerald-400" />
                      <span className="font-mono">AGENT_DEPLOY</span>
                    </div>
                    <span className="text-emerald-400 font-mono">READY</span>
                  </div>
                  <div className="flex items-center justify-between bg-background/50 rounded px-2 py-1">
                    <div className="flex items-center space-x-2">
                      <Zap className="w-3 h-3 text-yellow-400" />
                      <span className="font-mono">THREAT_INTEL</span>
                    </div>
                    <div className="flex space-x-1">
                      <div className="w-1 h-1 bg-yellow-400 rounded-full animate-data-packet" style={{ animationDelay: '0.8s' }} />
                      <div className="w-1 h-1 bg-yellow-400 rounded-full animate-data-packet" style={{ animationDelay: '1.1s' }} />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="relative flex items-center">
              <div className="relative w-16 h-8 lg:w-24 lg:h-8">
                {/* Secure Connection Lines */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-full h-0.5 bg-gradient-to-r from-emerald-400/20 via-emerald-400 to-emerald-400/20" />
                  <div className="absolute w-full h-px bg-gradient-to-r from-transparent via-white/50 to-transparent top-0" />
                </div>
                {/* Encrypted Data Flow */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-3 h-3 bg-emerald-400 rounded-full animate-flow-right opacity-90 shadow-[0_0_8px_rgb(52,211,153)]" style={{ animationDelay: '1s' }} />
                </div>
                <ArrowRight className="absolute right-0 top-1/2 transform -translate-y-1/2 h-4 w-4 text-emerald-400 rotate-90 lg:rotate-0" />
                {/* Port Information */}
                <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 text-center">
                  <div className="text-xs text-muted-foreground font-mono">PORT 8443</div>
                  <div className="text-xs text-emerald-400 font-mono">SSL/VPN</div>
                  <div className="w-2 h-2 bg-emerald-400 rounded-full mx-auto mt-1 animate-network-pulse" title="Port Status: Encrypted" />
                </div>
              </div>
            </div>

            <Card className="bg-gradient-to-br from-card via-card to-card/80 border-2 border-border hover:border-trellix-orange/50 transition-all duration-500 hover:shadow-2xl hover:shadow-trellix-orange/20 flex-1 relative overflow-hidden animate-pulse-glow">
              {/* Cloud Visual Effects */}
              <div className="absolute inset-0 opacity-20">
                <div className="absolute top-4 left-4 w-8 h-8 border border-trellix-orange/50 rounded-full" />
                <div className="absolute top-6 right-6 w-4 h-4 border border-emerald-400/50 rounded-full animate-network-pulse" />
                <div className="absolute bottom-4 left-6 w-6 h-6 border border-blue-400/50 rounded-full" style={{ animationDelay: '1s' }} />
              </div>
              
              <CardContent className="p-6 text-center relative">
                <div className="relative mb-4">
                  <Cloud className="h-12 w-12 text-trellix-orange mx-auto" />
                  {/* Global Network Indicators */}
                  <div className="absolute -top-2 -left-2 w-4 h-4 border-2 border-blue-400 rounded-full animate-radar-sweep" />
                  <div className="absolute -top-2 -right-2 w-3 h-3 bg-emerald-400 rounded-full animate-network-pulse" />
                  <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-red-400 rounded-full animate-data-packet" />
                </div>
                <h4 className="text-xl font-semibold text-card-foreground mb-2 font-mono">
                  TRELLIX CLOUD
                </h4>
                <p className="text-muted-foreground mb-4 text-xs uppercase tracking-wider">
                  Global Threat Intelligence
                </p>
                
                {/* Cloud Services Status */}
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between bg-background/50 rounded px-2 py-1">
                    <div className="flex items-center space-x-2">
                      <Shield className="w-3 h-3 text-emerald-400" />
                      <span className="font-mono">SIGNATURES</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <span className="text-emerald-400 font-mono text-xs">99.9%</span>
                      <div className="w-1 h-1 bg-emerald-400 rounded-full animate-data-packet" style={{ animationDelay: '0.7s' }} />
                    </div>
                  </div>
                  <div className="flex items-center justify-between bg-background/50 rounded px-2 py-1">
                    <div className="flex items-center space-x-2">
                      <Activity className="w-3 h-3 text-blue-400" />
                      <span className="font-mono">ANALYTICS</span>
                    </div>
                    <div className="w-12 h-1 bg-background rounded overflow-hidden">
                      <div className="h-full bg-blue-400 animate-circuit-trace" style={{ animationDelay: '1.2s' }} />
                    </div>
                  </div>
                  <div className="flex items-center justify-between bg-background/50 rounded px-2 py-1">
                    <div className="flex items-center space-x-2">
                      <Zap className="w-3 h-3 text-red-400" />
                      <span className="font-mono">RESEARCH</span>
                    </div>
                    <div className="flex space-x-1">
                      <div className="w-1 h-1 bg-red-400 rounded-full animate-data-packet" style={{ animationDelay: '1.7s' }} />
                      <div className="w-1 h-1 bg-red-400 rounded-full animate-data-packet" style={{ animationDelay: '2s' }} />
                      <div className="w-1 h-1 bg-red-400 rounded-full animate-data-packet" style={{ animationDelay: '2.3s' }} />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Network Ports and Technical Information */}
          <div className="w-full max-w-6xl">
            <h3 className="text-2xl font-semibold text-center text-primary mb-6 font-mono">
              TRELLIX NETWORK ARCHITECTURE
            </h3>
            
            {/* Data Packet Legend */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {Object.entries(packetColors).map(([type, color]) => (
                <div key={type} className="flex items-center gap-2 p-2 bg-card rounded-lg border border-border">
                  <div className={`w-3 h-3 rounded-full ${color}`} />
                  <span className="text-sm text-card-foreground font-mono">{packetLabels[type as keyof typeof packetLabels]}</span>
                </div>
              ))}
            </div>

            {/* Port Information Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Primary Communication Ports */}
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-primary mb-4 font-mono">
                  PRIMARY PORTS
                </h4>
                <Card className="bg-emerald-400/10 border-emerald-400">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h5 className="font-semibold text-emerald-400 font-mono">PORT 443</h5>
                      <div className="w-2 h-2 bg-emerald-400 rounded-full animate-network-pulse" title="Secure Active" />
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">HTTPS/SSL - Primary EPO Communication</p>
                    <div className="text-xs text-muted-foreground space-y-1">
                      <div>• Agent Status Reports</div>
                      <div>• Policy Distribution</div>
                      <div>• Threat Response</div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="bg-blue-400/10 border-blue-400">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h5 className="font-semibold text-blue-400 font-mono">PORT 8443</h5>
                      <div className="w-2 h-2 bg-blue-400 rounded-full animate-network-pulse" title="Management Active" />
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">EPO Web Console - Admin Interface</p>
                    <div className="text-xs text-muted-foreground space-y-1">
                      <div>• Web Management</div>
                      <div>• Policy Configuration</div>
                      <div>• System Dashboard</div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Secondary Ports */}
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-primary mb-4 font-mono">
                  SECONDARY PORTS
                </h4>
                <Card className="bg-yellow-400/10 border-yellow-400">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h5 className="font-semibold text-yellow-400 font-mono">PORT 445</h5>
                      <div className="w-2 h-2 bg-yellow-400 rounded-full animate-data-packet" title="File Transfer" />
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">SMB - File Sharing & Updates</p>
                    <div className="text-xs text-muted-foreground space-y-1">
                      <div>• Signature Updates</div>
                      <div>• Definition Files</div>
                      <div>• Network Shares</div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="bg-orange-400/10 border-orange-400">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h5 className="font-semibold text-orange-400 font-mono">PORT 1433</h5>
                      <div className="w-2 h-2 bg-orange-400 rounded-full animate-network-pulse" title="Database Active" />
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">SQL Server - Database Communication</p>
                    <div className="text-xs text-muted-foreground space-y-1">
                      <div>• Event Storage</div>
                      <div>• Policy Database</div>
                      <div>• Audit Logs</div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* System Ports & Metrics */}
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-primary mb-4 font-mono">
                  SYSTEM STATUS
                </h4>
                <Card className="bg-purple-400/10 border-purple-400">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h5 className="font-semibold text-purple-400 font-mono">RPC/NetBIOS</h5>
                      <div className="w-2 h-2 bg-purple-400 rounded-full animate-network-pulse" title="System Services" />
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">Ports 135, 139 - System Services</p>
                    <div className="text-xs text-muted-foreground space-y-1">
                      <div>• RPC Endpoint Mapper</div>
                      <div>• NetBIOS Sessions</div>
                      <div>• Windows Integration</div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="bg-trellix-orange/10 border-trellix-orange">
                  <CardContent className="p-4">
                    <h5 className="font-semibold text-trellix-orange mb-2 font-mono">NETWORK METRICS</h5>
                    <div className="space-y-3 text-xs">
                      <div>
                        <div className="flex justify-between mb-1">
                          <span>Throughput</span>
                          <span className="text-emerald-400">98.7%</span>
                        </div>
                        <div className="w-full h-1 bg-background rounded overflow-hidden">
                          <div className="h-full bg-emerald-400 animate-flow-right" style={{ width: '98.7%' }} />
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between mb-1">
                          <span>Latency</span>
                          <span className="text-yellow-400">8ms</span>
                        </div>
                        <div className="w-full h-1 bg-background rounded overflow-hidden">
                          <div className="h-full bg-yellow-400 animate-network-pulse" style={{ width: '8%' }} />
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between mb-1">
                          <span>Security</span>
                          <span className="text-emerald-400">TLS 1.3</span>
                        </div>
                        <div className="w-full h-1 bg-background rounded overflow-hidden">
                          <div className="h-full bg-emerald-400" style={{ width: '100%' }} />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};