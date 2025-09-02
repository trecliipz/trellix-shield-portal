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

  try {
    logStep("Checkout request received");

    // Initialize Supabase client for user authentication
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    // Authenticate user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header provided");
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    
    const user = userData.user;
    if (!user?.email) {
      throw new Error("User not authenticated or email not available");
    }

    logStep("User authenticated", { userId: user.id, email: user.email });

    // Get request body
    const { planType, customerId: providedCustomerId, priceAmount } = await req.json();
    
    if (!planType) {
      throw new Error("planType is required");
    }

    // Initialize Stripe
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      throw new Error("STRIPE_SECRET_KEY not configured");
    }
    
    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });

    // Check if Stripe customer exists for this email
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId = providedCustomerId;
    
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      logStep("Found existing Stripe customer", { customerId });
    } else {
      // Create new Stripe customer
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.user_metadata?.name || user.email,
        metadata: {
          user_id: user.id,
          plan_type: planType
        }
      });
      customerId = customer.id;
      logStep("Created new Stripe customer", { customerId });
    }

    // Define plan details based on planType
    const planDetails = {
      starter: {
        name: "Starter Plan",
        description: "Basic endpoint protection for small businesses",
        unit_amount: priceAmount || 999, // $9.99
        recurring: { interval: "month" as const }
      },
      professional: {
        name: "Professional Plan", 
        description: "Advanced protection for growing businesses",
        unit_amount: priceAmount || 1999, // $19.99
        recurring: { interval: "month" as const }
      },
      enterprise: {
        name: "Enterprise Plan",
        description: "Complete security solution for large organizations", 
        unit_amount: priceAmount || 3999, // $39.99
        recurring: { interval: "month" as const }
      }
    };

    const selectedPlan = planDetails[planType as keyof typeof planDetails];
    if (!selectedPlan) {
      throw new Error(`Invalid plan type: ${planType}`);
    }

    logStep("Creating checkout session", { planType, amount: selectedPlan.unit_amount });

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: selectedPlan.name,
              description: selectedPlan.description,
            },
            unit_amount: selectedPlan.unit_amount,
            recurring: selectedPlan.recurring,
          },
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${req.headers.get("origin")}/portal?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get("origin")}/setup/${planType}`,
      metadata: {
        user_id: user.id,
        plan_type: planType,
      },
    });

    logStep("Checkout session created successfully", { sessionId: session.id, url: session.url });

    return new Response(JSON.stringify({ 
      url: session.url,
      session_id: session.id 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in create-checkout", { message: errorMessage });
    
    return new Response(JSON.stringify({ 
      error: errorMessage,
      success: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});