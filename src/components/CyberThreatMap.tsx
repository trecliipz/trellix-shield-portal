import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Play, Pause, Shield, AlertTriangle, Zap, Bot, Target } from 'lucide-react';

// More accurate country coordinates for realistic attack visualization
const COUNTRIES = {
  'China': { x: 720, y: 260, name: 'China' },
  'Russia': { x: 680, y: 180, name: 'Russia' },
  'North Korea': { x: 750, y: 250, name: 'North Korea' },
  'Iran': { x: 600, y: 280, name: 'Iran' },
  'United States': { x: 220, y: 260, name: 'United States' },
  'United Kingdom': { x: 490, y: 200, name: 'United Kingdom' },
  'Germany': { x: 510, y: 210, name: 'Germany' },
  'Japan': { x: 780, y: 270, name: 'Japan' },
  'Australia': { x: 760, y: 400, name: 'Australia' },
  'Brazil': { x: 320, y: 360, name: 'Brazil' },
  'India': { x: 650, y: 300, name: 'India' },
  'South Korea': { x: 760, y: 260, name: 'South Korea' },
  'France': { x: 500, y: 220, name: 'France' },
  'Canada': { x: 200, y: 160, name: 'Canada' },
  'Israel': { x: 570, y: 290, name: 'Israel' }
};

