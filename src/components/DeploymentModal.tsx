import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Search, Users, UserCheck, AlertCircle, Rocket } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useConfirm } from "@/hooks/useConfirm";
import { supabase } from "@/integrations/supabase/client";

interface User {
  id: string;
  name: string;
  email: string;
  department?: string;
  is_online?: boolean;
}

interface Agent {
  id: string;
  name: string;
  version: string;
}

interface DeploymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  agent: Agent;
}

export const DeploymentModal = ({ open, onOpenChange, agent }: DeploymentModalProps) => {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [deploymentType, setDeploymentType] = useState<"single" | "multiple" | "all">("single");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { confirm, ConfirmDialog } = useConfirm();

  useEffect(() => {
    if (open) {
      loadUsers();
      // Reset state when modal opens
      setSelectedUsers([]);
      setSearchQuery("");
      setDeploymentType("single");
    }
  }, [open]);

  useEffect(() => {
    // Filter users based on search query
    const filtered = users.filter(user =>
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (user.department && user.department.toLowerCase().includes(searchQuery.toLowerCase()))
    );
    setFilteredUsers(filtered);
}, [users, searchQuery]);

  useEffect(() => {
    const handler = () => {
      try {
        const cached = localStorage.getItem('synced_users');
        if (cached) {
          const parsed = JSON.parse(cached) as Array<{ id: string; name: string; email: string; department?: string }>;
          setUsers(parsed.map(u => ({ id: u.id, name: u.name, email: u.email, department: u.department, is_online: false })));
        }
      } catch {}
    };
    window.addEventListener('usersSynced', handler as unknown as EventListener);
    return () => window.removeEventListener('usersSynced', handler as unknown as EventListener);
  }, []);


  const loadUsers = async () => {
    try {
      // Prefer users synced from the User Management page
      const cached = localStorage.getItem('synced_users');
      if (cached) {
        const parsed = JSON.parse(cached) as Array<{ id: string; name: string; email: string; department?: string }>;
        const mapped = parsed.map(u => ({
          id: u.id,
          name: u.name,
          email: u.email,
          department: u.department,
          is_online: false,
        }));
        setUsers(mapped);
        return;
      }

      const { data, error } = await supabase.functions.invoke('list-profiles');

      if (error) {
        // Fallback to mock data if database fails
        const mockUsers: User[] = [
          { id: '1', name: 'John Doe', email: 'john.doe@company.com', department: 'IT Department', is_online: true },
          { id: '2', name: 'Jane Smith', email: 'jane.smith@company.com', department: 'Finance Department', is_online: true },
          { id: '3', name: 'Mike Johnson', email: 'mike.johnson@company.com', department: 'HR Department', is_online: false },
          { id: '4', name: 'Sarah Wilson', email: 'sarah.wilson@company.com', department: 'Marketing Department', is_online: true },
          { id: '5', name: 'David Brown', email: 'david.brown@company.com', department: 'Operations Department', is_online: false },
          { id: '6', name: 'Lisa Garcia', email: 'lisa.garcia@company.com', department: 'Sales Department', is_online: true }
        ];
        setUsers(mockUsers);
      } else {
        const mapped = (data || []).map((u: any) => ({
          id: u.id,
          name: u.name,
          email: u.email,
          department: u.department,
          is_online: u.is_online ?? false,
        }));
        setUsers(mapped);
      }
    } catch (error) {
      console.error('Error loading users:', error);
      toast({
        title: "Error",
        description: "Failed to load users. Using sample data.",
        variant: "destructive"
      });
    }
  };

  const handleUserSelection = (userId: string, checked: boolean) => {
    if (deploymentType === "single") {
      setSelectedUsers(checked ? [userId] : []);
    } else {
      setSelectedUsers(prev =>
        checked
          ? [...prev, userId]
          : prev.filter(id => id !== userId)
      );
    }
  };

  const handleSelectAll = () => {
    setSelectedUsers(filteredUsers.map(user => user.id));
  };

  const handleDeselectAll = () => {
    setSelectedUsers([]);
  };

  const getButtonText = () => {
    if (deploymentType === "all") {
      return `Deploy to All Users (${filteredUsers.length})`;
    }
    if (deploymentType === "single") {
      return selectedUsers.length === 1 ? "Deploy to Selected User" : "Select a User";
    }
    return selectedUsers.length > 0 
      ? `Deploy to ${selectedUsers.length} Users`
      : "Select Users";
  };

  const canDeploy = () => {
    if (deploymentType === "all") return true;
    return selectedUsers.length > 0;
  };



  const handleDeploy = async () => {
    let targetUsers: User[] = [];
    let deploymentTypeText = "";

    if (deploymentType === "all") {
      targetUsers = filteredUsers;
      deploymentTypeText = "all users";
    } else {
      targetUsers = filteredUsers.filter(user => selectedUsers.includes(user.id));
      deploymentTypeText = deploymentType === "single" ? "1 user" : `${targetUsers.length} users`;
    }

    const userNames = targetUsers.length <= 3 
      ? targetUsers.map(u => u.name).join(", ")
      : `${targetUsers.slice(0, 3).map(u => u.name).join(", ")} and ${targetUsers.length - 3} others`;

    const confirmed = await confirm({
      title: "Confirm Deployment",
      description: `Are you sure you want to deploy ${agent.name} v${agent.version} to ${deploymentTypeText}?\n\nTarget users: ${userNames}`,
      confirmText: "Deploy Now"
    });

    if (!confirmed) return;

    setLoading(true);

    try {
      // Simulate deployment process
      toast({
        title: "Deployment Started",
        description: `Deploying ${agent.name} to ${targetUsers.length} user${targetUsers.length > 1 ? 's' : ''}...`,
      });

      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      toast({
        title: "Deployment Complete",
        description: `${agent.name} has been successfully deployed to ${targetUsers.length} user${targetUsers.length > 1 ? 's' : ''}.`,
      });

      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Deployment Failed",
        description: "An error occurred during deployment. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Rocket className="h-5 w-5" />
              Deploy {agent.name} v{agent.version}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Deployment Type Selection */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">Deployment Options</Label>
              <RadioGroup
                value={deploymentType}
                onValueChange={(value) => {
                  setDeploymentType(value as "single" | "multiple" | "all");
                  setSelectedUsers([]);
                }}
                className="space-y-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="single" id="single" />
                  <Label htmlFor="single">Deploy to Single User - Select exactly one user for deployment</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="multiple" id="multiple" />
                  <Label htmlFor="multiple">Deploy to Multiple Users (Bulk) - Select multiple users with checkboxes</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="all" id="all" />
                  <Label htmlFor="all">Deploy to All Users - Deploy to all users at once ({filteredUsers.length} users)</Label>
                </div>
              </RadioGroup>
            </div>

            {/* Search */}
            <div className="space-y-2">
              <Label className="text-base font-semibold">Search Users</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Filter users by name, email, or department..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Bulk Actions */}
            {deploymentType === "multiple" && (
              <div className="flex items-center gap-3">
                <Button variant="outline" size="sm" onClick={handleSelectAll}>
                  <UserCheck className="h-4 w-4 mr-2" />
                  Select All ({filteredUsers.length})
                </Button>
                <Button variant="outline" size="sm" onClick={handleDeselectAll}>
                  Deselect All
                </Button>
                {selectedUsers.length > 0 && (
                  <Badge variant="secondary" className="ml-auto">
                    {selectedUsers.length} selected
                  </Badge>
                )}
              </div>
            )}

            {/* User List */}
            <div className="space-y-2">
                <div className="flex items-center">
                  <Label className="text-base font-semibold flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    User List ({filteredUsers.length} users)
                  </Label>
                </div>


              
              <div className="border rounded-lg max-h-64 overflow-y-auto">
                {filteredUsers.length === 0 ? (
                  <div className="p-4 text-center text-muted-foreground">
                    <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                    No users found matching your search criteria
                  </div>
                ) : (
                  <div className="space-y-1 p-2">
                    {filteredUsers.map((user) => (
                      <div
                        key={user.id}
                        className={`flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors ${
                          selectedUsers.includes(user.id) ? 'bg-muted' : ''
                        }`}
                      >
                        <Checkbox
                          checked={selectedUsers.includes(user.id)}
                          onCheckedChange={(checked) => 
                            handleUserSelection(user.id, checked as boolean)
                          }
                          disabled={deploymentType === "single" && selectedUsers.length > 0 && !selectedUsers.includes(user.id)}
                        />
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium truncate">{user.name}</span>
                            <Badge
                              variant={user.is_online ? "default" : "secondary"}
                              className="text-xs"
                            >
                              {user.is_online ? "Online" : "Offline"}
                            </Badge>
                          </div>
                          <div className="text-sm text-muted-foreground truncate">{user.email}</div>
                          {user.department && (
                            <div className="text-xs text-muted-foreground">{user.department}</div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Selection Summary */}
            {selectedUsers.length > 0 && deploymentType !== "all" && (
              <div className="bg-muted/50 p-3 rounded-lg">
                <Label className="text-sm font-medium">Selected Users:</Label>
                <div className="mt-1 text-sm text-muted-foreground">
                  {filteredUsers
                    .filter(user => selectedUsers.includes(user.id))
                    .map(user => user.name)
                    .join(", ")}
                </div>
              </div>
            )}

            {/* Deploy Button */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleDeploy}
                disabled={!canDeploy() || loading}
                className="min-w-32"
              >
                {loading ? "Deploying..." : getButtonText()}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog />
    </>
  );
};