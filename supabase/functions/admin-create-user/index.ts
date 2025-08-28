
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[ADMIN-CREATE-USER] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    // Initialize Supabase client with service role for admin operations
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Authenticate the caller
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    
    const caller = userData.user;
    if (!caller) throw new Error("User not authenticated");
    logStep("Caller authenticated", { callerId: caller.id });

    // Check if caller has admin role
    const { data: hasAdminRole } = await supabaseAdmin.rpc('has_role', {
      _user_id: caller.id,
      _role: 'admin'
    });

    if (!hasAdminRole) {
      throw new Error("Insufficient permissions - admin role required");
    }
    logStep("Admin role verified");

    // Get request body
    const { email, name, password, role } = await req.json();
    
    if (!email || !name || !password) {
      throw new Error("Email, name, and password are required");
    }

    logStep("Creating new user", { email, name, role });

    // Create the auth user with admin privileges
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        name: name
      }
    });

    if (createError) {
      throw new Error(`Failed to create user: ${createError.message}`);
    }

    if (!newUser.user) {
      throw new Error("User creation failed - no user returned");
    }

    logStep("Auth user created successfully", { userId: newUser.user.id });

    // Assign admin role if requested
    if (role === 'admin') {
      try {
        await supabaseAdmin.rpc('assign_admin_role', {
          admin_email: email
        });
        logStep("Admin role assigned", { userId: newUser.user.id });
      } catch (roleError) {
        logStep("Warning: Failed to assign admin role", { error: roleError });
      }
    }

    // Assign free trial to start membership tracking
    try {
      await supabaseAdmin.rpc('assign_free_trial', {
        p_user_id: newUser.user.id
      });
      logStep("Free trial assigned", { userId: newUser.user.id });
    } catch (trialError) {
      logStep("Warning: Failed to assign free trial", { error: trialError });
    }

    return new Response(JSON.stringify({
      success: true,
      user_id: newUser.user.id,
      email: newUser.user.email,
      message: "User created successfully"
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in admin-create-user", { message: errorMessage });
    
    return new Response(JSON.stringify({ 
      success: false,
      error: errorMessage 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
