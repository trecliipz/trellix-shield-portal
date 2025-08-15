import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError || !userData.user) {
      throw new Error("Invalid user token");
    }

    const url = new URL(req.url);
    const action = url.searchParams.get("action");

    // Get user's customer information
    const { data: customerUser } = await supabaseClient
      .from("customer_users")
      .select(`
        customer_id,
        role,
        customers (
          id,
          company_name,
          ou_group_name,
          contact_name,
          contact_email,
          phone,
          status,
          stripe_customer_id,
          epo_ou_id,
          created_at
        )
      `)
      .eq("user_id", userData.user.id)
      .single();

    if (!customerUser?.customers) {
      throw new Error("Customer not found for user");
    }

    const customer = customerUser.customers;

    switch (action) {
      case "get-dashboard": {
        // Get subscription info
        const { data: subscription } = await supabaseClient
          .from("customer_subscriptions")
          .select(`
            *,
            subscription_plans_epo (
              plan_name,
              display_name,
              features,
              price_per_endpoint_monthly,
              price_per_endpoint_yearly
            )
          `)
          .eq("customer_id", customer.id)
          .eq("status", "active")
          .single();

        // Get endpoint count
        const { count: endpointCount } = await supabaseClient
          .from("customer_endpoints")
          .select("*", { count: "exact" })
          .eq("customer_id", customer.id);

        // Get recent endpoints
        const { data: recentEndpoints } = await supabaseClient
          .from("customer_endpoints")
          .select("hostname, status, last_seen, threat_status, created_at")
          .eq("customer_id", customer.id)
          .order("created_at", { ascending: false })
          .limit(10);

        // Get agent installers
        const { data: installers } = await supabaseClient
          .from("agent_installers")
          .select("id, installer_name, platform, download_count, created_at, expires_at")
          .eq("customer_id", customer.id)
          .order("created_at", { ascending: false });

        // Get recent audit logs
        const { data: auditLogs } = await supabaseClient
          .from("customer_audit_logs")
          .select("action, resource_type, details, created_at")
          .eq("customer_id", customer.id)
          .order("created_at", { ascending: false })
          .limit(20);

        return new Response(JSON.stringify({
          customer: {
            ...customer,
            role: customerUser.role
          },
          subscription,
          endpoints: {
            count: endpointCount || 0,
            recent: recentEndpoints || []
          },
          installers: installers || [],
          recentActivity: auditLogs || []
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }

      case "get-endpoints": {
        const page = parseInt(url.searchParams.get("page") || "1");
        const limit = parseInt(url.searchParams.get("limit") || "25");
        const offset = (page - 1) * limit;

        const { data: endpoints, count } = await supabaseClient
          .from("customer_endpoints")
          .select("*", { count: "exact" })
          .eq("customer_id", customer.id)
          .order("last_seen", { ascending: false })
          .range(offset, offset + limit - 1);

        return new Response(JSON.stringify({
          endpoints: endpoints || [],
          pagination: {
            page,
            limit,
            total: count || 0,
            totalPages: Math.ceil((count || 0) / limit)
          }
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }

      case "get-billing": {
        // Get subscription and usage records
        const { data: subscription } = await supabaseClient
          .from("customer_subscriptions")
          .select(`
            *,
            subscription_plans_epo (
              plan_name,
              display_name,
              price_per_endpoint_monthly,
              price_per_endpoint_yearly
            )
          `)
          .eq("customer_id", customer.id)
          .eq("status", "active")
          .single();

        const { data: usageRecords } = await supabaseClient
          .from("usage_records")
          .select("*")
          .eq("customer_id", customer.id)
          .order("period_start", { ascending: false })
          .limit(12);

        return new Response(JSON.stringify({
          subscription,
          usageHistory: usageRecords || []
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }

      case "get-installers": {
        const { data: installers } = await supabaseClient
          .from("agent_installers")
          .select("*")
          .eq("customer_id", customer.id)
          .order("created_at", { ascending: false });

        return new Response(JSON.stringify({
          installers: installers || []
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }

      case "download-installer": {
        const installerId = url.searchParams.get("installer_id");
        if (!installerId) {
          throw new Error("Installer ID required");
        }

        // Get installer and increment download count
        const { data: installer, error } = await supabaseClient
          .from("agent_installers")
          .select("*")
          .eq("id", installerId)
          .eq("customer_id", customer.id)
          .single();

        if (error || !installer) {
          throw new Error("Installer not found");
        }

        // Increment download count
        await supabaseClient
          .from("agent_installers")
          .update({ download_count: (installer.download_count || 0) + 1 })
          .eq("id", installerId);

        // Log download
        await supabaseClient
          .from("customer_audit_logs")
          .insert({
            customer_id: customer.id,
            user_id: userData.user.id,
            action: 'installer_downloaded',
            resource_type: 'agent_installer',
            resource_id: installerId,
            details: { 
              installer_name: installer.installer_name,
              platform: installer.platform
            }
          });

        return new Response(JSON.stringify({
          download_url: installer.download_url,
          installer_name: installer.installer_name,
          platform: installer.platform
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }

      default:
        throw new Error("Invalid action specified");
    }

  } catch (error) {
    console.error("Customer portal error:", error);
    return new Response(JSON.stringify({ 
      error: error.message 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});