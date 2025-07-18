
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Monitor, 
  Laptop, 
  Server, 
  Download, 
  CheckCircle, 
  AlertTriangle,
  Info,
  Cpu,
  HardDrive,
  MemoryStick,
  Wifi
} from 'lucide-react';

const platformSupport = [
  {
    platform: 'Windows',
    icon: '🪟',
    color: 'bg-blue-500',
    versions: [
      { name: 'Windows 11', status: 'fully-supported', arch: ['x64'] },
      { name: 'Windows 10 (1909+)', status: 'fully-supported', arch: ['x64'] },
      { name: 'Windows Server 2022', status: 'fully-supported', arch: ['x64'] },
      { name: 'Windows Server 2019', status: 'fully-supported', arch: ['x64'] },
      { name: 'Windows Server 2016', status: 'limited-support', arch: ['x64'] }
    ],
    requirements: {
      memory: '4 GB RAM (8 GB recommended)',
      disk: '2 GB free space',
      processor: 'Intel/AMD x64',
      network: 'Internet connectivity required'
    }
  },
  {
    platform: 'macOS',
    icon: '🍎',
    color: 'bg-gray-600',
    versions: [
      { name: 'macOS 14 Sonoma', status: 'fully-supported', arch: ['Apple Silicon', 'Intel'] },
      { name: 'macOS 13 Ventura', status: 'fully-supported', arch: ['Apple Silicon', 'Intel'] },
      { name: 'macOS 12 Monterey', status: 'fully-supported', arch: ['Apple Silicon', 'Intel'] },
      { name: 'macOS 11 Big Sur', status: 'limited-support', arch: ['Apple Silicon', 'Intel'] }
    ],
    requirements: {
      memory: '4 GB RAM (8 GB recommended)',
      disk: '2 GB free space',
      processor: 'Apple Silicon (M1/M2/M3) or Intel',
      network: 'Internet connectivity required'
    }
  },
  {
    platform: 'Linux',
    icon: '🐧',
    color: 'bg-orange-500',
    versions: [
      { name: 'RHEL 9', status: 'fully-supported', arch: ['x64'] },
      { name: 'RHEL 8', status: 'fully-supported', arch: ['x64'] },
      { name: 'Ubuntu 22.04 LTS', status: 'fully-supported', arch: ['x64'] },
      { name: 'Ubuntu 20.04 LTS', status: 'fully-supported', arch: ['x64'] },
      { name: 'SUSE Linux Enterprise 15', status: 'fully-supported', arch: ['x64'] },
      { name: 'CentOS 7', status: 'limited-support', arch: ['x64'] }
    ],
    requirements: {
      memory: '4 GB RAM (8 GB recommended)',
      disk: '2 GB free space',
      processor: 'x64 architecture',
      network: 'Internet connectivity required'
    }
  }
];

const agentFeatures = [
  {
    category: 'Endpoint Protection',
    features: [
      'Real-time threat detection',
      'Behavioral analysis',
      'Machine learning protection',
      'Exploit prevention'
    ]
  },
  {
    category: 'Management',
    features: [
      'Centralized policy control',
      'Remote configuration',
      'Automated updates',
      'Compliance reporting'
    ]
  },
  {
    category: 'Integration',
    features: [
      'ePO console integration',
      'SIEM connectivity',
      'Cloud management',
      'API support'
    ]
  }
];

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'fully-supported':
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    case 'limited-support':
      return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    default:
      return <Info className="h-4 w-4 text-muted-foreground" />;
  }
};

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'fully-supported':
      return <Badge variant="default" className="bg-green-100 text-green-800">Fully Supported</Badge>;
    case 'limited-support':
      return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Limited Support</Badge>;
    default:
      return <Badge variant="outline">Not Supported</Badge>;
  }
};

export const AgentCompatibility = () => {
  const [selectedPlatform, setSelectedPlatform] = useState('Windows');

  const currentPlatform = platformSupport.find(p => p.platform === selectedPlatform);

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h3 className="text-2xl font-bold text-primary mb-4">
          Trellix Agent & ENS Platform Support
        </h3>
        <p className="text-muted-foreground max-w-3xl mx-auto">
          Comprehensive endpoint security protection across all major operating systems with 
          platform-specific optimizations and native integrations.
        </p>
      </div>

      <Tabs defaultValue="compatibility" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="compatibility">Platform Compatibility</TabsTrigger>
          <TabsTrigger value="requirements">System Requirements</TabsTrigger>
          <TabsTrigger value="features">Features by Platform</TabsTrigger>
        </TabsList>

        <TabsContent value="compatibility" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {platformSupport.map((platform) => (
              <Card 
                key={platform.platform}
                className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
                  selectedPlatform === platform.platform 
                    ? 'ring-2 ring-primary shadow-lg' 
                    : 'hover:shadow-md'
                }`}
                onClick={() => setSelectedPlatform(platform.platform)}
              >
                <CardContent className="p-4 text-center">
                  <div className="text-3xl mb-2">{platform.icon}</div>
                  <h4 className="font-semibold text-card-foreground">{platform.platform}</h4>
                  <p className="text-sm text-muted-foreground">
                    {platform.versions.length} versions supported
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          {currentPlatform && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-3">
                  <span className="text-2xl">{currentPlatform.icon}</span>
                  <span>{currentPlatform.platform} Compatibility</span>
                </CardTitle>
                <CardDescription>
                  Supported versions and architectures for {currentPlatform.platform} platform
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {currentPlatform.versions.map((version, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                      <div className="flex items-center space-x-3">
                        {getStatusIcon(version.status)}
                        <div>
                          <span className="font-medium">{version.name}</span>
                          <div className="text-sm text-muted-foreground">
                            {version.arch.join(', ')} architecture
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {getStatusBadge(version.status)}
                        <Button size="sm" variant="outline">
                          <Download className="h-4 w-4 mr-1" />
                          Download
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="requirements" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {platformSupport.map((platform) => (
              <Card key={platform.platform}>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <span className="text-lg">{platform.icon}</span>
                    <span>{platform.platform}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <MemoryStick className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <div className="font-medium">Memory</div>
                      <div className="text-sm text-muted-foreground">{platform.requirements.memory}</div>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <HardDrive className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <div className="font-medium">Disk Space</div>
                      <div className="text-sm text-muted-foreground">{platform.requirements.disk}</div>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Cpu className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <div className="font-medium">Processor</div>
                      <div className="text-sm text-muted-foreground">{platform.requirements.processor}</div>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Wifi className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <div className="font-medium">Network</div>
                      <div className="text-sm text-muted-foreground">{platform.requirements.network}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="features" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {agentFeatures.map((category, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="text-lg">{category.category}</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {category.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Universal Features</CardTitle>
              <CardDescription>
                Core capabilities available across all supported platforms
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="flex items-center space-x-2">
                  <Monitor className="h-5 w-5 text-primary" />
                  <span className="text-sm">Real-time monitoring</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Server className="h-5 w-5 text-primary" />
                  <span className="text-sm">Central management</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Laptop className="h-5 w-5 text-primary" />
                  <span className="text-sm">Lightweight footprint</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5 text-primary" />
                  <span className="text-sm">Auto-updates</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
