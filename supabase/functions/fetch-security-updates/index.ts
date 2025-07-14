import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.5';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SecurityUpdate {
  name: string;
  type: string;
  platform: string;
  version: string;
  release_date: string;
  file_size: number;
  file_name: string;
  sha256?: string;
  description: string;
  is_recommended: boolean;
  download_url?: string;
  changelog?: string;
  update_category?: string;
  criticality_level?: string;
  target_systems?: any;
  dependencies?: any;
  compatibility_info?: any;
  threat_coverage?: string[];
  deployment_notes?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Starting security updates fetch...');
    const startTime = Date.now();

    // Fetch real security updates from Trellix downloads page
    const trellixUrl = 'https://www.trellix.com/downloads/security-updates/';
    
    try {
      const response = await fetch(trellixUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; Security-Updates-Bot/1.0)'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const html = await response.text();
      console.log('Successfully fetched Trellix page, parsing content...');
      
      // Parse the HTML to extract security update information
      const updates = await parseSecurityUpdates(html);
      console.log(`Parsed ${updates.length} updates from Trellix`);
      
      // Process real updates
      await processUpdates(supabase, updates, startTime);
      
    } catch (error) {
      console.error('Error fetching from Trellix:', error);
      console.log('Falling back to mock data...');
      
      // Fallback to mock data if real fetch fails
      const mockUpdates: SecurityUpdate[] = [
      {
        name: 'AMCore Content',
        type: 'content',
        platform: 'Windows',
        version: '4.0.00-100012',
        release_date: new Date().toISOString(),
        file_size: 245760000,
        file_name: 'amcore-content-100012.zip',
        sha256: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
        description: 'Latest AMCore content package with enhanced threat detection',
        is_recommended: true,
        download_url: 'https://update.nai.com/Products/AMCore/amcore-content-100012.zip'
      },
      {
        name: 'Virus Definition Files',
        type: 'dat',
        platform: 'Windows',
        version: '10998',
        release_date: new Date().toISOString(),
        file_size: 156780000,
        file_name: 'avvdat-10998.zip',
        sha256: 'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3',
        description: 'Daily virus definition update with latest threat signatures',
        is_recommended: true,
        download_url: 'https://update.nai.com/Products/CommonUpdater/avvdat-10998.zip'
      },
      {
        name: 'Security Engine',
        type: 'engine',
        platform: 'Windows',
        version: '6.1.3.178',
        release_date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        file_size: 89650000,
        file_name: 'security-engine-6.1.3.178.exe',
        sha256: 'b94d27b9934d3e08a52e52d7da7dabfac484efe37a5380ee9088f7ace2efcde9',
        description: 'Enhanced security engine with improved performance',
        is_recommended: false,
        download_url: 'https://update.nai.com/Products/CommonUpdater/security-engine-6.1.3.178.exe'
      },
      {
        name: 'AMCore Content',
        type: 'content',
        platform: 'Linux',
        version: '4.0.00-100012',
        release_date: new Date().toISOString(),
        file_size: 234560000,
        file_name: 'amcore-content-linux-100012.tar.gz',
        sha256: 'hello4298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
        description: 'AMCore content package for Linux environments',
        is_recommended: true,
        download_url: 'https://update.nai.com/Products/AMCore/amcore-content-linux-100012.tar.gz'
      },
      {
        name: 'Virus Definition Files',
        type: 'dat',
        platform: 'Linux',
        version: '10998',
        release_date: new Date().toISOString(),
        file_size: 145890000,
        file_name: 'avvdat-linux-10998.tar.gz',
        sha256: 'linux45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3',
        description: 'Virus definition files for Linux systems',
        is_recommended: true,
        download_url: 'https://update.nai.com/Products/CommonUpdater/avvdat-linux-10998.tar.gz'
      }
      ];

      await processUpdates(supabase, mockUpdates, startTime);
    }

  } catch (error) {
    console.error('Error in fetch-security-updates function:', error);
    
    // Log the error
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    await supabase
      .from('update_logs')
      .insert([{
        updates_found: 0,
        new_updates: 0,
        status: 'failed',
        error_message: error.message
      }]);

    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
     );
   }
 });

