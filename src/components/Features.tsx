
import React from 'react';
import { Shield, Users, Activity, Lock, AlertTriangle, CheckCircle, Download, Calendar, RefreshCw, Brain, Zap, Target, Bot, Heart, Globe, Cpu, Settings } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AgentCompatibility } from './AgentCompatibility';
import { MLDashboard } from './MLDashboard';
import { CyberAttacksSection } from './CyberAttacksSection';
import { CyberThreatMap } from './CyberThreatMap';
import { useSecurityUpdates, normalizeUpdateType } from '@/hooks/useSecurityUpdates';
import { useToast } from '@/hooks/use-toast';

const features = [
  {
    icon: <Shield className="h-12 w-12" />,
    title: "Advanced Threat Detection", 
    description: "AI-powered detection with neural networks analyzing behavioral patterns and zero-day threats in real-time."
  },
  {
    icon: <Brain className="h-12 w-12" />,
    title: "AI Behavioral Analysis",
    description: "Deep learning models continuously monitor user and system behavior to detect sophisticated attack patterns."
  },
  {
    icon: <Bot className="h-12 w-12" />,
    title: "Neural Network Classification",
    description: "Advanced machine learning algorithms classify and categorize threats with 98%+ accuracy rates."
  },
  {
    icon: <Zap className="h-12 w-12" />,
    title: "Predictive Analytics",
    description: "ML-driven forecasting identifies potential security threats before they manifest into actual attacks."
  },
  {
    icon: <Activity className="h-12 w-12" />,
    title: "Automated Response Intelligence",
    description: "AI-powered incident response with automated remediation based on machine learning recommendations."
  },
  {
    icon: <Target className="h-12 w-12" />,
    title: "Real-time ML Processing",
    description: "Sub-second threat analysis using optimized neural networks for immediate threat classification."
  },
  {
    icon: <Users className="h-12 w-12" />,
    title: "Centralized ML Management",
    description: "Unified console for managing AI models, training data, and machine learning policies across endpoints."
  },
  {
    icon: <Lock className="h-12 w-12" />,
    title: "Compliance & ML Auditing", 
    description: "Comprehensive ML model auditing and compliance reporting for AI-driven security decisions."
  }
];

