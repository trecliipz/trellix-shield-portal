import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Lock, Calendar, Key, Shield, Users } from "lucide-react";

export const AccessPolicy = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Lock className="h-6 w-6 text-primary" />
          <h3 className="text-2xl font-bold">Access Control Policy</h3>
        </div>
        <Badge variant="outline" className="flex items-center space-x-1">
          <Calendar className="h-3 w-3" />
          <span>Version 2.1 - January 2025</span>
        </Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Policy Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            This Access Control Policy establishes guidelines for managing user access to Trellix systems, 
            applications, and data. It ensures that access is granted based on the principle of least privilege 
            and business need while maintaining security and compliance standards.
          </p>
        </CardContent>
      </Card>

      <ScrollArea className="h-[600px] pr-4">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Key className="h-5 w-5" />
                <span>1. Authentication Requirements</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Multi-Factor Authentication (MFA)</h4>
                <ul className="space-y-1 text-sm text-muted-foreground ml-4">
                  <li>• Required for all administrative accounts</li>
                  <li>• Required for access to sensitive systems</li>
                  <li>• Required for remote access connections</li>
                  <li>• Supported methods: Hardware tokens, authenticator apps, biometrics</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Password Requirements</h4>
                <ul className="space-y-1 text-sm text-muted-foreground ml-4">
                  <li>• Minimum 12 characters for standard accounts</li>
                  <li>• Minimum 15 characters for privileged accounts</li>
                  <li>• Must include uppercase, lowercase, numbers, and symbols</li>
                  <li>• Cannot reuse last 12 passwords</li>
                  <li>• Password rotation every 90 days for admin accounts</li>
                  <li>• Immediate change required if compromised</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Account Lockout Policies</h4>
                <ul className="space-y-1 text-sm text-muted-foreground ml-4">
                  <li>• Account lockout after 5 failed attempts</li>
                  <li>• 30-minute lockout duration</li>
                  <li>• Administrative override available for urgent needs</li>
                  <li>• Security team notification for repeated lockouts</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="h-5 w-5" />
                <span>2. Role-Based Access Control (RBAC)</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">User Roles</h4>
                <div className="space-y-3">
                  <div>
                    <Badge variant="secondary" className="mb-1">Standard User</Badge>
                    <ul className="space-y-1 text-sm text-muted-foreground ml-4">
                      <li>• Access to assigned applications and data</li>
                      <li>• Cannot install software or modify system settings</li>
                      <li>• Limited file sharing capabilities</li>
                    </ul>
                  </div>
                  
                  <div>
                    <Badge variant="secondary" className="mb-1 bg-blue-100 text-blue-800">Power User</Badge>
                    <ul className="space-y-1 text-sm text-muted-foreground ml-4">
                      <li>• Standard user permissions plus software installation</li>
                      <li>• Access to development and testing environments</li>
                      <li>• Limited administrative functions</li>
                    </ul>
                  </div>

                  <div>
                    <Badge variant="secondary" className="mb-1 bg-orange-100 text-orange-800">System Administrator</Badge>
                    <ul className="space-y-1 text-sm text-muted-foreground ml-4">
                      <li>• Full system configuration and maintenance access</li>
                      <li>• User account management capabilities</li>
                      <li>• Security configuration permissions</li>
                    </ul>
                  </div>

                  <div>
                    <Badge variant="destructive" className="mb-1">Security Administrator</Badge>
                    <ul className="space-y-1 text-sm text-muted-foreground ml-4">
                      <li>• All security system access and configuration</li>
                      <li>• Audit log review and investigation</li>
                      <li>• Incident response and forensics</li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="h-5 w-5" />
                <span>3. Privileged Access Management</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Administrative Accounts</h4>
                <ul className="space-y-1 text-sm text-muted-foreground ml-4">
                  <li>• Separate administrative accounts required</li>
                  <li>• No shared or generic administrative accounts</li>
                  <li>• Just-in-time access provisioning when possible</li>
                  <li>• All privileged sessions recorded and monitored</li>
                  <li>• Regular access reviews and certification</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Service Accounts</h4>
                <ul className="space-y-1 text-sm text-muted-foreground ml-4">
                  <li>• Unique accounts for each service or application</li>
                  <li>• Automated password rotation where supported</li>
                  <li>• Principle of least privilege applied</li>
                  <li>• Regular inventory and access review</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Emergency Access</h4>
                <ul className="space-y-1 text-sm text-muted-foreground ml-4">
                  <li>• Break-glass procedures for critical situations</li>
                  <li>• Documented approval process</li>
                  <li>• Enhanced monitoring and logging</li>
                  <li>• Post-emergency access review required</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>4. Access Request Process</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">New User Access</h4>
                <ul className="space-y-1 text-sm text-muted-foreground ml-4">
                  <li>1. Manager submits access request through IT portal</li>
                  <li>2. HR confirms employment and role</li>
                  <li>3. Security reviews and approves access level</li>
                  <li>4. IT provisions accounts and access</li>
                  <li>5. User completes security awareness training</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Access Modifications</h4>
                <ul className="space-y-1 text-sm text-muted-foreground ml-4">
                  <li>• Manager or system owner approval required</li>
                  <li>• Business justification documented</li>
                  <li>• Security impact assessment</li>
                  <li>• Time-limited access when appropriate</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Access Termination</h4>
                <ul className="space-y-1 text-sm text-muted-foreground ml-4">
                  <li>• Immediate termination upon employment end</li>
                  <li>• Coordinated deprovisioning across all systems</li>
                  <li>• Return of all company devices and credentials</li>
                  <li>• Access removal verification and documentation</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>5. Access Reviews and Monitoring</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Regular Access Reviews</h4>
                <ul className="space-y-1 text-sm text-muted-foreground ml-4">
                  <li>• Quarterly reviews for all user access</li>
                  <li>• Monthly reviews for privileged accounts</li>
                  <li>• Manager certification of team member access</li>
                  <li>• System owner validation of application access</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Continuous Monitoring</h4>
                <ul className="space-y-1 text-sm text-muted-foreground ml-4">
                  <li>• Real-time monitoring of privileged account usage</li>
                  <li>• Automated alerts for suspicious access patterns</li>
                  <li>• Regular audit of dormant accounts</li>
                  <li>• Access analytics and anomaly detection</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>6. Compliance and Enforcement</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Violations of this access control policy may result in disciplinary action, 
                including termination. All access activities are logged and monitored for compliance 
                with internal policies and external regulations including SOX, GDPR, and industry standards.
              </p>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p><strong>Policy Owner:</strong> Chief Information Security Officer</p>
                <p><strong>Review Frequency:</strong> Annual or as required by business changes</p>
                <p><strong>Compliance Questions:</strong> security@trellix.com</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </ScrollArea>
    </div>
  );
};