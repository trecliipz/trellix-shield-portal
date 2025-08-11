import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.5";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
    const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
      console.error("Missing Supabase env vars");
      return new Response(
        JSON.stringify({ error: "Server not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Expect JSON body: { user_ids: string[] }
    const { user_ids } = await req.json().catch(() => ({ user_ids: [] }));

    if (!Array.isArray(user_ids) || user_ids.length === 0) {
      return new Response(
        JSON.stringify({ error: "user_ids must be a non-empty array" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    // Fetch agent download rows for these users
    const { data, error } = await supabase
      .from("agent_downloads")
      .select("user_id, status")
      .in("user_id", user_ids);

    if (error) {
      console.error("Error fetching agent download status:", error);
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const availabilityMap: Record<string, { available: boolean; total_available: number }> = {};

    // Initialize all to false
    for (const uid of user_ids) {
      availabilityMap[uid] = { available: false, total_available: 0 };
    }

    for (const row of data ?? []) {
      const uid = row.user_id as string;
      if (!availabilityMap[uid]) availabilityMap[uid] = { available: false, total_available: 0 };
      if (row.status === "available") {
        availabilityMap[uid].available = true;
        availabilityMap[uid].total_available += 1;
      }
    }

    const result = Object.entries(availabilityMap).map(([user_id, v]) => ({ user_id, ...v }));

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("agent-download-status unexpected error:", e);
    return new Response(
      JSON.stringify({ error: "Internal error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
