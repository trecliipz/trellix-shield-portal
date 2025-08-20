import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[EPO-INTEGRATION] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Use service role key for admin operations
  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    logStep("Function started");

    const epoServerUrl = Deno.env.get("EPO_SERVER_URL");
    const epoUsername = Deno.env.get("EPO_API_USERNAME");
    const epoPassword = Deno.env.get("EPO_API_PASSWORD");

    if (!epoServerUrl || !epoUsername || !epoPassword) {
      throw new Error("ePO credentials not configured");
    }

    const requestBody = await req.json();
    const { action, customerId, ouGroupName, companyName, serverUrl, username, password } = requestBody;
    
    logStep("Processing ePO action", { action, customerId, ouGroupName });

    if (action === 'test-connection') {
      // Test connection to EPO server
      const testUrl = serverUrl || epoServerUrl;
      const testUsername = username || epoUsername;
      const testPassword = password || epoPassword;
      
      logStep("Testing EPO connection", { url: testUrl });
      
      try {
        // Test basic connectivity with a simple API call
        const testResponse = await fetch(`${testUrl}/remote/core.help`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Basic ${btoa(`${testUsername}:${testPassword}`)}`
          },
          body: JSON.stringify({})
        });

        if (testResponse.ok) {
          logStep("EPO connection successful");
          return new Response(JSON.stringify({
            success: true,
            message: "Successfully connected to EPO server",
            serverUrl: testUrl
          }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
          });
        } else {
          const errorText = await testResponse.text();
          logStep("EPO connection failed", { status: testResponse.status, error: errorText });
          
          return new Response(JSON.stringify({
            success: false,
            error: `EPO server returned ${testResponse.status}: ${errorText}`
          }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
          });
        }
      } catch (connectionError) {
        logStep("EPO connection error", connectionError);
        
        return new Response(JSON.stringify({
          success: false,
          error: `Unable to connect to EPO server: ${connectionError.message}`
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }
    }

    if (action === 'create-customer-ou') {
      // Create System Tree OU for customer
      const createOuResponse = await fetch(`${epoServerUrl}/remote/core.createSystemTreeNode`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${btoa(`${epoUsername}:${epoPassword}`)}`
        },
        body: JSON.stringify({
          parentId: 3, // Assuming 3 is the SaaS-Customers OU ID
          name: ouGroupName,
          description: `Automated OU for ${companyName}`
        })
      });

      if (!createOuResponse.ok) {
        const errorText = await createOuResponse.text();
        logStep("Failed to create OU", { status: createOuResponse.status, error: errorText });
        throw new Error(`Failed to create OU: ${errorText}`);
      }

      const ouData = await createOuResponse.json();
      logStep("OU created successfully", ouData);

      // Generate site key for customer
      const siteKeyResponse = await fetch(`${epoServerUrl}/remote/system.createSiteKey`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${btoa(`${epoUsername}:${epoPassword}`)}`
        },
        body: JSON.stringify({
          name: `${ouGroupName}-SiteKey`,
          description: `Site key for ${companyName}`,
          expiration: new Date(Date.now() + (365 * 24 * 60 * 60 * 1000)).toISOString() // 1 year from now
        })
      });

      let siteKey = null;
      if (siteKeyResponse.ok) {
        const siteKeyData = await siteKeyResponse.json();
        siteKey = siteKeyData.siteKey;
        logStep("Site key generated", { siteKey: siteKey?.substring(0, 10) + "..." });
      } else {
        logStep("Site key generation failed", { status: siteKeyResponse.status });
      }

      // Create agent installer record
      const { data: installerData, error: installerError } = await supabaseAdmin
        .from("agent_installers")
        .insert({
          customer_id: customerId,
          installer_name: `${ouGroupName}-Installer`,
          platform: 'windows',
          site_key: siteKey,
          config_data: {
            ou_group_name: ouGroupName,
            company_name: companyName,
            epo_server: epoServerUrl,
            created_at: new Date().toISOString()
          }
        })
        .select()
        .single();

      if (installerError) {
        logStep("Failed to create installer record", installerError);
        throw new Error(`Failed to create installer record: ${installerError.message}`);
      }

      logStep("Installer record created", { installerId: installerData.id });

      // Apply default policies based on subscription tier
      try {
        const applyPolicyResponse = await fetch(`${epoServerUrl}/remote/policy.assign`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Basic ${btoa(`${epoUsername}:${epoPassword}`)}`
          },
          body: JSON.stringify({
            systemId: ouData.systemId,
            policyName: 'Starter-Policy-Template' // Default to starter policies
          })
        });

        if (applyPolicyResponse.ok) {
          logStep("Default policies applied successfully");
        } else {
          logStep("Policy application failed", { status: applyPolicyResponse.status });
        }
      } catch (policyError) {
        logStep("Policy application error", policyError);
      }

      return new Response(JSON.stringify({
        success: true,
        ouId: ouData.systemId,
        siteKey: siteKey,
        installer: {
          id: installerData.id,
          name: installerData.installer_name
        }
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    if (action === 'generate-installer') {
      // Generate a new installer for existing customer
      const { data: customerData, error: customerError } = await supabaseAdmin
        .from("customers")
        .select("*")
        .eq("id", customerId)
        .single();

      if (customerError || !customerData) {
        throw new Error("Customer not found");
      }

      // Create new installer record
      const { data: installerData, error: installerError } = await supabaseAdmin
        .from("agent_installers")
        .insert({
          customer_id: customerId,
          installer_name: `${customerData.ou_group_name}-Installer-${Date.now()}`,
          platform: 'windows',
          config_data: {
            ou_group_name: customerData.ou_group_name,
            company_name: customerData.company_name,
            epo_server: epoServerUrl,
            created_at: new Date().toISOString()
          }
        })
        .select()
        .single();

      if (installerError) {
        throw new Error(`Failed to create installer: ${installerError.message}`);
      }

      return new Response(JSON.stringify({
        success: true,
        installer: installerData
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    if (action === 'proxy') {
      return await proxyEPORequest(requestBody);
    }

    throw new Error(`Unknown action: ${action}`);

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in ePO integration", { message: errorMessage });
    
    // Check if it's a network connectivity issue
    const isNetworkError = errorMessage.includes('fetch') || 
                         errorMessage.includes('network') ||
                         errorMessage.includes('ENOTFOUND') ||
                         errorMessage.includes('certificate') ||
                         errorMessage.includes('SSL') ||
                         errorMessage.includes('timeout');
    
    return new Response(JSON.stringify({ 
      error: errorMessage,
      type: isNetworkError ? 'network_error' : 'general_error',
      suggestions: isNetworkError ? [
        'Verify EPO server is accessible from internet',
        'Check if using private/internal hostname',
        'Ensure valid SSL certificate is configured',
        'Consider using Cloudflare Tunnel or public DNS'
      ] : [],
      success: false 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});

// New proxy function for general EPO API calls
async function proxyEPORequest(requestData: any) {
  const epoServerUrl = Deno.env.get("EPO_SERVER_URL");
  const epoUsername = Deno.env.get("EPO_API_USERNAME");
  const epoPassword = Deno.env.get("EPO_API_PASSWORD");
  
  logStep('Proxy EPO Request', { endpoint: requestData.endpoint });
  
  const { endpoint, params = {}, useFormData = true } = requestData;
  
  if (!endpoint) {
    throw new Error('Missing endpoint parameter');
  }
  
  // Construct Basic Auth header
  const auth = btoa(`${epoUsername}:${epoPassword}`);
  
  try {
    let body: string;
    let contentType: string;
    
    if (useFormData) {
      // EPO API typically expects form-encoded data
      const formData = new URLSearchParams();
      Object.keys(params).forEach(key => {
        formData.append(key, params[key]);
      });
      body = formData.toString();
      contentType = 'application/x-www-form-urlencoded';
    } else {
      // Some endpoints might accept JSON
      body = JSON.stringify(params);
      contentType = 'application/json';
    }
    
    const response = await fetch(`${epoServerUrl}/remote/${endpoint}`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': contentType,
      },
      body: body
    });
    
    const responseText = await response.text();
    
    logStep('EPO Response', { 
      status: response.status, 
      endpoint,
      responseLength: responseText.length 
    });
    
    return new Response(
      JSON.stringify({
        success: response.ok,
        status: response.status,
        statusText: response.statusText,
        data: responseText,
        endpoint: endpoint,
        timestamp: new Date().toISOString()
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
    
  } catch (error: any) {
    logStep('EPO Proxy Error', { error: error.message, endpoint });
    throw new Error(`EPO API call failed: ${error.message}`);
  }
}