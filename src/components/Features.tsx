
import React, { useState, useEffect } from 'react';
import { Shield, Users, Activity, Lock, AlertTriangle, CheckCircle, Download, Calendar, RefreshCw, Brain, Zap, Target, Bot, Heart, Globe } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { AgentCompatibility } from './AgentCompatibility';
import { MLDashboard } from './MLDashboard';
import { CyberAttacksSection } from './CyberAttacksSection';
import { useErrorHandling } from '@/hooks/useErrorHandling';
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

interface SecurityUpdateData {
  type: string;
  urgency: string;
  platforms: Array<{
    name: string;
    version: string;
    date: string;
    size: string;
    icon: React.ReactNode;
    status: string;
    criticality?: string;
  }>;
  description: string;
  frequency: string;
}

const Features = (): JSX.Element => {
  const [securityUpdates, setSecurityUpdates] = useState<SecurityUpdateData[]>([]);
  const [loading, setLoading] = useState(true);
  const { errorState, handleError, retryOperation, clearError } = useErrorHandling();
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

  const getUpdateFrequency = (type: string): string => {
    const frequencies: Record<string, string> = {
      'dat': 'Updated multiple times daily',
      'datv3': 'Updated multiple times daily',
      'meddat': 'Updated weekly',
      'tie': 'Updated continuously',
      'exploit_prevention': 'Updated as threats emerge',
      'amcore_dat': 'Updated daily',
      'engine': 'Updated weekly',
      'content': 'Updated daily'
    };
    return frequencies[type] || 'Updated regularly';
  };

  // Fetch and aggregate security updates from Supabase with error handling
  const fetchSecurityUpdates = async () => {
    try {
      setLoading(true);
      clearError();
      
      const operation = async () => {
        const { data, error } = await supabase
          .from('security_updates')
          .select('*')
          .order('release_date', { ascending: false });

        if (error) {
          console.error('Error fetching security updates:', error);
          throw new Error('Failed to load user data from API');
        }

        return data;
      };

      const data = await retryOperation(operation, 3);

      // Group updates by type with priority for V3 DAT, MEDDAT, TIE, and Exploit Prevention
      const groupedUpdates: { [key: string]: any } = {};
      
      data?.forEach(update => {
        const typeKey = update.type === 'dat' ? 'Standard DAT Files' :
                       update.type === 'datv3' ? 'V3 Virus Definition Files' :
                       update.type === 'meddat' ? 'Medical Device DAT Files' :
                       update.type === 'tie' ? 'TIE Intelligence Updates' :
                       update.type === 'exploit_prevention' ? 'Exploit Prevention Content' :
                       update.type === 'amcore_dat' ? 'AMCore Content' :
                       update.type === 'engine' ? 'Security Engine' :
                       update.type === 'content' ? 'Content Updates' : 
                       'Security Updates';
        
        if (!groupedUpdates[typeKey]) {
          groupedUpdates[typeKey] = {
            type: typeKey,
            urgency: update.is_recommended ? 'critical' : 'important',
            platforms: [],
            description: update.description || getUpdateDescription(update.type),
            frequency: getUpdateFrequency(update.type)
          };
        }

        const platformKey = update.platform || 'All Platforms';
        const isNew = new Date(update.release_date) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        
        groupedUpdates[typeKey].platforms.push({
          name: platformKey,
          version: update.version,
          date: new Date(update.release_date).toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric', 
            year: 'numeric' 
          }),
          size: formatFileSize(update.file_size),
          icon: getPlatformIcon(platformKey),
          status: isNew ? 'new' : 
                 update.is_recommended ? 'updated' : 
                 'stable',
          criticality: update.criticality_level
        });
      });

      // Sort to prioritize V3 DAT, MEDDAT, TIE, and Exploit Prevention
      const sortedUpdates = Object.values(groupedUpdates).sort((a: any, b: any) => {
        const priority = { 
          'V3 Virus Definition Files': 1, 
          'Medical Device DAT Files': 2, 
          'TIE Intelligence Updates': 3,
          'Exploit Prevention Content': 4,
          'Standard DAT Files': 5 
        };
        return (priority[a.type as keyof typeof priority] || 99) - (priority[b.type as keyof typeof priority] || 99);
      });

      setSecurityUpdates(sortedUpdates);
    } catch (error) {
      handleError(error, 'Database connection lost. Unable to fetch security updates.');
    } finally {
      setLoading(false);
    }
  };

  const getUpdateDescription = (type: string): string => {
    const descriptions: Record<string, string> = {
      'dat': 'Traditional virus definition files for comprehensive threat protection',
      'datv3': 'Next-generation V3 virus definition files with enhanced detection capabilities and improved performance',
      'meddat': 'Specialized threat definitions for medical device security and healthcare networks',
      'tie': 'Global threat intelligence feeds with real-time reputation data and file reputation scoring',
      'exploit_prevention': 'Zero-day exploit protection rules, behavioral heuristics, and vulnerability shields',
      'amcore_dat': 'Advanced malware core content with behavioral analysis patterns',
      'engine': 'Core scanning engine with latest detection capabilities',
      'content': 'General content updates and improvements'
    };
    return descriptions[type] || 'Security update package';
  };

  useEffect(() => {
    fetchSecurityUpdates();
    
    // Set up real-time subscription for security updates
    const channel = supabase
      .channel('security_updates_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'security_updates'
        },
        () => {
          console.log('Security updates changed, refetching...');
          fetchSecurityUpdates();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleRefresh = async () => {
    try {
      // Trigger the edge function to fetch latest updates
      const { data, error } = await supabase.functions.invoke('fetch-security-updates');
      
      if (error) {
        throw error;
      }
      
      toast({
        title: "Success",
        description: data?.message || "Security updates refreshed successfully.",
      });
      
      // Refresh the displayed data
      await fetchSecurityUpdates();
    } catch (error) {
      handleError(error, 'Failed to refresh security updates');
    }
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

        {/* Cyber Attacks Section */}
        <CyberAttacksSection />

        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-bold text-primary">
            Latest Security Updates by Platform
          </h2>
          <Button 
            onClick={handleRefresh} 
            disabled={loading}
            variant="outline"
            className="flex items-center space-x-2"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh Updates</span>
          </Button>
        </div>
        
        {errorState.hasError && (
          <Card className="mb-8 border-destructive">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2 text-destructive">
                <AlertTriangle className="h-5 w-5" />
                <span className="font-medium">Connection Issue</span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {errorState.errorMessage}
              </p>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={fetchSecurityUpdates}
                className="mt-2"
              >
                Retry
              </Button>
            </CardContent>
          </Card>
        )}
        
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {securityUpdates.map((update, index) => (
              <Card key={index} className="modern-card group">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <h3 className="text-xl font-semibold text-card-foreground">
                        {update.type}
                      </h3>
                      {update.type === 'V3 Virus Definition Files' && (
                        <Zap className="h-5 w-5 text-primary" />
                      )}
                      {update.type === 'Medical Device DAT Files' && (
                        <Heart className="h-5 w-5 text-destructive" />
                      )}
                      {update.type === 'TIE Intelligence Updates' && (
                        <Globe className="h-5 w-5 text-blue-600" />
                      )}
                      {update.type === 'Exploit Prevention Content' && (
                        <Lock className="h-5 w-5 text-orange-600" />
                      )}
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
                    </div>
                  </div>
                  <p className="text-muted-foreground text-sm mb-4">
                    {update.description}
                  </p>
                  <div className="flex items-center justify-center mb-6">
                    <Badge variant="outline" className="text-xs">
                      {update.frequency}
                    </Badge>
                  </div>
                  
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
