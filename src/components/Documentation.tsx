import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  BookOpen, 
  Code, 
  Settings, 
  Shield, 
  Download,
  ExternalLink,
  FileText,
  Terminal,
  Database,
  Network,
  Zap
} from "lucide-react";

const installationGuides = [
  {
    platform: "Windows",
    icon: <Settings className="h-5 w-5" />,
    guides: [
      "Prerequisites and System Preparation",
      "Silent Installation via MSI",
      "Active Directory Deployment",
      "Group Policy Configuration",
      "Registry Settings and Customization"
    ]
  },
  {
    platform: "macOS",
    icon: <Shield className="h-5 w-5" />,
    guides: [
      "macOS Installation Requirements",
      "Package (.pkg) Installation",
      "Configuration Profile Deployment",
      "Keychain and Certificate Management",
      "Mobile Device Management (MDM) Setup"
    ]
  },
  {
    platform: "Linux",
    icon: <Terminal className="h-5 w-5" />,
    guides: [
      "Package Manager Installation (RPM/DEB)",
      "Manual Installation and Configuration",
      "Service Management (systemd/SysV)",
      "SELinux and AppArmor Configuration",
      "Container and Virtualization Support"
    ]
  }
];

const apiEndpoints = [
  {
    method: "GET",
    endpoint: "/api/v1/agents",
    description: "Retrieve list of all managed agents",
    params: ["limit", "offset", "status"]
  },
  {
    method: "POST",
    endpoint: "/api/v1/agents/{id}/scan",
    description: "Initiate scan on specific agent",
    params: ["scan_type", "priority", "schedule"]
  },
  {
    method: "GET",
    endpoint: "/api/v1/threats",
    description: "Get threat detection events",
    params: ["from_date", "to_date", "severity"]
  },
  {
    method: "PUT",
    endpoint: "/api/v1/policies/{id}",
    description: "Update security policy configuration",
    params: ["policy_data", "apply_immediately"]
  },
  {
    method: "GET",
    endpoint: "/api/v1/updates",
    description: "Check for available security updates",
    params: ["update_type", "platform"]
  }
];

const integrationGuides = [
  {
    title: "SIEM Integration",
    icon: <Database className="h-6 w-6" />,
    description: "Connect Trellix with popular SIEM platforms",
    integrations: ["Splunk", "IBM QRadar", "Microsoft Sentinel", "LogRhythm"]
  },
  {
    title: "Network Security",
    icon: <Network className="h-6 w-6" />,
    description: "Integrate with network security solutions",
    integrations: ["Cisco ASA", "Palo Alto Networks", "Fortinet FortiGate", "pfSense"]
  },
  {
    title: "Cloud Platforms",
    icon: <Zap className="h-6 w-6" />,
    description: "Deploy and manage in cloud environments",
    integrations: ["AWS", "Microsoft Azure", "Google Cloud", "VMware vSphere"]
  },
  {
    title: "Identity Management",
    icon: <Shield className="h-6 w-6" />,
    description: "Integrate with identity and access management",
    integrations: ["Active Directory", "Azure AD", "Okta", "Ping Identity"]
  }
];

const bestPractices = [
  {
    category: "Security Hardening",
    practices: [
      "Enable real-time scanning with optimal performance settings",
      "Configure firewall rules for secure communication",
      "Implement principle of least privilege for service accounts",
      "Regular security policy reviews and updates",
      "Enable detailed logging and monitoring"
    ]
  },
  {
    category: "Performance Optimization", 
    practices: [
      "Schedule intensive scans during off-peak hours",
      "Exclude trusted applications and directories",
      "Optimize cache settings for frequent file access",
      "Monitor resource usage and set appropriate limits",
      "Use incremental updates to reduce bandwidth"
    ]
  },
  {
    category: "Deployment Strategy",
    practices: [
      "Pilot deployment in test environment first",
      "Gradual rollout with phased approach",
      "Maintain rollback procedures and backups",
      "Document all configuration changes",
      "Train administrators before full deployment"
    ]
  }
];

const troubleshootingGuides = [
  {
    category: "Installation Issues",
    icon: <Settings className="h-5 w-5" />,
    issues: [
      { code: "ERR_INSTALL_001", description: "Insufficient disk space", solution: "Free up at least 2GB disk space" },
      { code: "ERR_INSTALL_002", description: "Missing prerequisites", solution: "Install required .NET Framework version" },
      { code: "ERR_INSTALL_003", description: "Permission denied", solution: "Run installer as administrator" }
    ]
  },
  {
    category: "Network Connectivity",
    icon: <Network className="h-5 w-5" />,
    issues: [
      { code: "ERR_CONN_001", description: "Server unreachable", solution: "Check firewall rules and network connectivity" },
      { code: "ERR_CONN_002", description: "Certificate validation failed", solution: "Update root certificates or disable SSL verification" },
      { code: "ERR_CONN_003", description: "Proxy authentication required", solution: "Configure proxy settings with credentials" }
    ]
  },
  {
    category: "Performance Issues",
    icon: <Zap className="h-5 w-5" />,
    issues: [
      { code: "ERR_PERF_001", description: "High CPU usage during scan", solution: "Adjust scan thread count and priority" },
      { code: "ERR_PERF_002", description: "Slow file access", solution: "Add exclusions for frequently accessed files" },
      { code: "ERR_PERF_003", description: "Memory consumption high", solution: "Increase memory limits or restart service" }
    ]
  }
];

