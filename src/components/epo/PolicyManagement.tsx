import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Shield, 
  Plus, 
  Edit, 
  Copy, 
  Trash2, 
  FileText, 
  CheckCircle, 
  AlertTriangle,
  Clock,
  Users
} from 'lucide-react';

export const PolicyManagement = () => {
  const [selectedPolicy, setSelectedPolicy] = useState(null);

  // Mock policy data
  const policies = [
    {
      id: 'POL001',
      name: 'Corporate Antivirus Policy',
      type: 'Antivirus',
      status: 'active',
      assigned: 847,
      compliant: 832,
      lastModified: '2024-01-15',
      version: '2.1',
      description: 'Standard antivirus protection for all corporate endpoints'
    },
    {
      id: 'POL002',
      name: 'Firewall Security Policy',
      type: 'Firewall',
      status: 'active',
      assigned: 1156,
      compliant: 1089,
      lastModified: '2024-01-12',
      version: '1.8',
      description: 'Network firewall configuration for workstations and servers'
    },
    {
      id: 'POL003',
      name: 'Data Loss Prevention',
      type: 'DLP',
      status: 'draft',
      assigned: 0,
      compliant: 0,
      lastModified: '2024-01-18',
      version: '1.0',
      description: 'Prevent sensitive data from leaving the organization'
    },
    {
      id: 'POL004',
      name: 'Mobile Device Security',
      type: 'Mobile',
      status: 'active',
      assigned: 234,
      compliant: 201,
      lastModified: '2024-01-10',
      version: '3.2',
      description: 'Security policies for mobile devices and BYOD'
    }
  ];

  const policyTemplates = [
    {
      name: 'Standard Workstation Policy',
      category: 'Endpoint Protection',
      description: 'Basic security policy for office workstations',
      products: ['Endpoint Security', 'Firewall', 'Web Protection']
    },
    {
      name: 'Server Protection Policy',
      category: 'Server Security',
      description: 'Enhanced security for critical server infrastructure',
      products: ['Server Security', 'Application Control', 'Change Control']
    },
    {
      name: 'Remote Worker Policy',
      category: 'Remote Access',
      description: 'Security policy for remote and mobile workers',
      products: ['VPN', 'Endpoint Security', 'Web Protection']
    },
    {
      name: 'Executive Protection',
      category: 'High Priority',
      description: 'Advanced security for executive and C-level users',
      products: ['Advanced Threat Protection', 'Email Security', 'Web Protection']
    }
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800">Active</Badge>;
      case 'draft':
        return <Badge variant="secondary">Draft</Badge>;
      case 'inactive':
        return <Badge variant="outline">Inactive</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getComplianceColor = (compliant: number, total: number) => {
    const percentage = total > 0 ? (compliant / total) * 100 : 0;
    if (percentage >= 95) return 'text-green-600';
    if (percentage >= 85) return 'text-amber-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Policy Management</CardTitle>
              <CardDescription>
                Create, deploy, and manage security policies across your environment
              </CardDescription>
            </div>
            <div className="flex space-x-2">
              <Button variant="outline" size="sm">
                <Copy className="h-4 w-4 mr-2" />
                Import
              </Button>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                New Policy
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="policies" className="space-y-4">
            <TabsList>
              <TabsTrigger value="policies">Active Policies</TabsTrigger>
              <TabsTrigger value="templates">Policy Templates</TabsTrigger>
              <TabsTrigger value="compliance">Compliance Overview</TabsTrigger>
              <TabsTrigger value="deployment">Deployment Status</TabsTrigger>
            </TabsList>

            <TabsContent value="policies" className="space-y-4">
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Policy Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Assigned</TableHead>
                      <TableHead>Compliance</TableHead>
                      <TableHead>Last Modified</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {policies.map((policy) => (
                      <TableRow key={policy.id}>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="font-medium">{policy.name}</div>
                            <div className="text-sm text-muted-foreground">v{policy.version}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{policy.type}</Badge>
                        </TableCell>
                        <TableCell>{getStatusBadge(policy.status)}</TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-1">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            <span>{policy.assigned}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className={`font-medium ${getComplianceColor(policy.compliant, policy.assigned)}`}>
                              {policy.assigned > 0 ? Math.round((policy.compliant / policy.assigned) * 100) : 0}%
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {policy.compliant}/{policy.assigned}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{policy.lastModified}</TableCell>
                        <TableCell>
                          <div className="flex space-x-1">
                            <Button variant="ghost" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Copy className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            <TabsContent value="templates" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {policyTemplates.map((template, index) => (
                  <Card key={index}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{template.name}</CardTitle>
                        <Badge variant="outline">{template.category}</Badge>
                      </div>
                      <CardDescription>{template.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div>
                          <label className="text-sm font-medium">Included Products:</label>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {template.products.map((product) => (
                              <Badge key={product} variant="secondary" className="text-xs">
                                {product}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <Button className="w-full" variant="outline">
                          <Plus className="h-4 w-4 mr-2" />
                          Create from Template
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="compliance" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Overall Compliance</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-green-600">94.2%</div>
                    <div className="text-sm text-muted-foreground">1,122 of 1,191 systems</div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Non-Compliant Systems</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-red-600">69</div>
                    <div className="text-sm text-muted-foreground">Require attention</div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Policy Violations</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-amber-600">12</div>
                    <div className="text-sm text-muted-foreground">Last 24 hours</div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Compliance by Policy Type</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {policies.filter(p => p.status === 'active').map((policy) => (
                      <div key={policy.id} className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="font-medium">{policy.name}</span>
                          <span className={getComplianceColor(policy.compliant, policy.assigned)}>
                            {policy.assigned > 0 ? Math.round((policy.compliant / policy.assigned) * 100) : 0}%
                          </span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div 
                            className="bg-green-600 h-2 rounded-full" 
                            style={{ width: `${policy.assigned > 0 ? (policy.compliant / policy.assigned) * 100 : 0}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="deployment" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Deployments</CardTitle>
                    <CardDescription>Latest policy deployment activities</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {[
                        { policy: 'Corporate Antivirus Policy', action: 'Updated', time: '2 hours ago', status: 'success' },
                        { policy: 'Firewall Security Policy', action: 'Deployed', time: '6 hours ago', status: 'success' },
                        { policy: 'Mobile Device Security', action: 'Failed', time: '1 day ago', status: 'error' },
                        { policy: 'Data Loss Prevention', action: 'Scheduled', time: 'Tomorrow', status: 'pending' }
                      ].map((deployment, index) => (
                        <div key={index} className="flex items-center justify-between p-3 border rounded">
                          <div className="space-y-1">
                            <div className="font-medium text-sm">{deployment.policy}</div>
                            <div className="text-xs text-muted-foreground">{deployment.action} • {deployment.time}</div>
                          </div>
                          <div className="flex items-center space-x-2">
                            {deployment.status === 'success' && <CheckCircle className="h-4 w-4 text-green-600" />}
                            {deployment.status === 'error' && <AlertTriangle className="h-4 w-4 text-red-600" />}
                            {deployment.status === 'pending' && <Clock className="h-4 w-4 text-amber-600" />}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Deployment Queue</CardTitle>
                    <CardDescription>Pending policy deployments</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="text-center text-muted-foreground py-8">
                        <Clock className="h-8 w-8 mx-auto mb-2" />
                        <p>No pending deployments</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};