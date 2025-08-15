import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import Stripe from "https://esm.sh/stripe@14.21.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface OnboardingRequest {
  companyName: string;
  ouGroupName: string;
  contactName: string;
  contactEmail: string;
  phone?: string;
  planId: string;
  billingCycle: 'monthly' | 'yearly';
  address?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
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

    const onboardingData: OnboardingRequest = await req.json();
    
    // Validate input
    if (!onboardingData.companyName || !onboardingData.ouGroupName || !onboardingData.contactName || !onboardingData.contactEmail || !onboardingData.planId) {
      throw new Error("Missing required fields");
    }

    // Check if OU group name is unique
    const { data: existingCustomer } = await supabaseClient
      .from("customers")
      .select("id")
      .eq("ou_group_name", onboardingData.ouGroupName)
      .single();

    if (existingCustomer) {
      throw new Error("OU group name already exists. Please choose a different name.");
    }

    // Get subscription plan
    const { data: plan, error: planError } = await supabaseClient
      .from("subscription_plans_epo")
      .select("*")
      .eq("id", onboardingData.planId)
      .single();

    if (planError || !plan) {
      throw new Error("Invalid subscription plan");
    }

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });

    // Create Stripe customer
    const stripeCustomer = await stripe.customers.create({
      name: onboardingData.companyName,
      email: onboardingData.contactEmail,
      phone: onboardingData.phone,
      metadata: {
        company_name: onboardingData.companyName,
        ou_group_name: onboardingData.ouGroupName,
        user_id: userData.user.id,
      },
    });

    // Create customer record
    const { data: customer, error: customerError } = await supabaseClient
      .from("customers")
      .insert({
        company_name: onboardingData.companyName,
        ou_group_name: onboardingData.ouGroupName,
        contact_name: onboardingData.contactName,
        contact_email: onboardingData.contactEmail,
        phone: onboardingData.phone,
        address: onboardingData.address,
        billing_email: onboardingData.contactEmail,
        stripe_customer_id: stripeCustomer.id,
        status: 'active'
      })
      .select()
      .single();

    if (customerError) {
      console.error("Customer creation error:", customerError);
      throw new Error("Failed to create customer record");
    }

    // Link user to customer
    const { error: userLinkError } = await supabaseClient
      .from("customer_users")
      .insert({
        user_id: userData.user.id,
        customer_id: customer.id,
        role: 'admin',
        is_primary: true
      });

    if (userLinkError) {
      console.error("User link error:", userLinkError);
      throw new Error("Failed to link user to customer");
    }

    // Calculate pricing
    const pricePerEndpoint = onboardingData.billingCycle === 'yearly' 
      ? plan.price_per_endpoint_yearly 
      : plan.price_per_endpoint_monthly;

    // Create Stripe price for this customer (starting with 1 endpoint for trial)
    const stripePrice = await stripe.prices.create({
      unit_amount: Math.round(pricePerEndpoint * 100), // Convert to cents
      currency: 'usd',
      recurring: {
        interval: onboardingData.billingCycle === 'yearly' ? 'year' : 'month',
      },
      product_data: {
        name: `${plan.display_name} - ${onboardingData.companyName}`,
        description: `Trellix ePO SaaS - ${plan.display_name}`,
      },
      metadata: {
        plan_id: plan.id,
        customer_id: customer.id,
        plan_name: plan.plan_name,
      },
    });

    // Create Stripe subscription with 30-day trial
    const subscription = await stripe.subscriptions.create({
      customer: stripeCustomer.id,
      items: [
        {
          price: stripePrice.id,
          quantity: 1, // Start with 1 endpoint
        },
      ],
      trial_period_days: 30,
      payment_behavior: 'default_incomplete',
      payment_settings: { save_default_payment_method: 'on_subscription' },
      expand: ['latest_invoice.payment_intent'],
      metadata: {
        customer_id: customer.id,
        plan_id: plan.id,
      },
    });

    // Create subscription record
    const { error: subscriptionError } = await supabaseClient
      .from("customer_subscriptions")
      .insert({
        customer_id: customer.id,
        plan_id: plan.id,
        stripe_subscription_id: subscription.id,
        status: 'active',
        billing_cycle: onboardingData.billingCycle,
        current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
        current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        trial_end: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null,
        endpoint_count: 0
      });

    if (subscriptionError) {
      console.error("Subscription creation error:", subscriptionError);
      throw new Error("Failed to create subscription record");
    }

    // Log audit event
    await supabaseClient
      .from("customer_audit_logs")
      .insert({
        customer_id: customer.id,
        user_id: userData.user.id,
        action: 'customer_created',
        resource_type: 'customer',
        resource_id: customer.id,
        details: {
          company_name: onboardingData.companyName,
          plan_name: plan.plan_name,
          billing_cycle: onboardingData.billingCycle
        }
      });

    // Return onboarding result
    return new Response(JSON.stringify({
      success: true,
      customer_id: customer.id,
      subscription_id: subscription.id,
      client_secret: subscription.latest_invoice?.payment_intent?.client_secret,
      trial_end: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null,
      setup_intent_client_secret: subscription.pending_setup_intent?.client_secret,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("Customer onboarding error:", error);
    return new Response(JSON.stringify({ 
      error: error.message 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});