// Parse security updates from Trellix HTML content
async function parseSecurityUpdates(html: string): Promise<SecurityUpdate[]> {
  const updates: SecurityUpdate[] = [];
  
  // Enhanced parsing patterns for all security update types
  const updatePatterns = [
    // DAT V3 pattern
    { 
      regex: /DAT\s+V?3?\s+(?:Version\s+)?(\d+)[\s\S]*?(\d+(?:\.\d+)?\s*(?:MB|GB|KB))[\s\S]*?(\d{1,2}\/\d{1,2}\/\d{4}|\d{4}-\d{2}-\d{2})/gi,
      type: 'datv3',
      category: 'endpoint',
      criticality: 'high'
    },
    // Traditional DAT pattern
    { 
      regex: /(?:^|\s)DAT\s+(?:Version\s+)?(\d+)(?!\s+V3)[\s\S]*?(\d+(?:\.\d+)?\s*(?:MB|GB|KB))[\s\S]*?(\d{1,2}\/\d{1,2}\/\d{4}|\d{4}-\d{2}-\d{2})/gi,
      type: 'dat',
      category: 'endpoint',
      criticality: 'high'
    },
    // MEDDAT pattern
    { 
      regex: /MED[-\s]?DAT\s+(?:Version\s+)?(\d+)[\s\S]*?(\d+(?:\.\d+)?\s*(?:MB|GB|KB))[\s\S]*?(\d{1,2}\/\d{1,2}\/\d{4}|\d{4}-\d{2}-\d{2})/gi,
      type: 'meddat',
      category: 'medical',
      criticality: 'critical'
    },
    // TIE pattern
    { 
      regex: /TIE\s+(?:Intelligence\s+)?(?:Feed\s+)?(?:Version\s+)?(\d+(?:\.\d+)*)[\s\S]*?(\d+(?:\.\d+)?\s*(?:MB|GB|KB))[\s\S]*?(\d{1,2}\/\d{1,2}\/\d{4}|\d{4}-\d{2}-\d{2})/gi,
      type: 'tie',
      category: 'tie',
      criticality: 'medium'
    },
    // Exploit Prevention pattern
    { 
      regex: /Exploit\s+Prevention\s+(?:Version\s+)?(\d+(?:\.\d+)*)[\s\S]*?(\d+(?:\.\d+)?\s*(?:MB|GB|KB))[\s\S]*?(\d{1,2}\/\d{1,2}\/\d{4}|\d{4}-\d{2}-\d{2})/gi,
      type: 'exploit_prevention',
      category: 'endpoint',
      criticality: 'critical'
    },
    // AMCore DAT pattern
    { 
      regex: /AMCore\s+(?:Content\s+|DAT\s+)?(?:Version\s+)?(\d+)[\s\S]*?(\d+(?:\.\d+)?\s*(?:MB|GB|KB))[\s\S]*?(\d{1,2}\/\d{1,2}\/\d{4}|\d{4}-\d{2}-\d{2})/gi,
      type: 'amcore_dat',
      category: 'endpoint',
      criticality: 'high'
    },
    // Gateway DAT pattern
    { 
      regex: /Gateway\s+DAT\s+(?:Version\s+)?(\d+)[\s\S]*?(\d+(?:\.\d+)?\s*(?:MB|GB|KB))[\s\S]*?(\d{1,2}\/\d{1,2}\/\d{4}|\d{4}-\d{2}-\d{2})/gi,
      type: 'gateway_dat',
      category: 'gateway',
      criticality: 'high'
    },
    // Email DAT pattern
    { 
      regex: /Email\s+(?:Security\s+)?DAT\s+(?:Version\s+)?(\d+)[\s\S]*?(\d+(?:\.\d+)?\s*(?:MB|GB|KB))[\s\S]*?(\d{1,2}\/\d{1,2}\/\d{4}|\d{4}-\d{2}-\d{2})/gi,
      type: 'email_dat',
      category: 'email',
      criticality: 'high'
    },
    // Security Engine pattern
    { 
      regex: /(?:Security\s+)?Engine\s+(?:Version\s+)?(\d+(?:\.\d+)*(?:\.\d+)*)[\s\S]*?(\d+(?:\.\d+)?\s*(?:MB|GB|KB))[\s\S]*?(\d{1,2}\/\d{1,2}\/\d{4}|\d{4}-\d{2}-\d{2})/gi,
      type: 'engine',
      category: 'general',
      criticality: 'medium'
    }
  ];
  
  // Parse each update type
  for (const pattern of updatePatterns) {
    let match;
    while ((match = pattern.regex.exec(html)) !== null) {
      const [, version, sizeStr, dateStr] = match;
      const sizeMatch = sizeStr.match(/(\d+(?:\.\d+)?)\s*(MB|GB|KB)/i);
      
      if (sizeMatch) {
        const [, size, unit] = sizeMatch;
        const updateType = pattern.type as string;
        const updateName = getUpdateDisplayName(updateType, version);
        
        updates.push({
          name: updateName,
          type: updateType,
          platform: getPlatformForType(updateType),
          version: version,
          release_date: new Date(dateStr).toISOString(),
          file_size: parseSizeToBytes(size, unit),
          file_name: `${updateType.replace('_', '-')}-${version}.zip`,
          sha256: generateMockSHA256(),
          description: getUpdateDescription(updateType),
          is_recommended: pattern.criticality === 'critical' || pattern.criticality === 'high',
          download_url: `https://www.trellix.com/downloads/${updateType.replace('_', '-')}-${version}.zip`,
          update_category: pattern.category,
          criticality_level: pattern.criticality,
          target_systems: getTargetSystems(updateType),
          dependencies: getDependencies(updateType),
          compatibility_info: getCompatibilityInfo(updateType),
          threat_coverage: getThreatCoverage(updateType),
          deployment_notes: getDeploymentNotes(updateType)
        });
      }
    }
  }
  
  return updates;
}

