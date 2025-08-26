-- Phase A: Fix usage_records schema properly

-- First, update usage_records table structure to match development guide
ALTER TABLE public.usage_records 
ADD COLUMN IF NOT EXISTS record_date DATE NOT NULL DEFAULT CURRENT_DATE,
ADD COLUMN IF NOT EXISTS billable_endpoints INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS overage_endpoints INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS sync_source TEXT DEFAULT 'manual';

-- Add missing ePO fields to customers table
ALTER TABLE public.customers
ADD COLUMN IF NOT EXISTS epo_ou_path TEXT;

-- Update customer_subscriptions to include plan_id reference
ALTER TABLE public.customer_subscriptions
ADD COLUMN IF NOT EXISTS plan_id UUID REFERENCES subscription_plans(id);

-- Create index on the new fields for performance
CREATE INDEX IF NOT EXISTS idx_customers_contact_email ON public.customers(contact_email);
CREATE INDEX IF NOT EXISTS idx_usage_records_record_date ON public.usage_records(record_date);
CREATE INDEX IF NOT EXISTS idx_usage_records_customer_period ON public.usage_records(customer_id, period_start, period_end);

-- Create a view for simplified billing reconciliation  
CREATE OR REPLACE VIEW public.billing_reconciliation AS
SELECT 
  c.id as customer_id,
  c.company_name,
  c.contact_email,
  c.ou_group_name,
  cs.plan_id,
  cs.status as subscription_status,
  cs.endpoint_count as current_endpoints,
  sp.endpoint_limit as plan_limit,
  GREATEST(0, cs.endpoint_count - sp.endpoint_limit) as overage_endpoints,
  sp.price_monthly,
  sp.plan_name as subscription_tier
FROM public.customers c
LEFT JOIN public.customer_subscriptions cs ON c.id = cs.customer_id  
LEFT JOIN public.subscription_plans sp ON cs.plan_id = sp.id
WHERE cs.status = 'active';

-- Add missing tables for agent installers and site keys
CREATE TABLE IF NOT EXISTS public.agent_installers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  installer_name TEXT NOT NULL,
  platform TEXT NOT NULL DEFAULT 'windows',
  site_key TEXT,
  config_data JSONB DEFAULT '{}',
  download_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on new table
ALTER TABLE public.agent_installers ENABLE ROW LEVEL SECURITY;

-- RLS policies for agent_installers
CREATE POLICY "Users can view their customer installers" ON public.agent_installers
FOR SELECT USING (customer_id IN (
  SELECT customer_id FROM customer_users WHERE user_id = auth.uid()
));

CREATE POLICY "System can manage agent installers" ON public.agent_installers
FOR ALL USING (true);