// World map paths for better visualization
const WORLD_MAP_PATHS = {
  // North America
  northAmerica: "M100,150 Q120,140 140,150 Q160,145 180,150 Q200,140 220,150 Q240,145 260,160 Q280,155 300,170 Q320,165 340,180 L340,220 Q320,225 300,220 Q280,225 260,230 Q240,235 220,240 Q200,245 180,240 Q160,245 140,240 Q120,245 100,240 Z",
  
  // South America
  southAmerica: "M280,320 Q290,315 300,320 Q310,315 320,325 Q330,330 335,345 Q340,360 335,380 Q330,400 325,420 Q320,440 310,455 Q300,470 290,480 Q280,485 270,480 Q260,475 255,460 Q250,445 255,430 Q260,415 265,400 Q270,385 275,370 Q280,355 285,340 Q280,325 280,320 Z",
  
  // Europe
  europe: "M480,200 Q500,195 520,200 Q540,195 560,205 Q580,200 600,210 L600,250 Q580,255 560,250 Q540,255 520,250 Q500,255 480,250 Z",
  
  // Africa
  africa: "M500,280 Q520,275 540,285 Q560,290 575,305 Q580,320 575,340 Q570,360 565,380 Q560,400 550,415 Q540,430 530,440 Q520,445 510,440 Q500,435 495,420 Q490,405 495,390 Q500,375 505,360 Q510,345 505,330 Q500,315 500,300 Q500,285 500,280 Z",
  
  // Asia
  asia: "M600,200 Q650,190 700,200 Q750,195 800,210 Q850,205 900,220 L900,320 Q850,325 800,320 Q750,325 700,320 Q650,325 600,320 Z",
  
  // Australia
  australia: "M750,420 Q780,415 810,425 Q840,430 860,445 Q870,460 860,475 Q850,485 830,480 Q810,485 790,480 Q770,485 750,480 Q730,475 720,460 Q715,445 720,430 Q730,420 750,420 Z"
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
                {/* World Map - Flat Mercator Projection */}
                <svg 
                  viewBox="0 0 900 500" 
                  className="absolute inset-0 w-full h-full"
                  style={{ filter: 'drop-shadow(0 0 10px hsl(var(--primary) / 0.3))' }}
                >
                  <defs>
                    {/* Gradient for highlighted countries */}
                    <linearGradient id="countryHighlight" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.3" />
                      <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.1" />
                    </linearGradient>
                    
                    {/* Glow filter for countries */}
                    <filter id="countryGlow" x="-50%" y="-50%" width="200%" height="200%">
                      <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                      <feMerge> 
                        <feMergeNode in="coloredBlur"/>
                        <feMergeNode in="SourceGraphic"/>
                      </feMerge>
                    </filter>
                  </defs>

                  {/* More Accurate World Map Continents */}
                  <g opacity="0.4" stroke="hsl(var(--primary))" strokeWidth="1.5" fill="hsl(var(--muted))">
                    {/* North America - More accurate shape */}
                    <path d="M60,120 Q80,110 120,120 Q150,115 180,130 Q200,125 230,140 Q250,135 270,150 Q290,145 310,160 L315,180 Q320,200 315,220 Q310,240 300,260 L280,270 Q260,275 240,270 Q220,275 200,270 Q180,275 160,270 Q140,275 120,270 Q100,275 80,270 Q60,275 50,260 Q45,240 50,220 Q55,200 60,180 Q65,160 60,140 Q58,130 60,120 Z" />
                    
                    {/* South America - More accurate shape */}
                    <path d="M280,320 Q290,315 310,325 Q320,330 325,345 Q330,360 335,380 Q340,400 335,420 Q330,440 325,460 Q320,475 310,485 Q300,490 290,485 Q280,490 270,485 Q260,490 250,480 Q245,470 250,450 Q255,430 260,410 Q265,390 270,370 Q275,350 280,330 Q282,325 280,320 Z" />
                    
                    {/* Europe - More detailed */}
                    <path d="M460,180 Q480,175 500,185 Q520,180 540,190 Q560,185 580,195 Q590,200 595,215 Q590,230 585,245 Q580,260 570,270 Q560,275 540,270 Q520,275 500,270 Q480,275 460,270 Q450,265 455,250 Q460,235 465,220 Q470,205 465,190 Q462,185 460,180 Z" />
                    
                    {/* Africa - More realistic outline */}
                    <path d="M480,280 Q500,275 520,285 Q540,290 560,300 Q575,310 580,325 Q585,340 580,355 Q575,370 570,385 Q565,400 560,415 Q555,430 545,440 Q535,445 525,440 Q515,445 505,440 Q495,445 485,435 Q480,425 485,410 Q490,395 495,380 Q500,365 495,350 Q490,335 485,320 Q480,305 475,290 Q478,285 480,280 Z" />
                    
                    {/* Asia - Better proportions */}
                    <path d="M600,120 Q650,110 700,125 Q750,120 800,135 Q830,140 850,155 Q860,170 855,185 Q850,200 845,215 Q840,230 835,245 Q830,260 825,275 Q820,290 815,305 Q810,320 805,335 Q800,350 790,360 Q780,365 770,360 Q760,365 750,360 Q740,365 730,360 Q720,365 710,360 Q700,365 690,360 Q680,365 670,360 Q660,365 650,360 Q640,365 630,360 Q620,365 610,355 Q605,345 610,330 Q615,315 620,300 Q625,285 620,270 Q615,255 620,240 Q625,225 630,210 Q635,195 630,180 Q625,165 620,150 Q615,135 610,125 Q605,120 600,120 Z" />
                    
                    {/* Australia - Better shape */}
                    <path d="M720,380 Q750,375 780,385 Q810,390 830,405 Q840,420 835,435 Q830,450 820,460 Q810,465 800,460 Q790,465 780,460 Q770,465 760,460 Q750,465 740,460 Q730,465 720,455 Q715,445 720,430 Q725,415 730,400 Q735,385 730,385 Q725,380 720,380 Z" />
                  </g>

                  {/* Grid lines for map projection */}
                  <g opacity="0.2" stroke="hsl(var(--primary))" strokeWidth="0.5" fill="none">
                    {/* Longitude lines */}
                    <line x1="150" y1="50" x2="150" y2="480" />
                    <line x1="300" y1="50" x2="300" y2="480" />
                    <line x1="450" y1="50" x2="450" y2="480" />
                    <line x1="600" y1="50" x2="600" y2="480" />
                    <line x1="750" y1="50" x2="750" y2="480" />
                    
                    {/* Latitude lines */}
                    <line x1="50" y1="150" x2="850" y2="150" />
                    <line x1="50" y1="250" x2="850" y2="250" />
                    <line x1="50" y1="350" x2="850" y2="350" />
                  </g>
                  
                  {/* Highlighted Countries */}
                  {Object.entries(COUNTRIES).map(([country, coords]) => {
                    const highlightedCountries = [
                      'Canada', 'United States', 'Brazil', 'United Kingdom', 
                      'Germany', 'France', 'Iran', 'Israel', 'Russia', 
                      'India', 'China', 'Australia', 'North Korea', 'Japan'
                    ];
                    
                    if (!highlightedCountries.includes(country)) return null;
                    
                    return (
                      <g key={country}>
                        {/* Country highlight area */}
                        <rect
                          x={coords.x - 20}
                          y={coords.y - 15}
                          width="40"
                          height="30"
                          fill="url(#countryHighlight)"
                          stroke="hsl(var(--primary))"
                          strokeWidth="1"
                          rx="4"
                          className="animate-pulse"
                          style={{ 
                            animationDuration: '3s',
                            animationDelay: `${Math.random() * 2}s`
                          }}
                        />
                        
                        {/* Main country marker */}
                        <circle
                          cx={coords.x}
                          cy={coords.y}
                          r="6"
                          fill="hsl(var(--primary))"
                          opacity="0.9"
                          filter="url(#countryGlow)"
                          className="transition-all duration-300 hover:scale-125 cursor-pointer"
                        />
                        
                        {/* Inner core */}
                        <circle
                          cx={coords.x}
                          cy={coords.y}
                          r="3"
                          fill="white"
                          opacity="1"
                        />
                        
                        {/* Country label */}
                        <text
                          x={coords.x}
                          y={coords.y - 25}
                          fontSize="10"
                          textAnchor="middle"
                          fill="hsl(var(--foreground))"
                          opacity="0.9"
                          className="font-mono text-xs font-bold"
                          style={{ 
                            textShadow: '0 0 4px hsl(var(--background))',
                            filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.3))'
                          }}
                        >
                          {country}
                        </text>
                        
                        {/* Connection lines to show relationships */}
                        <line
                          x1={coords.x}
                          y1={coords.y + 6}
                          x2={coords.x}
                          y2={coords.y + 15}
                          stroke="hsl(var(--primary))"
                          strokeWidth="2"
                          opacity="0.5"
                        />
                      </g>
                    );
                  })}

                  {/* Active threats with enhanced animations */}
                  {threats.map((threat) => {
                    const source = COUNTRIES[threat.source];
                    const target = COUNTRIES[threat.target];
                    const progress = Math.min((Date.now() - threat.timestamp) / threat.duration, 1);
                    const fadeProgress = 1 - Math.pow(progress, 2); // Smoother fade
                    
                    if (!source || !target) return null;

                    // Calculate curve for more realistic attack paths
                    const midX = (source.x + target.x) / 2;
                    const midY = (source.y + target.y) / 2 - 30; // Arc upward
                    const currentX = source.x + (target.x - source.x) * progress;
                    const currentY = source.y + (target.y - source.y) * progress - 30 * Math.sin(Math.PI * progress);

                    return (
                      <g key={threat.id}>
                        {/* Background glow line */}
                        <path
                          d={`M ${source.x},${source.y} Q ${midX},${midY} ${target.x},${target.y}`}
                          fill="none"
                          stroke={THREAT_TYPES[threat.type].color}
                          strokeWidth="6"
                          opacity={fadeProgress * 0.2}
                          filter="url(#threatGlow)"
                        />
                        
                        {/* Main attack line with curve */}
                        <path
                          d={`M ${source.x},${source.y} Q ${midX},${midY} ${target.x},${target.y}`}
                          fill="none"
                          stroke={THREAT_TYPES[threat.type].color}
                          strokeWidth="2"
                          opacity={fadeProgress}
                          style={{
                            filter: `drop-shadow(0 0 6px ${THREAT_TYPES[threat.type].color})`,
                            strokeDasharray: '8,4',
                            strokeDashoffset: -progress * 40,
                            transition: 'all 0.1s ease-out'
                          }}
                        />
                        
                        {/* Moving threat pulse with trail */}
                        <g>
                          {/* Pulse trail */}
                          {[0.8, 0.6, 0.4, 0.2].map((trailProgress, index) => {
                            const trailPos = Math.max(0, progress - trailProgress * 0.1);
                            const trailX = source.x + (target.x - source.x) * trailPos;
                            const trailY = source.y + (target.y - source.y) * trailPos - 30 * Math.sin(Math.PI * trailPos);
                            
                            return (
                              <circle
                                key={index}
                                cx={trailX}
                                cy={trailY}
                                r={Math.max(1, (threat.severity / 3) * trailProgress)}
                                fill={THREAT_TYPES[threat.type].color}
                                opacity={fadeProgress * trailProgress * 0.6}
                                style={{
                                  filter: `drop-shadow(0 0 4px ${THREAT_TYPES[threat.type].color})`
                                }}
                              />
                            );
                          })}
                          
                          {/* Main moving pulse */}
                          <circle
                            cx={currentX}
                            cy={currentY}
                            r={Math.max(4, threat.severity / 1.5)}
                            fill={THREAT_TYPES[threat.type].color}
                            opacity={fadeProgress}
                            filter="url(#threatGlow)"
                            style={{
                              animation: 'pulse 0.5s ease-in-out infinite alternate'
                            }}
                          />
                          
                          {/* Core pulse */}
                          <circle
                            cx={currentX}
                            cy={currentY}
                            r={Math.max(2, threat.severity / 3)}
                            fill="white"
                            opacity={fadeProgress * 0.9}
                          />
                        </g>
                        
                        {/* Enhanced source indicator */}
                        <g>
                          <circle
                            cx={source.x}
                            cy={source.y}
                            r="15"
                            fill={THREAT_TYPES[threat.type].color}
                            opacity={fadeProgress * 0.15}
                            className="animate-ping"
                            style={{ animationDuration: '1s' }}
                          />
                          <circle
                            cx={source.x}
                            cy={source.y}
                            r="10"
                            fill={THREAT_TYPES[threat.type].color}
                            opacity={fadeProgress * 0.25}
                            className="animate-ping"
                            style={{ animationDuration: '0.5s', animationDelay: '0.25s' }}
                          />
                        </g>
                        
                        {/* Enhanced target indicator */}
                        {progress > 0.8 && (
                          <g>
                            <circle
                              cx={target.x}
                              cy={target.y}
                              r="12"
                              fill={THREAT_TYPES[threat.type].color}
                              opacity={fadeProgress * 0.3}
                              className="animate-pulse"
                            />
                            <circle
                              cx={target.x}
                              cy={target.y}
                              r="8"
                              fill="white"
                              opacity={fadeProgress * 0.8}
                              className="animate-ping"
                              style={{ animationDuration: '0.3s' }}
                            />
                          </g>
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