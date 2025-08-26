
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[NOTIFICATION-SERVICE] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Notification service called");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const { action, ...params } = await req.json();
    logStep("Action requested", { action });

    let result;

    switch (action) {
      case 'send_notification':
        result = await sendNotification(supabaseClient, params);
        break;
      
      case 'send_bulk_notifications':
        result = await sendBulkNotifications(supabaseClient, params);
        break;

      case 'send_email':
        result = await sendEmail(params);
        break;

      case 'send_sms':
        result = await sendSMS(params);
        break;

      default:
        throw new Error(`Unknown action: ${action}`);
    }

    logStep("Notification service completed", result);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in notification service", { message: errorMessage });
    
    return new Response(JSON.stringify({ 
      error: errorMessage,
      success: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

async function sendNotification(supabaseClient: any, params: any) {
  const { user_id, title, message, type = 'info', data = null } = params;

  if (!user_id || !title || !message) {
    throw new Error("Missing required fields: user_id, title, message");
  }

  const { data: notification, error } = await supabaseClient
    .from('notifications')
    .insert({
      user_id,
      title,
      message,
      type,
      data
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create notification: ${error.message}`);
  }

  logStep("Notification created", { notificationId: notification.id });

  return {
    success: true,
    notification_id: notification.id,
    message: "Notification sent successfully"
  };
}

async function sendBulkNotifications(supabaseClient: any, params: any) {
  const { user_ids, title, message, type = 'info', data = null } = params;

  if (!user_ids || !Array.isArray(user_ids) || !title || !message) {
    throw new Error("Missing required fields: user_ids (array), title, message");
  }

  const notifications = user_ids.map(user_id => ({
    user_id,
    title,
    message,
    type,
    data
  }));

  const { data, error } = await supabaseClient
    .from('notifications')
    .insert(notifications)
    .select();

  if (error) {
    throw new Error(`Failed to create bulk notifications: ${error.message}`);
  }

  logStep("Bulk notifications created", { count: data.length });

  return {
    success: true,
    notifications_created: data.length,
    message: "Bulk notifications sent successfully"
  };
}

async function sendEmail(params: any) {
  // Placeholder for email service integration (SendGrid, etc.)
  logStep("Email sending requested", { to: params.to, subject: params.subject });
  
  // In a real implementation, you would integrate with SendGrid or similar
  // const sgMail = require('@sendgrid/mail');
  // sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  // await sgMail.send(msg);

  return {
    success: true,
    message: "Email service not yet implemented",
    email_requested: true
  };
}

async function sendSMS(params: any) {
  // Placeholder for SMS service integration (Twilio, etc.)
  logStep("SMS sending requested", { to: params.to, message: params.message });
  
  // In a real implementation, you would integrate with Twilio or similar
  // const twilio = require('twilio');
  // const client = twilio(accountSid, authToken);
  // await client.messages.create({ body: message, from: fromNumber, to: toNumber });

  return {
    success: true,
    message: "SMS service not yet implemented",
    sms_requested: true
  };
}
