import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SystemManagement } from './epo/SystemManagement';
import { PolicyManagement } from './epo/PolicyManagement';
import { TaskScheduler } from './epo/TaskScheduler';
import { EventMonitor } from './epo/EventMonitor';
import { EPOReporting } from './epo/EPOReporting';
import { IntegrationCenter } from './epo/IntegrationCenter';
import { RemoteOperations } from './epo/RemoteOperations';
import { 
  Shield, 
  Settings, 
  Clock, 
  Activity, 
  BarChart3, 
  Plug, 
  Terminal,
  AlertTriangle
} from 'lucide-react';

export const EPOManagement = () => {
  const [activeTab, setActiveTab] = useState('systems');

  // Mock ePO status data
  const epoStatus = {
    totalEndpoints: 1247,
    onlineEndpoints: 1156,
    offlineEndpoints: 91,
    criticalAlerts: 12,
    policyCompliance: 94.2,
    lastSync: '2 minutes ago'
  };

  return (
    <div className="space-y-6">
      {/* ePO Overview Header */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Trellix ePO Management</h2>
            <p className="text-muted-foreground">
              Enterprise Policy Orchestrator - Centralized security management platform
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant={epoStatus.criticalAlerts > 0 ? "destructive" : "default"}>
              {epoStatus.criticalAlerts} Critical Alerts
            </Badge>
            <Badge variant="outline">
              Last Sync: {epoStatus.lastSync}
            </Badge>
          </div>
        </div>

        {/* Quick Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Endpoints</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{epoStatus.totalEndpoints.toLocaleString()}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Online Systems</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{epoStatus.onlineEndpoints.toLocaleString()}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Offline Systems</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-600">{epoStatus.offlineEndpoints}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Policy Compliance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{epoStatus.policyCompliance}%</div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Main ePO Management Interface */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="systems" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Systems
          </TabsTrigger>
          <TabsTrigger value="policies" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Policies
          </TabsTrigger>
          <TabsTrigger value="tasks" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Tasks
          </TabsTrigger>
          <TabsTrigger value="events" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Events
          </TabsTrigger>
          <TabsTrigger value="reports" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Reports
          </TabsTrigger>
          <TabsTrigger value="integration" className="flex items-center gap-2">
            <Plug className="h-4 w-4" />
            Integration
          </TabsTrigger>
          <TabsTrigger value="remote" className="flex items-center gap-2">
            <Terminal className="h-4 w-4" />
            Remote Ops
          </TabsTrigger>
        </TabsList>

        <TabsContent value="systems">
          <SystemManagement />
        </TabsContent>

        <TabsContent value="policies">
          <PolicyManagement />
        </TabsContent>

        <TabsContent value="tasks">
          <TaskScheduler />
        </TabsContent>

        <TabsContent value="events">
          <EventMonitor />
        </TabsContent>

        <TabsContent value="reports">
          <EPOReporting />
        </TabsContent>

        <TabsContent value="integration">
          <IntegrationCenter />
        </TabsContent>

        <TabsContent value="remote">
          <RemoteOperations />
        </TabsContent>
      </Tabs>
    </div>
  );
};