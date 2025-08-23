import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper logging function for debugging
const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[GRANT-LATEST-AGENT-BULK] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    // Initialize Supabase client with service role key for administrative operations
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");
    
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user) throw new Error("User not authenticated");
    
    // Check if user is admin
    const { data: userRole } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .single();

    if (!userRole) {
      throw new Error("Unauthorized: Admin access required");
    }

    logStep("Admin user authenticated", { userId: user.id });

    // Get the latest active agent
    const { data: latestAgent, error: agentError } = await supabaseClient
      .from('admin_agent_packages')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (agentError) {
      logStep("No active agents found", { error: agentError.message });
      return new Response(JSON.stringify({ 
        success: false, 
        message: "No active agents available for assignment." 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 404,
      });
    }

    logStep("Latest agent found", { agentId: latestAgent.id, name: latestAgent.name, version: latestAgent.version });

    // Get all users with active subscriptions
    const { data: activeSubscriptions, error: subError } = await supabaseClient
      .from('user_subscriptions')
      .select('user_id, plan_type')
      .eq('status', 'active');

    if (subError) {
      throw new Error(`Failed to get active subscriptions: ${subError.message}`);
    }

    if (!activeSubscriptions || activeSubscriptions.length === 0) {
      logStep("No active subscriptions found");
      return new Response(JSON.stringify({ 
        success: true, 
        message: "No users with active subscriptions found.",
        processed: 0,
        assigned: 0
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    logStep("Active subscriptions found", { count: activeSubscriptions.length });

    let processed = 0;
    let assigned = 0;
    const errors: string[] = [];

    // Process each subscribed user
    for (const subscription of activeSubscriptions) {
      try {
        processed++;
        
        // Check if user already has this agent assigned
        const { data: existingAssignment } = await supabaseClient
          .from('agent_downloads')
          .select('id')
          .eq('user_id', subscription.user_id)
          .eq('agent_name', latestAgent.name)
          .eq('agent_version', latestAgent.version)
          .single();

        if (existingAssignment) {
          logStep("Agent already assigned to user", { userId: subscription.user_id });
          continue;
        }

        // Assign the latest agent to the user
        const { error: assignError } = await supabaseClient
          .from('agent_downloads')
          .insert({
            user_id: subscription.user_id,
            agent_name: latestAgent.name,
            agent_version: latestAgent.version,
            file_name: latestAgent.file_name,
            platform: latestAgent.platform,
            file_size: latestAgent.file_size,
            status: 'available',
            assigned_by_admin: user.id
          });

        if (assignError) {
          errors.push(`User ${subscription.user_id}: ${assignError.message}`);
          logStep("Failed to assign agent to user", { userId: subscription.user_id, error: assignError.message });
        } else {
          assigned++;
          logStep("Agent assigned to user", { userId: subscription.user_id });
        }

      } catch (error) {
        errors.push(`User ${subscription.user_id}: ${error instanceof Error ? error.message : String(error)}`);
        logStep("Error processing user", { userId: subscription.user_id, error: error instanceof Error ? error.message : String(error) });
      }
    }

    logStep("Bulk assignment completed", { processed, assigned, errors: errors.length });

    return new Response(JSON.stringify({ 
      success: true, 
      message: `Bulk assignment completed. Processed ${processed} users, assigned to ${assigned} users.`,
      processed,
      assigned,
      errors: errors.length > 0 ? errors : undefined,
      agent: {
        name: latestAgent.name,
        version: latestAgent.version,
        platform: latestAgent.platform
      }
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in grant-latest-agent-bulk", { message: errorMessage });
    
    return new Response(JSON.stringify({ 
      success: false, 
      error: errorMessage 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});