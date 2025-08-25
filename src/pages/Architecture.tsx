import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Download } from "lucide-react";
import { AnimatedArchitecture } from "@/components/AnimatedArchitecture";
import { Architecture as ArchitectureSection } from "@/components/Architecture";
import { Mermaid } from "@/components/Mermaid";
import { downloadCurrentPageHtml } from "@/utils/exportProject";
import { useToast } from "@/hooks/use-toast";

const routingDiagram = `
graph LR
    A[/] --> B[Index Page]
    C[/setup/:plan] --> D[PlanSetup Page]
    E[/portal] --> F[Portal Page]
    G[/architecture] --> H[Architecture Page]
    I[/*] --> J[NotFound Page]
    
    B --> K[Hero]
    B --> L[Features]
    B --> M[Architecture Section]
    B --> N[Pricing]
    B --> O[Documentation]
    B --> P[Support]
    
    F --> Q[Dashboard]
    F --> R[Agent Management]
    F --> S[EPO Integration]
    F --> T[User Management]
    
    H --> U[Animated Architecture]
    H --> V[Static Architecture]
    H --> W[System Diagrams]
`;

const subscriptionFlowDiagram = `
sequenceDiagram
    participant U as User
    participant P as Portal
    participant S as Supabase
    participant E as Edge Function
    participant D as Database
    
    U->>P: Login & Navigate to Portal
    P->>S: Check subscription status
    S->>D: Query user_subscriptions
    D-->>S: Return subscription data
    S-->>P: Subscription details
    
    alt Has Active Subscription
        P->>E: Call grant-latest-agent
        E->>D: Query admin_agent_packages
        E->>D: Check existing agent_downloads
        E->>D: Insert/Update agent_downloads
        E-->>P: Agent granted successfully
        P->>U: Show available downloads
    else No Subscription
        P->>U: Show subscription options
    end
    
    Note over U,D: Admin can use grant-latest-agent-bulk for all users
`;

const dataModelDiagram = `
erDiagram
    profiles {
        uuid id PK
        text name
        text email
        text phone
        text department
        boolean is_online
        timestamp last_seen
    }
    
    user_subscriptions {
        uuid id PK
        uuid user_id FK
        uuid plan_id FK
        text plan_type
        text status
        integer downloads_used
        integer max_downloads
        timestamp trial_ends_at
    }
    
    admin_agent_packages {
        uuid id PK
        text name
        text version
        text platform
        text file_name
        bigint file_size
        boolean is_active
        boolean is_recommended
        jsonb features
    }
    
    agent_downloads {
        uuid id PK
        uuid user_id FK
        text agent_name
        text agent_version
        text platform
        text status
        timestamp downloaded_at
        timestamp installed_at
        uuid assigned_by_admin FK
    }
    
    endpoints {
        uuid id PK
        uuid user_id FK
        uuid organization_id FK
        text machine_name
        text os_type
        text deployment_status
        text health_status
        text ip_address
        timestamp last_check_in
    }
    
    profiles ||--o{ user_subscriptions : "has"
    profiles ||--o{ agent_downloads : "receives"
    profiles ||--o{ endpoints : "manages"
    admin_agent_packages ||--o{ agent_downloads : "generates"
`;

export const ArchitecturePage = () => {
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();

  const handleExport = async () => {
    setIsExporting(true);
    try {
      await downloadCurrentPageHtml();
      toast({
        title: "Export Successful",
        description: "Architecture page exported as HTML file",
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to export the page. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-primary mb-2">
                System Architecture
              </h1>
              <p className="text-muted-foreground">
                Comprehensive overview of the Trellix Shield Portal architecture, data flows, and system components.
              </p>
            </div>
            <Button 
              onClick={handleExport}
              disabled={isExporting}
              variant="outline"
              className="ml-4"
            >
              <Download className="h-4 w-4 mr-2" />
              {isExporting ? "Exporting..." : "Export Page"}
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 lg:px-8 py-8 space-y-12">
        {/* Animated Architecture */}
        <section>
          <h2 className="text-3xl font-bold text-primary mb-6">Interactive Security Architecture</h2>
          <AnimatedArchitecture />
        </section>

        {/* Static Architecture */}
        <section>
          <ArchitectureSection />
        </section>

        {/* System Diagrams */}
        <section>
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl text-primary">System Diagrams</CardTitle>
              <CardDescription>
                Technical diagrams showing routing, data flows, and database relationships.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="routing" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="routing">App Routing</TabsTrigger>
                  <TabsTrigger value="subscription">Subscription Flow</TabsTrigger>
                  <TabsTrigger value="data">Data Model</TabsTrigger>
                </TabsList>
                
                <TabsContent value="routing" className="mt-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Application Routing Map</CardTitle>
                      <CardDescription>
                        Overview of all routes and page components in the application.
                      </CardDescription>
                    </CardHeader>
                     <CardContent>
                       <Mermaid title="Application Routing Map" diagram={routingDiagram} />
                     </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="subscription" className="mt-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Subscription & Agent Assignment Flow</CardTitle>
                      <CardDescription>
                        Sequence diagram showing how users get agent downloads based on their subscription.
                      </CardDescription>
                    </CardHeader>
                     <CardContent>
                       <Mermaid title="Subscription & Agent Assignment Flow" diagram={subscriptionFlowDiagram} />
                     </CardContent>
                   </Card>
                 </TabsContent>
                 
                 <TabsContent value="data" className="mt-6">
                   <Card>
                     <CardHeader>
                       <CardTitle>Core Data Model</CardTitle>
                       <CardDescription>
                         Entity relationship diagram of the main database tables and their relationships.
                       </CardDescription>
                     </CardHeader>
                     <CardContent>
                       <Mermaid title="Core Data Model & Entity Relationships" diagram={dataModelDiagram} />
                     </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  );
};