import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Eye, Calendar, AlertTriangle, Shield, Mail } from "lucide-react";

export const DisclosurePolicy = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Eye className="h-6 w-6 text-primary" />
          <h3 className="text-2xl font-bold">Vulnerability Disclosure Policy</h3>
        </div>
        <Badge variant="outline" className="flex items-center space-x-1">
          <Calendar className="h-3 w-3" />
          <span>Version 1.5 - January 2025</span>
        </Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Program Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Trellix values the security research community and encourages responsible disclosure of 
            security vulnerabilities. This policy outlines our coordinated vulnerability disclosure 
            process and provides guidelines for security researchers.
          </p>
        </CardContent>
      </Card>

      <ScrollArea className="h-[600px] pr-4">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Mail className="h-5 w-5" />
                <span>1. Reporting Channels</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Primary Contact</h4>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p><strong>Email:</strong> security@trellix.com</p>
                  <p><strong>PGP Key:</strong> Available at https://trellix.com/security-pgp-key</p>
                  <p><strong>Response Time:</strong> Within 5 business days</p>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Alternative Channels</h4>
                <ul className="space-y-1 text-sm text-muted-foreground ml-4">
                  <li>• HackerOne: https://hackerone.com/trellix</li>
                  <li>• Bug Crowd: https://bugcrowd.com/trellix</li>
                  <li>• Postal Mail: Trellix Security Team, 6220 America Center Drive, San Jose, CA 95002</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Required Information</h4>
                <ul className="space-y-1 text-sm text-muted-foreground ml-4">
                  <li>• Detailed description of the vulnerability</li>
                  <li>• Steps to reproduce the issue</li>
                  <li>• Proof of concept (if applicable)</li>
                  <li>• Affected systems, products, or versions</li>
                  <li>• Your contact information for follow-up</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="h-5 w-5" />
                <span>2. Scope and Coverage</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">In Scope</h4>
                <ul className="space-y-1 text-sm text-muted-foreground ml-4">
                  <li>• Trellix cloud services and web applications</li>
                  <li>• Trellix endpoint protection products</li>
                  <li>• Network security appliances and software</li>
                  <li>• Mobile applications published by Trellix</li>
                  <li>• Infrastructure supporting customer-facing services</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Out of Scope</h4>
                <ul className="space-y-1 text-sm text-muted-foreground ml-4">
                  <li>• Third-party services integrated with Trellix products</li>
                  <li>• Partner or reseller websites and applications</li>
                  <li>• Physical security of Trellix facilities</li>
                  <li>• Social engineering attacks against employees</li>
                  <li>• Issues in end-of-life or deprecated products</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Vulnerability Types</h4>
                <ul className="space-y-1 text-sm text-muted-foreground ml-4">
                  <li>• Remote code execution</li>
                  <li>• SQL injection and database vulnerabilities</li>
                  <li>• Cross-site scripting (XSS) and CSRF</li>
                  <li>• Authentication and authorization bypasses</li>
                  <li>• Privilege escalation vulnerabilities</li>
                  <li>• Data exposure and privacy violations</li>
                  <li>• Cryptographic implementation flaws</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <AlertTriangle className="h-5 w-5" />
                <span>3. Research Guidelines</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Acceptable Research Activities</h4>
                <ul className="space-y-1 text-sm text-muted-foreground ml-4">
                  <li>• Testing on your own systems or test accounts</li>
                  <li>• Using publicly available documentation and tools</li>
                  <li>• Analyzing client-side code and mobile applications</li>
                  <li>• Limited testing that doesn't impact service availability</li>
                  <li>• Proof-of-concept demonstrations without exploitation</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Prohibited Activities</h4>
                <ul className="space-y-1 text-sm text-muted-foreground ml-4">
                  <li>• Accessing, modifying, or deleting customer data</li>
                  <li>• Performing actions that degrade service performance</li>
                  <li>• Social engineering attacks against employees</li>
                  <li>• Physical attacks against Trellix facilities</li>
                  <li>• Automated scanning or brute force attacks</li>
                  <li>• Testing third-party services or systems</li>
                  <li>• Violating privacy or attempting to access personal information</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Legal Safe Harbor</h4>
                <p className="text-sm text-muted-foreground">
                  Trellix commits not to pursue legal action against researchers who:
                </p>
                <ul className="space-y-1 text-sm text-muted-foreground ml-4">
                  <li>• Follow this vulnerability disclosure policy</li>
                  <li>• Act in good faith and avoid privacy violations</li>
                  <li>• Do not cause damage to systems or services</li>
                  <li>• Report vulnerabilities promptly and responsibly</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>4. Response Process</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Timeline and Communication</h4>
                <ul className="space-y-1 text-sm text-muted-foreground ml-4">
                  <li>• <strong>Day 1:</strong> Acknowledgment of report within 5 business days</li>
                  <li>• <strong>Week 1:</strong> Initial triage and severity assessment</li>
                  <li>• <strong>Week 2:</strong> Detailed analysis and reproduction</li>
                  <li>• <strong>30-90 days:</strong> Fix development and testing</li>
                  <li>• <strong>90+ days:</strong> Coordinated disclosure and public announcement</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Severity Classification</h4>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Badge variant="destructive">Critical</Badge>
                    <span className="text-sm text-muted-foreground">Remote code execution, complete system compromise</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="secondary" className="bg-orange-100 text-orange-800">High</Badge>
                    <span className="text-sm text-muted-foreground">Privilege escalation, authentication bypass</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Medium</Badge>
                    <span className="text-sm text-muted-foreground">Data exposure, cross-site scripting</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline">Low</Badge>
                    <span className="text-sm text-muted-foreground">Information disclosure, minor security issues</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>5. Coordination and Disclosure</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Coordinated Disclosure</h4>
                <ul className="space-y-1 text-sm text-muted-foreground ml-4">
                  <li>• Public disclosure after fix deployment and customer notification</li>
                  <li>• 90-day default disclosure timeline from report acknowledgment</li>
                  <li>• Extensions available for complex issues with advance notice</li>
                  <li>• Researcher credit in security advisories (if desired)</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Recognition Program</h4>
                <ul className="space-y-1 text-sm text-muted-foreground ml-4">
                  <li>• Public acknowledgment in security advisories</li>
                  <li>• Security researcher hall of fame listing</li>
                  <li>• Trellix branded security researcher merchandise</li>
                  <li>• Conference speaking opportunities (for significant findings)</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Public Communication</h4>
                <ul className="space-y-1 text-sm text-muted-foreground ml-4">
                  <li>• Security advisories published on Trellix website</li>
                  <li>• CVE assignment for applicable vulnerabilities</li>
                  <li>• Customer notification through security bulletins</li>
                  <li>• Coordination with industry threat intelligence sharing</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>6. Contact Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p><strong>Security Team:</strong> security@trellix.com</p>
                <p><strong>Bug Bounty Program:</strong> https://hackerone.com/trellix</p>
                <p><strong>Security Advisories:</strong> https://trellix.com/security/advisories</p>
                <p><strong>PGP Key:</strong> https://trellix.com/security-pgp-key</p>
                <p><strong>Policy Updates:</strong> This policy may be updated periodically. Check the website for the latest version.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </ScrollArea>
    </div>
  );
};