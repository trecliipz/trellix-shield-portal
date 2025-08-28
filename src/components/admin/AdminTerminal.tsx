import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Terminal, Copy, Check, Monitor, Download, AlertTriangle, Info, ExternalLink } from "lucide-react";
import { toast } from "sonner";

type OperatingSystem = "windows" | "macos" | "linux";

interface Command {
  name: string;
  description: string;
  command: string;
  notes?: string;
}

export const AdminTerminal = () => {
  const [selectedOS, setSelectedOS] = useState<OperatingSystem>("windows");
  const [copiedCommand, setCopiedCommand] = useState<string>("");

  const copyToClipboard = async (command: string, label: string) => {
    try {
      await navigator.clipboard.writeText(command);
      setCopiedCommand(command);
      toast.success(`Copied: ${label}`);
      
      // Reset copied state after 2 seconds
      setTimeout(() => setCopiedCommand(""), 2000);
    } catch (error) {
      toast.error("Failed to copy to clipboard");
    }
  };

  const installCommands: Record<OperatingSystem, Command[]> = {
    windows: [
      {
        name: "Winget (Recommended)",
        description: "Windows Package Manager - built into Windows 10+",
        command: "winget install OpenJS.NodeJS.LTS",
        notes: "This installs the latest LTS version. Run as Administrator for best results."
      },
      {
        name: "Chocolatey",
        description: "Third-party package manager",
        command: "choco install nodejs-lts",
        notes: "Requires Chocolatey to be installed first. Visit chocolatey.org"
      },
      {
        name: "Official Installer",
        description: "Download from nodejs.org",
        command: "# Download from: https://nodejs.org/en/download/",
        notes: "Choose the LTS version for stability. Run the .msi installer as Administrator."
      }
    ],
    macos: [
      {
        name: "Homebrew (Recommended)",
        description: "macOS package manager",
        command: "brew install node",
        notes: "Install Homebrew first if needed: /bin/bash -c \"$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)\""
      },
      {
        name: "Node Version Manager (NVM)",
        description: "Version manager for multiple Node.js versions",
        command: "curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash",
        notes: "After installation, restart terminal and run: nvm install --lts"
      },
      {
        name: "Official Installer",
        description: "Download from nodejs.org",
        command: "# Download from: https://nodejs.org/en/download/",
        notes: "Choose the LTS version. Download the .pkg file for macOS."
      }
    ],
    linux: [
      {
        name: "Ubuntu/Debian (NodeSource)",
        description: "Official NodeSource repository",
        command: "curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -\nsudo apt-get install -y nodejs",
        notes: "This adds the NodeSource repository and installs the latest LTS version."
      },
      {
        name: "Ubuntu/Debian (Snap)",
        description: "Universal package manager",
        command: "sudo snap install node --classic",
        notes: "Snap packages are containerized and may have different behavior."
      },
      {
        name: "RHEL/CentOS/Fedora",
        description: "Using DNF/YUM package manager",
        command: "curl -fsSL https://rpm.nodesource.com/setup_lts.x | sudo bash -\nsudo dnf install -y nodejs npm",
        notes: "For older systems, use 'yum' instead of 'dnf'."
      },
      {
        name: "Arch Linux",
        description: "Using pacman",
        command: "sudo pacman -S nodejs npm",
        notes: "This installs the current version. For LTS, use AUR packages."
      }
    ]
  };

  const verificationCommands: Command[] = [
    {
      name: "Node.js Version",
      description: "Check if Node.js is installed and show version",
      command: "node -v",
      notes: "Should return something like v18.19.0 or v20.11.0"
    },
    {
      name: "NPM Version",
      description: "Check NPM (Node Package Manager) version",
      command: "npm -v",
      notes: "Should return a version like 10.2.4"
    },
    {
      name: "NPX Version",
      description: "Check NPX (Node Package eXecute) availability",
      command: "npx -v",
      notes: "NPX comes bundled with NPM 5.2+ and allows running packages directly"
    },
    {
      name: "Installation Paths",
      description: "Show where Node.js and NPM are installed",
      command: selectedOS === "windows" ? "where node && where npm" : "which node && which npm",
      notes: "Helps verify the installation location and PATH configuration"
    }
  ];

  const troubleshootingTips: Command[] = [
    {
      name: "PATH Issues (Windows)",
      description: "Node/npm not found after installation",
      command: "echo %PATH%",
      notes: "Check if Node.js installation path is in system PATH. You may need to restart Command Prompt or reboot."
    },
    {
      name: "PATH Issues (macOS/Linux)",
      description: "Node/npm not found in terminal",
      command: "echo $PATH\n# Add to ~/.bashrc or ~/.zshrc:\nexport PATH=\"/usr/local/bin:$PATH\"",
      notes: "Restart terminal or run 'source ~/.bashrc' (or ~/.zshrc for zsh) after editing."
    },
    {
      name: "Permission Issues (macOS/Linux)",
      description: "Fix npm global install permissions",
      command: "sudo chown -R $(whoami) $(npm config get prefix)/{lib/node_modules,bin,share}",
      notes: "This fixes common permission errors when installing global packages."
    },
    {
      name: "Clear NPM Cache",
      description: "Fix corrupted package cache",
      command: "npm cache clean --force",
      notes: "Use when experiencing download or installation issues with packages."
    },
    {
      name: "SSL/Certificate Issues",
      description: "Fix certificate errors behind corporate firewalls",
      command: "npm config set strict-ssl false\n# or\nnpm config set registry http://registry.npmjs.org/",
      notes: "⚠️ Only use in development environments. Consult IT for proper certificate configuration."
    }
  ];

  const CommandBlock = ({ command, index }: { command: Command; index: number }) => (
    <Card key={index} className="group">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg flex items-center gap-2">
              <Terminal className="h-4 w-4" />
              {command.name}
            </CardTitle>
            <CardDescription>{command.description}</CardDescription>
          </div>
          <Badge variant="outline" className="ml-2">
            {selectedOS}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="relative">
          <pre className="bg-muted p-3 rounded-md text-sm font-mono overflow-x-auto">
            <code>{command.command}</code>
          </pre>
          <Button
            size="sm"
            variant="outline"
            className="absolute top-2 right-2 h-7 w-7 p-0"
            onClick={() => copyToClipboard(command.command, command.name)}
          >
            {copiedCommand === command.command ? (
              <Check className="h-3 w-3" />
            ) : (
              <Copy className="h-3 w-3" />
            )}
          </Button>
        </div>
        {command.notes && (
          <div className="flex items-start gap-2 text-sm text-muted-foreground">
            <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <span>{command.notes}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Terminal className="h-5 w-5" />
            Node.js Installation Terminal
          </CardTitle>
          <CardDescription>
            Step-by-step commands to install and verify Node.js on your system. 
            Commands run in your operating system terminal - this page provides copy-paste ready instructions.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
            <Monitor className="h-4 w-4 text-blue-600" />
            <span className="text-sm text-blue-800">
              Open your system terminal (Command Prompt, PowerShell, Terminal, etc.) to run these commands.
            </span>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="install" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="install">Install</TabsTrigger>
          <TabsTrigger value="verify">Verify</TabsTrigger>
          <TabsTrigger value="troubleshoot">Troubleshoot</TabsTrigger>
        </TabsList>

        <TabsContent value="install" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Choose Your Operating System</CardTitle>
                <Select value={selectedOS} onValueChange={(value: OperatingSystem) => setSelectedOS(value)}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="windows">Windows</SelectItem>
                    <SelectItem value="macos">macOS</SelectItem>
                    <SelectItem value="linux">Linux</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
          </Card>

          <ScrollArea className="h-[600px]">
            <div className="space-y-4 pr-4">
              {installCommands[selectedOS].map((command, index) => (
                <CommandBlock key={index} command={command} index={index} />
              ))}
              
              <Card className="border-blue-200 bg-blue-50">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-2">
                    <Download className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-blue-800">
                      <strong>Recommendation:</strong> Always choose the LTS (Long Term Support) version for production use. 
                      Visit <a href="https://nodejs.org" className="underline" target="_blank" rel="noopener noreferrer">nodejs.org</a> for official installers.
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="verify" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Verification Commands</CardTitle>
              <CardDescription>
                Run these commands to verify your Node.js installation is working correctly.
              </CardDescription>
            </CardHeader>
          </Card>

          <ScrollArea className="h-[600px]">
            <div className="space-y-4 pr-4">
              {verificationCommands.map((command, index) => (
                <CommandBlock key={index} command={command} index={index} />
              ))}
              
              <Card className="border-green-200 bg-green-50">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-green-800">
                      <strong>Success:</strong> If all commands return version numbers, Node.js is properly installed and configured.
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="troubleshoot" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Common Issues & Solutions
              </CardTitle>
              <CardDescription>
                Solutions for common Node.js installation and configuration problems.
              </CardDescription>
            </CardHeader>
          </Card>

          <ScrollArea className="h-[600px]">
            <div className="space-y-4 pr-4">
              {troubleshootingTips.map((command, index) => (
                <CommandBlock key={index} command={command} index={index} />
              ))}
              
              <Card className="border-orange-200 bg-orange-50">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-orange-600 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-orange-800 space-y-2">
                      <div><strong>Still having issues?</strong></div>
                      <ul className="list-disc pl-5 space-y-1">
                        <li>Restart your terminal/command prompt after installation</li>
                        <li>Reboot your computer if PATH issues persist</li>
                        <li>Check antivirus software for blocked downloads</li>
                        <li>For corporate environments, consult your IT department</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2">
                    <ExternalLink className="h-4 w-4" />
                    <span className="text-sm">
                      <strong>Additional Resources:</strong>{" "}
                      <a 
                        href="https://nodejs.org/en/download/package-manager" 
                        className="text-primary underline" 
                        target="_blank" 
                        rel="noopener noreferrer"
                      >
                        Official Installation Guide
                      </a>
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
};