
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Download, Shield, Lock, BarChart } from "lucide-react";
import UserManagement from "@/components/UserManagement";
import { AgentManagement } from "@/components/AgentManagement";
import { AdminAnalytics } from "@/components/AdminAnalytics";
import SecurityUpdates from "@/components/SecurityUpdates";

import { EPOManagement } from "@/components/EPOManagement";
import { AdminMessages } from "@/components/AdminMessages";
import { SecurityCompliance } from "@/components/SecurityCompliance";
import { LogsCenter } from "@/components/admin/LogsCenter";
import UserProfile from "@/components/UserProfile";
import { AnimatedArchitecture } from "@/components/AnimatedArchitecture";
import { Architecture } from "@/components/Architecture";
import { Mermaid } from "@/components/Mermaid";
import { BillingManagement } from "./BillingManagement";
import { WebhookManagement } from "./WebhookManagement";

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

  // Regular user view - show the new Trellix agent portal
  if (currentUser?.role !== 'admin') {
    return <UserProfile />;
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
          <TabsList className="modern-tabs flex w-full overflow-x-auto mb-8 h-auto p-1 bg-card/50 backdrop-blur-sm rounded-xl border border-border/50">
            <TabsTrigger value="downloads" className="flex-shrink-0 px-4 py-2 transition-all duration-300 hover:scale-105 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Downloads</TabsTrigger>
            <TabsTrigger value="users" className="flex-shrink-0 px-4 py-2 transition-all duration-300 hover:scale-105 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Users</TabsTrigger>
            <TabsTrigger value="agents" className="flex-shrink-0 px-4 py-2 transition-all duration-300 hover:scale-105 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Agents</TabsTrigger>
            <TabsTrigger value="billing" className="flex-shrink-0 px-4 py-2 transition-all duration-300 hover:scale-105 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Billing</TabsTrigger>
            <TabsTrigger value="webhooks" className="flex-shrink-0 px-4 py-2 transition-all duration-300 hover:scale-105 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Webhooks</TabsTrigger>
            <TabsTrigger value="security-updates" className="flex-shrink-0 px-4 py-2 transition-all duration-300 hover:scale-105 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Security Updates</TabsTrigger>
            <TabsTrigger value="epo" className="flex-shrink-0 px-4 py-2 transition-all duration-300 hover:scale-105 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Trellix ePO</TabsTrigger>
            <TabsTrigger value="messages" className="flex-shrink-0 px-4 py-2 transition-all duration-300 hover:scale-105 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Messages</TabsTrigger>
            <TabsTrigger value="security" className="flex-shrink-0 px-4 py-2 transition-all duration-300 hover:scale-105 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Security</TabsTrigger>
            <TabsTrigger value="logs" className="flex-shrink-0 px-4 py-2 transition-all duration-300 hover:scale-105 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Logs</TabsTrigger>
            <TabsTrigger value="analytics" className="flex-shrink-0 px-4 py-2 transition-all duration-300 hover:scale-105 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Analytics</TabsTrigger>
            <TabsTrigger value="architecture" className="flex-shrink-0 px-4 py-2 transition-all duration-300 hover:scale-105 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Architecture</TabsTrigger>
          </TabsList>

          <TabsContent value="downloads" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {dynamicAgents.map((agent, index) => (
                <Card key={index} className="modern-card group">
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
                      className="glow-button w-full group-hover:scale-105 transition-all duration-300"
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

          <TabsContent value="billing">
            <BillingManagement />
          </TabsContent>

          <TabsContent value="webhooks">
            <WebhookManagement />
          </TabsContent>

          <TabsContent value="security-updates">
            <SecurityUpdates />
          </TabsContent>

        <TabsContent value="epo">
          <EPOManagement />
        </TabsContent>

        <TabsContent value="messages">
          <AdminMessages />
        </TabsContent>

          <TabsContent value="security">
            <SecurityCompliance />
          </TabsContent>

          <TabsContent value="logs">
            <LogsCenter />
          </TabsContent>

          <TabsContent value="analytics">
            <AdminAnalytics />
          </TabsContent>

          <TabsContent value="architecture" className="space-y-8">
            <div className="space-y-8">
              <AnimatedArchitecture />
              <Architecture />
              
              <div className="space-y-6">
                <h3 className="text-2xl font-bold text-primary mb-6">System Diagrams</h3>
                <Tabs defaultValue="routing" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="routing">Routing Map</TabsTrigger>
                    <TabsTrigger value="subscription">Subscription Flow</TabsTrigger>
                    <TabsTrigger value="datamodel">Data Model</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="routing" className="mt-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>Application Routing Structure</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <Mermaid title="Application Routing Architecture" diagram={`graph LR
    Start([User Access]) --> Index["/"]
    Index --> |Anonymous| Landing[Landing Page]
    Index --> |Authenticated| RoleCheck{Check Role}
    
    RoleCheck --> |Admin| AdminDash[Admin Dashboard]
    RoleCheck --> |User| UserPortal[User Portal]
    
    Landing --> Auth[Authentication]
    Auth --> Setup["/setup/:plan"]
    Setup --> Portal["/portal"]
    
    Portal --> |Admin Actions| AdminTabs[Admin Tabs]
    AdminTabs --> Downloads
    AdminTabs --> Users
    AdminTabs --> Agents
    AdminTabs --> Security
    AdminTabs --> EPO[Trellix ePO]
    AdminTabs --> Messages
    AdminTabs --> Audit
    AdminTabs --> Errors
    AdminTabs --> Analytics
    AdminTabs --> Architecture
    
    Any[Any Page] --> |Navigation| ArchPage["/architecture"]
    
    Index --> |Direct Nav| ArchPage
    Portal --> |Direct Nav| ArchPage
    Setup --> |Direct Nav| ArchPage
    
    style Start fill:#e1f5fe
    style AdminDash fill:#f3e5f5
    style UserPortal fill:#e8f5e8
    style ArchPage fill:#fff3e0`} />
                      </CardContent>
                    </Card>
                  </TabsContent>
                  
                  <TabsContent value="subscription" className="mt-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>Subscription & Agent Grant Flow</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <Mermaid title="User Subscription & Agent Assignment Flow" diagram={`sequenceDiagram
    participant U as User
    participant F as Frontend
    participant CS as check-subscription
    participant GLA as grant-latest-agent
    participant GLB as grant-latest-agent-bulk
    participant DB as Database
    
    U->>F: Access Portal
    F->>CS: Check subscription status
    CS->>DB: Query user_subscriptions
    DB-->>CS: Subscription data
    CS-->>F: Subscription status
    
    alt User has valid subscription
        F->>GLA: Request latest agent
        GLA->>DB: Query admin_agent_packages
        DB-->>GLA: Available agents
        GLA-->>F: Agent download info
        F-->>U: Show download options
    else No valid subscription
        F-->>U: Show upgrade prompt
    end
    
    alt Admin bulk operation
        F->>GLB: Bulk grant request
        GLB->>DB: Update multiple user grants
        DB-->>GLB: Success confirmation
        GLB-->>F: Bulk operation complete
    end`} />
                      </CardContent>
                    </Card>
                  </TabsContent>
                  
                  <TabsContent value="datamodel" className="mt-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>Core Database Schema</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <Mermaid title="Core Data Model & Entity Relationships" diagram={`erDiagram
    profiles {
        uuid id PK
        uuid user_id FK
        text display_name
        text avatar_url
        text bio
        timestamp created_at
        timestamp updated_at
    }
    
    user_subscriptions {
        uuid id PK
        uuid user_id FK
        text subscription_type
        timestamp expires_at
        boolean is_active
        timestamp created_at
    }
    
    admin_agent_packages {
        uuid id PK
        text name
        text version
        text file_name
        text description
        text_array features
        text size
        text status
        timestamp created_at
        timestamp updated_at
    }
    
    agent_downloads {
        uuid id PK
        uuid user_id FK
        uuid agent_package_id FK
        timestamp downloaded_at
        text download_status
        text ip_address
    }
    
    endpoints {
        uuid id PK
        uuid user_id FK
        text hostname
        text ip_address
        text os_version
        text agent_version
        timestamp last_checkin
        text status
        jsonb metadata
    }
    
    profiles ||--|| user_subscriptions : user_id
    profiles ||--o{ agent_downloads : user_id
    profiles ||--o{ endpoints : user_id
    admin_agent_packages ||--o{ agent_downloads : agent_package_id`} />
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </section>
  );
};
