import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[HEALTH-CHECK] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Health check started");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const healthStatus = {
      timestamp: new Date().toISOString(),
      services: {
        database: false,
        epo_server: false,
        provisioning: false
      },
      overall_status: 'healthy'
    };

    // Check database connectivity
    try {
      const { data, error } = await supabaseClient
        .from('customers')
        .select('count')
        .limit(1);
      
      healthStatus.services.database = !error;
      logStep("Database health", { status: healthStatus.services.database });
    } catch (error) {
      logStep("Database check failed", { error: error.message });
      healthStatus.services.database = false;
    }

    // Check ePO server connectivity
    try {
      const { data: epoResult, error: epoError } = await supabaseClient.functions.invoke('epo-integration', {
        body: {
          action: 'health-check'
        }
      });

      healthStatus.services.epo_server = epoResult?.success || false;
      logStep("ePO health", { status: healthStatus.services.epo_server });
    } catch (error) {
      logStep("ePO check failed", { error: error.message });
      healthStatus.services.epo_server = false;
    }

    // Check for failed provisioning jobs
    try {
      const { data: failedJobs } = await supabaseClient
        .from('provisioning_jobs')
        .select('count')
        .eq('status', 'failed')
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

      const failedCount = failedJobs?.length || 0;
      healthStatus.services.provisioning = failedCount === 0;
      logStep("Provisioning health", { failedJobs: failedCount });
    } catch (error) {
      logStep("Provisioning check failed", { error: error.message });
      healthStatus.services.provisioning = false;
    }

    // Determine overall status
    const allHealthy = Object.values(healthStatus.services).every(status => status);
    healthStatus.overall_status = allHealthy ? 'healthy' : 'degraded';

    // Log health status for monitoring
    logStep("Health check completed", healthStatus);

    return new Response(JSON.stringify(healthStatus), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: allHealthy ? 200 : 503
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in health check", { message: errorMessage });
    
    return new Response(JSON.stringify({ 
      error: errorMessage,
      overall_status: 'unhealthy',
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});