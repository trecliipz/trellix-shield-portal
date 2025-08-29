import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Play, Pause, Shield, AlertTriangle, Zap, Bot, Target } from 'lucide-react';

// Country coordinates for realistic attack visualization
const COUNTRIES = {
  'China': { x: 740, y: 280, name: 'China' },
  'Russia': { x: 650, y: 200, name: 'Russia' },
  'North Korea': { x: 780, y: 260, name: 'North Korea' },
  'Iran': { x: 580, y: 300, name: 'Iran' },
  'United States': { x: 200, y: 240, name: 'United States' },
  'United Kingdom': { x: 480, y: 220, name: 'United Kingdom' },
  'Germany': { x: 520, y: 230, name: 'Germany' },
  'Japan': { x: 820, y: 270, name: 'Japan' },
  'Australia': { x: 800, y: 450, name: 'Australia' },
  'Brazil': { x: 300, y: 380, name: 'Brazil' },
  'India': { x: 650, y: 320, name: 'India' },
  'South Korea': { x: 790, y: 270, name: 'South Korea' },
  'France': { x: 500, y: 240, name: 'France' },
  'Canada': { x: 180, y: 180, name: 'Canada' },
  'Israel': { x: 560, y: 310, name: 'Israel' }
};

// Threat types with colors and weights
const THREAT_TYPES = {
  'Malware': { color: '#ef4444', weight: 0.4, icon: 'virus' },
  'DDoS': { color: '#f97316', weight: 0.25, icon: 'zap' },
  'Phishing': { color: '#eab308', weight: 0.2, icon: 'mail' },
  'Botnet': { color: '#a855f7', weight: 0.1, icon: 'bot' },
  'APT': { color: '#ec4899', weight: 0.05, icon: 'target' }
};

// Common attack sources (higher probability)
const ATTACK_SOURCES = ['China', 'Russia', 'North Korea', 'Iran'];
const POPULAR_TARGETS = ['United States', 'United Kingdom', 'Germany', 'Japan', 'Australia'];

interface Threat {
  id: string;
  source: string;
  target: string;
  type: keyof typeof THREAT_TYPES;
  severity: number;
  timestamp: number;
  duration: number;
}

interface ThreatActivity {
  timestamp: string;
  source: string;
  target: string;
  type: string;
  severity: number;
}

