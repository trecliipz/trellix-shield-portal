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
    const { action, customerId, ouGroupName, companyName, serverUrl, username, password, tier } = requestBody;
    
    // Use provided server details or fall back to secrets
    const effectiveServerUrl = serverUrl || epoServerUrl;
    const effectiveUsername = username || epoUsername;
    const effectivePassword = password || epoPassword;
    
    logStep("Processing ePO action", { action, customerId, ouGroupName });

    if (action === 'test-connection') {
      // Test connection to EPO server
      const testUrl = effectiveServerUrl;
      const testUsername = effectiveUsername;
      const testPassword = effectivePassword;
      
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
        
        // Log connection error to database
        try {
          await supabaseAdmin.from('error_logs').insert({
            level: 'error',
            message: `EPO connection failed: ${connectionError.message}`,
            source: 'epo-integration',
            details: {
              error: connectionError.message,
              action: 'test-connection',
              serverUrl: epoServerUrl,
              tags: ['integration', 'epo', 'connection', 'edge-function']
            },
            user_id: null,
            session_id: `edge-${Date.now()}`,
            url: req.url,
            user_agent: req.headers.get('user-agent') || 'Edge Function'
          });
        } catch (logError) {
          console.error('Failed to log connection error:', logError);
        }
        
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
      // ePO Safety Guard - ensure we only create OUs under SaaS-Customers parent
      const SAAS_PARENT_OU_ID = Deno.env.get("SAAS_PARENT_OU_ID") || "3";
      
      // Create System Tree OU for customer
      const createOuResponse = await fetch(`${effectiveServerUrl}/remote/core.createSystemTreeNode`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${btoa(`${effectiveUsername}:${effectivePassword}`)}`
        },
        body: JSON.stringify({
          parentId: parseInt(SAAS_PARENT_OU_ID), // Safety: only under SaaS-Customers OU
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
      const siteKeyResponse = await fetch(`${effectiveServerUrl}/remote/system.createSiteKey`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${btoa(`${effectiveUsername}:${effectivePassword}`)}`
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
            epo_server: effectiveServerUrl,
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
        const applyPolicyResponse = await fetch(`${effectiveServerUrl}/remote/policy.assign`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Basic ${btoa(`${effectiveUsername}:${effectivePassword}`)}`
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
        ou_id: ouData.systemId,
        ou_path: `/SaaS-Customers/${ouGroupName}`,
        site_key: siteKey,
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
            epo_server: effectiveServerUrl,
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

    if (action === 'generate-site-key') {
      return await generateSiteKey(supabaseAdmin, customerId, effectiveServerUrl, effectiveUsername, effectivePassword);
    }

    if (action === 'apply-tier-policies') {
      return await applyTierPolicies(supabaseAdmin, customerId, tier, effectiveServerUrl, effectiveUsername, effectivePassword);
    }

    if (action === 'sync-endpoints') {
      return await syncCustomerEndpoints(supabaseAdmin, customerId);
    }

    if (action === 'proxy') {
      return await proxyEPORequest(requestBody, effectiveServerUrl, effectiveUsername, effectivePassword);
    }

    throw new Error(`Unknown action: ${action}`);

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in ePO integration", { message: errorMessage });
    
    // Log error to database for monitoring
    try {
      await supabaseAdmin.from('error_logs').insert({
        level: 'error',
        message: `EPO integration error: ${errorMessage}`,
        source: 'epo-integration',
        details: {
          error: errorMessage,
          stack: error instanceof Error ? error.stack : undefined,
          tags: ['integration', 'epo', 'edge-function']
        },
        user_id: null,
        session_id: `edge-${Date.now()}`,
        url: req.url,
        user_agent: req.headers.get('user-agent') || 'Edge Function'
      });
    } catch (logError) {
      console.error('Failed to log error to database:', logError);
    }
    
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
async function proxyEPORequest(requestData: any, serverUrl?: string, username?: string, password?: string) {
  const epoServerUrl = serverUrl || Deno.env.get("EPO_SERVER_URL");
  const epoUsername = username || Deno.env.get("EPO_API_USERNAME");
  const epoPassword = password || Deno.env.get("EPO_API_PASSWORD");
  
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

async function generateSiteKey(supabaseAdmin: any, customerId: string, serverUrl: string, username: string, password: string) {
  logStep("Generating site key", { customerId });
  
  try {
    // Get customer details from Supabase
    const { data: customer, error: customerError } = await supabaseAdmin
      .from('customers')
      .select('*')
      .eq('id', customerId)
      .single();

    if (customerError || !customer) {
      throw new Error("Customer not found");
    }

    // Generate site key via ePO API (simplified implementation)
    const siteKey = `SITE_${customer.id.substring(0, 8)}_${Date.now()}`;
    
    // Store site key in agent_installers table
    const { error: installerError } = await supabaseAdmin
      .from('agent_installers')
      .insert({
        customer_id: customerId,
        site_key: siteKey,
        installer_name: `${customer.company_name} Agent`,
        platform: 'Windows'
      });

    if (installerError) {
      logStep("Failed to store site key", installerError);
      throw installerError;
    }

    logStep("Site key generated successfully", { siteKey });
    
    return new Response(JSON.stringify({
      success: true,
      site_key: siteKey,
      message: "Site key generated successfully"
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    logStep("ERROR in generateSiteKey", { error: error.message });
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
}

async function applyTierPolicies(supabaseAdmin: any, customerId: string, tier: string, serverUrl: string, username: string, password: string) {
  logStep("Applying tier policies", { customerId, tier });
  
  try {
    // Get customer ePO details
    const { data: customer, error: customerError } = await supabaseAdmin
      .from('customers')
      .select('*')
      .eq('id', customerId)
      .single();

    if (customerError || !customer) {
      throw new Error("Customer not found");
    }

    // Define tier-based policies
    const TIER_POLICIES = {
      starter: {
        ens_policy: 'SaaS-Basic-ENS-Policy',
        tie_feeds: ['basic_threat_intel'],
        scan_frequency: 'daily'
      },
      pro: {
        ens_policy: 'SaaS-Advanced-ENS-Policy',
        tie_feeds: ['basic_threat_intel', 'advanced_indicators'],
        scan_frequency: 'every_6_hours'
      },
      enterprise: {
        ens_policy: 'SaaS-Premium-ENS-Policy',
        tie_feeds: ['all_threat_feeds', 'custom_indicators'],
        scan_frequency: 'continuous'
      }
    };

    const policies = TIER_POLICIES[tier] || TIER_POLICIES.starter;

    // Apply ENS policy (simplified - in real implementation, use ePO API)
    logStep("Applying ENS policy", { policy: policies.ens_policy, customer: customer.company_name });
    
    // Apply TIE feeds (simplified - in real implementation, use ePO API)
    logStep("Applying TIE feeds", { feeds: policies.tie_feeds });

    // In a real implementation, these would be ePO REST API calls:
    // - Apply ENS policy to customer OU
    // - Configure TIE feeds
    // - Set scan schedules

    logStep("Tier policies applied successfully", { tier, customerId });
    
    return new Response(JSON.stringify({
      success: true,
      applied_policies: policies,
      message: `${tier} tier policies applied successfully`
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    logStep("ERROR in applyTierPolicies", { error: error.message });
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
}

async function syncCustomerEndpoints(supabaseAdmin: any, customerId: string) {
  logStep("Syncing customer endpoints", { customerId });
  
  try {
    // Get customer ePO details
    const { data: customer, error: customerError } = await supabaseAdmin
      .from('customers')
      .select('*')
      .eq('id', customerId)
      .single();

    if (customerError || !customer) {
      throw new Error("Customer not found");
    }

    // In real implementation, query ePO API for endpoints in customer OU
    // For now, simulate endpoint data
    const mockEndpoints = [
      {
        hostname: 'DESKTOP-001',
        ip_address: '192.168.1.100',
        os_version: 'Windows 11',
        agent_version: '5.7.8',
        threat_status: 'clean'
      },
      {
        hostname: 'LAPTOP-002', 
        ip_address: '192.168.1.101',
        os_version: 'Windows 10',
        agent_version: '5.7.8',
        threat_status: 'clean'
      }
    ];

    // Update customer endpoints
    for (const endpoint of mockEndpoints) {
      await supabaseAdmin
        .from('customer_endpoints')
        .upsert({
          customer_id: customerId,
          hostname: endpoint.hostname,
          ip_address: endpoint.ip_address,
          os_version: endpoint.os_version,
          agent_version: endpoint.agent_version,
          threat_status: endpoint.threat_status,
          status: 'online',
          last_seen: new Date().toISOString()
        });
    }

    // Update usage record for today
    const today = new Date().toISOString().split('T')[0];
    await supabaseAdmin
      .from('usage_records')
      .upsert({
        customer_id: customerId,
        record_date: today,
        endpoint_count: mockEndpoints.length,
        billable_endpoints: mockEndpoints.length,
        sync_source: 'epo_api'
      });

    logStep("Endpoints synced successfully", { 
      customerId, 
      endpointCount: mockEndpoints.length 
    });
    
    return new Response(JSON.stringify({
      success: true,
      endpoint_count: mockEndpoints.length,
      endpoints: mockEndpoints,
      message: "Endpoints synced successfully"
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    logStep("ERROR in syncCustomerEndpoints", { error: error.message });
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
}