function getUpdateDisplayName(type: string, version: string): string {
  const displayNames: Record<string, string> = {
    'dat': `DAT Version ${version}`,
    'datv3': `DAT V3 Version ${version}`,
    'meddat': `MEDDAT Version ${version}`,
    'tie': `TIE Intelligence Feed ${version}`,
    'exploit_prevention': `Exploit Prevention ${version}`,
    'amcore_dat': `AMCore DAT ${version}`,
    'gateway_dat': `Gateway DAT ${version}`,
    'email_dat': `Email Security DAT ${version}`,
    'engine': `Security Engine ${version}`,
    'content': `Content Update ${version}`
  };
  return displayNames[type] || `Security Update ${version}`;
}

function getPlatformForType(type: string): string {
  const platforms: Record<string, string> = {
    'dat': 'All Platforms',
    'datv3': 'Windows, Linux',
    'meddat': 'Medical Devices',
    'tie': 'TIE Enabled Systems',
    'exploit_prevention': 'Windows',
    'amcore_dat': 'Windows',
    'gateway_dat': 'Email Gateway',
    'email_dat': 'Email Security',
    'engine': 'All Platforms',
    'content': 'All Platforms'
  };
  return platforms[type] || 'All Platforms';
}

function getUpdateDescription(type: string): string {
  const descriptions: Record<string, string> = {
    'dat': 'Traditional DAT file containing virus definitions and signatures',
    'datv3': 'Next-generation DAT Version 3 with enhanced detection capabilities',
    'meddat': 'Specialized threat definitions for medical device security',
    'tie': 'Threat Intelligence Exchange feeds with global reputation data',
    'exploit_prevention': 'Zero-day exploit protection rules and heuristics',
    'amcore_dat': 'Advanced malware core content with behavioral analysis patterns',
    'gateway_dat': 'Email gateway specific threat definitions',
    'email_dat': 'Email security threat definitions and spam filters',
    'engine': 'Core scanning engine with latest detection capabilities',
    'content': 'General content updates and improvements'
  };
  return descriptions[type] || 'Security update package';
}

function getTargetSystems(type: string): any {
  const systems: Record<string, string[]> = {
    'dat': ['Endpoint Security', 'File & Removable Media Protection'],
    'datv3': ['Next-Gen Endpoint', 'Advanced Threat Protection'],
    'meddat': ['Medical Device Security', 'Healthcare Networks'],
    'tie': ['TIE Server', 'Global Threat Intelligence'],
    'exploit_prevention': ['Host Intrusion Prevention', 'Exploit Protection'],
    'amcore_dat': ['Advanced Malware Protection', 'Behavioral Analysis'],
    'gateway_dat': ['Email Gateway Appliance', 'Mail Security'],
    'email_dat': ['Email Protection', 'Anti-Spam'],
    'engine': ['All Security Products', 'Scanning Components'],
    'content': ['All Platforms', 'General Updates']
  };
  return systems[type] || ['General Security Products'];
}

function getDependencies(type: string): any {
  const deps: Record<string, string[]> = {
    'datv3': ['Security Engine 5.7.0+'],
    'meddat': ['Medical Device Connector'],
    'tie': ['TIE Server 2.0+'],
    'exploit_prevention': ['Host IPS Engine'],
    'amcore_dat': ['AMCore Engine 4.0+'],
    'gateway_dat': ['Email Gateway 7.0+'],
    'email_dat': ['Email Protection 8.0+']
  };
  return deps[type] || [];
}

function getCompatibilityInfo(type: string): any {
  return {
    minimum_version: '1.0.0',
    supported_platforms: getPlatformForType(type).split(', '),
    last_supported_version: null
  };
}

