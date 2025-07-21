import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshCw, ExternalLink, Calendar, Shield, AlertTriangle, Globe, Building, Target } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface CyberAttack {
  id: string;
  title: string;
  description: string;
  attack_type: string;
  severity: string;
  date_detected: string;
  source: string;
  external_url?: string;
  indicators?: any;
  affected_products?: string[];
  industries?: string[];
  attack_vectors?: string[];
  business_impact?: string;
  mitigation_steps?: string[];
  source_credibility_score?: number;
  cvss_score?: number;
  cwe_id?: string;
  vendor_info?: any;
  created_at: string;
}

export const CyberAttacksSection = () => {
  const [attacks, setAttacks] = useState<CyberAttack[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedSource, setSelectedSource] = useState<string>('all');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');
  const { toast } = useToast();

  const fetchCyberAttacks = async () => {
    try {
      const { data, error } = await supabase
        .from('cyberattacks' as any)
        .select('*')
        .order('date_detected', { ascending: false })
        .limit(6);

      if (error) throw error;
      setAttacks((data as any) || []);
    } catch (error) {
      console.error('Error fetching cyberattacks:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch latest cyber threats',
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
        description: 'Enhanced threat intelligence refreshed successfully',
      });
    } catch (error) {
      console.error('Error refreshing data:', error);
      toast({
        title: 'Error',
        description: 'Failed to refresh threat intelligence data',
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
      case 'phishing': return <Target className="w-4 h-4" />;
      case 'ddos': return <Globe className="w-4 h-4" />;
      case 'data_breach': return <Building className="w-4 h-4" />;
      default: return <AlertTriangle className="w-4 h-4" />;
    }
  };

  const getCredibilityBadge = (score?: number) => {
    if (!score) return null;
    
    const getCredibilityLevel = (score: number) => {
      if (score >= 9) return { label: 'VERIFIED', variant: 'default' as const };
      if (score >= 7) return { label: 'RELIABLE', variant: 'secondary' as const };
      return { label: 'REPORTED', variant: 'outline' as const };
    };

    const { label, variant } = getCredibilityLevel(score);
    return <Badge variant={variant} className="text-xs">{label}</Badge>;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredAttacks = attacks.filter(attack => {
    const sourceMatch = selectedSource === 'all' || attack.source.toLowerCase().includes(selectedSource.toLowerCase());
    const severityMatch = selectedSeverity === 'all' || attack.severity === selectedSeverity;
    return sourceMatch && severityMatch;
  });

  const sources = ['all', ...new Set(attacks.map(a => a.source))];
  const severities = ['all', 'critical', 'high', 'medium', 'low'];

  if (loading) {
    return (
      <section className="py-20 bg-gradient-to-br from-background via-muted/20 to-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-foreground mb-4">Enhanced Threat Intelligence</h2>
            <div className="h-6 bg-muted animate-pulse rounded w-96 mx-auto"></div>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-64 bg-muted animate-pulse rounded-lg"></div>
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
          <h2 className="text-4xl font-bold text-foreground mb-4">Enhanced Threat Intelligence</h2>
          <p className="text-xl text-muted-foreground mb-6">
            Real-time cyber threat intelligence from premium sources including Krebs on Security, BleepingComputer, CISA, and US-CERT
          </p>
          
          {/* Enhanced Controls */}
          <div className="flex flex-wrap justify-center gap-4 mb-8">
            <Button 
              onClick={handleRefresh}
              disabled={refreshing}
              variant="outline"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Refreshing...' : 'Refresh Intelligence'}
            </Button>

            <select 
              value={selectedSource}
              onChange={(e) => setSelectedSource(e.target.value)}
              className="px-3 py-2 border rounded-md bg-background"
            >
              {sources.map(source => (
                <option key={source} value={source}>
                  {source === 'all' ? 'All Sources' : source}
                </option>
              ))}
            </select>

            <select 
              value={selectedSeverity}
              onChange={(e) => setSelectedSeverity(e.target.value)}
              className="px-3 py-2 border rounded-md bg-background"
            >
              {severities.map(severity => (
                <option key={severity} value={severity}>
                  {severity === 'all' ? 'All Severities' : severity.charAt(0).toUpperCase() + severity.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredAttacks.map((attack) => (
            <Card key={attack.id} className="group hover:shadow-lg transition-all duration-300 border-border/50 bg-card/80 backdrop-blur-sm">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    {getAttackTypeIcon(attack.attack_type)}
                    <Badge variant={getSeverityColor(attack.severity)} className="text-xs">
                      {attack.severity.toUpperCase()}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {attack.source}
                    </Badge>
                    {getCredibilityBadge(attack.source_credibility_score)}
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
                </div>

                {/* CVSS Score for vulnerabilities */}
                {attack.cvss_score && (
                  <div className="text-xs">
                    <span className="font-medium text-foreground">CVSS Score: </span>
                    <Badge 
                      variant={attack.cvss_score >= 7 ? 'destructive' : attack.cvss_score >= 4 ? 'secondary' : 'outline'} 
                      className="text-xs"
                    >
                      {attack.cvss_score.toFixed(1)}
                    </Badge>
                    {attack.cwe_id && (
                      <span className="ml-2 text-muted-foreground">• CWE: {attack.cwe_id}</span>
                    )}
                  </div>
                )}

                {/* Enhanced Business Impact */}
                {attack.business_impact && (
                  <div className="text-xs">
                    <span className="font-medium text-foreground">Business Impact: </span>
                    <span className="text-muted-foreground">{attack.business_impact}</span>
                  </div>
                )}

                {/* Attack Vectors */}
                {attack.attack_vectors && attack.attack_vectors.length > 0 && (
                  <div className="text-xs">
                    <span className="font-medium text-foreground">Attack Vectors: </span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {attack.attack_vectors.map((vector, i) => (
                        <Badge key={i} variant="outline" className="text-xs capitalize">
                          {vector}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Affected Products */}
                {attack.affected_products && attack.affected_products.length > 0 && (
                  <div className="text-xs">
                    <span className="font-medium text-foreground">Affected Products: </span>
                    <span className="text-muted-foreground capitalize">
                      {attack.affected_products.slice(0, 3).join(', ')}
                      {attack.affected_products.length > 3 && '...'}
                    </span>
                  </div>
                )}

                {/* Mitigation Steps */}
                {attack.mitigation_steps && Array.isArray(attack.mitigation_steps) && attack.mitigation_steps.length > 0 && (
                  <div className="text-xs">
                    <span className="font-medium text-foreground">Mitigation: </span>
                    <span className="text-muted-foreground">{attack.mitigation_steps[0]}</span>
                  </div>
                )}

                <div className="flex items-center justify-between pt-2">
                  {attack.indicators && Array.isArray(attack.indicators) && attack.indicators.length > 0 && (
                    <Badge variant="outline" className="text-xs font-mono">
                      {attack.indicators[0]}
                    </Badge>
                  )}
                  {attack.external_url && (
                    <Button
                      variant="ghost"
                      size="sm"
                      asChild
                      className="h-auto p-1 text-xs"
                    >
                      <a
                        href={attack.external_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1"
                      >
                        <ExternalLink className="w-3 h-3" />
                        Read Full Report
                      </a>
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredAttacks.length === 0 && (
          <div className="text-center py-12">
            <AlertTriangle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">No Threats Found</h3>
            <p className="text-muted-foreground">No threat intelligence data matching your filters.</p>
          </div>
        )}

        <div className="text-center mt-12">
          <p className="text-sm text-muted-foreground">
            Enhanced intelligence from: Krebs on Security, BleepingComputer, The Hacker News, Security Week, CISA KEV, NVD, US-CERT
            <span className="mx-2">•</span>
            Last updated: {filteredAttacks.length > 0 ? formatDate(filteredAttacks[0]?.created_at || new Date().toISOString()) : 'Never'}
            <span className="mx-2">•</span>
            Auto-refreshed daily at 6:00 AM UTC
          </p>
        </div>
      </div>
    </section>
  );
};
