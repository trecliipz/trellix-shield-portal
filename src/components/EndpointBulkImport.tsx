import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Upload, Monitor, Download } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface EndpointBulkImportProps {
  onEndpointsImported?: () => void;
  organizationId?: string;
}

export const EndpointBulkImport = ({ onEndpointsImported, organizationId }: EndpointBulkImportProps) => {
  const [showImport, setShowImport] = useState(false);
  const [csvData, setCsvData] = useState("");

  const downloadTemplate = () => {
    const template = `machine_name,os_type,description
DESKTOP-001,windows,Marketing Department Desktop
LAPTOP-HR-01,windows,HR Manager Laptop
SERVER-DB-01,linux,Database Server
WORKSTATION-DEV-01,windows,Development Workstation`;

    const blob = new Blob([template], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'endpoint-import-template.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    toast.success("Template downloaded successfully!");
  };

  const handleImport = async () => {
    if (!csvData.trim()) {
      toast.error("Please paste CSV data or upload a file");
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("You must be logged in to import endpoints");
        return;
      }

      const lines = csvData.trim().split('\n');
      const machineNames = lines.slice(1).map(line => {
        const [machineName, osType] = line.split(',');
        return {
          machine_name: machineName?.trim(),
          os_type: osType?.trim() || 'windows'
        };
      }).filter(endpoint => endpoint.machine_name);

      if (machineNames.length === 0) {
        toast.error("No valid machine names found");
        return;
      }

      // Get organization ID
      const { data: orgData } = await supabase
        .from('user_organizations')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!orgData) {
        toast.error("Organization not found");
        return;
      }

      const endpoints = machineNames.map(endpoint => ({
        user_id: user.id,
        organization_id: orgData.id,
        machine_name: endpoint.machine_name,
        os_type: endpoint.os_type,
        deployment_status: 'pending',
        health_status: 'unknown',
      }));

      const { error } = await supabase.from('endpoints').insert(endpoints);
      
      if (error) throw error;

      toast.success(`Successfully imported ${endpoints.length} endpoints!`);
      setShowImport(false);
      setCsvData("");
      onEndpointsImported?.();
    } catch (error) {
      toast.error("Error importing endpoints");
      console.error('Error:', error);
    }
  };

  return (
    <Dialog open={showImport} onOpenChange={setShowImport}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Upload className="h-4 w-4 mr-2" />
          Bulk Import Endpoints
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Monitor className="h-5 w-5" />
            <span>Bulk Import Endpoints</span>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Instructions</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              <ol className="list-decimal list-inside space-y-1">
                <li>Download the CSV template below</li>
                <li>Fill in machine names and OS types</li>
                <li>Upload the file or paste the data directly</li>
              </ol>
              <div className="mt-4">
                <Button onClick={downloadTemplate} variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Download CSV Template
                </Button>
              </div>
            </CardContent>
          </Card>

          <div>
            <Label htmlFor="csv-data">CSV Data</Label>
            <Textarea
              id="csv-data"
              placeholder="machine_name,os_type&#10;DESKTOP-001,windows&#10;LAPTOP-HR-01,windows"
              value={csvData}
              onChange={(e) => setCsvData(e.target.value)}
              rows={8}
              className="mt-1"
            />
          </div>

          <div className="flex space-x-2">
            <Button onClick={handleImport} className="flex-1">
              <Upload className="h-4 w-4 mr-2" />
              Import Endpoints
            </Button>
            <Button 
              variant="outline" 
              onClick={() => {
                setShowImport(false);
                setCsvData("");
              }}
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};