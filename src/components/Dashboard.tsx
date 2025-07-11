import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Download, Shield, Lock, BarChart } from "lucide-react";
import { UserManagement } from "@/components/UserManagement";
import { AgentManagement } from "@/components/AgentManagement";
import { AdminAnalytics } from "@/components/AdminAnalytics";

interface DashboardProps {
  currentUser: { email: string; name: string; role: 'admin' | 'user' } | null;
}

interface AgentDownload {
  name: string;
  size: string;
  file: string;
  description: string;
  features: string[];
  icon: React.ReactNode;
}

const agentDownloads: Record<string, AgentDownload> = {
  'trellix-agent': {
    name: 'Trellix Agent v10.7.8',
    size: '145 MB',
    file: 'trellix-agent-10.7.8.exe',
    description: 'Core endpoint protection agent with real-time threat detection and prevention capabilities.',
    features: [
      'Real-time scanning engine',
      'Behavioral analysis',
      'Automated threat response',
      'EPO server communication'
    ],
    icon: <Shield className="h-8 w-8 text-primary" />
  },
  'ens': {
    name: 'ENS Endpoint Security v10.7.8',
    size: '298 MB',
    file: 'ens-endpoint-security-10.7.8.exe',
    description: 'Enhanced endpoint security with advanced threat intelligence and machine learning detection.',
    features: [
      'AI-powered threat detection',
      'Zero-day protection',
      'Application control',
      'Web protection'
    ],
    icon: <Lock className="h-8 w-8 text-primary" />
  },
  'epo-tools': {
    name: 'EPO Management Tools v5.10.5',
    size: '89 MB',
    file: 'epo-tools-5.10.5.exe',
    description: 'Centralized management console for policy deployment and monitoring.',
    features: [
      'Policy management',
      'Deployment automation',
      'Compliance reporting',
      'Threat intelligence'
    ],
    icon: <BarChart className="h-8 w-8 text-primary" />
  }
};

export const Dashboard = ({ currentUser }: DashboardProps) => {
  const [dynamicAgents, setDynamicAgents] = useState<AgentDownload[]>([]);

  useEffect(() => {
    loadDynamicAgents();

    // Listen for localStorage changes from other windows
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'admin_agents') {
        loadDynamicAgents();
      }
    };

    // Listen for custom events from same window (AgentManagement updates)
    const handleAgentUpdate = () => {
      loadDynamicAgents();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('agentsUpdated', handleAgentUpdate);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('agentsUpdated', handleAgentUpdate);
    };
  }, []);

  const loadDynamicAgents = () => {
    const savedAgents = localStorage.getItem('admin_agents');
    if (savedAgents) {
      const agentData = JSON.parse(savedAgents);
      const activeAgents = agentData
        .filter((agent: any) => agent.status === 'active')
        .map((agent: any) => ({
          name: `${agent.name} v${agent.version}`,
          size: agent.size,
          file: agent.fileName,
          description: agent.description,
          features: agent.features,
          icon: <Shield className="h-8 w-8 text-primary" />
        }));
      setDynamicAgents(activeAgents);
    } else {
      // Fallback to hardcoded agents if no saved data
      setDynamicAgents(Object.values(agentDownloads));
    }
  };

  const handleDownload = (agentIndex: number) => {
    const download = dynamicAgents[agentIndex];
    if (!download) return;

    const confirmDownload = window.confirm(
      `Download ${download.name}?\n\nSize: ${download.size}\nFile: ${download.file}\n\nThis will initiate the download process.`
    );

    if (confirmDownload) {
      // Create a temporary download link
      const link = document.createElement('a');
      link.href = `data:application/octet-stream;base64,${btoa('Trellix Agent Package - Demo Version')}`;
      link.download = download.file;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success(
        `${download.name} download initiated!`,
        {
          description: "Installation Instructions:\n1. Run as Administrator\n2. Follow the installation wizard\n3. Configure EPO server connection\n4. Restart when prompted",
          duration: 10000,
        }
      );
    }
  };

  // Filter agents based on user role
  const availableAgents = currentUser?.role === 'admin' 
    ? dynamicAgents
    : dynamicAgents.slice(0, 1); // Regular users see only first agent

  // Regular user view - only agent downloads
  if (currentUser?.role !== 'admin') {
    return (
      <section className="py-12 min-h-screen">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold text-primary">
              Welcome to Trellix Agent Portal
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {availableAgents.map((agent, index) => (
              <Card key={index} className="bg-card border-border hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/20">
                <CardHeader>
                  <div className="flex items-center space-x-3 mb-2">
                    {agent.icon}
                    <CardTitle className="text-xl text-card-foreground">
                      {agent.name}
                    </CardTitle>
                  </div>
                  <p className="text-muted-foreground">{agent.description}</p>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 mb-6 text-sm">
                    {agent.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center space-x-2">
                        <span className="w-1.5 h-1.5 bg-primary rounded-full flex-shrink-0" />
                        <span className="text-muted-foreground">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button 
                    onClick={() => handleDownload(index)}
                    className="w-full"
                    size="lg"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download {agent.name.split(' ')[0]}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    );
  }

  // Admin user view - tabbed interface with all features
  return (
    <section className="py-12 min-h-screen">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold text-primary">
            Admin Portal
            <span className="ml-3 px-3 py-1 text-sm bg-primary text-primary-foreground rounded-full">
              ADMIN
            </span>
          </h2>
        </div>

        <Tabs defaultValue="downloads" className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-8">
            <TabsTrigger value="downloads">Agent Downloads</TabsTrigger>
            <TabsTrigger value="users">User Management</TabsTrigger>
            <TabsTrigger value="agents">Agent Management</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="downloads" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {dynamicAgents.map((agent, index) => (
                <Card key={index} className="bg-card border-border hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/20">
                  <CardHeader>
                    <div className="flex items-center space-x-3 mb-2">
                      {agent.icon}
                      <CardTitle className="text-xl text-card-foreground">
                        {agent.name}
                      </CardTitle>
                    </div>
                    <p className="text-muted-foreground">{agent.description}</p>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 mb-6 text-sm">
                      {agent.features.map((feature, featureIndex) => (
                        <li key={featureIndex} className="flex items-center space-x-2">
                          <span className="w-1.5 h-1.5 bg-primary rounded-full flex-shrink-0" />
                          <span className="text-muted-foreground">{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <Button 
                      onClick={() => handleDownload(index)}
                      className="w-full"
                      size="lg"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download {agent.name.split(' ')[0]}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="users">
            <UserManagement />
          </TabsContent>

          <TabsContent value="agents">
            <AgentManagement />
          </TabsContent>

          <TabsContent value="analytics">
            <AdminAnalytics />
          </TabsContent>
        </Tabs>
      </div>
    </section>
  );
};