import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  HelpCircle, 
  Phone, 
  MessageSquare, 
  BookOpen, 
  Video, 
  Users, 
  Download,
  ExternalLink,
  Clock,
  Globe
} from "lucide-react";

const supportChannels = [
  {
    icon: <Phone className="h-6 w-6" />,
    title: "Phone Support",
    description: "24/7 technical support for critical issues",
    contact: "+1-800-338-8754",
    availability: "24/7 for Enterprise customers"
  },
  {
    icon: <MessageSquare className="h-6 w-6" />,
    title: "Live Chat",
    description: "Real-time assistance from our support team",
    contact: "Available in customer portal",
    availability: "Mon-Fri 8AM-6PM EST"
  },
  {
    icon: <HelpCircle className="h-6 w-6" />,
    title: "Support Tickets",
    description: "Submit detailed support requests",
    contact: "support.trellix.com",
    availability: "24/7 submission, response within 4 hours"
  }
];

const knowledgeBase = [
  {
    category: "Installation & Setup",
    articles: [
      "System Requirements and Compatibility",
      "Step-by-Step Installation Guide",
      "Post-Installation Configuration",
      "Troubleshooting Installation Errors"
    ]
  },
  {
    category: "Security Updates",
    articles: [
      "Understanding DAT V3 Files",
      "Engine Update Best Practices",
      "Content Package Management",
      "MEDDAT and TIE Integration"
    ]
  },
  {
    category: "Policy Management",
    articles: [
      "Creating Custom Security Policies",
      "Group Policy Integration",
      "Scheduling Updates and Scans",
      "Performance Optimization"
    ]
  },
  {
    category: "Troubleshooting",
    articles: [
      "Common Error Codes and Solutions",
      "Performance Issues Resolution",
      "Network Connectivity Problems",
      "Log Analysis and Debugging"
    ]
  }
];

const systemRequirements = [
  {
    platform: "Windows",
    requirements: [
      "Windows 10/11 (64-bit)",
      "4 GB RAM minimum, 8 GB recommended",
      "2 GB free disk space",
      ".NET Framework 4.7.2 or higher",
      "PowerShell 5.1 or higher"
    ]
  },
  {
    platform: "macOS",
    requirements: [
      "macOS 11.0 (Big Sur) or later",
      "4 GB RAM minimum, 8 GB recommended",
      "2 GB free disk space",
      "Apple Silicon or Intel processor",
      "Administrator privileges for installation"
    ]
  },
  {
    platform: "Linux",
    requirements: [
      "RHEL 7/8, Ubuntu 18.04/20.04 LTS, SLES 12/15",
      "4 GB RAM minimum, 8 GB recommended",
      "2 GB free disk space",
      "Kernel version 3.10 or higher",
      "systemd or SysV init system"
    ]
  }
];

const trainingResources = [
  {
    type: "Video Tutorial",
    title: "Getting Started with Trellix Endpoint Security",
    duration: "45 minutes",
    level: "Beginner"
  },
  {
    type: "Webinar",
    title: "Advanced Threat Detection and Response",
    duration: "1 hour",
    level: "Intermediate"
  },
  {
    type: "Certification",
    title: "Trellix Certified Administrator",
    duration: "2 days",
    level: "Advanced"
  },
  {
    type: "Workshop",
    title: "Security Policy Optimization",
    duration: "4 hours",
    level: "Intermediate"
  }
];

export const Support = () => {
  return (
    <section id="support" className="py-20 bg-muted/30">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-primary mb-4">
            Support & Resources
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Get the help you need with comprehensive support options, documentation, and training resources.
          </p>
        </div>

        <Tabs defaultValue="contact" className="w-full">
          <TabsList className="grid w-full grid-cols-5 mb-8">
            <TabsTrigger value="contact">Contact Support</TabsTrigger>
            <TabsTrigger value="knowledge">Knowledge Base</TabsTrigger>
            <TabsTrigger value="requirements">System Requirements</TabsTrigger>
            <TabsTrigger value="training">Training</TabsTrigger>
            <TabsTrigger value="community">Community</TabsTrigger>
          </TabsList>

          <TabsContent value="contact" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {supportChannels.map((channel, index) => (
                <Card key={index} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-center space-x-3">
                      <div className="text-primary">{channel.icon}</div>
                      <CardTitle className="text-lg">{channel.title}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground mb-3">{channel.description}</p>
                    <p className="font-semibold text-primary mb-2">{channel.contact}</p>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Clock className="h-4 w-4 mr-1" />
                      {channel.availability}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Emergency Support</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  For critical security incidents requiring immediate attention, contact our emergency support line.
                </p>
                <div className="flex items-center space-x-4">
                  <Badge variant="destructive">EMERGENCY</Badge>
                  <span className="font-bold text-lg">+1-800-TRELLIX (873-5549)</span>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="knowledge" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {knowledgeBase.map((section, index) => (
                <Card key={index}>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <BookOpen className="h-5 w-5 mr-2 text-primary" />
                      {section.category}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {section.articles.map((article, articleIndex) => (
                        <li key={articleIndex} className="flex items-center text-muted-foreground hover:text-primary cursor-pointer transition-colors">
                          <ExternalLink className="h-4 w-4 mr-2" />
                          {article}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="requirements" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {systemRequirements.map((system, index) => (
                <Card key={index}>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Globe className="h-5 w-5 mr-2 text-primary" />
                      {system.platform}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {system.requirements.map((req, reqIndex) => (
                        <li key={reqIndex} className="flex items-start text-sm">
                          <div className="w-2 h-2 bg-primary rounded-full mt-2 mr-3 flex-shrink-0"></div>
                          {req}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="training" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {trainingResources.map((resource, index) => (
                <Card key={index} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center">
                        <Video className="h-5 w-5 mr-2 text-primary" />
                        {resource.title}
                      </CardTitle>
                      <Badge variant="outline">{resource.level}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-sm text-muted-foreground">{resource.type}</span>
                      <span className="text-sm font-medium">{resource.duration}</span>
                    </div>
                    <Button className="w-full">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Access Resource
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="community" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Users className="h-5 w-5 mr-2 text-primary" />
                    Community Forum
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">
                    Connect with other Trellix users, share experiences, and get answers from experts.
                  </p>
                  <Button className="w-full">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Join Community
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Download className="h-5 w-5 mr-2 text-primary" />
                    Download Center
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">
                    Access the latest software, updates, and documentation downloads.
                  </p>
                  <Button className="w-full">
                    <Download className="h-4 w-4 mr-2" />
                    Browse Downloads
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