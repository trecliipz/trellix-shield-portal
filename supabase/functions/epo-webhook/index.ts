
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[EPO-WEBHOOK] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("ePO webhook received");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const payload = await req.json();
    logStep("Payload received", { eventType: payload.event_type });

    // Store the event in our database
    const { data: epoEvent, error: insertError } = await supabaseClient
      .from('epo_events')
      .insert({
        event_id: payload.event_id || crypto.randomUUID(),
        customer_id: payload.customer_id || null,
        source: payload.source || 'epo',
        event_type: payload.event_type || 'unknown',
        payload: payload,
        processed: false
      })
      .select()
      .single();

    if (insertError) {
      logStep("Failed to store ePO event", insertError);
      throw new Error(`Database error: ${insertError.message}`);
    }

    logStep("ePO event stored", { eventId: epoEvent.id });

    // Process specific event types
    let processingResult = { success: true, message: 'Event stored' };

    switch (payload.event_type) {
      case 'agent_installation':
        processingResult = await handleAgentInstallation(supabaseClient, payload);
        break;
      
      case 'policy_update':
        processingResult = await handlePolicyUpdate(supabaseClient, payload);
        break;

      case 'threat_detection':
        processingResult = await handleThreatDetection(supabaseClient, payload);
        break;

      case 'system_status':
        processingResult = await handleSystemStatus(supabaseClient, payload);
        break;

      default:
        logStep("Unhandled ePO event type", { type: payload.event_type });
        processingResult = { success: true, message: `Stored unhandled event type: ${payload.event_type}` };
    }

    // Update event processing status
    const { error: updateError } = await supabaseClient
      .from('epo_events')
      .update({
        processed: true,
        processing_error: processingResult.success ? null : processingResult.message
      })
      .eq('id', epoEvent.id);

    if (updateError) {
      logStep("Failed to update event status", updateError);
    }

    logStep("ePO webhook processing completed", processingResult);

    return new Response(JSON.stringify({
      received: true,
      processed: processingResult.success,
      message: processingResult.message,
      event_id: epoEvent.id
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in ePO webhook", { message: errorMessage });
    
    return new Response(JSON.stringify({ 
      error: errorMessage,
      received: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

async function handleAgentInstallation(supabaseClient: any, payload: any) {
  try {
    logStep("Processing agent installation event");
    
    // Update agent download status if we have user mapping
    if (payload.endpoint_id && payload.customer_id) {
      const { error } = await supabaseClient
        .from('agent_downloads')
        .update({
          status: 'installed',
          installed_at: new Date().toISOString()
        })
        .match({
          user_id: payload.user_id,
          status: 'downloaded'
        });

      if (error) {
        logStep("Failed to update agent download status", error);
      }
    }

    return { success: true, message: "Agent installation processed" };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in handleAgentInstallation", { message: errorMessage });
    return { success: false, message: errorMessage };
  }
}

async function handlePolicyUpdate(supabaseClient: any, payload: any) {
  try {
    logStep("Processing policy update event");
    
    // Could trigger notifications to customers about policy changes
    if (payload.customer_id) {
      await supabaseClient
        .from('notifications')
        .insert({
          user_id: payload.customer_id, // This would need proper user mapping
          title: 'Policy Update',
          message: `Security policy has been updated: ${payload.policy_name || 'Unknown'}`,
          type: 'policy_update'
        });
    }

    return { success: true, message: "Policy update processed" };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in handlePolicyUpdate", { message: errorMessage });
    return { success: false, message: errorMessage };
  }
}

async function handleThreatDetection(supabaseClient: any, payload: any) {
  try {
    logStep("Processing threat detection event");
    
    // Store threat data and notify customer
    if (payload.customer_id && payload.threat_data) {
      await supabaseClient
        .from('notifications')
        .insert({
          user_id: payload.customer_id, // This would need proper user mapping
          title: 'Threat Detected',
          message: `Security threat detected: ${payload.threat_data.name || 'Unknown threat'}`,
          type: 'security_alert',
          data: payload.threat_data
        });
    }

    return { success: true, message: "Threat detection processed" };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in handleThreatDetection", { message: errorMessage });
    return { success: false, message: errorMessage };
  }
}

async function handleSystemStatus(supabaseClient: any, payload: any) {
  try {
    logStep("Processing system status event");
    
    // Log system health status
    await supabaseClient
      .from('health_logs')
      .insert({
        overall_status: payload.status || 'unknown',
        service_status: { epo_server: payload },
        details: { source: 'epo_webhook', payload }
      });

    return { success: true, message: "System status processed" };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in handleSystemStatus", { message: errorMessage });
    return { success: false, message: errorMessage };
  }
}
