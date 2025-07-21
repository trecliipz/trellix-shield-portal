import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshCw, ExternalLink, Calendar, Shield, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface CyberAttack {
  id: string;
  title: string;
  description: string;
  attack_type: string;
  severity: string;
  date_detected: string;
  source: string;
  target_sector?: string;
  impact?: string;
  mitigation_steps?: string;
  external_id?: string;
  source_url?: string;
  created_at: string;
}

export const CyberAttacksSection = () => {
  const [attacks, setAttacks] = useState<CyberAttack[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { toast } = useToast();

  const fetchCyberAttacks = async () => {
    try {
      const { data, error } = await supabase
        .from('cyberattacks' as any)
        .select('*')
        .order('date_detected', { ascending: false })
        .limit(10);

      if (error) throw error;
      setAttacks((data as any) || []);
    } catch (error) {
      console.error('Error fetching cyberattacks:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch latest cyberattacks',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const { error } = await supabase.functions.invoke('fetch-cyberattacks', {
        body: { trigger: 'manual' }
      });

      if (error) throw error;

      await fetchCyberAttacks();
      toast({
        title: 'Success',
        description: 'Cyberattack data refreshed successfully',
      });
    } catch (error) {
      console.error('Error refreshing data:', error);
      toast({
        title: 'Error',
        description: 'Failed to refresh cyberattack data',
        variant: 'destructive',
      });
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchCyberAttacks();
  }, []);

  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'critical': return 'destructive';
      case 'high': return 'secondary';
      case 'medium': return 'outline';
      case 'low': return 'default';
      default: return 'outline';
    }
  };

  const getAttackTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'vulnerability': return <Shield className="w-4 h-4" />;
      case 'malware': return <AlertTriangle className="w-4 h-4" />;
      default: return <AlertTriangle className="w-4 h-4" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <section className="py-20 bg-gradient-to-br from-background via-muted/20 to-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-foreground mb-4">Latest Cyber Threats</h2>
            <div className="h-6 bg-muted animate-pulse rounded w-96 mx-auto"></div>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-48 bg-muted animate-pulse rounded-lg"></div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-20 bg-gradient-to-br from-background via-muted/20 to-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-foreground mb-4">Latest Cyber Threats</h2>
          <p className="text-xl text-muted-foreground mb-6">
            Real-time intelligence on the latest cybersecurity threats and vulnerabilities
          </p>
          <Button 
            onClick={handleRefresh}
            disabled={refreshing}
            variant="outline"
            className="mb-8"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing...' : 'Refresh Data'}
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {attacks.map((attack) => (
            <Card key={attack.id} className="group hover:shadow-lg transition-all duration-300 border-border/50 bg-card/80 backdrop-blur-sm">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 mb-2">
                    {getAttackTypeIcon(attack.attack_type)}
                    <Badge variant={getSeverityColor(attack.severity)} className="text-xs">
                      {attack.severity.toUpperCase()}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {attack.source}
                    </Badge>
                  </div>
                </div>
                <CardTitle className="text-lg leading-tight group-hover:text-primary transition-colors">
                  {attack.title}
                </CardTitle>
              </CardHeader>
              
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground line-clamp-3">
                  {attack.description}
                </p>
                
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Calendar className="w-3 h-3" />
                  <span>{formatDate(attack.date_detected)}</span>
                  {attack.target_sector && (
                    <>
                      <span>•</span>
                      <span className="capitalize">{attack.target_sector}</span>
                    </>
                  )}
                </div>

                {attack.impact && (
                  <div className="text-xs">
                    <span className="font-medium text-foreground">Impact: </span>
                    <span className="text-muted-foreground">{attack.impact}</span>
                  </div>
                )}

                {attack.mitigation_steps && (
                  <div className="text-xs">
                    <span className="font-medium text-foreground">Mitigation: </span>
                    <span className="text-muted-foreground">{attack.mitigation_steps}</span>
                  </div>
                )}

                <div className="flex items-center justify-between pt-2">
                  {attack.external_id && (
                    <Badge variant="outline" className="text-xs font-mono">
                      {attack.external_id}
                    </Badge>
                  )}
                  {attack.source_url && (
                    <Button
                      variant="ghost"
                      size="sm"
                      asChild
                      className="h-auto p-1 text-xs"
                    >
                      <a
                        href={attack.source_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1"
                      >
                        <ExternalLink className="w-3 h-3" />
                        Details
                      </a>
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {attacks.length === 0 && (
          <div className="text-center py-12">
            <AlertTriangle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">No Recent Threats</h3>
            <p className="text-muted-foreground">No cyberattack data available at the moment.</p>
          </div>
        )}

        <div className="text-center mt-12">
          <p className="text-sm text-muted-foreground">
            Last updated: {attacks.length > 0 ? formatDate(attacks[0]?.created_at || new Date().toISOString()) : 'Never'}
            <span className="mx-2">•</span>
            Data refreshed daily at 6:00 AM UTC
          </p>
        </div>
      </div>
    </section>
  );
};