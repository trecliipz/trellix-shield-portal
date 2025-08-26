
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[RATE-LIMITER] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Rate limiter check requested");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const { identifier, limit = 60, window_seconds = 60 } = await req.json();

    if (!identifier) {
      throw new Error("Missing required field: identifier");
    }

    logStep("Checking rate limit", { identifier, limit, window_seconds });

    const windowStart = new Date();
    windowStart.setSeconds(windowStart.getSeconds() - window_seconds);

    // Check current rate limit status
    const { data: existingLimit, error: selectError } = await supabaseClient
      .from('api_rate_limits')
      .select('*')
      .eq('identifier', identifier)
      .gte('window_start', windowStart.toISOString())
      .order('window_start', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (selectError) {
      throw new Error(`Database error: ${selectError.message}`);
    }

    let currentCount = 0;
    let isBlocked = false;

    if (existingLimit) {
      currentCount = existingLimit.request_count;
      
      if (currentCount >= limit) {
        isBlocked = true;
        logStep("Rate limit exceeded", { identifier, currentCount, limit });
        
        return new Response(JSON.stringify({
          allowed: false,
          blocked: true,
          current_count: currentCount,
          limit: limit,
          window_seconds: window_seconds,
          reset_time: new Date(existingLimit.window_start).getTime() + (window_seconds * 1000),
          message: "Rate limit exceeded"
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 429,
        });
      }

      // Increment the counter
      const { error: updateError } = await supabaseClient
        .from('api_rate_limits')
        .update({
          request_count: currentCount + 1,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingLimit.id);

      if (updateError) {
        logStep("Failed to update rate limit", updateError);
      }

      currentCount += 1;
    } else {
      // Create new rate limit window
      const { error: insertError } = await supabaseClient
        .from('api_rate_limits')
        .insert({
          identifier,
          window_start: new Date().toISOString(),
          window_seconds,
          request_count: 1
        });

      if (insertError) {
        logStep("Failed to create rate limit", insertError);
      }

      currentCount = 1;
    }

    logStep("Rate limit check completed", { identifier, currentCount, limit, allowed: true });

    return new Response(JSON.stringify({
      allowed: true,
      blocked: false,
      current_count: currentCount,
      limit: limit,
      window_seconds: window_seconds,
      remaining: Math.max(0, limit - currentCount),
      message: "Request allowed"
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in rate limiter", { message: errorMessage });
    
    return new Response(JSON.stringify({ 
      error: errorMessage,
      allowed: false,
      blocked: false
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
