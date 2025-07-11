import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Search, 
  Plus, 
  RefreshCw, 
  Monitor, 
  Wifi, 
  WifiOff, 
  AlertTriangle,
  CheckCircle,
  Server,
  Laptop,
  Smartphone
} from 'lucide-react';

export const SystemManagement = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  // Mock managed systems data
  const managedSystems = [
    {
      id: 'SYS001',
      name: 'DESKTOP-WRK001',
      ipAddress: '192.168.1.101',
      status: 'online',
      lastContact: '2 minutes ago',
      agentVersion: '5.7.8.195',
      os: 'Windows 11 Pro',
      type: 'workstation',
      group: 'Finance Department',
      compliance: 'compliant',
      threats: 0
    },
    {
      id: 'SYS002',
      name: 'LAPTOP-HR002',
      ipAddress: '192.168.1.156',
      status: 'offline',
      lastContact: '2 hours ago',
      agentVersion: '5.7.8.195',
      os: 'Windows 10 Pro',
      type: 'laptop',
      group: 'HR Department',
      compliance: 'non-compliant',
      threats: 1
    },
    {
      id: 'SYS003',
      name: 'SERVER-DC01',
      ipAddress: '192.168.1.10',
      status: 'online',
      lastContact: '30 seconds ago',
      agentVersion: '5.7.8.195',
      os: 'Windows Server 2022',
      type: 'server',
      group: 'Infrastructure',
      compliance: 'compliant',
      threats: 0
    },
    {
      id: 'SYS004',
      name: 'MOBILE-DEV003',
      ipAddress: '192.168.1.203',
      status: 'online',
      lastContact: '5 minutes ago',
      agentVersion: '5.7.8.195',
      os: 'Android 13',
      type: 'mobile',
      group: 'Development Team',
      compliance: 'compliant',
      threats: 0
    }
  ];

  const systemGroups = [
    { name: 'Finance Department', systems: 45, online: 42 },
    { name: 'HR Department', systems: 23, online: 20 },
    { name: 'Development Team', systems: 67, online: 65 },
    { name: 'Infrastructure', systems: 12, online: 12 },
    { name: 'Marketing', systems: 34, online: 31 }
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'online':
        return <Wifi className="h-4 w-4 text-green-600" />;
      case 'offline':
        return <WifiOff className="h-4 w-4 text-red-600" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-amber-600" />;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'server':
        return <Server className="h-4 w-4" />;
      case 'laptop':
        return <Laptop className="h-4 w-4" />;
      case 'mobile':
        return <Smartphone className="h-4 w-4" />;
      default:
        return <Monitor className="h-4 w-4" />;
    }
  };

  const filteredSystems = managedSystems.filter(system => {
    const matchesSearch = system.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         system.ipAddress.includes(searchTerm);
    const matchesFilter = filterStatus === 'all' || system.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>System Management</CardTitle>
              <CardDescription>
                Manage and monitor all endpoints in your ePO environment
              </CardDescription>
            </div>
            <div className="flex space-x-2">
              <Button variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add System
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="systems" className="space-y-4">
            <TabsList>
              <TabsTrigger value="systems">Managed Systems</TabsTrigger>
              <TabsTrigger value="groups">System Groups</TabsTrigger>
              <TabsTrigger value="discovery">Discovery</TabsTrigger>
            </TabsList>

            <TabsContent value="systems" className="space-y-4">
              {/* Search and Filter Controls */}
              <div className="flex space-x-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search systems by name or IP address..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Systems</SelectItem>
                    <SelectItem value="online">Online</SelectItem>
                    <SelectItem value="offline">Offline</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Systems Table */}
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>System</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Group</TableHead>
                      <TableHead>Last Contact</TableHead>
                      <TableHead>Compliance</TableHead>
                      <TableHead>Threats</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSystems.map((system) => (
                      <TableRow key={system.id}>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="font-medium">{system.name}</div>
                            <div className="text-sm text-muted-foreground">{system.ipAddress}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            {getStatusIcon(system.status)}
                            <span className="capitalize">{system.status}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            {getTypeIcon(system.type)}
                            <span className="capitalize">{system.type}</span>
                          </div>
                        </TableCell>
                        <TableCell>{system.group}</TableCell>
                        <TableCell>{system.lastContact}</TableCell>
                        <TableCell>
                          <Badge variant={system.compliance === 'compliant' ? 'default' : 'destructive'}>
                            {system.compliance}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={system.threats > 0 ? 'destructive' : 'secondary'}>
                            {system.threats}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button variant="outline" size="sm">
                            Manage
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            <TabsContent value="groups" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {systemGroups.map((group) => (
                  <Card key={group.name}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">{group.name}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Total Systems:</span>
                          <span className="font-medium">{group.systems}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Online:</span>
                          <span className="font-medium text-green-600">{group.online}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Offline:</span>
                          <span className="font-medium text-red-600">{group.systems - group.online}</span>
                        </div>
                        <div className="mt-3">
                          <div className="w-full bg-muted rounded-full h-2">
                            <div 
                              className="bg-green-600 h-2 rounded-full" 
                              style={{ width: `${(group.online / group.systems) * 100}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="discovery" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Network Discovery</CardTitle>
                    <CardDescription>
                      Automatically discover systems on your network
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">IP Range</label>
                      <Input placeholder="192.168.1.0/24" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Scan Type</label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select scan type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ping">Ping Sweep</SelectItem>
                          <SelectItem value="port">Port Scan</SelectItem>
                          <SelectItem value="wmi">WMI Query</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button className="w-full">
                      Start Discovery
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Agent Deployment</CardTitle>
                    <CardDescription>
                      Deploy ePO agents to discovered systems
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Target Systems</label>
                      <Input placeholder="Enter IP addresses or hostnames" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Credentials</label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select credential set" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">Domain Admin</SelectItem>
                          <SelectItem value="local">Local Admin</SelectItem>
                          <SelectItem value="service">Service Account</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button className="w-full">
                      Deploy Agent
                    </Button>
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