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
    // Try to verify JWT token, but fall back to public access if not authenticated
    const authHeader = req.headers.get("authorization");
    let userData = null;
    
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
      const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

      if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
        console.error("Missing Supabase env vars");
        return new Response(
          JSON.stringify({ error: "Server not configured" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

      // Verify the user's JWT token
      const jwt = authHeader.replace("Bearer ", "");
      const { data: userResult, error: userError } = await supabase.auth.getUser(jwt);
      
      if (!userError && userResult.user) {
        userData = userResult;
        
        // Check if user has admin role (check profiles table for admin email)
        const { data: profile } = await supabase
          .from("profiles")
          .select("email")
          .eq("id", userData.user.id)
          .single();

        if (profile?.email?.includes('admin')) {
          // Admin access - return detailed data
          const { data, error } = await supabase
            .from("profiles")
            .select("id, name, email, department, is_online")
            .order("name", { ascending: true });

          if (error) {
            console.error("Error fetching profiles:", error);
            return new Response(
              JSON.stringify({ error: error.message }),
              { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }

          return new Response(
            JSON.stringify(data ?? []),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }
    }

    // No authentication or non-admin - return public demo data
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") ?? "";

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      console.error("Missing Supabase env vars for public access");
      return new Response(
        JSON.stringify({ error: "Server not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const publicSupabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    // Return limited public data or demo data
    const { data, error } = await publicSupabase
      .from("profiles")
      .select("id, name, email")
      .limit(10)
      .order("name", { ascending: true });

    if (error) {
      console.log("Public profiles access failed, returning demo data");
      // Return demo data if no profiles accessible
      const demoData = [
        { id: "demo-1", name: "Demo Admin", email: "admin@demo.com" },
        { id: "demo-2", name: "Demo User", email: "user@demo.com" }
      ];
      return new Response(
        JSON.stringify(demoData),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify(data ?? []),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("list-profiles unexpected error:", e);
    return new Response(
      JSON.stringify({ error: "Internal error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
