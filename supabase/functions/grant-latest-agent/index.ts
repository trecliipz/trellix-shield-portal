import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper logging function for debugging
const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[GRANT-LATEST-AGENT] ${step}${detailsStr}`);
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
    
    logStep("User authenticated", { userId: user.id, email: user.email });

    // Check if user has an active subscription
    const { data: subscription, error: subError } = await supabaseClient
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single();

    if (subError && subError.code !== 'PGRST116') {
      throw new Error(`Subscription check error: ${subError.message}`);
    }

    if (!subscription) {
      logStep("No active subscription found for user");
      return new Response(JSON.stringify({ 
        success: false, 
        message: "No active subscription found. Please subscribe to download agents." 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 403,
      });
    }

    logStep("Active subscription found", { planType: subscription.plan_type });

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
        message: "No active agents available for download." 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 404,
      });
    }

    logStep("Latest agent found", { agentId: latestAgent.id, name: latestAgent.name, version: latestAgent.version });

    // Check if user already has this agent assigned
    const { data: existingAssignment } = await supabaseClient
      .from('agent_downloads')
      .select('*')
      .eq('user_id', user.id)
      .eq('agent_name', latestAgent.name)
      .eq('agent_version', latestAgent.version)
      .single();

    if (existingAssignment) {
      logStep("Agent already assigned to user");
      return new Response(JSON.stringify({ 
        success: true, 
        message: "Latest agent is already available for download.",
        agent: {
          name: latestAgent.name,
          version: latestAgent.version,
          status: existingAssignment.status
        }
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Assign the latest agent to the user
    const { data: newAssignment, error: assignError } = await supabaseClient
      .from('agent_downloads')
      .insert({
        user_id: user.id,
        agent_name: latestAgent.name,
        agent_version: latestAgent.version,
        file_name: latestAgent.file_name,
        platform: latestAgent.platform,
        file_size: latestAgent.file_size,
        status: 'available'
      })
      .select()
      .single();

    if (assignError) {
      throw new Error(`Failed to assign agent: ${assignError.message}`);
    }

    logStep("Agent successfully assigned", { assignmentId: newAssignment.id });

    return new Response(JSON.stringify({ 
      success: true, 
      message: "Latest agent has been granted and is now available for download.",
      agent: {
        name: latestAgent.name,
        version: latestAgent.version,
        file_name: latestAgent.file_name,
        platform: latestAgent.platform,
        status: 'available'
      }
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in grant-latest-agent", { message: errorMessage });
    
    return new Response(JSON.stringify({ 
      success: false, 
      error: errorMessage 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});