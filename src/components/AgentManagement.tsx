import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Plus, Edit, Trash2, Download, Package, List, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { DeploymentModal } from "@/components/DeploymentModal";

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
  }, []);

  const loadAgents = () => {
    const savedAgents = localStorage.getItem('admin_agents');
    if (savedAgents) {
      setAgents(JSON.parse(savedAgents));
    } else {
      // Initialize with mock data matching the existing agents
      const mockAgents: Agent[] = [
        {
          id: '1',
          name: 'Trellix Agent',
          version: '5.7.8',
          size: '125 MB',
          description: 'Advanced endpoint protection with real-time threat detection',
          features: ['Real-time scanning', 'Behavioral analysis', 'Cloud intelligence', 'Automated response'],
          fileName: 'trellix-agent-5.7.8.msi',
          uploadDate: '2024-01-15',
          downloads: 156,
          status: 'active'
        },
        {
          id: '2',
          name: 'ePolicy Orchestrator Tools',
          version: '5.10.0',
          size: '89 MB',
          description: 'Centralized management tools for enterprise security',
          features: ['Centralized management', 'Policy deployment', 'Reporting dashboard', 'Agent deployment'],
          fileName: 'epo-tools-5.10.0.exe',
          uploadDate: '2024-02-01',
          downloads: 89,
          status: 'active'
        },
        {
          id: '3',
          name: 'Endpoint Security',
          version: '10.7.0',
          size: '67 MB',
          description: 'Comprehensive endpoint security solution',
          features: ['Anti-malware', 'Firewall protection', 'Web control', 'Device control'],
          fileName: 'endpoint-security-10.7.0.msi',
          uploadDate: '2024-02-15',
          downloads: 234,
          status: 'active'
        }
      ];
      setAgents(mockAgents);
      localStorage.setItem('admin_agents', JSON.stringify(mockAgents));
    }
  };

  const saveAgents = (updatedAgents: Agent[]) => {
    setAgents(updatedAgents);
    localStorage.setItem('admin_agents', JSON.stringify(updatedAgents));
    
    // Dispatch custom event to notify other components of the update
    window.dispatchEvent(new CustomEvent('agentsUpdated'));
  };

  const handleAddAgent = () => {
    if (!newAgent.name || !newAgent.version || !newAgent.description || !newAgent.file) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    const agent: Agent = {
      id: Date.now().toString(),
      name: newAgent.name,
      version: newAgent.version,
      size: `${Math.round(newAgent.file.size / (1024 * 1024))} MB`,
      description: newAgent.description,
      features: newAgent.features.split(',').map(f => f.trim()).filter(f => f),
      fileName: newAgent.file.name,
      uploadDate: new Date().toISOString().split('T')[0],
      downloads: 0,
      status: 'active'
    };

    const updatedAgents = [...agents, agent];
    saveAgents(updatedAgents);
    
    setNewAgent({ name: '', version: '', description: '', features: '', file: null });
    setIsAddingAgent(false);
    
    toast({
      title: "Success",
      description: "Agent uploaded successfully",
    });
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
              <DialogContent className="max-w-md">
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
                        <DialogContent>
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