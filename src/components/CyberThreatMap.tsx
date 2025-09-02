import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Play, Pause, Shield, AlertTriangle, Zap, Bot, Target } from 'lucide-react';

// More accurate country coordinates for realistic attack visualization
const COUNTRIES = {
  'China': { x: 750, y: 280, name: 'China' },
  'Russia': { x: 700, y: 180, name: 'Russia' },
  'North Korea': { x: 780, y: 260, name: 'North Korea' },
  'Iran': { x: 580, y: 290, name: 'Iran' },
  'United States': { x: 200, y: 250, name: 'United States' },
  'United Kingdom': { x: 480, y: 210, name: 'United Kingdom' },
  'Germany': { x: 510, y: 220, name: 'Germany' },
  'Japan': { x: 820, y: 270, name: 'Japan' },
  'Australia': { x: 820, y: 420, name: 'Australia' },
  'Brazil': { x: 320, y: 380, name: 'Brazil' },
  'India': { x: 670, y: 310, name: 'India' },
  'South Korea': { x: 790, y: 270, name: 'South Korea' },
  'France': { x: 500, y: 230, name: 'France' },
  'Canada': { x: 180, y: 160, name: 'Canada' },
  'Israel': { x: 560, y: 300, name: 'Israel' },
  'Netherlands': { x: 490, y: 215, name: 'Netherlands' },
  'Sweden': { x: 510, y: 190, name: 'Sweden' },
  'Norway': { x: 500, y: 180, name: 'Norway' },
  'Mexico': { x: 220, y: 320, name: 'Mexico' },
  'South Africa': { x: 540, y: 420, name: 'South Africa' },
  'Turkey': { x: 560, y: 270, name: 'Turkey' },
  'Ukraine': { x: 550, y: 210, name: 'Ukraine' },
  'Poland': { x: 530, y: 220, name: 'Poland' },
  'Italy': { x: 510, y: 260, name: 'Italy' },
  'Spain': { x: 470, y: 270, name: 'Spain' }
};

// More accurate world map paths using simplified SVG coordinates
const WORLD_MAP_PATHS = {
  // North America - More accurate shape
  northAmerica: "M80,150 Q100,140 120,145 Q140,140 160,145 Q180,140 200,150 Q220,145 240,155 Q260,150 280,165 Q300,160 320,175 Q340,170 360,185 L360,280 Q340,285 320,280 Q300,285 280,275 Q260,280 240,275 Q220,280 200,275 Q180,280 160,270 Q140,275 120,270 Q100,275 80,265 Z",
  
  // South America - Better proportions
  southAmerica: "M280,320 Q290,315 300,325 Q310,320 320,330 Q330,335 340,350 Q345,370 340,390 Q335,410 330,430 Q325,450 315,465 Q305,480 295,490 Q285,495 275,490 Q265,485 260,470 Q255,455 260,440 Q265,425 270,410 Q275,395 270,380 Q275,365 280,350 Q275,335 280,320 Z",
  
  // Europe - More detailed
  europe: "M460,190 Q480,185 500,190 Q520,185 540,195 Q560,190 580,200 Q600,195 620,205 L620,260 Q600,265 580,260 Q560,265 540,260 Q520,265 500,260 Q480,265 460,260 Z",
  
  // Africa - Better shape
  africa: "M480,280 Q500,275 520,285 Q540,290 560,305 Q570,320 575,340 Q580,360 575,380 Q570,400 565,420 Q560,440 550,455 Q540,470 530,480 Q520,485 510,480 Q500,475 495,460 Q490,445 495,430 Q500,415 505,400 Q510,385 505,370 Q500,355 505,340 Q510,325 505,310 Q500,295 480,280 Z",
  
  // Asia - More accurate
  asia: "M620,180 Q660,170 710,180 Q760,175 810,190 Q860,185 900,200 L900,340 Q860,345 810,340 Q760,345 710,340 Q660,345 620,340 Z",
  
  // Australia - Correct position
  australia: "M760,400 Q790,395 820,405 Q850,410 870,425 Q880,440 870,455 Q860,470 840,465 Q820,470 800,465 Q780,470 760,465 Q740,460 730,445 Q725,430 730,415 Q740,405 760,400 Z"
};

// Threat types with colors and weights
const THREAT_TYPES = {
  'Malware': { color: '#ef4444', weight: 0.4, icon: 'virus' },
  'DDoS': { color: '#f97316', weight: 0.25, icon: 'zap' },
  'Phishing': { color: '#eab308', weight: 0.2, icon: 'mail' },
  'Botnet': { color: '#a855f7', weight: 0.1, icon: 'bot' },
  'APT': { color: '#ec4899', weight: 0.05, icon: 'target' }
};

