import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { 
  Shield, 
  Lock, 
  Eye, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  FileText, 
  Globe,
  Key,
  Database,
  Server,
  Activity
} from "lucide-react";

interface ComplianceStatus {
  name: string;
  status: 'compliant' | 'partial' | 'non-compliant';
  score: number;
  lastAudit: string;
  nextAudit: string;
  description: string;
}

interface SecurityMetric {
  name: string;
  value: string;
  status: 'good' | 'warning' | 'critical';
  trend: 'up' | 'down' | 'stable';
  icon: React.ReactNode;
}

export const SecurityCompliance = () => {
  const [complianceData, setComplianceData] = useState<ComplianceStatus[]>([]);
  const [securityMetrics, setSecurityMetrics] = useState<SecurityMetric[]>([]);

  useEffect(() => {
    // Load compliance data
    const compliance: ComplianceStatus[] = [
      {
        name: "SOC 2 Type II",
        status: "compliant",
        score: 98,
        lastAudit: "2024-12-15",
        nextAudit: "2025-12-15",
        description: "System and Organization Controls for security, availability, and confidentiality"
      },
      {
        name: "ISO 27001",
        status: "compliant",
        score: 95,
        lastAudit: "2024-11-20",
        nextAudit: "2025-11-20",
        description: "International standard for information security management systems"
      },
      {
        name: "GDPR",
        status: "compliant",
        score: 92,
        lastAudit: "2024-10-30",
        nextAudit: "2025-04-30",
        description: "General Data Protection Regulation for EU data protection and privacy"
      },
      {
        name: "HIPAA",
        status: "partial",
        score: 78,
        lastAudit: "2024-09-15",
        nextAudit: "2025-03-15",
        description: "Health Insurance Portability and Accountability Act compliance"
      },
      {
        name: "PCI DSS",
        status: "compliant",
        score: 89,
        lastAudit: "2024-08-10",
        nextAudit: "2025-08-10",
        description: "Payment Card Industry Data Security Standard"
      }
    ];

    const metrics: SecurityMetric[] = [
      {
        name: "Security Score",
        value: "94/100",
        status: "good",
        trend: "up",
        icon: <Shield className="h-5 w-5" />
      },
      {
        name: "Failed Login Attempts",
        value: "23",
        status: "warning",
        trend: "up",
        icon: <Lock className="h-5 w-5" />
      },
      {
        name: "Data Breaches",
        value: "0",
        status: "good",
        trend: "stable",
        icon: <Database className="h-5 w-5" />
      },
      {
        name: "Vulnerability Scans",
        value: "Daily",
        status: "good",
        trend: "stable",
        icon: <Eye className="h-5 w-5" />
      },
      {
        name: "Encryption Coverage",
        value: "100%",
        status: "good",
        trend: "stable",
        icon: <Key className="h-5 w-5" />
      },
      {
        name: "System Uptime",
        value: "99.9%",
        status: "good",
        trend: "stable",
        icon: <Server className="h-5 w-5" />
      }
    ];

    setComplianceData(compliance);
    setSecurityMetrics(metrics);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'compliant':
      case 'good':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'partial':
      case 'warning':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'non-compliant':
      case 'critical':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'compliant':
      case 'good':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'partial':
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'non-compliant':
      case 'critical':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const overallScore = Math.round(
    complianceData.reduce((sum, item) => sum + item.score, 0) / complianceData.length
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Shield className="h-6 w-6 text-primary" />
          <h3 className="text-2xl font-bold">Security & Compliance</h3>
        </div>
        <Badge className="bg-primary text-primary-foreground">
          Overall Score: {overallScore}/100
        </Badge>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
          <TabsTrigger value="security">Security Metrics</TabsTrigger>
          <TabsTrigger value="policies">Policies</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Overall Security Score */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Activity className="h-5 w-5" />
                <span>Security Dashboard</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary mb-2">{overallScore}</div>
                  <div className="text-sm text-muted-foreground">Overall Security Score</div>
                  <Progress value={overallScore} className="mt-2" />
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600 mb-2">
                    {complianceData.filter(c => c.status === 'compliant').length}
                  </div>
                  <div className="text-sm text-muted-foreground">Compliant Standards</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-yellow-600 mb-2">
                    {complianceData.filter(c => c.status === 'partial').length}
                  </div>
                  <div className="text-sm text-muted-foreground">Partial Compliance</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Security Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {securityMetrics.slice(0, 6).map((metric, index) => (
              <Card key={index}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {metric.icon}
                      <div>
                        <p className="text-sm font-medium">{metric.name}</p>
                        <p className="text-lg font-bold">{metric.value}</p>
                      </div>
                    </div>
                    <Badge className={getStatusColor(metric.status)}>
                      {getStatusIcon(metric.status)}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="compliance" className="space-y-4">
          {complianceData.map((compliance, index) => (
            <Card key={index}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center space-x-2">
                    <FileText className="h-5 w-5" />
                    <span>{compliance.name}</span>
                  </CardTitle>
                  <div className="flex items-center space-x-2">
                    <Badge className={getStatusColor(compliance.status)}>
                      {getStatusIcon(compliance.status)}
                      <span className="ml-1">{compliance.status.replace('-', ' ').toUpperCase()}</span>
                    </Badge>
                    <Badge variant="outline">
                      Score: {compliance.score}/100
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">{compliance.description}</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium">Last Audit</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(compliance.lastAudit).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Next Audit</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(compliance.nextAudit).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <Progress value={compliance.score} className="mt-4" />
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {securityMetrics.map((metric, index) => (
              <Card key={index}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      {metric.icon}
                      <div>
                        <h4 className="font-semibold">{metric.name}</h4>
                        <p className="text-2xl font-bold">{metric.value}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge className={getStatusColor(metric.status)}>
                        {metric.status.toUpperCase()}
                      </Badge>
                      <p className="text-sm text-muted-foreground mt-1">
                        Trend: {metric.trend}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="policies" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Data Privacy Policy</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Comprehensive data protection and privacy guidelines in compliance with GDPR and other regulations.
                </p>
                <Button variant="outline" className="w-full">
                  <Globe className="h-4 w-4 mr-2" />
                  View Privacy Policy
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Security Incident Response</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Procedures for identifying, responding to, and recovering from security incidents.
                </p>
                <Button variant="outline" className="w-full">
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  View Response Plan
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Access Control Policy</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Guidelines for user access management, authentication, and authorization protocols.
                </p>
                <Button variant="outline" className="w-full">
                  <Lock className="h-4 w-4 mr-2" />
                  View Access Policy
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Vulnerability Disclosure</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Process for reporting security vulnerabilities and our response procedures.
                </p>
                <Button variant="outline" className="w-full">
                  <Eye className="h-4 w-4 mr-2" />
                  View Disclosure Policy
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};