const Features = (): JSX.Element => {
  const { updates, isLoading, error, triggerUpdateFetch, stats } = useSecurityUpdates();
  const { toast } = useToast();

  // Helper functions
  const formatFileSize = (bytes: number): string => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const getPlatformIcon = (platform: string): React.ReactNode => {
    if (platform.toLowerCase().includes('windows')) return '🪟';
    if (platform.toLowerCase().includes('linux')) return '🐧';
    if (platform.toLowerCase().includes('mac')) return '🍎';
    if (platform.toLowerCase().includes('medical')) return '🏥';
    if (platform.toLowerCase().includes('healthcare')) return '⚕️';
    if (platform.toLowerCase().includes('gateway')) return '🌐';
    if (platform.toLowerCase().includes('email')) return '📧';
    if (platform.toLowerCase().includes('server')) return '🖥️';
    if (platform.toLowerCase().includes('tie')) return '🔗';
    if (platform.toLowerCase().includes('exploit')) return '🛡️';
    return '💻';
  };

  const getCategoryIcon = (type: string, updateCategory?: string) => {
    const normalizedType = normalizeUpdateType(type, updateCategory);
    switch (normalizedType) {
      case 'DATV3': return <Zap className="h-4 w-4 text-primary" />;
      case 'AMCore': return <Cpu className="h-4 w-4 text-purple-600" />;
      case 'Engine': return <Settings className="h-4 w-4 text-indigo-600" />;
      case 'Exploit Prevention': return <Shield className="h-4 w-4 text-orange-600" />;
      case 'EPO': return <Globe className="h-4 w-4 text-green-600" />;
      case 'TIE Intelligence': return <Brain className="h-4 w-4 text-blue-600" />;
      case 'MEDDAT': return <Heart className="h-4 w-4 text-red-600" />;
      default: return <Lock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getUpdateDescription = (type: string, updateCategory?: string): string => {
    const normalizedType = normalizeUpdateType(type, updateCategory);
    const descriptions: Record<string, string> = {
      'DATV3': 'Next-generation V3 virus definition files with enhanced detection capabilities',
      'AMCore': 'Advanced malware core content with behavioral analysis patterns',
      'Engine': 'Core scanning engine with latest detection capabilities',
      'Exploit Prevention': 'Zero-day exploit protection rules and vulnerability shields',
      'EPO': 'ePO management and policy updates',
      'TIE Intelligence': 'Global threat intelligence feeds with real-time reputation data',
      'MEDDAT': 'Specialized threat definitions for medical device security',
      'Content': 'General content updates and improvements'
    };
    return descriptions[normalizedType] || 'Security update package';
  };

  // Group updates by normalized type and show only most recent for each platform
  const groupedUpdates = React.useMemo(() => {
    const groups: { [key: string]: any } = {};
    
    updates.forEach(update => {
      const normalizedType = normalizeUpdateType(update.type, update.update_category);
      
      if (!groups[normalizedType]) {
        groups[normalizedType] = {
          type: normalizedType,
          urgency: update.is_recommended ? 'critical' : 'important',
          category: update.update_category,
          platforms: new Map(),
          description: getUpdateDescription(update.type, update.update_category),
          icon: getCategoryIcon(update.type, update.update_category)
        };
      }

      const isNew = new Date(update.release_date) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const platformKey = update.platform || 'All Platforms';
      
      const platformData = {
        name: platformKey,
        version: update.version,
        date: new Date(update.release_date).toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric', 
          year: 'numeric' 
        }),
        releaseDate: new Date(update.release_date),
        size: formatFileSize(update.file_size),
        icon: getPlatformIcon(platformKey),
        status: isNew ? 'new' : update.is_recommended ? 'updated' : 'stable',
        criticality: update.criticality_level
      };

      // Only keep the most recent update for each platform
      const existing = groups[normalizedType].platforms.get(platformKey);
      if (!existing || platformData.releaseDate > existing.releaseDate) {
        groups[normalizedType].platforms.set(platformKey, platformData);
      }
    });

    // Convert platforms Map to array and sort by priority
    Object.values(groups).forEach((group: any) => {
      group.platforms = Array.from(group.platforms.values());
    });

    const priority = { 
      'DATV3': 1, 
      'AMCore': 2, 
      'Engine': 3,
      'Exploit Prevention': 4,
      'MEDDAT': 5,
      'TIE Intelligence': 6
    };
    
    return Object.values(groups).sort((a: any, b: any) => 
      (priority[a.type as keyof typeof priority] || 99) - (priority[b.type as keyof typeof priority] || 99)
    );
  }, [updates]);

  const handleRefresh = async () => {
    await triggerUpdateFetch();
  };

  return (
    <div className="py-20 bg-gradient-to-br from-background via-muted/20 to-background">
      <div className="container mx-auto px-4 lg:px-8">
        <h2 className="text-4xl font-bold text-center text-primary mb-12">
          Enterprise Security Features
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          {features.map((feature, index) => (
            <Card 
              key={index} 
              className="modern-card text-center group hover:shadow-xl hover:bg-gradient-to-br hover:from-card hover:to-muted/10 transition-all duration-500"
            >
              <CardContent className="p-6">
                <div className="text-primary mb-4 flex justify-center transition-all duration-300 group-hover:scale-110 group-hover:text-primary group-hover:drop-shadow-lg">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-card-foreground mb-3 group-hover:text-primary transition-colors duration-300">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed group-hover:text-foreground transition-colors duration-300">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* ML Dashboard Section */}
        <div className="mb-16">
          <MLDashboard />
        </div>

        {/* Agent Compatibility Section */}
        <div className="mb-16">
          <AgentCompatibility />
        </div>

        {/* Cyber Threat Map */}
        <div className="mb-16">
          <CyberThreatMap />
        </div>

        {/* Cyber Attacks Section */}
        <CyberAttacksSection />

        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold text-primary">
              Latest Security Updates by Platform
            </h2>
            <p className="text-muted-foreground mt-2">
              {stats.total} total updates • {stats.critical} critical • {stats.recent} recent
            </p>
          </div>
          <Button 
            onClick={handleRefresh} 
            disabled={isLoading}
            variant="outline"
            className="flex items-center space-x-2"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh Updates</span>
          </Button>
        </div>
        
        {error && (
          <Card className="mb-8 border-destructive">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2 text-destructive">
                <AlertTriangle className="h-5 w-5" />
                <span className="font-medium">Connection Issue</span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Failed to load security updates. Please try again.
              </p>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleRefresh}
                className="mt-2"
              >
                Retry
              </Button>
            </CardContent>
          </Card>
        )}
        
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {groupedUpdates.map((update, index) => (
              <Card key={index} className="modern-card group">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <h3 className="text-xl font-semibold text-card-foreground">
                        {update.type}
                      </h3>
                      {update.icon}
                    </div>
                    <div className="flex items-center space-x-2">
                      {update.urgency === 'critical' && (
                        <Badge variant="destructive" className="flex items-center space-x-1">
                          <AlertTriangle className="h-3 w-3" />
                          <span>Critical</span>
                        </Badge>
                      )}
                      {update.urgency === 'important' && (
                        <Badge variant="default" className="flex items-center space-x-1">
                          <Calendar className="h-3 w-3" />
                          <span>Important</span>
                        </Badge>
                      )}
                      {update.type === 'AMCore' && (
                        <Badge variant="secondary" className="flex items-center space-x-1">
                          <Cpu className="h-3 w-3" />
                          <span>AMCore</span>
                        </Badge>
                      )}
                    </div>
                  </div>
                  <p className="text-muted-foreground text-sm mb-4">
                    {update.description}
                  </p>
                  
                  <div className="space-y-4">
                    {update.platforms.map((platform, platformIndex) => (
                      <div key={platformIndex} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-all duration-300 hover:scale-[1.02] border border-transparent hover:border-primary/20">
                        <div className="flex items-center space-x-3">
                         <div className="flex items-center space-x-2">
                           <span className="text-lg">{platform.icon}</span>
                           <span className="font-medium text-card-foreground">{platform.name}</span>
                           {platform.criticality && (
                             <Badge 
                               variant={platform.criticality === 'critical' ? 'destructive' : 
                                       platform.criticality === 'high' ? 'secondary' : 'outline'}
                               className="text-xs"
                             >
                               {platform.criticality}
                             </Badge>
                           )}
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
                          <div className="flex items-center space-x-2">
                            <span className="text-xs text-muted-foreground font-mono">{platform.version}</span>
                            {update.type === 'V3 Virus Definition Files' && (
                              <Badge variant="outline" className="text-xs">V3</Badge>
                            )}
                            {update.type === 'Medical Device DAT Files' && (
                              <Badge variant="destructive" className="text-xs">MED</Badge>
                            )}
                            {update.type === 'TIE Intelligence Updates' && (
                              <Badge variant="outline" className="text-xs">INTEL</Badge>
                            )}
                            {update.type === 'Exploit Prevention Content' && (
                              <Badge variant="destructive" className="text-xs">EP</Badge>
                            )}
                          </div>
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
        )}
      </div>
    </div>
  );
};

export { Features };
