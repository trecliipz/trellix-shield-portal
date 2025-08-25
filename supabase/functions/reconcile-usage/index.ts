import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[RECONCILE-USAGE] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Usage reconciliation started");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const { date } = await req.json();
    const reconciliationDate = date || new Date().toISOString().split('T')[0]; // Default to today

    logStep("Reconciling usage for date", { date: reconciliationDate });

    // Get all active customers
    const { data: customers, error: customerError } = await supabaseClient
      .from('customers')
      .select(`
        id,
        company_name,
        customer_subscriptions!inner (
          id,
          status,
          plan_id
        )
      `)
      .eq('customer_subscriptions.status', 'active');

    if (customerError) {
      logStep("Failed to fetch customers", customerError);
      throw customerError;
    }

    logStep("Processing customers", { count: customers.length });

    const reconciliationResults = [];

    for (const customer of customers) {
      try {
        const result = await reconcileCustomerUsage(supabaseClient, customer, reconciliationDate);
        reconciliationResults.push(result);
        logStep("Customer usage reconciled", { 
          customerId: customer.id, 
          endpointCount: result.endpoint_count 
        });
      } catch (error) {
        logStep("Failed to reconcile customer", { 
          customerId: customer.id, 
          error: error.message 
        });
        reconciliationResults.push({
          customer_id: customer.id,
          success: false,
          error: error.message
        });
      }
    }

    const summary = {
      total_customers: customers.length,
      successful: reconciliationResults.filter(r => r.success).length,
      failed: reconciliationResults.filter(r => !r.success).length,
      total_endpoints: reconciliationResults
        .filter(r => r.success)
        .reduce((sum, r) => sum + (r.endpoint_count || 0), 0)
    };

    logStep("Usage reconciliation completed", summary);

    return new Response(JSON.stringify({
      success: true,
      date: reconciliationDate,
      summary,
      results: reconciliationResults
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in usage reconciliation", { message: errorMessage });
    
    return new Response(JSON.stringify({ 
      success: false,
      error: errorMessage
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function reconcileCustomerUsage(supabaseClient: any, customer: any, date: string) {
  logStep("Reconciling customer usage", { customerId: customer.id, date });

  // Sync endpoints from ePO
  const { data: syncResult, error: syncError } = await supabaseClient.functions.invoke('epo-integration', {
    body: {
      action: 'sync-endpoints',
      customerId: customer.id
    }
  });

  if (syncError || !syncResult.success) {
    throw new Error(`Endpoint sync failed: ${syncError?.message || syncResult?.error}`);
  }

  const endpointCount = syncResult.endpoint_count || 0;

  // Get subscription details for billing limits
  const subscription = customer.customer_subscriptions[0];
  const { data: planDetails } = await supabaseClient
    .from('subscription_plans_epo')
    .select('max_endpoints')
    .eq('id', subscription.plan_id)
    .single();

  const maxEndpoints = planDetails?.max_endpoints || -1; // -1 means unlimited
  const billableEndpoints = maxEndpoints === -1 ? endpointCount : Math.min(endpointCount, maxEndpoints);
  const overageEndpoints = maxEndpoints === -1 ? 0 : Math.max(0, endpointCount - maxEndpoints);

  // Update or create usage record
  const { error: usageError } = await supabaseClient
    .from('usage_records')
    .upsert({
      customer_id: customer.id,
      subscription_id: subscription.id,
      record_date: date,
      endpoint_count: endpointCount,
      billable_endpoints: billableEndpoints,
      overage_endpoints: overageEndpoints,
      sync_source: 'daily_reconciliation'
    });

  if (usageError) {
    logStep("Failed to update usage record", usageError);
    throw usageError;
  }

  // Create overage notification if needed
  if (overageEndpoints > 0) {
    await createOverageNotification(supabaseClient, customer.id, endpointCount, maxEndpoints);
  }

  return {
    customer_id: customer.id,
    success: true,
    endpoint_count: endpointCount,
    billable_endpoints: billableEndpoints,
    overage_endpoints: overageEndpoints,
    plan_limit: maxEndpoints
  };
}

async function createOverageNotification(supabaseClient: any, customerId: string, actualCount: number, limit: number) {
  // Find user for this customer
  const { data: customerUser } = await supabaseClient
    .from('customer_users')
    .select('user_id')
    .eq('customer_id', customerId)
    .single();

  if (customerUser) {
    await supabaseClient
      .from('notifications')
      .insert({
        user_id: customerUser.user_id,
        title: 'Endpoint Limit Exceeded',
        message: `You have ${actualCount} endpoints but your plan allows ${limit}. Consider upgrading your plan.`,
        type: 'billing_alert',
        data: {
          actual_count: actualCount,
          plan_limit: limit,
          overage: actualCount - limit
        }
      });

    logStep("Overage notification created", { customerId, actualCount, limit });
  }
}