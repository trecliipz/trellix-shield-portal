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

// Mechanism-specific technical details
const mechanismDetails = {
  monitoring: {
    agent: {
      name: "REAL-TIME MONITOR",
      features: [
        { icon: Activity, label: "HEARTBEAT_INTERVAL", value: "5s", status: "active" },
        { icon: Wifi, label: "STATUS_CHECK", value: "HTTP/HTTPS", status: "ready" },
        { icon: Monitor, label: "HEALTH_METRICS", value: "CPU/MEM/DISK", status: "monitoring" }
      ]
    },
    epo: {
      name: "MONITORING CENTER",
      features: [
        { icon: Database, label: "AGENT_STATUS", value: "2,847 ONLINE", status: "active" },
        { icon: Network, label: "LATENCY_AVG", value: "12ms", status: "optimal" },
        { icon: Shield, label: "CONNECTION_COUNT", value: "Active: 156", status: "normal" }
      ]
    },
    cloud: {
      name: "TELEMETRY HUB",
      features: [
        { icon: Zap, label: "DATA_INGESTION", value: "1.2GB/hr", status: "streaming" },
        { icon: Activity, label: "ANALYTICS_ENGINE", value: "ML PROCESSING", status: "learning" },
        { icon: Database, label: "STORAGE_TIER", value: "HOT: 45TB", status: "available" }
      ]
    }
  },
  threat: {
    agent: {
      name: "THREAT SCANNER",
      features: [
        { icon: Shield, label: "ON_ACCESS_SCAN", value: "ENABLED", status: "active" },
        { icon: Activity, label: "BEHAVIORAL_AI", value: "HEURISTIC", status: "detecting" },
        { icon: Zap, label: "QUARANTINE_RATE", value: "0.03%", status: "normal" }
      ]
    },
    epo: {
      name: "THREAT COORDINATION",
      features: [
        { icon: Database, label: "SIGNATURE_VER", value: "v4.2.1105", status: "current" },
        { icon: Network, label: "FALSE_POSITIVE", value: "0.001%", status: "optimal" },
        { icon: Shield, label: "RESPONSE_TIME", value: "< 50ms", status: "fast" }
      ]
    },
    cloud: {
      name: "THREAT INTELLIGENCE",
      features: [
        { icon: Zap, label: "GLOBAL_THREATS", value: "2.1M/day", status: "analyzing" },
        { icon: Activity, label: "ML_MODELS", value: "47 ACTIVE", status: "training" },
        { icon: Database, label: "IOC_DATABASE", value: "450M entries", status: "updated" }
      ]
    }
  },
  policy: {
    agent: {
      name: "POLICY ENFORCER",
      features: [
        { icon: Shield, label: "POLICY_VERSION", value: "v12.4.0", status: "enforced" },
        { icon: Activity, label: "COMPLIANCE_CHK", value: "PASSING", status: "compliant" },
        { icon: Monitor, label: "OVERRIDE_COUNT", value: "0 incidents", status: "clean" }
      ]
    },
    epo: {
      name: "POLICY ENGINE",
      features: [
        { icon: Database, label: "DEPLOY_METHOD", value: "PUSH/PULL", status: "hybrid" },
        { icon: Network, label: "CONFIG_TEMPLATES", value: "84 active", status: "managed" },
        { icon: Zap, label: "RULE_EXECUTION", value: "PRIORITY", status: "ordered" }
      ]
    },
    cloud: {
      name: "GOVERNANCE CLOUD",
      features: [
        { icon: Activity, label: "POLICY_SYNC", value: "REALTIME", status: "synced" },
        { icon: Database, label: "COMPLIANCE_DB", value: "SOX/GDPR/PCI", status: "certified" },
        { icon: Shield, label: "AUDIT_TRAIL", value: "IMMUTABLE", status: "logged" }
      ]
    }
  },
  signatures: {
    agent: {
      name: "UPDATE CLIENT",
      features: [
        { icon: Database, label: "UPDATE_FREQ", value: "4x daily", status: "scheduled" },
        { icon: Activity, label: "DELTA_UPDATES", value: "ENABLED", status: "efficient" },
        { icon: Shield, label: "ROLLBACK_CAP", value: "3 versions", status: "safe" }
      ]
    },
    epo: {
      name: "UPDATE SERVER",
      features: [
        { icon: Network, label: "BANDWIDTH_OPT", value: "ADAPTIVE", status: "optimized" },
        { icon: Database, label: "SIG_DATABASE", value: "15.2GB", status: "current" },
        { icon: Zap, label: "DISTRIBUTION", value: "STAGED", status: "controlled" }
      ]
    },
    cloud: {
      name: "SIGNATURE FORGE",
      features: [
        { icon: Activity, label: "SIG_GENERATION", value: "24/7", status: "continuous" },
        { icon: Database, label: "THREAT_SAMPLES", value: "1.8M/day", status: "processing" },
        { icon: Shield, label: "QUALITY_GATE", value: "99.98%", status: "verified" }
      ]
    }
  },
  correlation: {
    agent: {
      name: "EVENT COLLECTOR",
      features: [
        { icon: Activity, label: "LOG_RATE", value: "450 eps", status: "collecting" },
        { icon: Database, label: "BUFFER_SIZE", value: "2MB local", status: "buffering" },
        { icon: Network, label: "SIEM_FORWARD", value: "SYSLOG/CEF", status: "forwarding" }
      ]
    },
    epo: {
      name: "CORRELATION ENGINE",
      features: [
        { icon: Zap, label: "EVENT_PRIORITY", value: "5-TIER", status: "prioritizing" },
        { icon: Shield, label: "INCIDENT_TRIG", value: "AUTOMATED", status: "responsive" },
        { icon: Database, label: "FORENSIC_RET", value: "90 days", status: "retained" }
      ]
    },
    cloud: {
      name: "ANALYTICS PLATFORM",
      features: [
        { icon: Activity, label: "PATTERN_DETECT", value: "AI/ML", status: "learning" },
        { icon: Database, label: "DATA_LAKE", value: "PETABYTE", status: "scalable" },
        { icon: Network, label: "API_ENDPOINTS", value: "REST/GraphQL", status: "integrated" }
      ]
    }
  },
  protection: {
    agent: {
      name: "NETWORK FIREWALL",
      features: [
        { icon: Shield, label: "FIREWALL_RULES", value: "1,247 active", status: "filtering" },
        { icon: Activity, label: "WEB_FILTERING", value: "20 categories", status: "blocking" },
        { icon: Network, label: "IPS_SIGNATURES", value: "47,892", status: "detecting" }
      ]
    },
    epo: {
      name: "PROTECTION ORCHESTRATOR",
      features: [
        { icon: Database, label: "TRAFFIC_ANALYSIS", value: "DEEP PACKET", status: "inspecting" },
        { icon: Zap, label: "BLOCK_STATISTICS", value: "2.1K/hr", status: "protecting" },
        { icon: Monitor, label: "BANDWIDTH_MON", value: "85% util", status: "monitoring" }
      ]
    },
    cloud: {
      name: "THREAT PREVENTION",
      features: [
        { icon: Activity, label: "URL_REPUTATION", value: "GLOBAL DB", status: "checking" },
        { icon: Shield, label: "DNS_FILTERING", value: "MALICIOUS", status: "blocking" },
        { icon: Database, label: "IP_BLACKLIST", value: "25M entries", status: "maintained" }
      ]
    }
  }
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
                  {mechanismDetails[currentScenario].agent.name}
                </h4>
                <p className="text-muted-foreground mb-4 text-xs uppercase tracking-wider">
                  Workstations • Laptops • Servers
                </p>
                
                {/* Dynamic Technical Status Display */}
                <div className="space-y-2 text-xs">
                  {mechanismDetails[currentScenario].agent.features.map((feature, index) => {
                    const IconComponent = feature.icon;
                    const statusColors = {
                      active: 'text-emerald-400',
                      ready: 'text-blue-400',
                      monitoring: 'text-trellix-orange',
                      detecting: 'text-yellow-400',
                      normal: 'text-emerald-400',
                      enforced: 'text-purple-400',
                      compliant: 'text-emerald-400',
                      clean: 'text-green-400',
                      scheduled: 'text-blue-400',
                      efficient: 'text-emerald-400',
                      safe: 'text-green-400',
                      collecting: 'text-trellix-orange',
                      buffering: 'text-yellow-400',
                      forwarding: 'text-blue-400',
                      filtering: 'text-red-400',
                      blocking: 'text-red-500',
                      optimal: 'text-emerald-400',
                      fast: 'text-green-400'
                    };
                    
                    return (
                      <div key={index} className="flex items-center justify-between bg-background/50 rounded px-2 py-1">
                        <div className="flex items-center space-x-2">
                          <IconComponent className={`w-3 h-3 ${statusColors[feature.status] || 'text-muted-foreground'}`} />
                          <span className="font-mono text-xs">{feature.label}</span>
                        </div>
                        <span className={`font-mono text-xs ${statusColors[feature.status] || 'text-muted-foreground'}`}>
                          {feature.value}
                        </span>
                      </div>
                    );
                  })}
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
                  {mechanismDetails[currentScenario].epo.name}
                </h4>
                <p className="text-muted-foreground mb-4 text-xs uppercase tracking-wider">
                  Central Management Console
                </p>
                
                {/* Dynamic Server Metrics */}
                <div className="space-y-2 text-xs">
                  {mechanismDetails[currentScenario].epo.features.map((feature, index) => {
                    const IconComponent = feature.icon;
                    const statusColors = {
                      active: 'text-emerald-400',
                      optimal: 'text-emerald-400',
                      normal: 'text-blue-400',
                      current: 'text-green-400',
                      fast: 'text-green-400',
                      hybrid: 'text-purple-400',
                      managed: 'text-blue-400',
                      ordered: 'text-trellix-orange',
                      optimized: 'text-emerald-400',
                      controlled: 'text-blue-400',
                      prioritizing: 'text-yellow-400',
                      responsive: 'text-emerald-400',
                      retained: 'text-blue-400',
                      inspecting: 'text-trellix-orange',
                      protecting: 'text-red-400',
                      monitoring: 'text-blue-400'
                    };
                    
                    return (
                      <div key={index} className="flex items-center justify-between bg-background/50 rounded px-2 py-1">
                        <div className="flex items-center space-x-2">
                          <IconComponent className={`w-3 h-3 ${statusColors[feature.status] || 'text-muted-foreground'}`} />
                          <span className="font-mono text-xs">{feature.label}</span>
                        </div>
                        <span className={`font-mono text-xs ${statusColors[feature.status] || 'text-muted-foreground'}`}>
                          {feature.value}
                        </span>
                      </div>
                    );
                  })}
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
                  {mechanismDetails[currentScenario].cloud.name}
                </h4>
                <p className="text-muted-foreground mb-4 text-xs uppercase tracking-wider">
                  Global Threat Intelligence
                </p>
                
                {/* Dynamic Cloud Services Status */}
                <div className="space-y-2 text-xs">
                  {mechanismDetails[currentScenario].cloud.features.map((feature, index) => {
                    const IconComponent = feature.icon;
                    const statusColors = {
                      streaming: 'text-blue-400',
                      learning: 'text-purple-400',
                      available: 'text-emerald-400',
                      analyzing: 'text-yellow-400',
                      training: 'text-purple-400',
                      updated: 'text-emerald-400',
                      synced: 'text-emerald-400',
                      certified: 'text-green-400',
                      logged: 'text-blue-400',
                      continuous: 'text-trellix-orange',
                      processing: 'text-yellow-400',
                      verified: 'text-emerald-400',
                      scalable: 'text-blue-400',
                      integrated: 'text-purple-400',
                      checking: 'text-blue-400',
                      blocking: 'text-red-400',
                      maintained: 'text-emerald-400'
                    };
                    
                    return (
                      <div key={index} className="flex items-center justify-between bg-background/50 rounded px-2 py-1">
                        <div className="flex items-center space-x-2">
                          <IconComponent className={`w-3 h-3 ${statusColors[feature.status] || 'text-muted-foreground'}`} />
                          <span className="font-mono text-xs">{feature.label}</span>
                        </div>
                        <span className={`font-mono text-xs ${statusColors[feature.status] || 'text-muted-foreground'}`}>
                          {feature.value}
                        </span>
                      </div>
                    );
                  })}
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