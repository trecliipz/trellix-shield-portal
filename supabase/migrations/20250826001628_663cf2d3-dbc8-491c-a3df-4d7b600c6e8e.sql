-- Phase A: Fix usage_records schema and update customer/subscription schema

-- First, update usage_records table structure to match development guide
ALTER TABLE public.usage_records 
ADD COLUMN IF NOT EXISTS record_date DATE NOT NULL DEFAULT CURRENT_DATE,
ADD COLUMN IF NOT EXISTS billable_endpoints INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS overage_endpoints INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS sync_source TEXT DEFAULT 'manual';

-- Update customers table to match webhook expectations
ALTER TABLE public.customers
ADD COLUMN IF NOT EXISTS contact_email TEXT,
ADD COLUMN IF NOT EXISTS ou_group_name TEXT DEFAULT 'Default-OU',
ADD COLUMN IF NOT EXISTS epo_ou_path TEXT,
ADD COLUMN IF NOT EXISTS epo_ou_id TEXT;

-- Backfill contact_email from email if null
UPDATE public.customers 
SET contact_email = email 
WHERE contact_email IS NULL AND email IS NOT NULL;

-- Backfill ou_group_name from company_name if null  
UPDATE public.customers
SET ou_group_name = REPLACE(REPLACE(company_name, ' ', '-'), '.', '-') || '-OU'
WHERE ou_group_name = 'Default-OU' AND company_name IS NOT NULL;

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

-- RLS policies for billing_reconciliation view
CREATE POLICY "System can view billing reconciliation" ON public.customers
FOR SELECT USING (true);

-- Add webhook_events RLS policy for system management
CREATE POLICY "System can manage webhook events" ON public.webhook_events
FOR ALL USING (true);