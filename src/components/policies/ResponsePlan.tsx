import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertTriangle, Calendar, Clock, Users, Phone } from "lucide-react";

export const ResponsePlan = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <AlertTriangle className="h-6 w-6 text-primary" />
          <h3 className="text-2xl font-bold">Security Incident Response Plan</h3>
        </div>
        <Badge variant="outline" className="flex items-center space-x-1">
          <Calendar className="h-3 w-3" />
          <span>Version 3.2 - January 2025</span>
        </Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Emergency Contact Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <p><strong>Security Operations Center (SOC):</strong></p>
              <p className="text-muted-foreground">24/7 Hotline: +1-800-TRELLIX</p>
              <p className="text-muted-foreground">Email: soc@trellix.com</p>
            </div>
            <div>
              <p><strong>Critical Incident Team:</strong></p>
              <p className="text-muted-foreground">Emergency: +1-800-SEC-HELP</p>
              <p className="text-muted-foreground">Email: critical@trellix.com</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <ScrollArea className="h-[600px] pr-4">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Clock className="h-5 w-5" />
                <span>1. Incident Classification</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Badge variant="destructive" className="mb-2">CRITICAL (P1)</Badge>
                <p className="text-sm text-muted-foreground mb-2">Response Time: 15 minutes</p>
                <ul className="space-y-1 text-sm text-muted-foreground ml-4">
                  <li>• Active data breach with confirmed data loss</li>
                  <li>• Complete system outage affecting all users</li>
                  <li>• Active ransomware or destructive malware</li>
                  <li>• External threat actor with admin access</li>
                </ul>
              </div>
              
              <div>
                <Badge variant="secondary" className="mb-2 bg-orange-100 text-orange-800">HIGH (P2)</Badge>
                <p className="text-sm text-muted-foreground mb-2">Response Time: 1 hour</p>
                <ul className="space-y-1 text-sm text-muted-foreground ml-4">
                  <li>• Suspected data breach under investigation</li>
                  <li>• Major service degradation</li>
                  <li>• Confirmed malware on critical systems</li>
                  <li>• Unauthorized access to sensitive systems</li>
                </ul>
              </div>

              <div>
                <Badge variant="secondary" className="mb-2 bg-yellow-100 text-yellow-800">MEDIUM (P3)</Badge>
                <p className="text-sm text-muted-foreground mb-2">Response Time: 4 hours</p>
                <ul className="space-y-1 text-sm text-muted-foreground ml-4">
                  <li>• Security policy violations</li>
                  <li>• Minor service disruptions</li>
                  <li>• Suspicious network activity</li>
                  <li>• Failed authentication attempts</li>
                </ul>
              </div>

              <div>
                <Badge variant="outline" className="mb-2">LOW (P4)</Badge>
                <p className="text-sm text-muted-foreground mb-2">Response Time: 24 hours</p>
                <ul className="space-y-1 text-sm text-muted-foreground ml-4">
                  <li>• Routine security alerts</li>
                  <li>• Documentation updates needed</li>
                  <li>• Training requirements</li>
                  <li>• Preventive maintenance</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="h-5 w-5" />
                <span>2. Response Team Roles</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Incident Commander</h4>
                <ul className="space-y-1 text-sm text-muted-foreground ml-4">
                  <li>• Overall incident response coordination</li>
                  <li>• Decision-making authority</li>
                  <li>• External communication approval</li>
                  <li>• Resource allocation and prioritization</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Security Analyst</h4>
                <ul className="space-y-1 text-sm text-muted-foreground ml-4">
                  <li>• Technical investigation and analysis</li>
                  <li>• Evidence collection and preservation</li>
                  <li>• Threat intelligence correlation</li>
                  <li>• System isolation and containment</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Communications Lead</h4>
                <ul className="space-y-1 text-sm text-muted-foreground ml-4">
                  <li>• Internal stakeholder notifications</li>
                  <li>• Customer communication coordination</li>
                  <li>• Media relations management</li>
                  <li>• Regulatory notification compliance</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Legal & Compliance</h4>
                <ul className="space-y-1 text-sm text-muted-foreground ml-4">
                  <li>• Regulatory requirement assessment</li>
                  <li>• Legal privilege protection</li>
                  <li>• External counsel coordination</li>
                  <li>• Compliance documentation</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>3. Response Procedures</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Phase 1: Detection & Analysis (0-30 minutes)</h4>
                <ul className="space-y-1 text-sm text-muted-foreground ml-4">
                  <li>1. Incident detection and initial triage</li>
                  <li>2. Severity classification assignment</li>
                  <li>3. Response team activation</li>
                  <li>4. Initial stakeholder notification</li>
                  <li>5. Evidence preservation initiation</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Phase 2: Containment (30 minutes - 4 hours)</h4>
                <ul className="space-y-1 text-sm text-muted-foreground ml-4">
                  <li>1. Threat containment and isolation</li>
                  <li>2. System and network segmentation</li>
                  <li>3. Account access restrictions</li>
                  <li>4. Data protection measures</li>
                  <li>5. Continuous monitoring enhancement</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Phase 3: Eradication (4-24 hours)</h4>
                <ul className="space-y-1 text-sm text-muted-foreground ml-4">
                  <li>1. Root cause analysis completion</li>
                  <li>2. Threat removal and cleanup</li>
                  <li>3. Vulnerability remediation</li>
                  <li>4. Security control strengthening</li>
                  <li>5. System hardening implementation</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Phase 4: Recovery (1-7 days)</h4>
                <ul className="space-y-1 text-sm text-muted-foreground ml-4">
                  <li>1. System restoration and validation</li>
                  <li>2. Service availability confirmation</li>
                  <li>3. Enhanced monitoring deployment</li>
                  <li>4. User access restoration</li>
                  <li>5. Performance validation testing</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Phase 5: Lessons Learned (7-14 days)</h4>
                <ul className="space-y-1 text-sm text-muted-foreground ml-4">
                  <li>1. Post-incident analysis review</li>
                  <li>2. Response effectiveness evaluation</li>
                  <li>3. Process improvement recommendations</li>
                  <li>4. Documentation updates</li>
                  <li>5. Training and awareness updates</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Phone className="h-5 w-5" />
                <span>4. Communication Protocols</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Internal Notifications</h4>
                <ul className="space-y-1 text-sm text-muted-foreground ml-4">
                  <li>• Immediate: Security team and management</li>
                  <li>• Within 1 hour: Executive leadership</li>
                  <li>• Within 4 hours: Affected department heads</li>
                  <li>• Within 24 hours: All employees (if applicable)</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold mb-2">External Notifications</h4>
                <ul className="space-y-1 text-sm text-muted-foreground ml-4">
                  <li>• GDPR: Within 72 hours to supervisory authority</li>
                  <li>• Customers: Within 24-72 hours depending on impact</li>
                  <li>• Law enforcement: As required by jurisdiction</li>
                  <li>• Regulatory bodies: Per compliance requirements</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </ScrollArea>
    </div>
  );
};