// Common attack sources and targets based on real cybersecurity data
const ATTACK_SOURCES = ['China', 'Russia', 'North Korea', 'Iran', 'Ukraine'];
const POPULAR_TARGETS = ['United States', 'United Kingdom', 'Germany', 'Japan', 'Australia', 'France', 'Canada', 'Netherlands', 'Sweden'];

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

                {/* Enhanced World Map */}
                <svg 
                  viewBox="0 0 900 500" 
                  className="absolute inset-0 w-full h-full"
                  style={{ filter: 'drop-shadow(0 0 10px hsl(var(--primary) / 0.3))' }}
                >
                  <defs>
                    {/* Gradient definitions for continents */}
                    <linearGradient id="continentGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.1" />
                      <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.05" />
                    </linearGradient>
                    
                    {/* Glow filter for countries */}
                    <filter id="countryGlow" x="-50%" y="-50%" width="200%" height="200%">
                      <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                      <feMerge> 
                        <feMergeNode in="coloredBlur"/>
                        <feMergeNode in="SourceGraphic"/>
                      </feMerge>
                    </filter>
                    
                    {/* Enhanced glow for active threats */}
                    <filter id="threatGlow" x="-100%" y="-100%" width="300%" height="300%">
                      <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
                      <feMerge> 
                        <feMergeNode in="coloredBlur"/>
                        <feMergeNode in="SourceGraphic"/>
                      </feMerge>
                    </filter>
                  </defs>

                  {/* Enhanced continent shapes */}
                  {Object.entries(WORLD_MAP_PATHS).map(([continent, path]) => (
                    <path
                      key={continent}
                      d={path}
                      fill="url(#continentGrad)"
                      stroke="hsl(var(--primary))"
                      strokeWidth="1"
                      opacity="0.4"
                      className="animate-pulse"
                      style={{ 
                        animationDuration: '4s',
                        animationDelay: `${Math.random() * 2}s`
                      }}
                    />
                  ))}
                  
                  {/* Ocean lines for depth */}
                  <g opacity="0.2">
                    <path d="M0,100 Q450,80 900,120" stroke="hsl(var(--primary))" strokeWidth="0.5" fill="none" />
                    <path d="M0,180 Q450,160 900,200" stroke="hsl(var(--primary))" strokeWidth="0.5" fill="none" />
                    <path d="M0,260 Q450,240 900,280" stroke="hsl(var(--primary))" strokeWidth="0.5" fill="none" />
                    <path d="M0,340 Q450,320 900,360" stroke="hsl(var(--primary))" strokeWidth="0.5" fill="none" />
                    <path d="M0,420 Q450,400 900,440" stroke="hsl(var(--primary))" strokeWidth="0.5" fill="none" />
                  </g>
                  
                  {/* Enhanced country markers */}
                  {Object.entries(COUNTRIES).map(([country, coords]) => {
                    const isAttackSource = ATTACK_SOURCES.includes(country);
                    const isPopularTarget = POPULAR_TARGETS.includes(country);
                    
                    return (
                      <g key={country}>
                        {/* Country glow base */}
                        <circle
                          cx={coords.x}
                          cy={coords.y}
                          r="12"
                          fill="hsl(var(--primary))"
                          opacity="0.1"
                          className={isAttackSource ? "animate-pulse" : ""}
                        />
                        
                        {/* Main country marker */}
                        <circle
                          cx={coords.x}
                          cy={coords.y}
                          r="5"
                          fill={isAttackSource ? "#ef4444" : isPopularTarget ? "#10b981" : "hsl(var(--primary))"}
                          opacity="0.8"
                          filter="url(#countryGlow)"
                          className="transition-all duration-300 hover:scale-125"
                        />
                        
                        {/* Inner core */}
                        <circle
                          cx={coords.x}
                          cy={coords.y}
                          r="2"
                          fill="white"
                          opacity="0.9"
                        />
                        
                        {/* Country label */}
                        <text
                          x={coords.x}
                          y={coords.y - 12}
                          fontSize="9"
                          textAnchor="middle"
                          fill="hsl(var(--foreground))"
                          opacity="0.8"
                          className="font-mono text-xs font-medium"
                          style={{ textShadow: '0 0 4px hsl(var(--background))' }}
                        >
                          {country.length > 10 ? country.substring(0, 10) + '...' : country}
                        </text>
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