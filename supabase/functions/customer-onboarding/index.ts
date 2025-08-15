import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CUSTOMER-ONBOARDING] ${step}${detailsStr}`);
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

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    
    logStep("User authenticated", { userId: user.id, email: user.email });

    // Skip onboarding for admin accounts
    if (user.email === 'admin@trellix.com') {
      logStep("Admin account detected, skipping customer onboarding");
      return new Response(JSON.stringify({ 
        success: true, 
        message: "Admin account - no customer onboarding needed" 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const { 
      company, 
      phone, 
      industry, 
      organizationSize, 
      ouGroupName, 
      planType = 'starter' 
    } = await req.json();

    logStep("Processing customer onboarding", { 
      company, 
      ouGroupName, 
      planType,
      userId: user.id 
    });

    // Create customer record
    const { data: customerData, error: customerError } = await supabaseAdmin
      .from("customers")
      .insert({
        company_name: company,
        ou_group_name: ouGroupName,
        contact_email: user.email,
        contact_name: user.user_metadata?.name || user.email.split('@')[0],
        phone: phone || null,
        status: 'active'
      })
      .select()
      .single();

    if (customerError) {
      logStep("Error creating customer", customerError);
      throw new Error(`Failed to create customer: ${customerError.message}`);
    }

    logStep("Customer created", { customerId: customerData.id });

    // Link user to customer
    const { error: linkError } = await supabaseAdmin
      .from("customer_users")
      .insert({
        user_id: user.id,
        customer_id: customerData.id,
        role: 'admin',
        is_primary: true
      });

    if (linkError) {
      logStep("Error linking user to customer", linkError);
      throw new Error(`Failed to link user to customer: ${linkError.message}`);
    }

    logStep("User linked to customer successfully");

    // Create user organization record
    const { error: orgError } = await supabaseAdmin
      .from("user_organizations")
      .insert({
        user_id: user.id,
        organization_name: company,
        group_name: ouGroupName,
        industry: industry || null,
        organization_size: organizationSize || null,
        primary_contact_phone: phone || null
      });

    if (orgError) {
      logStep("Error creating organization", orgError);
      // Don't fail the whole process for this
      console.warn("Failed to create organization record:", orgError);
    }

    // Call ePO integration to create OU and generate installer
    try {
      const { data: epoData, error: epoError } = await supabaseAdmin.functions.invoke('epo-integration', {
        body: {
          action: 'create-customer-ou',
          customerId: customerData.id,
          ouGroupName: ouGroupName,
          companyName: company
        }
      });

      if (epoError) {
        logStep("ePO integration warning", epoError);
        // Don't fail customer creation if ePO integration fails
        console.warn("ePO integration failed:", epoError);
      } else {
        logStep("ePO integration successful", epoData);
      }
    } catch (epoError) {
      logStep("ePO integration error", epoError);
      console.warn("ePO integration error:", epoError);
    }

    // Start subscription based on selected plan
    const planPrices = {
      starter: 1500, // $15.00
      pro: 2500,     // $25.00
      enterprise: 4000 // $40.00
    };

    try {
      const { data: checkoutData, error: checkoutError } = await supabaseAdmin.functions.invoke('create-checkout', {
        body: {
          planType: planType,
          customerId: customerData.id,
          priceAmount: planPrices[planType as keyof typeof planPrices] || planPrices.starter
        },
        headers: {
          Authorization: authHeader
        }
      });

      if (checkoutError) {
        logStep("Checkout creation warning", checkoutError);
        console.warn("Failed to create checkout session:", checkoutError);
      } else {
        logStep("Checkout session created", { url: checkoutData?.url });
      }
    } catch (checkoutError) {
      logStep("Checkout creation error", checkoutError);
      console.warn("Checkout creation error:", checkoutError);
    }

    logStep("Customer onboarding completed successfully");

    return new Response(JSON.stringify({
      success: true,
      customer: {
        id: customerData.id,
        company_name: customerData.company_name,
        ou_group_name: customerData.ou_group_name
      },
      message: "Customer onboarding completed successfully"
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in customer onboarding", { message: errorMessage });
    
    return new Response(JSON.stringify({ 
      error: errorMessage,
      success: false 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});