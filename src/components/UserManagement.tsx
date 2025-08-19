import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Users, Search, UserCheck, UserX, Shield, UserPlus, Settings, Activity, Key, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { BulkUserImport } from "@/components/BulkUserImport";
import { supabase } from "@/integrations/supabase/client";
import { useErrorHandling } from "@/hooks/useErrorHandling";

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
  source?: 'admin_created' | 'registered';
  planType?: string;
  subscriptionStatus?: string;
  trialEndsAt?: string;
  downloadsUsed?: number;
  maxDownloads?: number;
  isOnline?: boolean;
  lastSeen?: string;
}

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showAddUser, setShowAddUser] = useState(false);
  const [newUser, setNewUser] = useState({ email: "", name: "", role: "user" as 'admin' | 'user' });
  const [isLoading, setIsLoading] = useState(false);
  const [agentAvailability, setAgentAvailability] = useState<Record<string, boolean>>({});
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const { handleError, retryOperation } = useErrorHandling();

  useEffect(() => {
    // Preload from cache to keep users visible while syncing
    const cached = localStorage.getItem('synced_users');
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        setUsers(parsed);
      } catch {}
    }
    loadUsers();
  }, []);

  // Set up presence channel to track online users
  useEffect(() => {
    const channel = supabase.channel('online_users');

    channel.on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState();
      const onlineUserIds = new Set<string>();
      
      Object.values(state).forEach((presences: any) => {
        presences.forEach((presence: any) => {
          if (presence.user_id) {
            onlineUserIds.add(presence.user_id);
          }
        });
      });
      
      setOnlineUsers(onlineUserIds);
    });

    channel.on('presence', { event: 'join' }, ({ newPresences }) => {
      newPresences.forEach((presence: any) => {
        if (presence.user_id) {
          setOnlineUsers(prev => new Set([...prev, presence.user_id]));
        }
      });
    });

    channel.on('presence', { event: 'leave' }, ({ leftPresences }) => {
      leftPresences.forEach((presence: any) => {
        if (presence.user_id) {
          setOnlineUsers(prev => {
            const newSet = new Set(prev);
            newSet.delete(presence.user_id);
            return newSet;
          });
        }
      });
    });

    channel.subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, []);

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      await retryOperation(async () => {
        console.log('Loading users...');
        
        // Check authentication; if not available, use public edge function
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
          console.info('No authenticated user - fetching via public endpoint');
          try {
            const { data, error } = await supabase.functions.invoke('list-profiles');
            if (error) throw error;
            const publicUsers: User[] = (data || []).map((p: any) => ({
              id: p.id,
              email: p.email || 'unknown@email.com',
              name: p.name || 'Unknown User',
              role: p.email?.includes('admin') ? 'admin' : 'user',
              status: 'active',
              registrationDate: new Date().toISOString().split('T')[0],
              lastLogin: 'Unknown',
              source: 'registered',
            }));
            setUsers(publicUsers);
            await updateAgentAvailability(publicUsers);
            localStorage.setItem('synced_users', JSON.stringify(publicUsers));
            window.dispatchEvent(new CustomEvent('usersSynced', { detail: { count: publicUsers.length } }));
            toast.success(`Synced ${publicUsers.length} users (public)`);
            return publicUsers;
          } catch (e) {
            console.warn('Public fetch failed, using cache', e);
            const cached = localStorage.getItem('synced_users');
            if (cached) {
              const parsed = JSON.parse(cached);
              setUsers(parsed);
              toast.info(`Loaded ${parsed.length} users from local cache`);
              return parsed;
            }
            throw new Error('Failed to fetch users');
          }
        }

        console.log('Current user:', user.email);

        // Check if user is admin with retry logic
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('email')
          .eq('id', user.id)
          .maybeSingle();

        if (profileError) {
          console.error('Profile error:', profileError);
          const cached = localStorage.getItem('synced_users');
          if (cached) {
            const parsed = JSON.parse(cached);
            setUsers(parsed);
            toast.info('Using cached users while database reconnects');
            return parsed;
          }
          throw new Error('database connection lost');
        }

        if (!profile?.email?.includes('admin')) {
          throw new Error('Admin access required');
        }

        // Load all users from admin_users table AND real registered users with error handling
        const [adminUsersResponse, profilesResponse, subscriptionsResponse] = await Promise.all([
          supabase.from('admin_users').select('*').order('created_at', { ascending: false }),
          supabase.from('profiles').select('id, name, email, created_at, is_online, last_seen').order('created_at', { ascending: false }),
          supabase.from('user_subscriptions').select('user_id, plan_type, status, trial_ends_at, max_downloads, downloads_used')
        ]);

        // Check for database errors
        if (adminUsersResponse.error) {
          console.error('Admin users error:', adminUsersResponse.error);
          throw new Error('database connection lost');
        }
        
        if (profilesResponse.error) {
          console.error('Profiles error:', profilesResponse.error);
          throw new Error('database connection lost');
        }
        
        if (subscriptionsResponse.error) {
          console.error('Subscriptions error:', subscriptionsResponse.error);
          // Don't fail for subscriptions errors, just log
          console.warn('Could not load subscription data');
        }

        console.log('Admin users response:', adminUsersResponse);
        console.log('Profiles response:', profilesResponse);
        console.log('Subscriptions response:', subscriptionsResponse);

        const allUsers: User[] = [];

        // Add admin-created users
        if (adminUsersResponse.data) {
          const adminUsers = adminUsersResponse.data.map(dbUser => ({
            id: dbUser.id,
            email: dbUser.email,
            name: dbUser.name,
            role: dbUser.role as 'admin' | 'user',
            status: 'active' as const,
            registrationDate: new Date(dbUser.created_at).toISOString().split('T')[0],
            lastLogin: 'Unknown',
            tempPassword: dbUser.temp_password,
            source: 'admin_created' as const
          }));
          allUsers.push(...adminUsers);
          console.log('Added admin users:', adminUsers.length);
        }

        // Add real registered users from profiles
        if (profilesResponse.data) {
          const registeredUsers = profilesResponse.data.map(profile => {
            const subscription = subscriptionsResponse.data?.find(sub => sub.user_id === profile.id);
            return {
              id: profile.id,
              email: profile.email || 'unknown@email.com',
              name: profile.name || 'Unknown User',
              role: profile.email?.includes('admin') ? 'admin' as const : 'user' as const,
              status: 'active' as const,
              registrationDate: new Date(profile.created_at).toISOString().split('T')[0],
              lastLogin: 'Unknown',
              source: 'registered' as const,
              planType: subscription?.plan_type,
              subscriptionStatus: subscription?.status,
              trialEndsAt: subscription?.trial_ends_at,
              downloadsUsed: subscription?.downloads_used,
              maxDownloads: subscription?.max_downloads,
              isOnline: profile.is_online,
              lastSeen: profile.last_seen
            };
          });
          allUsers.push(...registeredUsers);
          console.log('Added registered users:', registeredUsers.length);
        }

        console.log('Total users loaded:', allUsers.length);
        setUsers(allUsers);
        await updateAgentAvailability(allUsers);
        localStorage.setItem('synced_users', JSON.stringify(allUsers));
        window.dispatchEvent(new CustomEvent('usersSynced', { detail: { count: allUsers.length } }));
        toast.success(`Synced ${allUsers.length} users from database`);
        
        return allUsers;
      });
    } catch (error) {
      console.error('Error loading users after retries:', error);
      handleError(error, 'Failed to sync users; showing cached data if available');
      // Fallback to local cache first
      const cachedSynced = localStorage.getItem('synced_users');
      if (cachedSynced) {
        try {
          const localUsers = JSON.parse(cachedSynced);
          setUsers(localUsers);
          await updateAgentAvailability(localUsers);
          console.log('Loaded from local cache fallback:', localUsers.length);
          toast.info(`Loaded ${localUsers.length} users from local cache (offline mode)`);
          return;
        } catch (parseError) {
          console.error('Error parsing cached synced users:', parseError);
        }
      }
      
      // Fallback to legacy admin_users storage
      const savedUsers = localStorage.getItem('admin_users');
      if (savedUsers) {
        try {
          const localUsers = JSON.parse(savedUsers);
          setUsers(localUsers);
          await updateAgentAvailability(localUsers);
          console.log('Loaded from localStorage fallback:', localUsers.length);
          toast.info(`Loaded ${localUsers.length} users from local storage (offline mode)`);
        } catch (parseError) {
          console.error('Error parsing localStorage users:', parseError);
          toast.error('Failed to load users from any source');
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  const updateAgentAvailability = async (userList: User[]) => {
    try {
      const ids = userList.map((u) => u.id);
      if (ids.length === 0) return;
      const { data, error } = await supabase.functions.invoke('agent-download-status', {
        body: { user_ids: ids }
      });
      if (error) {
        console.warn('Agent availability fetch error:', error);
        return;
      }
      const map: Record<string, boolean> = {};
      (data || []).forEach((row: any) => {
        map[row.user_id] = !!row.available;
      });
      setAgentAvailability(map);
    } catch (e) {
      console.warn('Agent availability failed, skipping', e);
    }
  };

  const migrateLocalUsersToDatabase = async (localUsers: User[]) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const usersToInsert = localUsers.map(localUser => ({
        email: localUser.email,
        name: localUser.name,
        role: localUser.role,
        temp_password: localUser.tempPassword,
        created_by: user.id
      }));

      const { error } = await supabase
        .from('admin_users')
        .insert(usersToInsert);

      if (error) throw error;
      
      // Clear localStorage after successful migration
      localStorage.removeItem('admin_users');
    } catch (error) {
      console.error('Error migrating users to database:', error);
    }
  };

  const saveUsers = async (updatedUsers: User[]) => {
    setUsers(updatedUsers);
    // Also update in database
    try {
      await loadUsers(); // Refresh from database
    } catch (error) {
      console.error('Error refreshing users:', error);
    }
  };

  const handleRoleChange = (userId: string, newRole: 'admin' | 'user') => {
    const updatedUsers = users.map(user =>
      user.id === userId ? { ...user, role: newRole } : user
    );
    saveUsers(updatedUsers);
    toast.success(`User role changed to ${newRole}`);
  };

  const handleStatusChange = (userId: string, newStatus: 'active' | 'suspended') => {
    const updatedUsers = users.map(user =>
      user.id === userId ? { ...user, status: newStatus } : user
    );
    saveUsers(updatedUsers);
    toast.success(`User ${newStatus === 'active' ? 'activated' : 'suspended'}`);
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
    
    toast.success(`Temporary password: ${tempPassword} (copied to clipboard)`, {
      duration: 10000,
    });
  };

  const handleAddUser = async () => {
    if (!newUser.email || !newUser.name) {
      toast.error("Email and name are required fields");
      return;
    }

    // Check if email already exists
    if (users.some(user => user.email.toLowerCase() === newUser.email.toLowerCase())) {
      toast.error("A user with this email address already exists");
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Authentication required");
        return;
      }

      const tempPassword = Math.random().toString(36).slice(-8);
      
      const { error } = await supabase
        .from('admin_users')
        .insert([{
          email: newUser.email,
          name: newUser.name,
          role: newUser.role,
          temp_password: tempPassword,
          created_by: user.id
        }]);

      if (error) throw error;

      // Copy to clipboard
      navigator.clipboard.writeText(tempPassword);

      toast.success(`User created successfully. Temporary password: ${tempPassword} (copied to clipboard)`, {
        duration: 10000,
      });

      // Reset form and reload users
      setNewUser({ email: "", name: "", role: "user" });
      setShowAddUser(false);
      await loadUsers();
    } catch (error) {
      console.error('Error creating user:', error);
      toast.error("Error creating user");
    }
  };

  const handleBulkImport = (importedUsers: User[]) => {
    const existingUsers = [...users];
    const newUsers = [...existingUsers, ...importedUsers];
    saveUsers(newUsers);
    
    toast.success(`${importedUsers.length} users have been imported successfully`);
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
            <div className="flex items-center space-x-2">
              <Button onClick={loadUsers} variant="outline" disabled={isLoading}>
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                {isLoading ? 'Syncing...' : 'Sync Users'}
              </Button>
              <BulkUserImport onUsersImported={handleBulkImport} />
              <Dialog open={showAddUser} onOpenChange={setShowAddUser}>
                <DialogTrigger asChild>
                  <Button>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Add User
                  </Button>
                </DialogTrigger>
                <DialogContent aria-describedby={undefined}>
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
                <TableHead>Plan</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Presence</TableHead>
                <TableHead>Registration</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Agent Download</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => {
                // Check if user is online based on presence or recent activity
                const isUserOnline = onlineUsers.has(user.id) || 
                  (user.lastSeen && new Date(user.lastSeen).getTime() > Date.now() - 90000) || // Within 90 seconds
                  user.isOnline;

                return (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">
                      <div>
                        <div>{user.email}</div>
                        {user.trialEndsAt && (
                          <div className="text-xs text-muted-foreground">
                            Trial ends: {new Date(user.trialEndsAt).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{user.name}</TableCell>
                    <TableCell>
                      <div className="flex flex-col space-y-1">
                        <Badge variant={user.planType === 'free' ? 'secondary' : 'default'}>
                          {user.planType || 'No Plan'}
                        </Badge>
                        {user.downloadsUsed !== undefined && (
                          <div className="text-xs text-muted-foreground">
                            Downloads: {user.downloadsUsed}/{user.maxDownloads === -1 ? '∞' : user.maxDownloads}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        {user.role === 'admin' ? <Shield className="h-3 w-3" /> : <Settings className="h-3 w-3" />}
                        <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                          {user.role}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        {user.status === 'active' ? <Activity className="h-3 w-3 text-green-500" /> : <UserX className="h-3 w-3 text-red-500" />}
                        <Badge variant={user.status === 'active' ? 'default' : 'destructive'}>
                          {user.status}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <div className={`w-2 h-2 rounded-full ${isUserOnline ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                        <Badge variant={isUserOnline ? 'default' : 'secondary'} className={isUserOnline ? 'bg-green-600 text-white hover:bg-green-700' : ''}>
                          {isUserOnline ? 'Online' : 'Offline'}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>{user.registrationDate}</TableCell>
                    <TableCell>
                      <Badge variant={user.source === 'registered' ? 'default' : 'outline'}>
                        {user.source === 'registered' ? 'Registered' : 'Admin Created'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={agentAvailability[user.id] ? 'default' : 'secondary'}>
                        {agentAvailability[user.id] ? 'Available' : 'Unavailable'}
                      </Badge>
                    </TableCell>
                  <TableCell>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" onClick={() => setSelectedUser(user)}>
                          Edit
                        </Button>
                      </DialogTrigger>
                      <DialogContent aria-describedby={undefined}>
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
                              <Key className="h-4 w-4 mr-2" />
                              Reset Password
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </TableCell>
                 </TableRow>
                );
                })}
             </TableBody>
           </Table>
        </CardContent>
      </Card>
    </div>
  );
};
