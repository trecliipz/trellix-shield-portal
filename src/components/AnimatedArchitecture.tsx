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

// Comprehensive mechanism-specific technical details
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
    },
    details: {
      protocols: ["HTTPS (443)", "SNMP (161)", "WS-Management (5985/5986)"],
      algorithms: ["Exponential Backoff", "Circuit Breaker", "Health Score Calculation"],
      performance: {
        "Agent Response Time": "< 50ms",
        "Data Collection Rate": "450 metrics/sec",
        "Compression Ratio": "4:1",
        "Bandwidth Usage": "2.1 MB/s avg"
      },
      configurations: {
        "Heartbeat Frequency": "Configurable: 5s-300s",
        "Retry Logic": "3 attempts with exponential backoff",
        "Failover Threshold": "3 consecutive failures",
        "Buffer Size": "Local: 10MB, Remote: 100MB"
      }
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
    },
    details: {
      protocols: ["HTTPS (443)", "AMQP (5672)", "MQTT (1883/8883)"],
      algorithms: ["Multi-Vector Analysis", "Behavioral Heuristics", "Machine Learning Classification", "Sandbox Emulation"],
      performance: {
        "Scan Throughput": "15,000 files/sec",
        "Detection Latency": "< 100ms",
        "Memory Usage": "< 512MB",
        "CPU Impact": "< 5% avg"
      },
      configurations: {
        "Scan Sensitivity": "Low/Medium/High/Custom",
        "Exclusion Lists": "Path/Process/Extension based",
        "Quarantine Policy": "Auto/Manual/Disabled",
        "Cloud Lookup": "Real-time reputation checking"
      },
      engines: {
        "Static Analysis": "Signature-based detection",
        "Dynamic Analysis": "Behavioral monitoring",
        "Machine Learning": "Neural network classification",
        "Sandboxing": "Isolated execution environment"
      }
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
    },
    details: {
      protocols: ["HTTPS (8443)", "LDAP/LDAPS (389/636)", "SAML 2.0", "OAuth 2.0"],
      algorithms: ["Policy Conflict Resolution", "Inheritance Chain", "Priority-based Execution", "Delta Deployment"],
      performance: {
        "Deployment Speed": "< 5 minutes globally",
        "Rollback Time": "< 30 seconds",
        "Policy Size": "Average 2KB per rule",
        "Sync Frequency": "Real-time + hourly validation"
      },
      configurations: {
        "Deployment Strategy": "Phased/Immediate/Scheduled",
        "Conflict Resolution": "Last-wins/Priority-based/Manual",
        "Validation Rules": "Schema/Business logic/Dependencies",
        "Override Permissions": "Role-based with approval workflow"
      },
      compliance: {
        "Standards Supported": "SOX, GDPR, PCI-DSS, HIPAA, ISO 27001",
        "Audit Capabilities": "Real-time monitoring, Historical reports",
        "Change Management": "Approval workflows, Version control",
        "Risk Assessment": "Impact analysis, Rollback planning"
      }
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
    },
    details: {
      protocols: ["HTTPS (443)", "FTP/FTPS (21/990)", "BitTorrent", "P2P Distribution"],
      algorithms: ["Delta Compression", "Binary Diff", "Adaptive Bandwidth", "Progressive Download"],
      performance: {
        "Update Size": "Delta: 5-50MB, Full: 2-15GB",
        "Compression Ratio": "15:1 average",
        "Download Speed": "Adaptive to bandwidth",
        "Verification Time": "< 10 seconds"
      },
      configurations: {
        "Update Schedule": "Hourly/Daily/Weekly/Custom",
        "Bandwidth Throttling": "Time-based limits",
        "Staging Groups": "Pilot/Canary/Production waves",
        "Rollback Strategy": "Automatic on failure threshold"
      },
      quality: {
        "Testing Pipeline": "Automated sandbox validation",
        "False Positive Rate": "< 0.001%",
        "Coverage Analysis": "99.97% malware family coverage",
        "Release Process": "Multi-stage validation gates"
      }
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
    },
    details: {
      protocols: ["Syslog (514)", "CEF/LEEF", "REST API (443)", "Kafka (9092)", "Elasticsearch (9200)"],
      algorithms: ["Complex Event Processing", "Machine Learning Clustering", "Anomaly Detection", "Temporal Correlation"],
      performance: {
        "Event Throughput": "100,000 EPS",
        "Query Response": "< 200ms average",
        "Storage Efficiency": "10:1 compression",
        "Real-time Processing": "< 5 second latency"
      },
      configurations: {
        "Correlation Rules": "500+ pre-built, Custom rule engine",
        "Retention Policies": "Hot/Warm/Cold storage tiers",
        "Alert Thresholds": "Configurable severity levels",
        "Integration Points": "SOAR, SIEM, Ticketing systems"
      },
      analytics: {
        "Machine Learning": "Unsupervised clustering, Supervised classification",
        "Behavioral Analytics": "User/Entity baseline modeling",
        "Threat Hunting": "Query engine with threat intel correlation",
        "Forensics": "Timeline reconstruction, Evidence preservation"
      }
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
    },
    details: {
      protocols: ["TCP/UDP Layer 4", "HTTP/HTTPS (80/443)", "DNS (53)", "SMTP (25/587)", "FTP (21)"],
      algorithms: ["Deep Packet Inspection", "Stateful Inspection", "Application Layer Gateway", "Behavioral Analysis"],
      performance: {
        "Throughput": "10 Gbps line rate",
        "Latency": "< 1ms additional",
        "Concurrent Sessions": "2M+ connections",
        "Rule Processing": "100,000 rules/second"
      },
      configurations: {
        "Firewall Modes": "Transparent/Routed/NAT",
        "IPS Sensitivity": "Prevention/Detection/Monitor",
        "Content Filtering": "Category/URL/Content-based",
        "SSL Inspection": "Inbound/Outbound with certificate management"
      },
      protection: {
        "Web Filtering": "90+ categories, Real-time classification",
        "Application Control": "3000+ applications identified",
        "Anti-Malware": "Multi-engine scanning",
        "Data Loss Prevention": "Content inspection and blocking"
      }
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
    <section id="architecture" className="py-20 gradient-bg relative overflow-hidden">
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

          {/* Data Packet Legend */}
          <div className="mt-8 bg-card border border-border rounded-lg p-6 w-full max-w-4xl">
            <h3 className="text-lg font-semibold text-card-foreground mb-4 flex items-center gap-2">
              <Activity className="h-5 w-5 text-trellix-orange" />
              Data Packet Types
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(packetColors).map(([type, colorClass]) => (
                <div key={type} className="flex items-center gap-2">
                  <div className={`w-4 h-4 rounded-full ${colorClass} border border-white/30`} />
                  <span className="text-sm text-muted-foreground">{packetLabels[type as keyof typeof packetLabels]}</span>
                </div>
              ))}
            </div>
          </div>
          
          {/* Dynamic Technical Information */}
          <div className="mt-8 w-full max-w-6xl">
            <div className="bg-gradient-to-br from-card via-card to-secondary/5 border border-border rounded-lg p-6 relative overflow-hidden">
              <div className="absolute inset-0 opacity-5">
                <div className="grid grid-cols-8 grid-rows-8 h-full">
                  {Array.from({length: 64}).map((_, i) => (
                    <div key={i} className="border border-primary/20" />
                  ))}
                </div>
              </div>
              
              <h3 className="text-xl font-semibold text-card-foreground mb-6 flex items-center gap-2 relative z-10">
                <Network className="h-6 w-6 text-trellix-orange" />
                {communicationScenarios[currentScenario].name} - Technical Details
              </h3>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 relative z-10">
                {/* Protocols & Communication */}
                <Card className="bg-gradient-to-br from-emerald-900/20 to-emerald-700/10 border-emerald-500/30">
                  <CardContent className="p-4">
                    <h4 className="text-sm font-semibold text-emerald-300 mb-3 flex items-center gap-2">
                      <Network className="h-4 w-4" />
                      PROTOCOLS & COMMUNICATION
                    </h4>
                    <div className="space-y-2 text-xs">
                      {mechanismDetails[currentScenario].details.protocols.map((protocol, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                          <span className="text-emerald-400 font-mono">{protocol}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
                
                {/* Algorithms & Processing */}
                <Card className="bg-gradient-to-br from-blue-900/20 to-blue-700/10 border-blue-500/30">
                  <CardContent className="p-4">
                    <h4 className="text-sm font-semibold text-blue-300 mb-3 flex items-center gap-2">
                      <Zap className="h-4 w-4" />
                      ALGORITHMS & PROCESSING
                    </h4>
                    <div className="space-y-2 text-xs">
                      {mechanismDetails[currentScenario].details.algorithms.map((algorithm, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
                          <span className="text-blue-400">{algorithm}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
                
                {/* Performance Metrics */}
                <Card className="bg-gradient-to-br from-trellix-orange/20 to-yellow-700/10 border-trellix-orange/30">
                  <CardContent className="p-4">
                    <h4 className="text-sm font-semibold text-trellix-orange mb-3 flex items-center gap-2">
                      <Activity className="h-4 w-4" />
                      PERFORMANCE METRICS
                    </h4>
                    <div className="space-y-2 text-xs">
                      {Object.entries(mechanismDetails[currentScenario].details.performance).map(([key, value]) => (
                        <div key={key} className="flex justify-between items-center">
                          <span className="text-muted-foreground">{key}</span>
                          <span className="text-trellix-orange font-mono">{value}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
                
                {/* Configuration Parameters */}
                <Card className="bg-gradient-to-br from-purple-900/20 to-purple-700/10 border-purple-500/30">
                  <CardContent className="p-4">
                    <h4 className="text-sm font-semibold text-purple-300 mb-3 flex items-center gap-2">
                      <Monitor className="h-4 w-4" />
                      CONFIGURATION PARAMETERS
                    </h4>
                    <div className="space-y-2 text-xs">
                      {Object.entries(mechanismDetails[currentScenario].details.configurations).map(([key, value]) => (
                        <div key={key} className="space-y-1">
                          <div className="text-purple-300 font-medium">{key}</div>
                          <div className="text-muted-foreground ml-2">{value}</div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              {/* Additional detailed sections for specific mechanisms */}
              {currentScenario === 'threat' && mechanismDetails[currentScenario].details.engines && (
                <div className="mt-6">
                  <Card className="bg-gradient-to-br from-red-900/20 to-red-700/10 border-red-500/30">
                    <CardContent className="p-4">
                      <h4 className="text-sm font-semibold text-red-300 mb-3 flex items-center gap-2">
                        <Shield className="h-4 w-4" />
                        DETECTION ENGINES
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                        {Object.entries(mechanismDetails[currentScenario].details.engines!).map(([key, value]) => (
                          <div key={key} className="space-y-1">
                            <div className="text-red-300 font-medium">{key}</div>
                            <div className="text-muted-foreground">{value}</div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
              
              {currentScenario === 'policy' && mechanismDetails[currentScenario].details.compliance && (
                <div className="mt-6">
                  <Card className="bg-gradient-to-br from-green-900/20 to-green-700/10 border-green-500/30">
                    <CardContent className="p-4">
                      <h4 className="text-sm font-semibold text-green-300 mb-3 flex items-center gap-2">
                        <Shield className="h-4 w-4" />
                        COMPLIANCE & GOVERNANCE
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                        {Object.entries(mechanismDetails[currentScenario].details.compliance!).map(([key, value]) => (
                          <div key={key} className="space-y-1">
                            <div className="text-green-300 font-medium">{key}</div>
                            <div className="text-muted-foreground">{value}</div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
              
              {currentScenario === 'signatures' && mechanismDetails[currentScenario].details.quality && (
                <div className="mt-6">
                  <Card className="bg-gradient-to-br from-indigo-900/20 to-indigo-700/10 border-indigo-500/30">
                    <CardContent className="p-4">
                      <h4 className="text-sm font-semibold text-indigo-300 mb-3 flex items-center gap-2">
                        <Database className="h-4 w-4" />
                        QUALITY ASSURANCE
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                        {Object.entries(mechanismDetails[currentScenario].details.quality!).map(([key, value]) => (
                          <div key={key} className="space-y-1">
                            <div className="text-indigo-300 font-medium">{key}</div>
                            <div className="text-muted-foreground">{value}</div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
              
              {currentScenario === 'correlation' && mechanismDetails[currentScenario].details.analytics && (
                <div className="mt-6">
                  <Card className="bg-gradient-to-br from-cyan-900/20 to-cyan-700/10 border-cyan-500/30">
                    <CardContent className="p-4">
                      <h4 className="text-sm font-semibold text-cyan-300 mb-3 flex items-center gap-2">
                        <Activity className="h-4 w-4" />
                        ANALYTICS & INTELLIGENCE
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                        {Object.entries(mechanismDetails[currentScenario].details.analytics!).map(([key, value]) => (
                          <div key={key} className="space-y-1">
                            <div className="text-cyan-300 font-medium">{key}</div>
                            <div className="text-muted-foreground">{value}</div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
              
              {currentScenario === 'protection' && mechanismDetails[currentScenario].details.protection && (
                <div className="mt-6">
                  <Card className="bg-gradient-to-br from-orange-900/20 to-orange-700/10 border-orange-500/30">
                    <CardContent className="p-4">
                      <h4 className="text-sm font-semibold text-orange-300 mb-3 flex items-center gap-2">
                        <Shield className="h-4 w-4" />
                        PROTECTION CAPABILITIES
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                        {Object.entries(mechanismDetails[currentScenario].details.protection!).map(([key, value]) => (
                          <div key={key} className="space-y-1">
                            <div className="text-orange-300 font-medium">{key}</div>
                            <div className="text-muted-foreground">{value}</div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};