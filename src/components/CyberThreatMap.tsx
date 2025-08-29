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

// Threat types with colors matching reference image
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
    if (threats.length >= 50) return; // Performance limit
    
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
              <div className="relative w-full h-96 bg-gray-900 rounded-lg overflow-hidden border border-gray-700">
                {/* Threat Map with realistic world map */}
                <svg 
                  viewBox="0 0 900 500" 
                  className="absolute inset-0 w-full h-full"
                  style={{ backgroundColor: '#1a1a1a' }}
                >
                  <defs>
                    {/* Glow filters for threat indicators */}
                    <filter id="threatGlow" x="-100%" y="-100%" width="300%" height="300%">
                      <feGaussianBlur stdDeviation="8" result="coloredBlur"/>
                      <feMerge> 
                        <feMergeNode in="coloredBlur"/>
                        <feMergeNode in="SourceGraphic"/>
                      </feMerge>
                    </filter>
                    
                    <filter id="pulseGlow" x="-200%" y="-200%" width="500%" height="500%">
                      <feGaussianBlur stdDeviation="12" result="bigBlur"/>
                      <feMerge> 
                        <feMergeNode in="bigBlur"/>
                        <feMergeNode in="SourceGraphic"/>
                      </feMerge>
                    </filter>
                  </defs>

                  {/* World Map Background - detailed country boundaries */}
                  <g stroke="#4a5568" strokeWidth="0.5" fill="#2d3748" opacity="0.8">
                    {/* North America */}
                    <path d="M50,100 Q80,90 120,100 Q150,95 180,110 Q200,120 220,140 Q240,160 250,180 Q255,200 250,220 Q240,240 220,250 Q200,255 180,250 Q150,245 120,240 Q80,235 50,230 Q30,220 25,200 Q30,180 40,160 Q45,140 50,120 Z"/>
                    
                    {/* South America */}
                    <path d="M220,280 Q240,270 260,280 Q280,290 290,310 Q295,330 290,350 Q285,370 275,390 Q265,410 250,425 Q235,435 220,430 Q205,425 195,410 Q190,390 195,370 Q200,350 205,330 Q210,310 215,290 Q218,280 220,280 Z"/>
                    
                    {/* Europe */}
                    <path d="M440,180 Q460,175 480,180 Q500,185 520,190 Q540,195 560,200 Q580,205 600,210 L600,240 Q580,245 560,240 Q540,235 520,230 Q500,225 480,220 Q460,215 440,210 Z"/>
                    
                    {/* Africa */}
                    <path d="M480,260 Q500,255 520,265 Q540,275 555,290 Q565,305 560,320 Q555,335 545,350 Q535,365 520,375 Q505,380 490,375 Q475,370 465,355 Q460,340 465,325 Q470,310 475,295 Q478,280 480,260 Z"/>
                    
                    {/* Asia */}
                    <path d="M600,160 Q650,150 700,160 Q750,170 800,180 Q850,190 900,200 L900,280 Q850,290 800,280 Q750,270 700,260 Q650,250 600,240 Z"/>
                    
                    {/* Australia */}
                    <path d="M730,380 Q760,375 790,385 Q820,395 840,410 Q850,425 840,440 Q830,450 810,445 Q790,440 770,435 Q750,430 730,425 Q710,420 700,405 Q695,390 700,375 Q710,370 730,380 Z"/>
                  </g>

                  {/* Subtle grid overlay */}
                  <defs>
                    <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                      <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#374151" strokeWidth="0.3" opacity="0.3"/>
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#grid)" />

                  {/* Active Threat Indicators */}
                  {threats.map((threat) => {
                    const source = COUNTRIES[threat.source];
                    const target = COUNTRIES[threat.target];
                    const progress = Math.min((Date.now() - threat.timestamp) / threat.duration, 1);
                    const opacity = 1 - progress;
                    
                    if (!source || !target || opacity <= 0) return null;

                    const threatColor = THREAT_TYPES[threat.type].color;
                    const size = Math.max(8, threat.severity * 2);
                    
                    return (
                      <g key={threat.id}>
                        {/* Source indicator */}
                        <circle
                          cx={source.x}
                          cy={source.y}
                          r={size + 8}
                          fill={threatColor}
                          opacity={opacity * 0.2}
                          filter="url(#pulseGlow)"
                          className="animate-pulse"
                        />
                        <circle
                          cx={source.x}
                          cy={source.y}
                          r={size}
                          fill={threatColor}
                          opacity={opacity * 0.8}
                          filter="url(#threatGlow)"
                        />
                        
                        {/* Target indicator */}
                        <circle
                          cx={target.x}
                          cy={target.y}
                          r={size + 6}
                          fill={threatColor}
                          opacity={opacity * 0.15}
                          filter="url(#pulseGlow)"
                          className="animate-ping"
                        />
                        <circle
                          cx={target.x}
                          cy={target.y}
                          r={size - 2}
                          fill={threatColor}
                          opacity={opacity * 0.9}
                          filter="url(#threatGlow)"
                        />
                        
                        {/* Attack line (subtle) */}
                        <line
                          x1={source.x}
                          y1={source.y}
                          x2={target.x}
                          y2={target.y}
                          stroke={threatColor}
                          strokeWidth="1"
                          opacity={opacity * 0.3}
                          strokeDasharray="4,4"
                          className="animate-pulse"
                        />
                      </g>
                    );
                  })}

                  {/* Country markers */}
                  {Object.entries(COUNTRIES).map(([country, coords]) => {
                    const activeThreats = threats.filter(t => 
                      t.source === country || t.target === country
                    );
                    const isActive = activeThreats.length > 0;
                    
                    return (
                      <g key={country}>
                        {/* Base indicator */}
                        <circle
                          cx={coords.x}
                          cy={coords.y}
                          r="4"
                          fill={isActive ? "#10b981" : "#6b7280"}
                          opacity="0.8"
                          filter="url(#threatGlow)"
                        />
                        
                        {/* Active glow */}
                        {isActive && (
                          <circle
                            cx={coords.x}
                            cy={coords.y}
                            r="8"
                            fill="#10b981"
                            opacity="0.3"
                            filter="url(#pulseGlow)"
                            className="animate-pulse"
                          />
                        )}
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