
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { User, Building2, Phone, Mail, Calendar, Download } from "lucide-react";

const UserProfile = () => {
  const [profile, setProfile] = useState<any>(null);
  const [organization, setOrganization] = useState<any>(null);
  const [subscription, setSubscription] = useState<any>(null);
  const [availableAgentPackages, setAvailableAgentPackages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
  });
  const [orgFormData, setOrgFormData] = useState({
    organization_name: '',
    group_name: '',
    industry: '',
    organization_size: '',
    primary_contact_phone: '',
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      // Fetch organization
      const { data: orgData } = await supabase
        .from('user_organizations')
        .select('*')
        .eq('user_id', user.id)
        .single();

      // Fetch subscription
      const { data: subData } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .single();

      // Fetch available agent packages
      const { data: agentData } = await supabase
        .from('admin_agent_packages')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      setProfile(profileData);
      setOrganization(orgData);
      setSubscription(subData);
      setAvailableAgentPackages(agentData || []);
      
      if (profileData) {
        setFormData({
          name: profileData.name || '',
          phone: profileData.phone || '',
          email: profileData.email || '',
        });
      }

      if (orgData) {
        setOrgFormData({
          organization_name: orgData.organization_name || '',
          group_name: orgData.group_name || '',
          industry: orgData.industry || '',
          organization_size: orgData.organization_size || '',
          primary_contact_phone: orgData.primary_contact_phone || '',
        });
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      toast({
        title: "Error",
        description: "Failed to load user data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadAgent = async (agentPackage: any) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Check if user can download using the database function
      const { data: canDownload, error: checkError } = await supabase
        .rpc('can_user_download', { p_user_id: user.id });

      if (checkError) {
        console.error('Error checking download permission:', checkError);
        toast({
          title: "Error",
          description: "Failed to verify download permission",
          variant: "destructive",
        });
        return;
      }

      if (!canDownload) {
        toast({
          title: "Download Restricted",
          description: "You need an active subscription plan to download agent packages. Please upgrade your plan.",
          variant: "destructive",
        });
        return;
      }

      // Record the download
      const { error: downloadError } = await supabase
        .from('agent_downloads')
        .insert({
          user_id: user.id,
          agent_name: agentPackage.name,
          agent_version: agentPackage.version,
          file_name: agentPackage.file_name,
          platform: agentPackage.platform,
          status: 'downloaded',
          downloaded_at: new Date().toISOString(),
        });

      if (downloadError) {
        console.error('Error recording download:', downloadError);
      }

      // Increment download count
      await supabase.rpc('increment_download_count', { p_user_id: user.id });

      // Simulate download (in real app, this would be an actual file download)
      toast({
        title: "Download Started",
        description: `Downloading ${agentPackage.name} v${agentPackage.version}`,
      });

      console.log('Download started for:', agentPackage);
    } catch (error) {
      console.error('Error downloading agent:', error);
      toast({
        title: "Error",
        description: "Failed to download agent package",
        variant: "destructive",
      });
    }
  };

  const handleProfileUpdate = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          ...formData,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;

      setProfile({ ...profile, ...formData });
      setIsEditing(false);
      toast({
        title: "Success",
        description: "Profile updated successfully",
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive",
      });
    }
  };

  const handleOrgUpdate = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('user_organizations')
        .upsert({
          user_id: user.id,
          ...orgFormData,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;

      setOrganization({ ...organization, ...orgFormData });
      toast({
        title: "Success",
        description: "Organization updated successfully",
      });
    } catch (error) {
      console.error('Error updating organization:', error);
      toast({
        title: "Error",
        description: "Failed to update organization",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="h-64 bg-gray-200 rounded"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">User Profile</h1>
        {subscription && (
          <Badge variant="secondary" className="text-sm px-3 py-1">
            {subscription.plan_type.charAt(0).toUpperCase() + subscription.plan_type.slice(1)} Plan
          </Badge>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Personal Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Personal Information
            </CardTitle>
            <CardDescription>
              Update your personal details and contact information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isEditing ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Enter your full name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="Enter your phone number"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="Enter your email address"
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleProfileUpdate}>Save Changes</Button>
                  <Button variant="outline" onClick={() => setIsEditing(false)}>
                    Cancel
                  </Button>
                </div>
              </>
            ) : (
              <>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Name:</span>
                    <span>{profile?.name || 'Not set'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Phone:</span>
                    <span>{profile?.phone || 'Not set'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Email:</span>
                    <span>{profile?.email || 'Not set'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Member since:</span>
                    <span>{profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : 'Unknown'}</span>
                  </div>
                </div>
                <Button onClick={() => setIsEditing(true)}>Edit Profile</Button>
              </>
            )}
          </CardContent>
        </Card>

        {/* Organization Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Organization
            </CardTitle>
            <CardDescription>
              Manage your organization details
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="org_name">Organization Name</Label>
              <Input
                id="org_name"
                value={orgFormData.organization_name}
                onChange={(e) => setOrgFormData({ ...orgFormData, organization_name: e.target.value })}
                placeholder="Enter organization name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="group_name">Group Name</Label>
              <Input
                id="group_name"
                value={orgFormData.group_name}
                onChange={(e) => setOrgFormData({ ...orgFormData, group_name: e.target.value })}
                placeholder="Enter group name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="industry">Industry</Label>
              <Input
                id="industry"
                value={orgFormData.industry}
                onChange={(e) => setOrgFormData({ ...orgFormData, industry: e.target.value })}
                placeholder="Enter industry"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="org_size">Organization Size</Label>
              <Input
                id="org_size"
                value={orgFormData.organization_size}
                onChange={(e) => setOrgFormData({ ...orgFormData, organization_size: e.target.value })}
                placeholder="e.g., 50-100 employees"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact_phone">Contact Phone</Label>
              <Input
                id="contact_phone"
                value={orgFormData.primary_contact_phone}
                onChange={(e) => setOrgFormData({ ...orgFormData, primary_contact_phone: e.target.value })}
                placeholder="Enter contact phone"
              />
            </div>
            <Button onClick={handleOrgUpdate}>Update Organization</Button>
          </CardContent>
        </Card>
      </div>

      {/* Agent Download Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Agent Download
          </CardTitle>
          <CardDescription>
            Download available agent packages for your organization
          </CardDescription>
        </CardHeader>
        <CardContent>
          {availableAgentPackages.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {availableAgentPackages.map((agent) => (
                <div key={agent.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold">{agent.name}</h3>
                      <p className="text-sm text-muted-foreground">Version {agent.version}</p>
                      <p className="text-sm text-muted-foreground">{agent.platform}</p>
                    </div>
                    {agent.is_recommended && (
                      <Badge variant="secondary" className="text-xs">
                        Recommended
                      </Badge>
                    )}
                  </div>
                  
                  {agent.description && (
                    <p className="text-sm text-gray-600">{agent.description}</p>
                  )}
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      {agent.file_size ? `${(agent.file_size / 1024 / 1024).toFixed(1)} MB` : 'Size unknown'}
                    </span>
                    <Button 
                      size="sm" 
                      onClick={() => handleDownloadAgent(agent)}
                      disabled={!subscription}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Download className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No agent packages available at this time.</p>
            </div>
          )}
          
          {!subscription && (
            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-700">
                <strong>Note:</strong> You need an active subscription plan to download agent packages. 
                Please contact your administrator to assign you a plan.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default UserProfile;
