import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.5'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface DownloadRequest {
  updateId: string;
  name: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Security update download request received');
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Parse request body
    const { updateId, name }: DownloadRequest = await req.json();
    console.log(`Download requested for update: ${updateId} - ${name}`);

    // Get the security update from database
    const { data: update, error } = await supabase
      .from('security_updates')
      .select('*')
      .eq('id', updateId)
      .single();

    if (error || !update) {
      console.error('Update not found:', error);
      return new Response(
        JSON.stringify({ error: 'Security update not found' }), 
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // For demo purposes, generate a mock download URL
    // In production, this would be the actual file URL from your storage
    const downloadUrl = `https://updates.trellix.com/packages/${update.type}/${update.version}/${update.name.replace(/\s+/g, '_')}.zip`;
    const filename = `${update.name.replace(/\s+/g, '_')}_v${update.version}.zip`;

    console.log(`Generated download URL: ${downloadUrl}`);

    // Log the download activity
    await supabase
      .from('audit_logs')
      .insert({
        action: 'security_update_download',
        resource_type: 'security_update',
        resource_id: updateId,
        details: {
          update_name: update.name,
          update_type: update.type,
          version: update.version,
          file_size: update.file_size
        }
      });

    return new Response(
      JSON.stringify({ 
        downloadUrl,
        filename,
        fileSize: update.file_size,
        updateInfo: {
          name: update.name,
          type: update.type,
          version: update.version
        }
      }), 
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Download error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to process download request' }), 
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});