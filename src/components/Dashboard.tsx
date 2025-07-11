import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Download, Shield, Lock, BarChart } from "lucide-react";

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
  const handleDownload = (agentType: string) => {
    const download = agentDownloads[agentType];
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
    ? Object.entries(agentDownloads)
    : Object.entries(agentDownloads).filter(([key]) => key === 'trellix-agent');

  return (
    <section className="py-12 min-h-screen">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold text-primary">
            Welcome to Trellix Agent Portal
            {currentUser?.role === 'admin' && (
              <span className="ml-3 px-3 py-1 text-sm bg-primary text-primary-foreground rounded-full">
                ADMIN
              </span>
            )}
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {availableAgents.map(([key, agent]) => (
            <Card key={key} className="bg-card border-border hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/20">
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
                  {agent.features.map((feature, index) => (
                    <li key={index} className="flex items-center space-x-2">
                      <span className="w-1.5 h-1.5 bg-primary rounded-full flex-shrink-0" />
                      <span className="text-muted-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button 
                  onClick={() => handleDownload(key)}
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
};