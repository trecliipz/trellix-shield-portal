
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { RefreshCw, Download, CheckCircle, AlertTriangle, Shield, Database, Zap, Globe, Mail, Lock, FileText, Heart, Activity } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Json } from "@/integrations/supabase/types";

interface SecurityUpdate {
  id: string;
  name: string;
  type: string;
  platform: string;
  version: string;
  release_date: string;
  file_size: number;
  file_name: string;
  sha256?: string;
  description?: string;
  is_recommended: boolean;
  update_category?: string;
  criticality_level?: string;
  target_systems?: string[];
  dependencies?: string[];
  compatibility_info?: any;
  threat_coverage?: string[];
  deployment_notes?: string;
  download_url?: string;
  changelog?: string;
  created_at: string;
  updated_at: string;
}

const AdminDAT: React.FC = () => {
  const [securityUpdates, setSecurityUpdates] = useState<SecurityUpdate[]>([]);
  const [selectedUpdates, setSelectedUpdates] = useState<Set<string>>(new Set());
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchSecurityUpdates();
  }, []);

  const fetchSecurityUpdates = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('security_updates')
        .select('*')
        .order('release_date', { ascending: false });

      if (error) throw error;

      if (data) {
        // Type cast the data to match our interface
        const typedData = data.map(update => ({
          ...update,
          target_systems: Array.isArray(update.target_systems) 
            ? update.target_systems.map(item => typeof item === 'string' ? item : String(item))
            : [],
          dependencies: Array.isArray(update.dependencies)
            ? update.dependencies.map(item => typeof item === 'string' ? item : String(item))
            : [],
          compatibility_info: update.compatibility_info || {},
          threat_coverage: update.threat_coverage || []
        }));
        setSecurityUpdates(typedData);
      }
    } catch (error) {
      console.error('Error fetching security updates:', error);
      toast({
        title: "Error",
        description: "Failed to fetch security updates. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const triggerUpdateFetch = async () => {
    try {
      setRefreshing(true);
      const { error } = await supabase.functions.invoke('fetch-security-updates');
      
      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Security updates refreshed successfully.",
      });
      
      // Refresh the data
      await fetchSecurityUpdates();
    } catch (error) {
      console.error('Error triggering update fetch:', error);
      toast({
        title: "Error", 
        description: "Failed to refresh security updates. Please try again.",
        variant: "destructive",
      });
    } finally {
      setRefreshing(false);
    }
  };

  const getTypeIcon = (type: string): React.ReactNode => {
    const iconMap: Record<string, React.ReactNode> = {
      dat: <Database className="h-4 w-4" />,
      datv3: <Zap className="h-4 w-4" />,
      meddat: <Heart className="h-4 w-4" />,
      tie: <Globe className="h-4 w-4" />,
      exploit_prevention: <Lock className="h-4 w-4" />,
      amcore_dat: <Activity className="h-4 w-4" />,
      gateway_dat: <Globe className="h-4 w-4" />,
      email_dat: <Mail className="h-4 w-4" />,
      security_engine: <Shield className="h-4 w-4" />,
      content_package: <FileText className="h-4 w-4" />,
      threat_intelligence: <Globe className="h-4 w-4" />,
      policy_template: <FileText className="h-4 w-4" />,
      signature_update: <Database className="h-4 w-4" />
    };
    return iconMap[type] || <Database className="h-4 w-4" />;
  };

  const getTypeColor = (type: string): "default" | "secondary" | "destructive" | "outline" => {
    const colorMap: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      dat: "default",
      datv3: "secondary", 
      meddat: "destructive",
      tie: "outline",
      exploit_prevention: "destructive",
      amcore_dat: "default",
      gateway_dat: "secondary",
      email_dat: "outline",
      security_engine: "destructive",
      content_package: "default",
      threat_intelligence: "secondary",
      policy_template: "outline",
      signature_update: "default"
    };
    return colorMap[type] || "default";
  };

  const getCriticalityColor = (level?: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (level?.toLowerCase()) {
      case 'critical': return "destructive";
      case 'high': return "destructive";
      case 'medium': return "secondary";
      case 'low': return "outline";
      default: return "default";
    }
  };

  const formatFileSize = (bytes: number): string => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleSelectUpdate = (updateId: string, checked: boolean) => {
    setSelectedUpdates(prev => {
      const newSet = new Set(prev);
      if (checked) {
        newSet.add(updateId);
      } else {
        newSet.delete(updateId);
      }
      return newSet;
    });
  };

  const handleSelectAll = (updates: SecurityUpdate[], checked: boolean) => {
    setSelectedUpdates(prev => {
      const newSet = new Set(prev);
      updates.forEach(update => {
        if (checked) {
          newSet.add(update.id);
        } else {
          newSet.delete(update.id);
        }
      });
      return newSet;
    });
  };

  const handleDownload = (update: SecurityUpdate) => {
    if (update.download_url) {
      window.open(update.download_url, '_blank');
    } else {
      toast({
        title: "Download Unavailable",
        description: "Direct download link is not available for this update.",
        variant: "destructive",
      });
    }
  };

  const handleBulkDownload = () => {
    const selectedUpdatesList = securityUpdates.filter(update => 
      selectedUpdates.has(update.id) && update.download_url
    );
    
    selectedUpdatesList.forEach(update => {
      if (update.download_url) {
        window.open(update.download_url, '_blank');
      }
    });
    
    toast({
      title: "Downloads Started",
      description: `Started downloading ${selectedUpdatesList.length} security updates.`,
    });
  };

  // Group updates by type with priority for V3 DAT, MEDDAT, TIE, and Exploit Prevention
  const updatesByType = securityUpdates.reduce((acc, update) => {
    if (!acc[update.type]) {
      acc[update.type] = [];
    }
    acc[update.type].push(update);
    return acc;
  }, {} as Record<string, SecurityUpdate[]>);

  const renderUpdatesTable = (updates: SecurityUpdate[]) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-12">
            <Checkbox
              checked={updates.every(update => selectedUpdates.has(update.id))}
              onCheckedChange={(checked) => handleSelectAll(updates, checked as boolean)}
            />
          </TableHead>
          <TableHead>Update</TableHead>
          <TableHead>Version</TableHead>
          <TableHead>Platform</TableHead>
          <TableHead>Size</TableHead>
          <TableHead>Priority</TableHead>
          <TableHead>Release Date</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {updates.map((update) => (
          <TableRow key={update.id}>
            <TableCell>
              <Checkbox
                checked={selectedUpdates.has(update.id)}
                onCheckedChange={(checked) => handleSelectUpdate(update.id, checked as boolean)}
              />
            </TableCell>
            <TableCell>
              <div className="flex items-center space-x-2">
                {getTypeIcon(update.type)}
                <div>
                  <div className="font-medium">{update.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {update.file_name}
                  </div>
                </div>
              </div>
            </TableCell>
            <TableCell>
              <Badge variant={getTypeColor(update.type)}>
                {update.version}
              </Badge>
            </TableCell>
            <TableCell>{update.platform}</TableCell>
            <TableCell>{formatFileSize(update.file_size)}</TableCell>
            <TableCell>
              {update.criticality_level && (
                <Badge variant={getCriticalityColor(update.criticality_level)}>
                  {update.criticality_level}
                </Badge>
              )}
              {update.is_recommended && (
                <Badge variant="default" className="ml-1">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Recommended
                </Badge>
              )}
            </TableCell>
            <TableCell>{formatDate(update.release_date)}</TableCell>
            <TableCell>
              <Button
                size="sm"
                onClick={() => handleDownload(update)}
                disabled={!update.download_url}
              >
                <Download className="h-4 w-4 mr-1" />
                Download
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">DAT Management</h1>
          <p className="text-muted-foreground">
            Manage and download security updates, V3 DAT files, MEDDAT, TIE Intelligence, and threat protection
          </p>
        </div>
        <div className="flex space-x-2">
          {selectedUpdates.size > 0 && (
            <Button onClick={handleBulkDownload}>
              <Download className="h-4 w-4 mr-2" />
              Download Selected ({selectedUpdates.size})
            </Button>
          )}
          <Button onClick={triggerUpdateFetch} disabled={refreshing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh Updates
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-7 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Updates</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{securityUpdates.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">V3 DAT Files</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {securityUpdates.filter(u => u.type === 'datv3').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">MEDDAT Files</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {securityUpdates.filter(u => u.type === 'meddat').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">TIE Intelligence</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {securityUpdates.filter(u => u.type === 'tie').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Exploit Prevention</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {securityUpdates.filter(u => u.type === 'exploit_prevention').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Critical Updates</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {securityUpdates.filter(u => u.criticality_level === 'critical').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Recommended</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {securityUpdates.filter(u => u.is_recommended).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Updates by Type with V3 DAT, MEDDAT, TIE, and Exploit Prevention priority */}
      <Tabs defaultValue="datv3" className="w-full">
        <TabsList className="grid w-full grid-cols-7">
          {/* Prioritize V3 DAT, MEDDAT, TIE, and Exploit Prevention */}
          {['datv3', 'meddat', 'tie', 'exploit_prevention', 'dat', 'engine', 'content'].map((type) => (
            updatesByType[type] && (
              <TabsTrigger key={type} value={type} className="flex items-center space-x-2">
                {getTypeIcon(type)}
                <span className="capitalize">
                  {type === 'datv3' ? 'V3 DAT' : 
                   type === 'meddat' ? 'MEDDAT' : 
                   type === 'tie' ? 'TIE Intel' :
                   type === 'exploit_prevention' ? 'Exploit Prev' :
                   type.replace('_', ' ')}
                </span>
                <Badge variant="secondary">{updatesByType[type].length}</Badge>
              </TabsTrigger>
            )
          ))}
        </TabsList>
        
        {Object.entries(updatesByType).map(([type, updates]) => (
          <TabsContent key={type} value={type}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  {getTypeIcon(type)}
                  <span className="capitalize">
                    {type === 'datv3' ? 'V3 Virus Definition Files' : 
                     type === 'meddat' ? 'Medical Device DAT Files' : 
                     type === 'tie' ? 'TIE Intelligence Updates' :
                     type === 'exploit_prevention' ? 'Exploit Prevention Content' :
                     type.replace('_', ' ')} Updates
                  </span>
                  <Badge variant="secondary">{updates.length}</Badge>
                </CardTitle>
                <div className="text-sm text-muted-foreground">
                  {type === 'datv3' && 'Next-generation virus definition files with enhanced detection capabilities'}
                  {type === 'meddat' && 'Specialized threat definitions for medical device security and healthcare networks'}
                  {type === 'tie' && 'Global threat intelligence feeds with real-time reputation data and file reputation scoring'}
                  {type === 'exploit_prevention' && 'Zero-day exploit protection rules, behavioral heuristics, and vulnerability shields'}
                  {type === 'dat' && 'Traditional virus definition files for comprehensive threat protection'}
                  {type === 'engine' && 'Security engine updates with latest detection capabilities'}
                  {type === 'content' && 'General content updates and security improvements'}
                </div>
              </CardHeader>
              <CardContent>
                {renderUpdatesTable(updates)}
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};

export default AdminDAT;
