import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Users, Search, UserCheck, UserX, Shield, UserPlus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'user';
  status: 'active' | 'suspended';
  registrationDate: string;
  lastLogin: string;
  hashedPassword?: string;
  tempPassword?: string;
  passwordResetDate?: string;
}

export const UserManagement = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showAddUser, setShowAddUser] = useState(false);
  const [newUser, setNewUser] = useState({ email: "", name: "", role: "user" as 'admin' | 'user' });
  const { toast } = useToast();

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = () => {
    const savedUsers = localStorage.getItem('admin_users');
    if (savedUsers) {
      setUsers(JSON.parse(savedUsers));
    } else {
      // Initialize with mock data
      const mockUsers: User[] = [
        {
          id: '1',
          email: 'admin@trellix.com',
          name: 'Admin',
          role: 'admin',
          status: 'active',
          registrationDate: '2024-01-15',
          lastLogin: '2024-07-11'
        },
        {
          id: '2',
          email: 'john.doe@company.com',
          name: 'John Doe',
          role: 'user',
          status: 'active',
          registrationDate: '2024-02-20',
          lastLogin: '2024-07-10'
        },
        {
          id: '3',
          email: 'jane.smith@company.com',
          name: 'Jane Smith',
          role: 'user',
          status: 'active',
          registrationDate: '2024-03-10',
          lastLogin: '2024-07-09'
        }
      ];
      setUsers(mockUsers);
      localStorage.setItem('admin_users', JSON.stringify(mockUsers));
    }
  };

  const saveUsers = (updatedUsers: User[]) => {
    setUsers(updatedUsers);
    localStorage.setItem('admin_users', JSON.stringify(updatedUsers));
  };

  const handleRoleChange = (userId: string, newRole: 'admin' | 'user') => {
    const updatedUsers = users.map(user =>
      user.id === userId ? { ...user, role: newRole } : user
    );
    saveUsers(updatedUsers);
    toast({
      title: "Role Updated",
      description: `User role changed to ${newRole}`,
    });
  };

  const handleStatusChange = (userId: string, newStatus: 'active' | 'suspended') => {
    const updatedUsers = users.map(user =>
      user.id === userId ? { ...user, status: newStatus } : user
    );
    saveUsers(updatedUsers);
    toast({
      title: "Status Updated",
      description: `User ${newStatus === 'active' ? 'activated' : 'suspended'}`,
    });
  };

  const handlePasswordReset = (userId: string) => {
    const tempPassword = Math.random().toString(36).slice(-8);
    const updatedUsers = users.map(user =>
      user.id === userId ? { 
        ...user, 
        tempPassword,
        passwordResetDate: new Date().toISOString().split('T')[0]
      } : user
    );
    saveUsers(updatedUsers);
    
    // Copy to clipboard
    navigator.clipboard.writeText(tempPassword);
    
    toast({
      title: "Password Reset",
      description: `Temporary password: ${tempPassword} (copied to clipboard)`,
      duration: 10000,
    });
  };

  const handleAddUser = () => {
    if (!newUser.email || !newUser.name) {
      toast({
        title: "Validation Error",
        description: "Email and name are required fields",
        variant: "destructive",
      });
      return;
    }

    // Check if email already exists
    if (users.some(user => user.email.toLowerCase() === newUser.email.toLowerCase())) {
      toast({
        title: "Email Already Exists",
        description: "A user with this email address already exists",
        variant: "destructive",
      });
      return;
    }

    const tempPassword = Math.random().toString(36).slice(-8);
    const newUserData: User = {
      id: Date.now().toString(),
      email: newUser.email,
      name: newUser.name,
      role: newUser.role,
      status: 'active',
      registrationDate: new Date().toISOString().split('T')[0],
      lastLogin: 'Never',
      tempPassword,
      passwordResetDate: new Date().toISOString().split('T')[0]
    };

    const updatedUsers = [...users, newUserData];
    saveUsers(updatedUsers);

    // Copy to clipboard
    navigator.clipboard.writeText(tempPassword);

    toast({
      title: "User Created Successfully",
      description: `Welcome email sent to ${newUser.email}. Temporary password: ${tempPassword} (copied to clipboard)`,
      duration: 10000,
    });

    // Reset form
    setNewUser({ email: "", name: "", role: "user" });
    setShowAddUser(false);
  };

  const filteredUsers = users.filter(user =>
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = {
    total: users.length,
    active: users.filter(u => u.status === 'active').length,
    admins: users.filter(u => u.role === 'admin').length,
    suspended: users.filter(u => u.status === 'suspended').length
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.active}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Admins</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.admins}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Suspended</CardTitle>
            <UserX className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.suspended}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>User Management</CardTitle>
            <Dialog open={showAddUser} onOpenChange={setShowAddUser}>
              <DialogTrigger asChild>
                <Button>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add User
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New User</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="user@company.com"
                      value={newUser.email}
                      onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="name">Full Name *</Label>
                    <Input
                      id="name"
                      placeholder="John Doe"
                      value={newUser.name}
                      onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="role">Role</Label>
                    <Select
                      value={newUser.role}
                      onValueChange={(value: 'admin' | 'user') => setNewUser({ ...newUser, role: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="user">User</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex space-x-2 pt-4">
                    <Button onClick={handleAddUser} className="flex-1">
                      Create User
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setShowAddUser(false);
                        setNewUser({ email: "", name: "", role: "user" });
                      }}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          <div className="flex items-center space-x-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Registration</TableHead>
                <TableHead>Last Login</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.email}</TableCell>
                  <TableCell>{user.name}</TableCell>
                  <TableCell>
                    <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                      {user.role}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={user.status === 'active' ? 'default' : 'destructive'}>
                      {user.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{user.registrationDate}</TableCell>
                  <TableCell>{user.lastLogin}</TableCell>
                  <TableCell>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" onClick={() => setSelectedUser(user)}>
                          Edit
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Edit User: {selectedUser?.email}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <label className="text-sm font-medium">Role</label>
                            <Select
                              value={selectedUser?.role}
                              onValueChange={(value: 'admin' | 'user') => {
                                if (selectedUser) {
                                  handleRoleChange(selectedUser.id, value);
                                  setSelectedUser({ ...selectedUser, role: value });
                                }
                              }}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="user">User</SelectItem>
                                <SelectItem value="admin">Admin</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <label className="text-sm font-medium">Status</label>
                            <Select
                              value={selectedUser?.status}
                              onValueChange={(value: 'active' | 'suspended') => {
                                if (selectedUser) {
                                  handleStatusChange(selectedUser.id, value);
                                  setSelectedUser({ ...selectedUser, status: value });
                                }
                              }}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="active">Active</SelectItem>
                                <SelectItem value="suspended">Suspended</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="flex space-x-2 mt-4">
                            <Button 
                              variant="outline" 
                              onClick={() => selectedUser && handlePasswordReset(selectedUser.id)}
                              className="flex-1"
                            >
                              Reset Password
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};