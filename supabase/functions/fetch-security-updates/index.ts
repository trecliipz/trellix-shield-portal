import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.5';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SecurityUpdate {
  name: string;
  type: 'dat' | 'engine' | 'content';
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

    // For demo purposes, we'll simulate fetching from Trellix APIs
    // In production, you would integrate with actual Trellix/McAfee update servers
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

    let newUpdates = 0;
    let totalUpdates = mockUpdates.length;

    // Check existing updates and insert new ones
    for (const update of mockUpdates) {
      const { data: existing } = await supabase
        .from('security_updates')
        .select('id')
        .eq('name', update.name)
        .eq('version', update.version)
        .eq('platform', update.platform)
        .single();

      if (!existing) {
        const { error } = await supabase
          .from('security_updates')
          .insert([update]);

        if (error) {
          console.error('Error inserting update:', error);
        } else {
          newUpdates++;
          console.log(`Inserted new update: ${update.name} v${update.version}`);
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