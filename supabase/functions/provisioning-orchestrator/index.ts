import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[PROVISIONING-ORCHESTRATOR] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Provisioning request received");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const { customer_id, action, subscription_data } = await req.json();

    if (!customer_id) {
      throw new Error("customer_id is required");
    }

    logStep("Provisioning parameters", { customer_id, action });

    let result;
    switch (action) {
      case 'start_onboarding':
        result = await startCustomerOnboarding(supabaseClient, customer_id, subscription_data);
        break;
      case 'retry_step':
        result = await retryProvisioningStep(supabaseClient, customer_id);
        break;
      default:
        throw new Error(`Unknown action: ${action}`);
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in provisioning", { message: errorMessage });
    
    return new Response(JSON.stringify({ 
      success: false,
      error: errorMessage
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function startCustomerOnboarding(supabaseClient: any, customerId: string, subscriptionData: any) {
  logStep("Starting customer onboarding", { customerId });

  // Create provisioning job
  const { data: job, error: jobError } = await supabaseClient
    .from('provisioning_jobs')
    .insert({
      customer_id: customerId,
      job_type: 'customer_onboarding',
      status: 'in_progress',
      current_step: 'create_ou',
      total_steps: 5,
      completed_steps: 0,
      step_details: {
        subscription_data: subscriptionData,
        steps: [
          'create_ou',
          'generate_site_key', 
          'apply_tier_policies',
          'create_installer',
          'send_welcome_notification'
        ]
      }
    })
    .select()
    .single();

  if (jobError) {
    logStep("Failed to create provisioning job", jobError);
    throw jobError;
  }

  logStep("Provisioning job created", { jobId: job.id });

  // Execute provisioning steps
  try {
    await executeProvisioningSteps(supabaseClient, job);
    
    return {
      success: true,
      job_id: job.id,
      message: "Customer onboarding initiated successfully"
    };
  } catch (error) {
    // Update job with error
    await supabaseClient
      .from('provisioning_jobs')
      .update({
        status: 'failed',
        error_message: error.message,
        updated_at: new Date().toISOString()
      })
      .eq('id', job.id);

    throw error;
  }
}

async function executeProvisioningSteps(supabaseClient: any, job: any) {
  const steps = job.step_details.steps;
  let currentStepIndex = 0;

  for (const stepName of steps) {
    logStep(`Executing step: ${stepName}`, { jobId: job.id });

    try {
      await updateJobProgress(supabaseClient, job.id, stepName, currentStepIndex);

      switch (stepName) {
        case 'create_ou':
          await executeCreateOU(supabaseClient, job);
          break;
        case 'generate_site_key':
          await executeGenerateSiteKey(supabaseClient, job);
          break;
        case 'apply_tier_policies':
          await executeApplyTierPolicies(supabaseClient, job);
          break;
        case 'create_installer':
          await executeCreateInstaller(supabaseClient, job);
          break;
        case 'send_welcome_notification':
          await executeSendWelcomeNotification(supabaseClient, job);
          break;
        default:
          throw new Error(`Unknown step: ${stepName}`);
      }

      currentStepIndex++;
      logStep(`Step completed: ${stepName}`);

    } catch (error) {
      logStep(`Step failed: ${stepName}`, { error: error.message });
      throw error;
    }
  }

  // Mark job as completed
  await supabaseClient
    .from('provisioning_jobs')
    .update({
      status: 'completed',
      completed_steps: steps.length,
      completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('id', job.id);

  logStep("All provisioning steps completed", { jobId: job.id });
}

async function updateJobProgress(supabaseClient: any, jobId: string, currentStep: string, completedSteps: number) {
  await supabaseClient
    .from('provisioning_jobs')
    .update({
      current_step: currentStep,
      completed_steps: completedSteps,
      updated_at: new Date().toISOString()
    })
    .eq('id', jobId);
}

async function executeCreateOU(supabaseClient: any, job: any) {
  // Get customer details
  const { data: customer } = await supabaseClient
    .from('customers')
    .select('*')
    .eq('id', job.customer_id)
    .single();

  if (!customer) {
    throw new Error("Customer not found");
  }

  // Call ePO integration to create OU
  const { data: epoResult, error: epoError } = await supabaseClient.functions.invoke('epo-integration', {
    body: {
      action: 'create-customer-ou',
      customerEmail: customer.contact_email,
      ouGroupName: customer.ou_group_name,
      companyName: customer.company_name,
      customerId: customer.id
    }
  });

  if (epoError || !epoResult.success) {
    throw new Error(`ePO OU creation failed: ${epoError?.message || epoResult?.error}`);
  }

  // Update customer with ePO OU details
  await supabaseClient
    .from('customers')
    .update({
      epo_ou_path: epoResult.ou_path,
      epo_ou_id: epoResult.ou_id
    })
    .eq('id', customer.id);

  logStep("ePO OU created successfully", { ouPath: epoResult.ou_path });
}

async function executeGenerateSiteKey(supabaseClient: any, job: any) {
  // Call ePO integration to generate site key
  const { data: epoResult, error: epoError } = await supabaseClient.functions.invoke('epo-integration', {
    body: {
      action: 'generate-site-key',
      customerId: job.customer_id
    }
  });

  if (epoError || !epoResult.success) {
    throw new Error(`Site key generation failed: ${epoError?.message || epoResult?.error}`);
  }

  logStep("Site key generated successfully", { siteKey: epoResult.site_key });
}

async function executeApplyTierPolicies(supabaseClient: any, job: any) {
  // Get subscription details with plan information to determine tier
  const { data: subscription } = await supabaseClient
    .from('customer_subscriptions')
    .select(`
      *,
      subscription_plans!inner(plan_name, price_monthly)
    `)
    .eq('customer_id', job.customer_id)
    .single();

  if (!subscription) {
    throw new Error("Customer subscription not found");
  }

  // Determine tier based on actual subscription plan
  let tier = 'starter'; // Default fallback
  
  if (subscription.subscription_plans) {
    const planName = subscription.subscription_plans.plan_name?.toLowerCase() || '';
    const price = subscription.subscription_plans.price_monthly || 0;
    
    // Map plan name and price to tier
    if (planName.includes('enterprise') || price >= 39.99) {
      tier = 'enterprise';
    } else if (planName.includes('professional') || planName.includes('pro') || price >= 19.99) {
      tier = 'professional';
    } else {
      tier = 'starter';
    }
  }
  
  logStep("Determined subscription tier", { tier, planName: subscription.subscription_plans?.plan_name });

  // Call ePO integration to apply tier policies
  const { data: epoResult, error: epoError } = await supabaseClient.functions.invoke('epo-integration', {
    body: {
      action: 'apply-tier-policies',
      customerId: job.customer_id,
      tier: tier
    }
  });

  if (epoError || !epoResult.success) {
    throw new Error(`Policy application failed: ${epoError?.message || epoResult?.error}`);
  }

  logStep("Tier policies applied successfully", { tier });
}

async function executeCreateInstaller(supabaseClient: any, job: any) {
  // Call ePO integration to create agent installer
  const { data: epoResult, error: epoError } = await supabaseClient.functions.invoke('epo-integration', {
    body: {
      action: 'generate-installer',
      customerId: job.customer_id
    }
  });

  if (epoError || !epoResult.success) {
    throw new Error(`Installer creation failed: ${epoError?.message || epoResult?.error}`);
  }

  logStep("Agent installer created successfully");
}

async function executeSendWelcomeNotification(supabaseClient: any, job: any) {
  // Get customer details
  const { data: customer } = await supabaseClient
    .from('customers')
    .select('*')
    .eq('id', job.customer_id)
    .single();

  // Find user ID for this customer
  const { data: customerUser } = await supabaseClient
    .from('customer_users')
    .select('user_id')
    .eq('customer_id', job.customer_id)
    .single();

  if (customerUser) {
    // Create welcome notification
    await supabaseClient
      .from('notifications')
      .insert({
        user_id: customerUser.user_id,
        title: 'Welcome to Trellix ePO SaaS!',
        message: 'Your endpoint protection is now set up. Download your agent installer from the portal.',
        type: 'welcome',
        data: {
          provisioning_completed: true,
          customer_id: job.customer_id
        }
      });
  }

  logStep("Welcome notification sent");
}

async function retryProvisioningStep(supabaseClient: any, customerId: string) {
  // Get the latest failed job for this customer
  const { data: job } = await supabaseClient
    .from('provisioning_jobs')
    .select('*')
    .eq('customer_id', customerId)
    .eq('status', 'failed')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (!job) {
    throw new Error("No failed provisioning job found for retry");
  }

  logStep("Retrying provisioning job", { jobId: job.id });

  // Reset job status and retry
  await supabaseClient
    .from('provisioning_jobs')
    .update({
      status: 'in_progress',
      error_message: null,
      updated_at: new Date().toISOString()
    })
    .eq('id', job.id);

  await executeProvisioningSteps(supabaseClient, job);

  return {
    success: true,
    job_id: job.id,
    message: "Provisioning job retried successfully"
  };
}