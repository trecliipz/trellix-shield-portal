
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Upload, Users, FileText, CheckCircle, AlertTriangle, Download } from "lucide-react";
import { toast } from "sonner";

interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'user';
  status: 'active' | 'suspended';
  registrationDate: string;
  lastLogin: string;
  tempPassword?: string;
  passwordResetDate?: string;
}

interface BulkUserImportProps {
  onUsersImported?: (users: User[]) => void;
  organizationId?: string;
}

export const BulkUserImport = ({ onUsersImported, organizationId }: BulkUserImportProps) => {
  const [showImport, setShowImport] = useState(false);
  const [csvData, setCsvData] = useState("");
  const [importResults, setImportResults] = useState<{
    successful: any[];
    failed: any[];
    total: number;
  } | null>(null);

  const downloadTemplate = () => {
    const template = `email,name,role
john.doe@company.com,John Doe,user
jane.smith@company.com,Jane Smith,admin
mike.johnson@company.com,Mike Johnson,user`;

    const blob = new Blob([template], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'user-import-template.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    toast.success("Template downloaded successfully!");
  };

  const processCsvData = (csvText: string) => {
    const lines = csvText.trim().split('\n');
    if (lines.length < 2) {
      throw new Error('CSV must contain at least a header row and one data row');
    }

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    if (!headers.includes('email') || !headers.includes('name')) {
      throw new Error('CSV must contain "email" and "name" columns');
    }

    const users = [];
    const errors = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      if (values.length !== headers.length) {
        errors.push(`Line ${i + 1}: Invalid column count`);
        continue;
      }

      const userData: any = {};
      headers.forEach((header, index) => {
        userData[header] = values[index];
      });

      // Validate required fields
      if (!userData.email || !userData.name) {
        errors.push(`Line ${i + 1}: Missing required fields`);
        continue;
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(userData.email)) {
        errors.push(`Line ${i + 1}: Invalid email format`);
        continue;
      }

      // Set default role if not provided
      if (!userData.role || !['admin', 'user'].includes(userData.role)) {
        userData.role = 'user';
      }

      users.push({
        ...userData,
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        status: 'active',
        registrationDate: new Date().toISOString().split('T')[0],
        lastLogin: 'Never',
        tempPassword: Math.random().toString(36).slice(-8),
        passwordResetDate: new Date().toISOString().split('T')[0]
      });
    }

    return { users, errors };
  };

  const handleImport = () => {
    if (!csvData.trim()) {
      toast.error("Please paste CSV data or upload a file");
      return;
    }

    try {
      const { users, errors } = processCsvData(csvData);
      
      // Check for duplicate emails in existing users
      const existingUsers = JSON.parse(localStorage.getItem('admin_users') || '[]');
      const existingEmails = existingUsers.map((u: any) => u.email.toLowerCase());
      
      const successful = users.filter(user => 
        !existingEmails.includes(user.email.toLowerCase())
      );
      
      const failed = [
        ...users.filter(user => 
          existingEmails.includes(user.email.toLowerCase())
        ).map(user => ({ ...user, error: 'Email already exists' })),
        ...errors.map(error => ({ error }))
      ];

      setImportResults({
        successful,
        failed,
        total: users.length + errors.length
      });

      if (successful.length > 0 && onUsersImported) {
        onUsersImported(successful);
        toast.success(`${successful.length} users imported successfully${failed.length > 0 ? `, ${failed.length} failed` : ''}`);
      } else {
        toast.error("No users could be imported. Please check your data.");
      }

    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to process CSV data");
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
      toast.error("Please upload a CSV file");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setCsvData(content);
    };
    reader.readAsText(file);
  };

  return (
    <Dialog open={showImport} onOpenChange={setShowImport}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Upload className="h-4 w-4 mr-2" />
          Bulk Import Users
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5" />
            <span>Bulk User Import</span>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Instructions</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              <ol className="list-decimal list-inside space-y-1">
                <li>Download the CSV template below</li>
                <li>Fill in user data (email, name, role)</li>
                <li>Upload the file or paste the data directly</li>
                <li>Review and confirm the import</li>
              </ol>
              <div className="mt-4">
                <Button onClick={downloadTemplate} variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Download CSV Template
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <div>
              <Label htmlFor="csv-file">Upload CSV File</Label>
              <input
                id="csv-file"
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="mt-1 block w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
              />
            </div>

            <div>
              <Label htmlFor="csv-data">Or Paste CSV Data</Label>
              <Textarea
                id="csv-data"
                placeholder="email,name,role&#10;john.doe@company.com,John Doe,user&#10;jane.smith@company.com,Jane Smith,admin"
                value={csvData}
                onChange={(e) => setCsvData(e.target.value)}
                rows={8}
                className="mt-1"
              />
            </div>
          </div>

          {importResults && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center space-x-2">
                  <FileText className="h-4 w-4" />
                  <span>Import Results</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{importResults.successful.length}</div>
                    <div className="text-sm text-muted-foreground">Successful</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">{importResults.failed.length}</div>
                    <div className="text-sm text-muted-foreground">Failed</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">{importResults.total}</div>
                    <div className="text-sm text-muted-foreground">Total</div>
                  </div>
                </div>

                {importResults.failed.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium text-red-600 flex items-center space-x-2">
                      <AlertTriangle className="h-4 w-4" />
                      <span>Failed Imports</span>
                    </h4>
                    <div className="max-h-32 overflow-y-auto space-y-1">
                      {importResults.failed.map((item, index) => (
                        <div key={index} className="text-sm text-muted-foreground">
                          {item.email ? `${item.email}: ${item.error}` : item.error}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <div className="flex space-x-2 pt-4">
            <Button onClick={handleImport} className="flex-1">
              <Users className="h-4 w-4 mr-2" />
              Import Users
            </Button>
            <Button 
              variant="outline" 
              onClick={() => {
                setShowImport(false);
                setCsvData("");
                setImportResults(null);
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