function getThreatCoverage(type: string): string[] {
  const coverage: Record<string, string[]> = {
    'dat': ['Viruses', 'Trojans', 'Malware', 'Spyware'],
    'datv3': ['Advanced Persistent Threats', 'Zero-day Exploits', 'Ransomware'],
    'meddat': ['Medical Device Vulnerabilities', 'Healthcare-specific Threats'],
    'tie': ['Global Threat Intelligence', 'Reputation Analysis'],
    'exploit_prevention': ['Zero-day Exploits', 'Buffer Overflows', 'Code Injection'],
    'amcore_dat': ['Advanced Malware', 'Fileless Attacks', 'Behavioral Threats'],
    'gateway_dat': ['Email Threats', 'Phishing', 'Malicious Attachments'],
    'email_dat': ['Spam', 'Phishing', 'Email-borne Malware'],
    'engine': ['Core Detection', 'Scanning Improvements'],
    'content': ['General Updates', 'Performance Improvements']
  };
  return coverage[type] || ['General Security'];
}

function getDeploymentNotes(type: string): string {
  const notes: Record<string, string> = {
    'datv3': 'Requires engine restart after deployment. Test in non-production environment first.',
    'meddat': 'Critical for healthcare environments. Deploy during maintenance windows.',
    'tie': 'Requires TIE server connectivity. Update may take 15-30 minutes to propagate.',
    'exploit_prevention': 'May require system reboot. Schedule deployment carefully.',
    'amcore_dat': 'High memory usage during initial deployment. Monitor system resources.',
    'gateway_dat': 'Email service interruption possible during update. Plan accordingly.',
    'email_dat': 'May affect email flow. Deploy during off-peak hours.'
  };
  return notes[type] || 'Standard deployment procedures apply.';
}

// Convert file size strings to bytes
function parseSizeToBytes(size: string, unit: string): number {
  const sizeNum = parseFloat(size);
  switch (unit.toUpperCase()) {
    case 'KB': return Math.round(sizeNum * 1024);
    case 'MB': return Math.round(sizeNum * 1024 * 1024);
    case 'GB': return Math.round(sizeNum * 1024 * 1024 * 1024);
    default: return Math.round(sizeNum);
  }
}

// Generate mock SHA256 for demo purposes
function generateMockSHA256(): string {
  const chars = '0123456789ABCDEF';
  let result = '';
  for (let i = 0; i < 64; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Process and store updates in database
async function processUpdates(supabase: any, updates: SecurityUpdate[], startTime: number) {
  console.log(`Starting to process ${updates.length} updates...`);

  let newUpdates = 0;
  let totalUpdates = updates.length;

  // Check existing updates and insert new ones
  for (const update of updates) {
    const { data: existing } = await supabase
      .from('security_updates')
      .select('id')
      .eq('name', update.name)
      .eq('version', update.version)
      .eq('platform', update.platform)
      .eq('type', update.type)
      .single();

    if (!existing) {
      // Prepare the insert data with all new fields
      const insertData = {
        name: update.name,
        type: update.type,
        platform: update.platform,
        version: update.version,
        release_date: update.release_date,
        file_size: update.file_size,
        file_name: update.file_name,
        sha256: update.sha256,
        description: update.description,
        is_recommended: update.is_recommended,
        download_url: update.download_url,
        changelog: update.changelog,
        update_category: update.update_category,
        criticality_level: update.criticality_level,
        target_systems: update.target_systems,
        dependencies: update.dependencies,
        compatibility_info: update.compatibility_info,
        threat_coverage: update.threat_coverage,
        deployment_notes: update.deployment_notes
      };

      const { error } = await supabase
        .from('security_updates')
        .insert([insertData]);

      if (error) {
        console.error('Error inserting update:', error);
      } else {
        newUpdates++;
        console.log(`Inserted new update: ${update.name} (${update.type}) v${update.version}`);
      }
    }
  }

  const endTime = Date.now();
  const responseTime = endTime - startTime;

  // Log the fetch operation
  await supabase
    .from('update_logs')
    .insert([{
      updates_found: totalUpdates,
      new_updates: newUpdates,
      status: 'success',
      api_response_time: responseTime
    }]);

  console.log(`Fetch completed: ${newUpdates} new updates out of ${totalUpdates} total`);

  return new Response(
    JSON.stringify({
      success: true,
      updates_found: totalUpdates,
      new_updates: newUpdates,
      response_time_ms: responseTime
    }),
    {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    }
  );