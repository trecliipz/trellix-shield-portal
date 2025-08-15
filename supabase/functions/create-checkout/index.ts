import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-CHECKOUT] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  );

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");
    logStep("Stripe key verified");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    const { planType, customerId, priceAmount } = await req.json();
    
    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });
    
    // Check if customer already exists in Stripe
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let stripeCustomerId;
    
    if (customers.data.length > 0) {
      stripeCustomerId = customers.data[0].id;
      logStep("Found existing Stripe customer", { stripeCustomerId });
    } else {
      // Create new Stripe customer
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.user_metadata?.name || user.email.split('@')[0],
        metadata: {
          supabase_user_id: user.id,
          customer_id: customerId || ''
        }
      });
      stripeCustomerId = customer.id;
      logStep("Created new Stripe customer", { stripeCustomerId });
    }

    // Define plan details
    const planDetails = {
      starter: {
        name: "Starter Plan",
        description: "Up to 50 endpoints",
        price: priceAmount || 1500,
        features: ["Basic ENS protection", "Standard TIE feeds", "Email support", "Monthly reporting"]
      },
      pro: {
        name: "Pro Plan", 
        description: "Up to 500 endpoints",
        price: priceAmount || 2500,
        features: ["Advanced ENS", "Enhanced TIE", "Priority support", "Weekly reporting", "API access"]
      },
      enterprise: {
        name: "Enterprise Plan",
        description: "Unlimited endpoints", 
        price: priceAmount || 4000,
        features: ["Full ENS feature set", "Premium TIE", "Dedicated support", "Real-time reporting", "Full API access"]
      }
    };

    const plan = planDetails[planType as keyof typeof planDetails] || planDetails.starter;

    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: plan.name,
              description: plan.description,
            },
            unit_amount: plan.price,
            recurring: { interval: "month" },
          },
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${req.headers.get("origin")}/portal?success=true`,
      cancel_url: `${req.headers.get("origin")}/portal?canceled=true`,
      metadata: {
        plan_type: planType,
        customer_id: customerId || '',
        user_id: user.id
      }
    });

    logStep("Checkout session created", { sessionId: session.id, url: session.url });

    return new Response(JSON.stringify({ 
      url: session.url,
      sessionId: session.id 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in create-checkout", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});