export const Documentation = () => {
  return (
    <section id="documentation" className="py-20">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-primary mb-4">
            Technical Documentation
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Comprehensive guides, API documentation, and best practices for implementing and managing Trellix security solutions.
          </p>
        </div>

        <Tabs defaultValue="installation" className="w-full">
          <TabsList className="grid w-full grid-cols-6 mb-8">
            <TabsTrigger value="installation">Installation</TabsTrigger>
            <TabsTrigger value="api">API Docs</TabsTrigger>
            <TabsTrigger value="integration">Integration</TabsTrigger>
            <TabsTrigger value="best-practices">Best Practices</TabsTrigger>
            <TabsTrigger value="troubleshooting">Troubleshooting</TabsTrigger>
            <TabsTrigger value="downloads">Downloads</TabsTrigger>
          </TabsList>

          <TabsContent value="installation" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {installationGuides.map((guide, index) => (
                <Card key={index} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <div className="text-primary mr-2">{guide.icon}</div>
                      {guide.platform}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3">
                      {guide.guides.map((item, itemIndex) => (
                        <li key={itemIndex} className="flex items-start text-sm">
                          <FileText className="h-4 w-4 mr-2 mt-0.5 text-primary flex-shrink-0" />
                          <span className="hover:text-primary cursor-pointer transition-colors">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="api" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Code className="h-5 w-5 mr-2 text-primary" />
                  REST API Reference
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-6">
                  Base URL: <code className="bg-muted px-2 py-1 rounded">https://api.trellix.com</code>
                </p>
                <div className="space-y-4">
                  {apiEndpoints.map((endpoint, index) => (
                    <div key={index} className="border border-border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-3">
                          <Badge variant={endpoint.method === 'GET' ? 'default' : endpoint.method === 'POST' ? 'secondary' : 'outline'}>
                            {endpoint.method}
                          </Badge>
                          <code className="text-sm font-mono">{endpoint.endpoint}</code>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{endpoint.description}</p>
                      <div className="flex flex-wrap gap-1">
                        {endpoint.params.map((param, paramIndex) => (
                          <Badge key={paramIndex} variant="outline" className="text-xs">
                            {param}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="integration" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {integrationGuides.map((integration, index) => (
                <Card key={index} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <div className="text-primary mr-2">{integration.icon}</div>
                      {integration.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground mb-4">{integration.description}</p>
                    <div className="space-y-2">
                      {integration.integrations.map((item, itemIndex) => (
                        <div key={itemIndex} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                          <span className="text-sm font-medium">{item}</span>
                          <Button variant="ghost" size="sm">
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="best-practices" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {bestPractices.map((practice, index) => (
                <Card key={index}>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Shield className="h-5 w-5 mr-2 text-primary" />
                      {practice.category}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3">
                      {practice.practices.map((item, itemIndex) => (
                        <li key={itemIndex} className="flex items-start text-sm">
                          <div className="w-2 h-2 bg-primary rounded-full mt-2 mr-3 flex-shrink-0"></div>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="troubleshooting" className="space-y-6">
            <div className="space-y-6">
              {troubleshootingGuides.map((guide, index) => (
                <Card key={index}>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <div className="text-primary mr-2">{guide.icon}</div>
                      {guide.category}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {guide.issues.map((issue, issueIndex) => (
                        <div key={issueIndex} className="border border-border rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <Badge variant="destructive" className="text-xs">
                              {issue.code}
                            </Badge>
                          </div>
                          <h4 className="font-semibold text-sm mb-1">{issue.description}</h4>
                          <p className="text-sm text-muted-foreground">
                            <strong>Solution:</strong> {issue.solution}
                          </p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="downloads" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Download className="h-5 w-5 mr-2 text-primary" />
                    Software Downloads
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button variant="outline" className="w-full justify-start">
                    <Download className="h-4 w-4 mr-2" />
                    Agent Installation Packages
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Download className="h-4 w-4 mr-2" />
                    Management Console
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Download className="h-4 w-4 mr-2" />
                    Security Updates
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <BookOpen className="h-5 w-5 mr-2 text-primary" />
                    Documentation Downloads
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button variant="outline" className="w-full justify-start">
                    <FileText className="h-4 w-4 mr-2" />
                    Installation Guide (PDF)
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <FileText className="h-4 w-4 mr-2" />
                    Administrator Guide (PDF)
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <FileText className="h-4 w-4 mr-2" />
                    API Reference (PDF)
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </section>
  );
};