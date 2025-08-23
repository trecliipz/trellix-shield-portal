import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Plus, Edit, Trash2, Download, Package, List, Loader2, Users, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { DeploymentModal } from "@/components/DeploymentModal";
import { supabase } from "@/integrations/supabase/client";

interface Agent {
  id: string;
  name: string;
  version: string;
  size: string;
  description: string;
  features: string[];
  fileName: string;
  uploadDate: string;
  downloads: number;
  status: 'active' | 'inactive';
}

export const AgentManagement = () => {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [isAddingAgent, setIsAddingAgent] = useState(false);
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);
  const [deployingAgent, setDeployingAgent] = useState<Agent | null>(null);
  const [downloadingAgents, setDownloadingAgents] = useState<Set<string>>(new Set());
  const [syncingSubscriptions, setSyncingSubscriptions] = useState(false);
  const [subscriptionStats, setSubscriptionStats] = useState({
    totalSubscribed: 0,
    totalWithAgents: 0,
    lastSync: null as string | null
  });
  const [newAgent, setNewAgent] = useState({
    name: '',
    version: '',
    description: '',
    features: '',
    file: null as File | null
  });
  
  const { toast } = useToast();

  useEffect(() => {
    loadAgents();
    loadSubscriptionStats();
  }, []);

  const loadAgents = async () => {
    try {
      const { data: agentPackages, error } = await supabase
        .from('admin_agent_packages')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (agentPackages && agentPackages.length > 0) {
        const formattedAgents: Agent[] = agentPackages.map(pkg => ({
          id: pkg.id,
          name: pkg.name,
          version: pkg.version,
          size: pkg.file_size ? `${Math.round(pkg.file_size / (1024 * 1024))} MB` : '0 MB',
          description: pkg.description || '',
          features: Array.isArray(pkg.features) ? pkg.features.map(f => String(f)) : [],
          fileName: pkg.file_name,
          uploadDate: pkg.created_at?.split('T')[0] || '',
          downloads: 0, // We'll calculate this from agent_downloads table
          status: pkg.is_active ? 'active' : 'inactive'
        }));

        // Get download counts
        for (const agent of formattedAgents) {
          const { count } = await supabase
            .from('agent_downloads')
            .select('*', { count: 'exact', head: true })
            .eq('agent_name', agent.name);
          agent.downloads = count || 0;
        }

        setAgents(formattedAgents);
      } else {
        setAgents([]);
      }
    } catch (error) {
      console.error('Error loading agents:', error);
      setAgents([]);
    }
  };

  const saveAgents = (updatedAgents: Agent[]) => {
    setAgents(updatedAgents);
    // Dispatch custom event to notify other components of the update
    window.dispatchEvent(new CustomEvent('agentsUpdated'));
  };

  const handleAddAgent = async () => {
    if (!newAgent.name || !newAgent.version || !newAgent.description || !newAgent.file) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('admin_agent_packages')
        .insert({
          name: newAgent.name,
          version: newAgent.version,
          platform: 'windows', // Default platform
          file_name: newAgent.file.name,
          description: newAgent.description,
          features: newAgent.features.split(',').map(f => f.trim()).filter(f => f),
          file_size: newAgent.file.size,
          is_active: true,
          is_recommended: false
        })
        .select()
        .single();

      if (error) throw error;

      await loadAgents(); // Reload agents from database
      
      setNewAgent({ name: '', version: '', description: '', features: '', file: null });
      setIsAddingAgent(false);
      
      toast({
        title: "Success",
        description: "Agent uploaded successfully",
      });
    } catch (error) {
      console.error('Error adding agent:', error);
      toast({
        title: "Error",
        description: "Failed to upload agent. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleEditAgent = (agent: Agent) => {
    const updatedAgents = agents.map(a => a.id === agent.id ? agent : a);
    saveAgents(updatedAgents);
    setEditingAgent(null);
    
    toast({
      title: "Success",
      description: "Agent updated successfully",
    });
  };

  const handleDeleteAgent = (agentId: string) => {
    const updatedAgents = agents.filter(a => a.id !== agentId);
    saveAgents(updatedAgents);
    
    toast({
      title: "Success",
      description: "Agent deleted successfully",
    });
  };

  const handleStatusToggle = (agentId: string) => {
    const updatedAgents = agents.map(agent =>
      agent.id === agentId 
        ? { ...agent, status: agent.status === 'active' ? 'inactive' : 'active' as 'active' | 'inactive' }
        : agent
    );
    saveAgents(updatedAgents);
    
    toast({
      title: "Success",
      description: "Agent status updated",
    });
  };

  const handleDownloadAgent = async (agent: Agent) => {
    setDownloadingAgents(prev => new Set(prev).add(agent.id));
    
    try {
      // Simulate download process
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      toast({
        title: "Download Complete",
        description: `${agent.fileName} has been downloaded successfully.`,
      });
      
      // Update download count
      const updatedAgents = agents.map(a => 
        a.id === agent.id ? { ...a, downloads: a.downloads + 1 } : a
      );
      saveAgents(updatedAgents);
    } catch (error) {
      toast({
        title: "Download Failed",
        description: "Failed to download the agent. Please try again.",
        variant: "destructive"
      });
    } finally {
      setDownloadingAgents(prev => {
        const newSet = new Set(prev);
        newSet.delete(agent.id);
        return newSet;
      });
    }
  };

  const handleDeployAgent = (agent: Agent) => {
    setDeployingAgent(agent);
  };

  const loadSubscriptionStats = async () => {
    try {
      // Get total subscribed users
      const { count: subscribedCount } = await supabase
        .from('user_subscriptions')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');

      // Get users with agent downloads
      const { data: usersWithAgents } = await supabase
        .from('agent_downloads')
        .select('user_id')
        .eq('status', 'available');

      const uniqueUsersWithAgents = new Set(usersWithAgents?.map(d => d.user_id) || []);

      setSubscriptionStats({
        totalSubscribed: subscribedCount || 0,
        totalWithAgents: uniqueUsersWithAgents.size,
        lastSync: localStorage.getItem('lastAgentSync')
      });
    } catch (error) {
      console.error('Error loading subscription stats:', error);
    }
  };

  const handleSyncSubscriptions = async () => {
    setSyncingSubscriptions(true);
    try {
      const { data, error } = await supabase.functions.invoke('grant-latest-agent-bulk');
      
      if (error) throw error;

      toast({
        title: "Sync Complete",
        description: data.message,
      });

      // Update last sync time
      const now = new Date().toISOString();
      localStorage.setItem('lastAgentSync', now);
      
      // Reload stats
      await loadSubscriptionStats();
      
    } catch (error) {
      console.error('Sync error:', error);
      toast({
        title: "Sync Failed",
        description: error instanceof Error ? error.message : "Failed to sync subscriptions",
        variant: "destructive"
      });
    } finally {
      setSyncingSubscriptions(false);
    }
  };

  const stats = {
    total: agents.length,
    active: agents.filter(a => a.status === 'active').length,
    totalDownloads: agents.reduce((sum, a) => sum + a.downloads, 0),
    avgSize: agents.length > 0 ? Math.round(agents.reduce((sum, a) => sum + parseInt(a.size), 0) / agents.length) : 0
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Agents</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Agents</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.active}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Downloads</CardTitle>
            <Download className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalDownloads}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Size</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgSize} MB</div>
          </CardContent>
        </Card>
      </div>

      {/* Subscription Sync Section */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Subscription Sync
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{subscriptionStats.totalSubscribed}</div>
              <div className="text-sm text-muted-foreground">Active Subscriptions</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{subscriptionStats.totalWithAgents}</div>
              <div className="text-sm text-muted-foreground">Users with Agents</div>
            </div>
            <div className="text-center">
              <div className="text-sm text-muted-foreground">Last Sync</div>
              <div className="text-sm">
                {subscriptionStats.lastSync 
                  ? new Date(subscriptionStats.lastSync).toLocaleString()
                  : 'Never'
                }
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Button 
              onClick={handleSyncSubscriptions}
              disabled={syncingSubscriptions}
              className="flex items-center gap-2"
            >
              {syncingSubscriptions ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              {syncingSubscriptions ? 'Syncing...' : 'Sync Latest Agent to All Subscribers'}
            </Button>
            <p className="text-sm text-muted-foreground">
              Grant the latest active agent to all users with active subscriptions
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Agent Management</CardTitle>
            <Dialog open={isAddingAgent} onOpenChange={setIsAddingAgent}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Agent
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md" aria-describedby={undefined}>
                <DialogHeader>
                  <DialogTitle>Upload New Agent</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name">Agent Name</Label>
                    <Input
                      id="name"
                      value={newAgent.name}
                      onChange={(e) => setNewAgent({ ...newAgent, name: e.target.value })}
                      placeholder="e.g., Trellix Agent"
                    />
                  </div>
                  <div>
                    <Label htmlFor="version">Version</Label>
                    <Input
                      id="version"
                      value={newAgent.version}
                      onChange={(e) => setNewAgent({ ...newAgent, version: e.target.value })}
                      placeholder="e.g., 5.7.8"
                    />
                  </div>
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={newAgent.description}
                      onChange={(e) => setNewAgent({ ...newAgent, description: e.target.value })}
                      placeholder="Brief description of the agent"
                    />
                  </div>
                  <div>
                    <Label htmlFor="features">Features (comma-separated)</Label>
                    <Textarea
                      id="features"
                      value={newAgent.features}
                      onChange={(e) => setNewAgent({ ...newAgent, features: e.target.value })}
                      placeholder="Real-time scanning, Behavioral analysis, Cloud intelligence"
                    />
                  </div>
                  <div>
                    <Label htmlFor="file">Agent File</Label>
                    <Input
                      id="file"
                      type="file"
                      accept=".msi,.exe,.zip"
                      onChange={(e) => setNewAgent({ ...newAgent, file: e.target.files?.[0] || null })}
                    />
                  </div>
                  <Button onClick={handleAddAgent} className="w-full">
                    Upload Agent
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Version</TableHead>
                <TableHead>Size</TableHead>
                <TableHead>Downloads</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Upload Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {agents.map((agent) => (
                <TableRow key={agent.id}>
                  <TableCell className="font-medium">{agent.name}</TableCell>
                  <TableCell>{agent.version}</TableCell>
                  <TableCell>{agent.size}</TableCell>
                  <TableCell>{agent.downloads}</TableCell>
                  <TableCell>
                    <Badge 
                      variant={agent.status === 'active' ? 'default' : 'secondary'}
                      className="cursor-pointer"
                      onClick={() => handleStatusToggle(agent.id)}
                    >
                      {agent.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{agent.uploadDate}</TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      {/* Edit Button */}
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => setEditingAgent(agent)}
                            className="hover:bg-trellix-orange/10 hover:border-trellix-orange/50 hover:text-trellix-orange transition-all duration-200"
                            title="Edit Agent"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent aria-describedby={undefined}>
                          <DialogHeader>
                            <DialogTitle>Edit Agent: {editingAgent?.name}</DialogTitle>
                          </DialogHeader>
                          {editingAgent && (
                            <div className="space-y-4">
                              <div>
                                <Label htmlFor="edit-name">Agent Name</Label>
                                <Input
                                  id="edit-name"
                                  value={editingAgent.name}
                                  onChange={(e) => setEditingAgent({ ...editingAgent, name: e.target.value })}
                                />
                              </div>
                              <div>
                                <Label htmlFor="edit-version">Version</Label>
                                <Input
                                  id="edit-version"
                                  value={editingAgent.version}
                                  onChange={(e) => setEditingAgent({ ...editingAgent, version: e.target.value })}
                                />
                              </div>
                              <div>
                                <Label htmlFor="edit-description">Description</Label>
                                <Textarea
                                  id="edit-description"
                                  value={editingAgent.description}
                                  onChange={(e) => setEditingAgent({ ...editingAgent, description: e.target.value })}
                                />
                              </div>
                              <div>
                                <Label htmlFor="edit-features">Features</Label>
                                <Textarea
                                  id="edit-features"
                                  value={editingAgent.features.join(', ')}
                                  onChange={(e) => setEditingAgent({ 
                                    ...editingAgent, 
                                    features: e.target.value.split(',').map(f => f.trim()).filter(f => f)
                                  })}
                                />
                              </div>
                              <Button onClick={() => handleEditAgent(editingAgent)} className="w-full glow-button">
                                Update Agent
                              </Button>
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>
                      
                      {/* Download Button */}
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleDownloadAgent(agent)}
                        disabled={downloadingAgents.has(agent.id)}
                        className="hover:bg-blue-500/10 hover:border-blue-500/50 hover:text-blue-400 transition-all duration-200"
                        title="Download Agent"
                      >
                        {downloadingAgents.has(agent.id) ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Download className="h-4 w-4" />
                        )}
                      </Button>
                      
                      {/* Deploy Button */}
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleDeployAgent(agent)}
                        className="hover:bg-trellix-orange/10 hover:border-trellix-orange/50 hover:text-trellix-orange transition-all duration-200"
                        title="Deploy Agent"
                      >
                        <List className="h-4 w-4" />
                      </Button>
                      
                      {/* Delete Button */}
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleDeleteAgent(agent.id)}
                        className="hover:bg-destructive/10 hover:border-destructive/50 hover:text-destructive transition-all duration-200"
                        title="Delete Agent"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Deployment Modal */}
      {deployingAgent && (
        <DeploymentModal
          open={!!deployingAgent}
          onOpenChange={(open) => !open && setDeployingAgent(null)}
          agent={deployingAgent}
        />
      )}
    </div>
  );
};