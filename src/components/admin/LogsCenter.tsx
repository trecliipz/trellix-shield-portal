import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, AlertTriangle, FileText } from "lucide-react";
import { AuditLog } from "@/components/AuditLog";
import { ErrorLogs } from "@/components/ErrorLogs";

export const LogsCenter = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10">
          <FileText className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h2 className="text-2xl font-bold tracking-tight">System Logs</h2>
          <p className="text-muted-foreground">
            Monitor security events and system errors across all components
          </p>
        </div>
      </div>

      {/* Quick Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="modern-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Audit Events</p>
                <p className="text-2xl font-bold">
                  {JSON.parse(localStorage.getItem('security_events') || '[]').length}
                </p>
              </div>
              <Activity className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card className="modern-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Error Logs</p>
                <p className="text-2xl font-bold">
                  {JSON.parse(localStorage.getItem('error_logs') || '[]').length}
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
        <Card className="modern-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Issues</p>
                <p className="text-2xl font-bold text-orange-600">
                  {JSON.parse(localStorage.getItem('error_logs') || '[]').filter((log: any) => !log.resolved).length}
                </p>
              </div>
              <div className="flex items-center space-x-1">
                <Badge variant="destructive" className="px-2 py-1">
                  Active
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabbed Log Views */}
      <Tabs defaultValue="audit" className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-card/50 backdrop-blur-sm rounded-xl border border-border/50">
          <TabsTrigger 
            value="audit" 
            className="flex items-center space-x-2 px-6 py-3 transition-all duration-300 hover:scale-105 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            <Activity className="h-4 w-4" />
            <span>Security Audit</span>
          </TabsTrigger>
          <TabsTrigger 
            value="errors" 
            className="flex items-center space-x-2 px-6 py-3 transition-all duration-300 hover:scale-105 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            <AlertTriangle className="h-4 w-4" />
            <span>Error Monitoring</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="audit" className="mt-6">
          <AuditLog />
        </TabsContent>

        <TabsContent value="errors" className="mt-6">
          <ErrorLogs />
        </TabsContent>
      </Tabs>
    </div>
  );
};