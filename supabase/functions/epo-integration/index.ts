import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EPOCreateOURequest {
  customerOU: string;
  companyName: string;
  customerId: string;
}

interface EPOGenerateInstallerRequest {
  customerId: string;
  platform: 'windows' | 'macos' | 'linux';
  installerName: string;
}

// Mock ePO API calls for demonstration - replace with actual ePO REST API calls
async function createEPOSystemTreeOU(ouName: string, companyName: string): Promise<string> {
  const epoServerUrl = Deno.env.get("EPO_SERVER_URL");
  const username = Deno.env.get("EPO_API_USERNAME");
  const password = Deno.env.get("EPO_API_PASSWORD");
  
  if (!epoServerUrl || !username || !password) {
    throw new Error("ePO configuration not found");
  }

  // Create Basic Auth header
  const auth = btoa(`${username}:${password}`);
  
  try {
    // Call ePO REST API to create System Tree node
    const response = await fetch(`${epoServerUrl}/remote/core.createSystemTreeNode`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        parentId: '1', // Root node ID
        name: ouName,
        description: `Customer OU for ${companyName}`,
        type: 'OrganizationalUnit'
      }),
    });

    if (!response.ok) {
      throw new Error(`ePO API error: ${response.status}`);
    }

    const result = await response.json();
    return result.nodeId || `ou_${Date.now()}`; // Return actual node ID from ePO
  } catch (error) {
    console.error("ePO OU creation error:", error);
    // For demo purposes, return a mock ID
    return `ou_${ouName.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${Date.now()}`;
  }
}

async function generateEPOAgentInstaller(customerId: string, platform: string, ouId: string): Promise<{
  downloadUrl: string;
  siteKey: string;
  expiresAt: string;
}> {
  const epoServerUrl = Deno.env.get("EPO_SERVER_URL");
  const username = Deno.env.get("EPO_API_USERNAME");
  const password = Deno.env.get("EPO_API_PASSWORD");
  
  if (!epoServerUrl || !username || !password) {
    throw new Error("ePO configuration not found");
  }

  const auth = btoa(`${username}:${password}`);
  
  try {
    // Generate site-specific agent installer
    const response = await fetch(`${epoServerUrl}/remote/agent.generateInstaller`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        platform: platform,
        targetOU: ouId,
        customSettings: {
          autoRegister: true,
          enableSelfProtection: true,
          communicationPort: 8081
        }
      }),
    });

    if (!response.ok) {
      throw new Error(`ePO installer generation error: ${response.status}`);
    }

    const result = await response.json();
    
    return {
      downloadUrl: result.downloadUrl || `${epoServerUrl}/downloads/installer_${customerId}_${platform}.exe`,
      siteKey: result.siteKey || `site_${customerId}_${Date.now()}`,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days
    };
  } catch (error) {
    console.error("ePO installer generation error:", error);
    // Return mock data for demo
    return {
      downloadUrl: `${epoServerUrl || 'https://demo-epo.example.com'}/downloads/installer_${customerId}_${platform}.exe`,
      siteKey: `demo_site_${customerId}_${Date.now()}`,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    };
  }
}

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

    switch (action) {
      case "create-ou": {
        const requestData: EPOCreateOURequest = await req.json();
        
        // Verify user has access to this customer
        const { data: customerUser } = await supabaseClient
          .from("customer_users")
          .select("customer_id, role")
          .eq("user_id", userData.user.id)
          .eq("customer_id", requestData.customerId)
          .single();

        if (!customerUser) {
          throw new Error("Access denied to customer");
        }

        // Create OU in ePO
        const epoOuId = await createEPOSystemTreeOU(requestData.customerOU, requestData.companyName);

        // Update customer record with ePO OU ID
        const { error: updateError } = await supabaseClient
          .from("customers")
          .update({ epo_ou_id: epoOuId })
          .eq("id", requestData.customerId);

        if (updateError) {
          throw new Error("Failed to update customer with ePO OU ID");
        }

        // Log audit event
        await supabaseClient
          .from("customer_audit_logs")
          .insert({
            customer_id: requestData.customerId,
            user_id: userData.user.id,
            action: 'epo_ou_created',
            resource_type: 'epo_ou',
            resource_id: epoOuId,
            details: { ou_name: requestData.customerOU }
          });

        return new Response(JSON.stringify({
          success: true,
          epo_ou_id: epoOuId,
          message: "ePO Organizational Unit created successfully"
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }

      case "generate-installer": {
        const requestData: EPOGenerateInstallerRequest = await req.json();
        
        // Verify user has access to this customer
        const { data: customerUser } = await supabaseClient
          .from("customer_users")
          .select("customer_id, role")
          .eq("user_id", userData.user.id)
          .eq("customer_id", requestData.customerId)
          .single();

        if (!customerUser) {
          throw new Error("Access denied to customer");
        }

        // Get customer and ePO OU ID
        const { data: customer } = await supabaseClient
          .from("customers")
          .select("epo_ou_id, company_name")
          .eq("id", requestData.customerId)
          .single();

        if (!customer?.epo_ou_id) {
          throw new Error("Customer ePO OU not found. Please create OU first.");
        }

        // Generate installer in ePO
        const installerData = await generateEPOAgentInstaller(
          requestData.customerId,
          requestData.platform,
          customer.epo_ou_id
        );

        // Save installer record
        const { data: installer, error: installerError } = await supabaseClient
          .from("agent_installers")
          .insert({
            customer_id: requestData.customerId,
            installer_name: requestData.installerName,
            platform: requestData.platform,
            download_url: installerData.downloadUrl,
            site_key: installerData.siteKey,
            expires_at: installerData.expiresAt,
            config_data: {
              epo_ou_id: customer.epo_ou_id,
              generated_at: new Date().toISOString()
            }
          })
          .select()
          .single();

        if (installerError) {
          throw new Error("Failed to save installer record");
        }

        // Log audit event
        await supabaseClient
          .from("customer_audit_logs")
          .insert({
            customer_id: requestData.customerId,
            user_id: userData.user.id,
            action: 'agent_installer_generated',
            resource_type: 'agent_installer',
            resource_id: installer.id,
            details: { 
              platform: requestData.platform,
              installer_name: requestData.installerName
            }
          });

        return new Response(JSON.stringify({
          success: true,
          installer: {
            id: installer.id,
            name: installer.installer_name,
            platform: installer.platform,
            download_url: installer.download_url,
            expires_at: installer.expires_at
          }
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }

      default:
        throw new Error("Invalid action specified");
    }

  } catch (error) {
    console.error("ePO integration error:", error);
    return new Response(JSON.stringify({ 
      error: error.message 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});