export const CyberThreatMap: React.FC = () => {
  const [threats, setThreats] = useState<Threat[]>([]);
  const [isPlaying, setIsPlaying] = useState(true);
  const [stats, setStats] = useState({
    totalThreats: 0,
    attacksBlocked: 0,
    countriesAffected: 0,
    activeSessions: 0
  });
  const [recentActivity, setRecentActivity] = useState<ThreatActivity[]>([]);
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const cleanupRef = useRef<NodeJS.Timeout | null>(null);

  // Generate weighted random threat type
  const getRandomThreatType = useCallback((): keyof typeof THREAT_TYPES => {
    const random = Math.random();
    let cumulative = 0;
    
    for (const [type, config] of Object.entries(THREAT_TYPES)) {
      cumulative += config.weight;
      if (random <= cumulative) {
        return type as keyof typeof THREAT_TYPES;
      }
    }
    return 'Malware';
  }, []);

  // Generate realistic attack pairs
  const generateThreat = useCallback((): Threat => {
    const isCommonAttack = Math.random() < 0.7;
    let source: string, target: string;
    
    if (isCommonAttack) {
      source = ATTACK_SOURCES[Math.floor(Math.random() * ATTACK_SOURCES.length)];
      target = POPULAR_TARGETS[Math.floor(Math.random() * POPULAR_TARGETS.length)];
    } else {
      const countries = Object.keys(COUNTRIES);
      source = countries[Math.floor(Math.random() * countries.length)];
      do {
        target = countries[Math.floor(Math.random() * countries.length)];
      } while (target === source);
    }

    const type = getRandomThreatType();
    
    return {
      id: `threat-${Date.now()}-${Math.random()}`,
      source,
      target,
      type,
      severity: Math.floor(Math.random() * 10) + 1,
      timestamp: Date.now(),
      duration: Math.random() * 2000 + 3000 // 3-5 seconds
    };
  }, [getRandomThreatType]);

  // Add new threat
  const addThreat = useCallback(() => {
    if (threats.length >= 150) return; // Performance limit
    
    const newThreat = generateThreat();
    setThreats(prev => [...prev, newThreat]);
    
    // Update recent activity
    setRecentActivity(prev => [
      {
        timestamp: new Date().toLocaleTimeString(),
        source: newThreat.source,
        target: newThreat.target,
        type: newThreat.type,
        severity: newThreat.severity
      },
      ...prev.slice(0, 9) // Keep only last 10
    ]);

    // Update stats
    setStats(prev => ({
      totalThreats: prev.totalThreats + 1,
      attacksBlocked: prev.attacksBlocked + (Math.random() > 0.3 ? 1 : 0),
      countriesAffected: new Set([...Object.keys(COUNTRIES)]).size,
      activeSessions: prev.activeSessions + Math.floor(Math.random() * 3) - 1
    }));
  }, [threats.length, generateThreat]);

  // Clean up expired threats
  const cleanupThreats = useCallback(() => {
    const now = Date.now();
    setThreats(prev => prev.filter(threat => 
      now - threat.timestamp < threat.duration
    ));
  }, []);

  // Animation loop
  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = setInterval(() => {
        addThreat();
      }, Math.random() * 1000 + 500); // 500-1500ms intervals

      cleanupRef.current = setInterval(cleanupThreats, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (cleanupRef.current) clearInterval(cleanupRef.current);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (cleanupRef.current) clearInterval(cleanupRef.current);
    };
  }, [isPlaying, addThreat, cleanupThreats]);

  // Initialize stats
  useEffect(() => {
    setStats({
      totalThreats: 847512,
      attacksBlocked: 234891,
      countriesAffected: Object.keys(COUNTRIES).length,
      activeSessions: 1247
    });
  }, []);

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const getThreatIcon = (type: string) => {
    switch (type) {
      case 'Malware': return <Shield className="h-3 w-3" />;
      case 'DDoS': return <Zap className="h-3 w-3" />;
      case 'Phishing': return <AlertTriangle className="h-3 w-3" />;
      case 'Botnet': return <Bot className="h-3 w-3" />;
      case 'APT': return <Target className="h-3 w-3" />;
      default: return <Shield className="h-3 w-3" />;
    }
  };

  return (
    <div className="w-full space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-primary mb-4">
          Global Cyber Threat Intelligence
        </h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Real-time visualization of global cyber threats with advanced analytics and behavioral pattern recognition
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Map Visualization */}
        <div className="lg:col-span-3">
          <Card className="glass-header border-primary/20">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl">Live Threat Map</CardTitle>
                <div className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${isPlaying ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`} />
                  <span className="text-sm text-muted-foreground">
                    {isPlaying ? 'Live' : 'Paused'}
                  </span>
                  <Button
                    onClick={togglePlayPause}
                    size="sm"
                    variant="outline"
                    className="ml-2"
                  >
                    {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="relative w-full h-96 bg-gradient-to-br from-background to-muted/20 rounded-lg overflow-hidden border border-primary/10">
                {/* Grid overlay */}
                <div className="absolute inset-0 opacity-20">
                  <svg width="100%" height="100%">
                    <defs>
                      <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                        <path d="M 20 0 L 0 0 0 20" fill="none" stroke="currentColor" strokeWidth="0.5"/>
                      </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#grid)" />
                  </svg>
                </div>

                {/* World map simplified outline */}
                <svg 
                  viewBox="0 0 900 500" 
                  className="absolute inset-0 w-full h-full"
                  style={{ filter: 'drop-shadow(0 0 10px rgba(59, 130, 246, 0.3))' }}
                >
                  {/* Simplified continent outlines */}
                  <path 
                    d="M150,200 Q200,180 250,200 Q300,190 350,210 Q400,200 450,220 Q500,210 550,230 Q600,220 650,240 Q700,230 750,250 Q800,240 850,260"
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="1" 
                    opacity="0.3"
                  />
                  <path 
                    d="M180,350 Q230,330 280,340 Q330,335 380,345 Q430,340 480,350"
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="1" 
                    opacity="0.3"
                  />
                  
                  {/* Country markers */}
                  {Object.entries(COUNTRIES).map(([country, coords]) => (
                    <g key={country}>
                      <circle
                        cx={coords.x}
                        cy={coords.y}
                        r="4"
                        fill="currentColor"
                        opacity="0.6"
                        className="pulse-primary"
                      />
                      <text
                        x={coords.x}
                        y={coords.y - 8}
                        fontSize="10"
                        textAnchor="middle"
                        fill="currentColor"
                        opacity="0.7"
                        className="font-mono text-xs"
                      >
                        {country.length > 8 ? country.substring(0, 8) + '...' : country}
                      </text>
                    </g>
                  ))}

                  {/* Active threats */}
                  {threats.map((threat) => {
                    const source = COUNTRIES[threat.source];
                    const target = COUNTRIES[threat.target];
                    const progress = Math.min((Date.now() - threat.timestamp) / threat.duration, 1);
                    
                    if (!source || !target) return null;

                    return (
                      <g key={threat.id}>
                        {/* Attack line */}
                        <line
                          x1={source.x}
                          y1={source.y}
                          x2={target.x}
                          y2={target.y}
                          stroke={THREAT_TYPES[threat.type].color}
                          strokeWidth="2"
                          opacity={1 - progress}
                          style={{
                            filter: `drop-shadow(0 0 4px ${THREAT_TYPES[threat.type].color})`,
                            strokeDasharray: '5,5',
                            strokeDashoffset: -progress * 20
                          }}
                        />
                        
                        {/* Moving pulse */}
                        <circle
                          cx={source.x + (target.x - source.x) * progress}
                          cy={source.y + (target.y - source.y) * progress}
                          r={Math.max(3, threat.severity / 2)}
                          fill={THREAT_TYPES[threat.type].color}
                          opacity={1 - progress}
                          style={{
                            filter: `drop-shadow(0 0 8px ${THREAT_TYPES[threat.type].color})`
                          }}
                        />
                        
                        {/* Source glow */}
                        <circle
                          cx={source.x}
                          cy={source.y}
                          r="8"
                          fill={THREAT_TYPES[threat.type].color}
                          opacity={0.3 * (1 - progress)}
                          className="animate-ping"
                        />
                      </g>
                    );
                  })}
                </svg>
              </div>

              {/* Threat Type Legend */}
              <div className="mt-4 flex flex-wrap gap-2">
                {Object.entries(THREAT_TYPES).map(([type, config]) => (
                  <Badge key={type} variant="outline" className="flex items-center space-x-1">
                    <div 
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: config.color }}
                    />
                    <span>{type}</span>
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar with Stats and Activity */}
        <div className="space-y-6">
          {/* Live Statistics */}
          <Card className="glass-header border-primary/20">
            <CardHeader>
              <CardTitle className="text-lg">Live Statistics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">
                    {stats.totalThreats.toLocaleString()}
                  </div>
                  <div className="text-xs text-muted-foreground">Total Threats</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-500">
                    {stats.attacksBlocked.toLocaleString()}
                  </div>
                  <div className="text-xs text-muted-foreground">Blocked</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-500">
                    {stats.countriesAffected}
                  </div>
                  <div className="text-xs text-muted-foreground">Countries</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-500">
                    {stats.activeSessions.toLocaleString()}
                  </div>
                  <div className="text-xs text-muted-foreground">Active</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity Feed */}
          <Card className="glass-header border-primary/20">
            <CardHeader>
              <CardTitle className="text-lg">Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-80 overflow-y-auto custom-scrollbar">
                {recentActivity.map((activity, index) => (
                  <div 
                    key={index}
                    className="flex items-center justify-between p-2 rounded-lg bg-muted/20 hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-center space-x-2 flex-1 min-w-0">
                      <div className="flex-shrink-0">
                        {getThreatIcon(activity.type)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-medium truncate">
                          {activity.source} → {activity.target}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {activity.type} • Lvl {activity.severity}
                        </div>
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground flex-shrink-0">
                      {activity.timestamp}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};