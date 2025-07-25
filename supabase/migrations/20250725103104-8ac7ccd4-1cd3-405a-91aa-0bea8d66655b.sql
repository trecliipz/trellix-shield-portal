-- Add subscription plans table
CREATE TABLE public.subscription_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  plan_name TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  price_monthly NUMERIC NOT NULL DEFAULT 0,
  price_yearly NUMERIC NOT NULL DEFAULT 0,
  endpoint_limit INTEGER NOT NULL DEFAULT -1, -- -1 means unlimited
  download_limit INTEGER NOT NULL DEFAULT -1, -- -1 means unlimited
  features JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT true,
  is_free_trial BOOLEAN DEFAULT false,
  trial_duration_days INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;

-- Create policies for subscription plans
CREATE POLICY "Anyone can view active subscription plans" 
ON public.subscription_plans 
FOR SELECT 
USING (is_active = true);

-- Insert default plans
INSERT INTO public.subscription_plans (plan_name, display_name, price_monthly, price_yearly, endpoint_limit, download_limit, features, is_free_trial, trial_duration_days) VALUES
('free', 'Free Trial', 0, 0, 3, 5, '["Basic endpoint protection", "Email support", "Standard updates"]'::jsonb, true, 14),
('starter', 'Starter', 9.99, 99.99, 50, 100, '["Up to 50 endpoints", "Email support", "Standard updates", "Basic reporting"]'::jsonb, false, 0),
('professional', 'Professional', 19.99, 199.99, -1, -1, '["Unlimited endpoints", "Priority support", "Advanced reporting", "Custom policies", "API access"]'::jsonb, false, 0),
('enterprise', 'Enterprise', 39.99, 399.99, -1, -1, '["Everything in Professional", "Dedicated support", "Advanced threat intelligence", "Custom integrations", "SLA guarantee"]'::jsonb, false, 0);

-- Update user_subscriptions table to include plan references and trial info
ALTER TABLE public.user_subscriptions 
ADD COLUMN IF NOT EXISTS plan_id UUID REFERENCES public.subscription_plans(id),
ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS billing_cycle TEXT DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly', 'yearly')),
ADD COLUMN IF NOT EXISTS auto_renew BOOLEAN DEFAULT true;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_plan_id ON public.user_subscriptions(plan_id);
CREATE INDEX IF NOT EXISTS idx_subscription_plans_active ON public.subscription_plans(is_active) WHERE is_active = true;

-- Update the trigger function to set updated_at
CREATE OR REPLACE FUNCTION public.update_subscription_plans_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_subscription_plans_updated_at
  BEFORE UPDATE ON public.subscription_plans
  FOR EACH ROW
  EXECUTE FUNCTION public.update_subscription_plans_updated_at();

-- Function to assign free trial to new users
CREATE OR REPLACE FUNCTION public.assign_free_trial(p_user_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  free_plan_id UUID;
  subscription_id UUID;
BEGIN
  -- Get the free trial plan
  SELECT id INTO free_plan_id
  FROM public.subscription_plans
  WHERE plan_name = 'free' AND is_active = true
  LIMIT 1;

  IF free_plan_id IS NULL THEN
    RAISE EXCEPTION 'Free trial plan not found';
  END IF;

  -- Create subscription record
  INSERT INTO public.user_subscriptions (
    user_id,
    plan_id,
    plan_type,
    status,
    trial_ends_at,
    max_downloads,
    downloads_used
  ) VALUES (
    p_user_id,
    free_plan_id,
    'free',
    'active',
    now() + INTERVAL '14 days',
    5,
    0
  ) RETURNING id INTO subscription_id;

  RETURN subscription_id;
END;
$$;

-- Function to upgrade user subscription
CREATE OR REPLACE FUNCTION public.upgrade_user_subscription(
  p_user_id UUID,
  p_plan_name TEXT,
  p_billing_cycle TEXT DEFAULT 'monthly'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  plan_data RECORD;
  subscription_id UUID;
BEGIN
  -- Get the plan details
  SELECT * INTO plan_data
  FROM public.subscription_plans
  WHERE plan_name = p_plan_name AND is_active = true
  LIMIT 1;

  IF plan_data IS NULL THEN
    RAISE EXCEPTION 'Plan not found: %', p_plan_name;
  END IF;

  -- Update or insert subscription
  INSERT INTO public.user_subscriptions (
    user_id,
    plan_id,
    plan_type,
    status,
    billing_cycle,
    max_downloads,
    downloads_used,
    trial_ends_at
  ) VALUES (
    p_user_id,
    plan_data.id,
    p_plan_name,
    'active',
    p_billing_cycle,
    plan_data.download_limit,
    0,
    NULL
  )
  ON CONFLICT (user_id) 
  DO UPDATE SET
    plan_id = plan_data.id,
    plan_type = p_plan_name,
    billing_cycle = p_billing_cycle,
    max_downloads = plan_data.download_limit,
    trial_ends_at = NULL,
    updated_at = now()
  RETURNING id INTO subscription_id;

  RETURN subscription_id;
END;
$$;