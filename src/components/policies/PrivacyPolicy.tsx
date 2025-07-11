import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Shield, Calendar, User, Database } from "lucide-react";

export const PrivacyPolicy = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Shield className="h-6 w-6 text-primary" />
          <h3 className="text-2xl font-bold">Data Privacy Policy</h3>
        </div>
        <Badge variant="outline" className="flex items-center space-x-1">
          <Calendar className="h-3 w-3" />
          <span>Last Updated: January 7, 2025</span>
        </Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            This Privacy Policy describes how Trellix collects, uses, processes, and protects your personal information 
            in accordance with GDPR, CCPA, and other applicable data protection regulations.
          </p>
        </CardContent>
      </Card>

      <ScrollArea className="h-[600px] pr-4">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Database className="h-5 w-5" />
                <span>1. Information We Collect</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Personal Information</h4>
                <ul className="space-y-1 text-sm text-muted-foreground ml-4">
                  <li>• Name, email address, and contact information</li>
                  <li>• Account credentials and authentication data</li>
                  <li>• Professional information and job title</li>
                  <li>• Payment and billing information</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Technical Information</h4>
                <ul className="space-y-1 text-sm text-muted-foreground ml-4">
                  <li>• Device information and system configurations</li>
                  <li>• IP addresses and network identifiers</li>
                  <li>• Usage patterns and security event logs</li>
                  <li>• Performance metrics and diagnostic data</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User className="h-5 w-5" />
                <span>2. How We Use Your Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Service Provision</h4>
                <p className="text-sm text-muted-foreground">
                  We use your information to provide, maintain, and improve our security services, 
                  including threat detection, incident response, and compliance monitoring.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Security and Compliance</h4>
                <p className="text-sm text-muted-foreground">
                  Your data helps us identify security threats, investigate incidents, and ensure 
                  compliance with applicable security standards and regulations.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Communication</h4>
                <p className="text-sm text-muted-foreground">
                  We may use your contact information to send security alerts, service updates, 
                  and important notifications about your account.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>3. Data Protection Rights</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Under GDPR and other applicable laws, you have the following rights:
              </p>
              <ul className="space-y-2 text-sm text-muted-foreground ml-4">
                <li>• <strong>Right to Access:</strong> Request access to your personal data</li>
                <li>• <strong>Right to Rectification:</strong> Correct inaccurate personal data</li>
                <li>• <strong>Right to Erasure:</strong> Request deletion of your personal data</li>
                <li>• <strong>Right to Portability:</strong> Receive your data in a structured format</li>
                <li>• <strong>Right to Object:</strong> Object to processing of your personal data</li>
                <li>• <strong>Right to Restrict:</strong> Request restriction of processing</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>4. Data Retention</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                We retain personal data only for as long as necessary to fulfill the purposes outlined 
                in this policy, comply with legal obligations, resolve disputes, and enforce agreements. 
                Security logs are typically retained for 12 months, while account information is retained 
                for the duration of your relationship with us plus 3 years for compliance purposes.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>5. International Transfers</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Your personal data may be transferred to and processed in countries other than your own. 
                We ensure appropriate safeguards are in place, including Standard Contractual Clauses 
                approved by the European Commission and other legally recognized transfer mechanisms.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>6. Contact Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p><strong>Data Protection Officer:</strong> privacy@trellix.com</p>
                <p><strong>Privacy Team:</strong> Trellix, Inc., 6220 America Center Drive, San Jose, CA 95002</p>
                <p><strong>EU Representative:</strong> Trellix Ireland Limited, 70 Sir John Rogerson's Quay, Dublin 2, Ireland</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </ScrollArea>
    </div>
  );
};