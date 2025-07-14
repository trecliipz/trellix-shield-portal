import React, { useState, useEffect } from 'react';
import { Shield, Users, Activity, Lock, AlertTriangle, CheckCircle, Download, Calendar, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const features = [
  {
    icon: <Shield className="h-12 w-12" />,
    title: "Advanced Threat Detection", 
    description: "Machine learning-powered detection of known and unknown threats with behavioral analysis."
  },
  {
    icon: <Activity className="h-12 w-12" />,
    title: "Real-time Response",
    description: "Automated threat response and remediation to minimize impact and recovery time."
  },
  {
    icon: <Users className="h-12 w-12" />,
    title: "Centralized Management",
    description: "Single console for managing security policies across all endpoints in your organization."
  },
  {
    icon: <Lock className="h-12 w-12" />,
    title: "Compliance Reporting", 
    description: "Comprehensive reporting and auditing capabilities for regulatory compliance."
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
  const [refreshing, setRefreshing] = useState(false);
  const [platformVersions, setPlatformVersions] = useState<Record<string, Record<string, string>>>({});

  // Helper functions
  const formatFileSize = (bytes: number): string => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const getPlatformIcon = (platform: string): string => {
    if (platform.toLowerCase().includes('windows')) return '🪟';
    if (platform.toLowerCase().includes('linux')) return '🐧';
    if (platform.toLowerCase().includes('mac')) return '🍎';
    if (platform.toLowerCase().includes('medical')) return '🏥';
    if (platform.toLowerCase().includes('gateway')) return '🌐';
    if (platform.toLowerCase().includes('email')) return '📧';
    return '💻';
  };

  const getUpdateFrequency = (type: string): string => {
    const frequencies: Record<string, string> = {
      'dat': 'Updated multiple times daily',
      'datv3': 'Updated daily',
      'meddat': 'Updated weekly',
      'amcore_dat': 'Updated daily',
      'tie': 'Updated continuously',
      'exploit_prevention': 'Updated as needed',
      'engine': 'Updated weekly',
      'content': 'Updated daily'
    };
    return frequencies[type] || 'Updated regularly';
  };

  // Fetch and aggregate security updates from Supabase
  const fetchSecurityUpdates = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('security_updates')
        .select('*')
        .order('release_date', { ascending: false });

      if (error) {
        console.error('Error fetching security updates:', error);
        return;
      }

      // Group updates by type and platform for better display
      const groupedUpdates: { [key: string]: any } = {};
      const platformVersions: { [key: string]: { [key: string]: any } } = {};
      
      data?.forEach(update => {
        const typeKey = update.type === 'dat' ? 'DAT Files' :
                       update.type === 'datv3' ? 'DAT V3' :
                       update.type === 'meddat' ? 'MEDDAT' :
                       update.type === 'amcore_dat' ? 'AMCore Content' :
                       update.type === 'tie' ? 'TIE Intelligence' :
                       update.type === 'exploit_prevention' ? 'Exploit Prevention' :
                       update.type === 'engine' ? 'Security Engine' :
                       update.type === 'content' ? 'Content Updates' : 
                       'Security Updates';
        
        if (!groupedUpdates[typeKey]) {
          groupedUpdates[typeKey] = {
            type: typeKey,
            urgency: update.is_recommended ? 'critical' : 'important',
            platforms: [],
            description: update.description || `${typeKey} for comprehensive threat protection`,
            frequency: getUpdateFrequency(update.type)
          };
        }

        // Track platform-specific versions
        if (!platformVersions[typeKey]) {
          platformVersions[typeKey] = {};
        }
        
        const platformKey = update.platform || 'All Platforms';
        if (!platformVersions[typeKey][platformKey] || 
            new Date(update.release_date) > new Date(platformVersions[typeKey][platformKey].date)) {
          platformVersions[typeKey][platformKey] = {
            version: update.version,
            date: update.release_date,
            size: update.file_size,
            isNew: new Date(update.release_date) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
            criticality: update.criticality_level,
            isRecommended: update.is_recommended
          };
        }
      });

      // Convert platform versions to display format
      Object.keys(groupedUpdates).forEach(typeKey => {
        const platforms = platformVersions[typeKey];
        Object.keys(platforms).forEach(platformName => {
          const platform = platforms[platformName];
          const platformIcon = getPlatformIcon(platformName);
          
          groupedUpdates[typeKey].platforms.push({
            name: platformName,
            version: platform.version,
            date: new Date(platform.date).toLocaleDateString('en-US', { 
              month: 'short', 
              day: 'numeric', 
              year: 'numeric' 
            }),
            size: formatFileSize(platform.size),
            icon: platformIcon,
            status: platform.isNew ? 'new' : 
                   platform.isRecommended ? 'updated' : 
                   'stable',
            criticality: platform.criticality
          });
        });
      });

      setSecurityUpdates(Object.values(groupedUpdates));
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSecurityUpdates();
  }, []);

  const handleRefresh = () => {
    fetchSecurityUpdates();
    toast.info('Refreshing security updates...', { duration: 2000 });
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
              className="modern-card text-center group"
            >
              <CardContent className="p-6">
                <div className="text-primary mb-4 flex justify-center transition-all duration-300 group-hover:scale-110 group-hover:text-primary">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-card-foreground mb-3">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        <h2 className="text-3xl font-bold text-center text-primary mb-12">
          Latest Security Updates by Platform
        </h2>
        
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
                    <h3 className="text-xl font-semibold text-card-foreground">
                      {update.type}
                    </h3>
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
                          <span className="text-xs text-muted-foreground font-mono">{platform.version}</span>
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