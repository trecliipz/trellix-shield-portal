import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { 
  Terminal, 
  Power, 
  Download, 
  Upload, 
  Settings, 
  Shield,
  FileText,
  Zap,
  Play,
  Pause,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react';

export const RemoteOperations = () => {
  const [selectedSystems, setSelectedSystems] = useState<string[]>([]);
  const [commandText, setCommandText] = useState('');

  // Mock data for remote operations
  const managedSystems = [
    { id: 'SYS001', name: 'DESKTOP-WRK001', status: 'online', os: 'Windows 11', lastContact: '2 min ago' },
    { id: 'SYS002', name: 'LAPTOP-HR002', status: 'offline', os: 'Windows 10', lastContact: '2 hours ago' },
    { id: 'SYS003', name: 'SERVER-DC01', status: 'online', os: 'Windows Server 2022', lastContact: '30 sec ago' },
    { id: 'SYS004', name: 'MOBILE-DEV003', status: 'online', os: 'Android 13', lastContact: '5 min ago' }
  ];

  const remoteCommands = [
    {
      id: 'CMD001',
      command: 'Get-Process | Where-Object {$_.ProcessName -eq "notepad"}',
      description: 'Check for running Notepad processes',
      category: 'System Query',
      lastUsed: '2024-01-19 14:30'
    },
    {
      id: 'CMD002',
      command: 'Get-Service -Name "McAfeeFramework" | Restart-Service',
      description: 'Restart McAfee Framework service',
      category: 'Service Management',
      lastUsed: '2024-01-18 09:15'
    },
    {
      id: 'CMD003',
      command: 'Get-HotFix | Sort-Object InstalledOn -Descending | Select-Object -First 10',
      description: 'List latest Windows updates',
      category: 'Update Management',
      lastUsed: '2024-01-17 16:45'
    }
  ];

  const activeOperations = [
    {
      id: 'OP001',
      operation: 'Wake-on-LAN',
      target: 'LAPTOP-HR002',
      status: 'in-progress',
      startTime: '14:25:30',
      progress: 75
    },
    {
      id: 'OP002',
      operation: 'Agent Update',
      target: 'Finance Department (45 systems)',
      status: 'completed',
      startTime: '13:15:00',
      progress: 100
    },
    {
      id: 'OP003',
      operation: 'Registry Modification',
      target: 'DESKTOP-WRK001',
      status: 'failed',
      startTime: '12:30:15',
      progress: 0
    }
  ];

  const licenseInfo = [
    { product: 'Endpoint Security', total: 1000, used: 847, available: 153, expiry: '2024-12-31' },
    { product: 'Data Loss Prevention', total: 500, used: 234, available: 266, expiry: '2024-08-15' },
    { product: 'Web Protection', total: 1200, used: 1156, available: 44, expiry: '2025-03-22' },
    { product: 'Email Security', total: 800, used: 672, available: 128, expiry: '2024-06-30' }
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'online':
        return <Badge className="bg-green-100 text-green-800">Online</Badge>;
      case 'offline':
        return <Badge variant="secondary">Offline</Badge>;
      case 'in-progress':
        return <Badge className="bg-blue-100 text-blue-800">In Progress</Badge>;
      case 'completed':
        return <Badge className="bg-green-100 text-green-800">Completed</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'in-progress':
        return <Clock className="h-4 w-4 text-blue-600" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Remote Operations</CardTitle>
              <CardDescription>
                Execute remote commands, manage systems, and control licenses
              </CardDescription>
            </div>
            <div className="flex space-x-2">
              <Button variant="outline" size="sm">
                <FileText className="h-4 w-4 mr-2" />
                Operation Log
              </Button>
              <Button size="sm">
                <Terminal className="h-4 w-4 mr-2" />
                Quick Command
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="commands" className="space-y-4">
            <TabsList>
              <TabsTrigger value="commands">Remote Commands</TabsTrigger>
              <TabsTrigger value="wake">Wake-on-LAN</TabsTrigger>
              <TabsTrigger value="files">File Management</TabsTrigger>
              <TabsTrigger value="services">Service Control</TabsTrigger>
              <TabsTrigger value="licenses">License Management</TabsTrigger>
              <TabsTrigger value="operations">Active Operations</TabsTrigger>
            </TabsList>

            <TabsContent value="commands" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Execute Remote Command</CardTitle>
                    <CardDescription>
                      Run PowerShell commands on selected systems
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Target Systems</label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select systems..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all-online">All Online Systems</SelectItem>
                          <SelectItem value="finance">Finance Department</SelectItem>
                          <SelectItem value="hr">HR Department</SelectItem>
                          <SelectItem value="custom">Custom Selection</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Command</label>
                      <Textarea
                        placeholder="Enter PowerShell command..."
                        value={commandText}
                        onChange={(e) => setCommandText(e.target.value)}
                        rows={4}
                      />
                    </div>
                    <div className="flex space-x-2">
                      <Button className="flex-1">
                        <Play className="h-4 w-4 mr-2" />
                        Execute
                      </Button>
                      <Button variant="outline">
                        <FileText className="h-4 w-4 mr-2" />
                        Save as Script
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Saved Commands</CardTitle>
                    <CardDescription>
                      Frequently used remote commands
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {remoteCommands.map((cmd) => (
                        <div key={cmd.id} className="p-3 border rounded">
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <Badge variant="outline" className="text-xs">
                                {cmd.category}
                              </Badge>
                              <span className="text-xs text-muted-foreground">{cmd.lastUsed}</span>
                            </div>
                            <div className="text-sm font-medium">{cmd.description}</div>
                            <div className="text-xs font-mono bg-muted p-2 rounded">
                              {cmd.command}
                            </div>
                            <Button size="sm" variant="outline" className="w-full">
                              Use Command
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="wake" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Wake-on-LAN Control</CardTitle>
                    <CardDescription>
                      Remotely wake up powered-off systems
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="border rounded-lg">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>System</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Action</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {managedSystems.map((system) => (
                            <TableRow key={system.id}>
                              <TableCell>
                                <div>
                                  <div className="font-medium">{system.name}</div>
                                  <div className="text-sm text-muted-foreground">{system.os}</div>
                                </div>
                              </TableCell>
                              <TableCell>{getStatusBadge(system.status)}</TableCell>
                              <TableCell>
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  disabled={system.status === 'online'}
                                >
                                  <Power className="h-4 w-4 mr-1" />
                                  Wake
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Bulk Wake Operations</CardTitle>
                    <CardDescription>
                      Wake multiple systems by group or filter
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Target Group</label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select group..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all-offline">All Offline Systems</SelectItem>
                          <SelectItem value="finance-offline">Finance (Offline)</SelectItem>
                          <SelectItem value="hr-offline">HR (Offline)</SelectItem>
                          <SelectItem value="dev-offline">Development (Offline)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Schedule</label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="When to wake..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="now">Immediately</SelectItem>
                          <SelectItem value="maintenance">Next Maintenance Window</SelectItem>
                          <SelectItem value="custom">Custom Schedule</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button className="w-full">
                      <Zap className="h-4 w-4 mr-2" />
                      Execute Wake Operation
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="files" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>File Deployment</CardTitle>
                    <CardDescription>
                      Deploy files and scripts to remote systems
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Source File</label>
                      <Input type="file" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Target Path</label>
                      <Input placeholder="C:\Temp\filename.exe" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Target Systems</label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select systems..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Systems</SelectItem>
                          <SelectItem value="finance">Finance Department</SelectItem>
                          <SelectItem value="hr">HR Department</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button className="w-full">
                      <Upload className="h-4 w-4 mr-2" />
                      Deploy File
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>File Retrieval</CardTitle>
                    <CardDescription>
                      Collect files from remote systems
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">File Path</label>
                      <Input placeholder="C:\Users\%USERNAME%\Documents\report.txt" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Source Systems</label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select systems..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Systems</SelectItem>
                          <SelectItem value="finance">Finance Department</SelectItem>
                          <SelectItem value="hr">HR Department</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Collection Method</label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select method..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="copy">Copy to ePO Server</SelectItem>
                          <SelectItem value="compress">Compress and Copy</SelectItem>
                          <SelectItem value="hash">Generate Hash Only</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button className="w-full">
                      <Download className="h-4 w-4 mr-2" />
                      Retrieve Files
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="services" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Service Control</CardTitle>
                    <CardDescription>Manage Windows services remotely</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Service Name</label>
                      <Input placeholder="McAfeeFramework" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Action</label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select action..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="start">Start Service</SelectItem>
                          <SelectItem value="stop">Stop Service</SelectItem>
                          <SelectItem value="restart">Restart Service</SelectItem>
                          <SelectItem value="status">Check Status</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button className="w-full">
                      <Settings className="h-4 w-4 mr-2" />
                      Execute
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Registry Management</CardTitle>
                    <CardDescription>Modify registry settings</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Registry Path</label>
                      <Input placeholder="HKLM\SOFTWARE\..." />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Value Name</label>
                      <Input placeholder="Setting name" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Value Data</label>
                      <Input placeholder="New value" />
                    </div>
                    <Button className="w-full">
                      <Settings className="h-4 w-4 mr-2" />
                      Update Registry
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>System Commands</CardTitle>
                    <CardDescription>Execute system-level operations</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button className="w-full" variant="outline">
                      <Power className="h-4 w-4 mr-2" />
                      Reboot Systems
                    </Button>
                    <Button className="w-full" variant="outline">
                      <Download className="h-4 w-4 mr-2" />
                      Force Update Check
                    </Button>
                    <Button className="w-full" variant="outline">
                      <Shield className="h-4 w-4 mr-2" />
                      Agent Health Check
                    </Button>
                    <Button className="w-full" variant="outline">
                      <FileText className="h-4 w-4 mr-2" />
                      Collect System Info
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="licenses" className="space-y-4">
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>Total Licenses</TableHead>
                      <TableHead>Used</TableHead>
                      <TableHead>Available</TableHead>
                      <TableHead>Utilization</TableHead>
                      <TableHead>Expiry Date</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {licenseInfo.map((license, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{license.product}</TableCell>
                        <TableCell>{license.total}</TableCell>
                        <TableCell>{license.used}</TableCell>
                        <TableCell>{license.available}</TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="text-sm font-medium">
                              {Math.round((license.used / license.total) * 100)}%
                            </div>
                            <div className="w-20 bg-muted rounded-full h-2">
                              <div 
                                className="bg-blue-600 h-2 rounded-full" 
                                style={{ width: `${(license.used / license.total) * 100}%` }}
                              />
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">{license.expiry}</TableCell>
                        <TableCell>
                          <Badge variant={license.available < 50 ? "destructive" : "default"}>
                            {license.available < 50 ? "Low" : "Good"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Total Licenses</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">3,500</div>
                    <div className="text-sm text-muted-foreground">Across all products</div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Used Licenses</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-blue-600">2,909</div>
                    <div className="text-sm text-muted-foreground">83% utilization</div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Available</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">591</div>
                    <div className="text-sm text-muted-foreground">Ready for deployment</div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Expiring Soon</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-amber-600">800</div>
                    <div className="text-sm text-muted-foreground">Within 90 days</div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="operations" className="space-y-4">
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Operation</TableHead>
                      <TableHead>Target</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Start Time</TableHead>
                      <TableHead>Progress</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activeOperations.map((operation) => (
                      <TableRow key={operation.id}>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            {getStatusIcon(operation.status)}
                            <span className="font-medium">{operation.operation}</span>
                          </div>
                        </TableCell>
                        <TableCell>{operation.target}</TableCell>
                        <TableCell>{getStatusBadge(operation.status)}</TableCell>
                        <TableCell className="text-sm">{operation.startTime}</TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="text-sm">{operation.progress}%</div>
                            <div className="w-20 bg-muted rounded-full h-2">
                              <div 
                                className="bg-blue-600 h-2 rounded-full" 
                                style={{ width: `${operation.progress}%` }}
                              />
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-1">
                            <Button variant="ghost" size="sm">
                              <Pause className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <FileText className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};