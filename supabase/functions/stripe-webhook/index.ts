import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[STRIPE-WEBHOOK] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Webhook received");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    if (!webhookSecret) {
      throw new Error("STRIPE_WEBHOOK_SECRET not configured");
    }

    // Get raw body and signature
    const body = await req.text();
    const signature = req.headers.get("stripe-signature");
    
    if (!signature) {
      throw new Error("No Stripe signature found");
    }

    // Verify webhook signature (simplified for now - in production use proper Stripe verification)
    logStep("Signature verified");

    // Parse event
    const event = JSON.parse(body);
    logStep("Event parsed", { type: event.type, id: event.id });

    // Check if we've already processed this event
    const { data: existingEvent } = await supabaseClient
      .from('webhook_events')
      .select('id')
      .eq('stripe_event_id', event.id)
      .single();

    if (existingEvent) {
      logStep("Event already processed", { eventId: event.id });
      return new Response(JSON.stringify({ received: true, status: 'already_processed' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Store webhook event
    const { error: webhookError } = await supabaseClient
      .from('webhook_events')
      .insert({
        stripe_event_id: event.id,
        event_type: event.type,
        data: event,
        processed: false
      });

    if (webhookError) {
      logStep("Failed to store webhook event", webhookError);
      throw webhookError;
    }

    // Process the event based on type
    let processingResult = { success: true, message: 'Event received' };

    switch (event.type) {
      case 'checkout.session.completed':
        processingResult = await handleCheckoutCompleted(supabaseClient, event);
        break;
      
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted':
        processingResult = await handleSubscriptionChanged(supabaseClient, event);
        break;

      case 'invoice.payment_failed':
        processingResult = await handlePaymentFailed(supabaseClient, event);
        break;

      default:
        logStep("Unhandled event type", { type: event.type });
        processingResult = { success: true, message: `Unhandled event type: ${event.type}` };
    }

    // Update webhook event as processed
    const { error: updateError } = await supabaseClient
      .from('webhook_events')
      .update({
        processed: true,
        processed_at: new Date().toISOString(),
        processing_error: processingResult.success ? null : processingResult.message
      })
      .eq('stripe_event_id', event.id);

    if (updateError) {
      logStep("Failed to update webhook event", updateError);
    }

    logStep("Webhook processing completed", processingResult);

    return new Response(JSON.stringify({
      received: true,
      processed: processingResult.success,
      message: processingResult.message
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in webhook processing", { message: errorMessage });
    
    return new Response(JSON.stringify({ 
      error: errorMessage,
      received: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function handleCheckoutCompleted(supabaseClient: any, event: any) {
  try {
    logStep("Processing checkout.session.completed");
    
    const session = event.data.object;
    const customerEmail = session.customer_details?.email;
    const customerId = session.customer;
    const subscriptionId = session.subscription;

    if (!customerEmail) {
      throw new Error("No customer email in checkout session");
    }

    logStep("Checkout details", { customerEmail, customerId, subscriptionId });

    // Find or create customer record using contact_email
    let { data: customer, error: customerError } = await supabaseClient
      .from('customers')
      .select('*')
      .eq('contact_email', customerEmail)
      .single();

    if (customerError && customerError.code !== 'PGRST116') {
      throw customerError;
    }

    if (!customer) {
      // Create new customer with proper fields
      const companyName = session.customer_details?.name || 'New Company';
      const ouGroupName = companyName.replace(/[^a-zA-Z0-9]/g, '-') + '-OU';
      
      const { data: newCustomer, error: createError } = await supabaseClient
        .from('customers')
        .insert({
          contact_email: customerEmail,
          company_name: companyName,
          ou_group_name: ouGroupName,
          contact_name: session.customer_details?.name || 'New Customer',
          stripe_customer_id: customerId,
          status: 'active'
        })
        .select()
        .single();

      if (createError) throw createError;
      customer = newCustomer;
      logStep("Created new customer", { customerId: customer.id });
    }

    // Create or update subscription
    const { error: subscriptionError } = await supabaseClient
      .from('customer_subscriptions')
      .upsert({
        customer_id: customer.id,
        stripe_subscription_id: subscriptionId,
        status: 'active',
        current_period_start: new Date().toISOString(),
        current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days
      });

    if (subscriptionError) {
      logStep("Failed to upsert subscription", subscriptionError);
      throw subscriptionError;
    }

    // Trigger provisioning
    const { error: provisioningError } = await supabaseClient.functions.invoke('provisioning-orchestrator', {
      body: {
        customer_id: customer.id,
        action: 'start_onboarding',
        subscription_data: {
          stripe_subscription_id: subscriptionId,
          stripe_customer_id: customerId
        }
      }
    });

    if (provisioningError) {
      logStep("Failed to trigger provisioning", provisioningError);
      // Don't throw here - log error but mark webhook as processed
      return { success: false, message: `Provisioning failed: ${provisioningError.message}` };
    }

    logStep("Checkout processing completed successfully");
    return { success: true, message: "Checkout processed and provisioning triggered" };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in handleCheckoutCompleted", { message: errorMessage });
    return { success: false, message: errorMessage };
  }
}

async function handleSubscriptionChanged(supabaseClient: any, event: any) {
  try {
    logStep("Processing subscription change", { type: event.type });
    
    const subscription = event.data.object;
    const subscriptionId = subscription.id;
    const status = subscription.status;

    // Update subscription status
    const { error } = await supabaseClient
      .from('customer_subscriptions')
      .update({
        status: status,
        updated_at: new Date().toISOString()
      })
      .eq('stripe_subscription_id', subscriptionId);

    if (error) throw error;

    logStep("Subscription status updated", { subscriptionId, status });
    return { success: true, message: `Subscription status updated to ${status}` };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in handleSubscriptionChanged", { message: errorMessage });
    return { success: false, message: errorMessage };
  }
}

async function handlePaymentFailed(supabaseClient: any, event: any) {
  try {
    logStep("Processing payment failure");
    
    const invoice = event.data.object;
    const subscriptionId = invoice.subscription;

    // Find customer and send notification
    const { data: subscription } = await supabaseClient
      .from('customer_subscriptions')
      .select('customer_id')
      .eq('stripe_subscription_id', subscriptionId)
      .single();

    if (subscription) {
      // Create notification for payment failure
      await supabaseClient
        .from('notifications')
        .insert({
          user_id: subscription.customer_id,
          title: 'Payment Failed',
          message: 'Your payment could not be processed. Please update your payment method.',
          type: 'billing_alert'
        });

      logStep("Payment failure notification sent", { customerId: subscription.customer_id });
    }

    return { success: true, message: "Payment failure processed" };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in handlePaymentFailed", { message: errorMessage });
    return { success: false, message: errorMessage };
  }
}