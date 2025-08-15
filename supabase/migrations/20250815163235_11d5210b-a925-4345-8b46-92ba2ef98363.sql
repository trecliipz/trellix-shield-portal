-- Create core tables for the Trellix ePO SaaS platform

-- Create subscription plans table
CREATE TABLE public.subscription_plans_epo (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_name TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  price_per_endpoint_monthly DECIMAL(10,2) NOT NULL,
  price_per_endpoint_yearly DECIMAL(10,2) NOT NULL,
  max_endpoints INTEGER NOT NULL DEFAULT -1, -- -1 for unlimited
  features JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create customers table (company/organization level)
CREATE TABLE public.customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name TEXT NOT NULL,
  ou_group_name TEXT NOT NULL UNIQUE, -- Custom OU name for ePO
  contact_email TEXT NOT NULL,
  contact_name TEXT NOT NULL,
  phone TEXT,
  address JSONB,
  billing_email TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'cancelled')),
  stripe_customer_id TEXT UNIQUE,
  epo_ou_id TEXT UNIQUE, -- ePO System Tree OU ID
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create customer users table (links auth.users to customers)
CREATE TABLE public.customer_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('admin', 'viewer', 'operator')),
  is_primary BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, customer_id)
);

-- Create customer subscriptions table
CREATE TABLE public.customer_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES public.subscription_plans_epo(id),
  stripe_subscription_id TEXT UNIQUE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'past_due', 'unpaid')),
  billing_cycle TEXT NOT NULL DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly', 'yearly')),
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  trial_end TIMESTAMPTZ,
  endpoint_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create endpoints table (managed devices)
CREATE TABLE public.customer_endpoints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  hostname TEXT NOT NULL,
  ip_address INET,
  mac_address TEXT,
  os_type TEXT,
  os_version TEXT,
  agent_version TEXT,
  last_seen TIMESTAMPTZ,
  epo_system_id TEXT UNIQUE, -- ePO System ID
  status TEXT NOT NULL DEFAULT 'online' CHECK (status IN ('online', 'offline', 'unmanaged')),
  policy_compliance JSONB DEFAULT '{}'::jsonb,
  threat_status TEXT DEFAULT 'clean' CHECK (threat_status IN ('clean', 'infected', 'suspicious')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(customer_id, hostname)
);

-- Create usage tracking table for billing
CREATE TABLE public.usage_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  subscription_id UUID NOT NULL REFERENCES public.customer_subscriptions(id) ON DELETE CASCADE,
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  endpoint_count INTEGER NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  stripe_invoice_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create agent installers table
CREATE TABLE public.agent_installers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  installer_name TEXT NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('windows', 'macos', 'linux')),
  download_url TEXT,
  site_key TEXT,
  config_data JSONB DEFAULT '{}'::jsonb,
  download_count INTEGER DEFAULT 0,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create customer API keys table
CREATE TABLE public.customer_api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  key_name TEXT NOT NULL,
  key_hash TEXT NOT NULL UNIQUE,
  permissions JSONB NOT NULL DEFAULT '[]'::jsonb,
  last_used TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_active BOOLEAN NOT NULL DEFAULT true
);

-- Create audit logs table
CREATE TABLE public.customer_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id TEXT,
  details JSONB DEFAULT '{}'::jsonb,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Insert default subscription plans
INSERT INTO public.subscription_plans_epo (plan_name, display_name, price_per_endpoint_monthly, price_per_endpoint_yearly, max_endpoints, features) VALUES
('starter', 'Starter Plan', 15.00, 150.00, 50, '["Basic ENS Protection", "Standard TIE Feeds", "Email Support", "Monthly Reporting"]'::jsonb),
('pro', 'Pro Plan', 25.00, 250.00, 500, '["Advanced ENS with Behavioral Analysis", "Enhanced TIE with Custom Indicators", "Priority Phone Support", "Weekly Reporting", "Custom Dashboards", "API Access"]'::jsonb),
('enterprise', 'Enterprise Plan', 40.00, 400.00, -1, '["Full ENS Feature Set", "Premium TIE with Threat Hunting", "Dedicated Support Manager", "Real-time Reporting", "Custom Alerts", "Full API Access", "Webhooks", "Compliance Reporting"]'::jsonb);

-- Enable Row Level Security
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_endpoints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_installers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_plans_epo ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for customers table
CREATE POLICY "Users can view their own customer data" ON public.customers
  FOR SELECT USING (
    id IN (
      SELECT customer_id FROM public.customer_users 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own customer data" ON public.customer_users
  FOR ALL USING (user_id = auth.uid());

-- Create policies for customer_subscriptions
CREATE POLICY "Users can view their customer subscriptions" ON public.customer_subscriptions
  FOR SELECT USING (
    customer_id IN (
      SELECT customer_id FROM public.customer_users 
      WHERE user_id = auth.uid()
    )
  );

-- Create policies for endpoints
CREATE POLICY "Users can manage their customer endpoints" ON public.customer_endpoints
  FOR ALL USING (
    customer_id IN (
      SELECT customer_id FROM public.customer_users 
      WHERE user_id = auth.uid()
    )
  );

-- Create policies for other tables
CREATE POLICY "Users can view their usage records" ON public.usage_records
  FOR SELECT USING (
    customer_id IN (
      SELECT customer_id FROM public.customer_users 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage their agent installers" ON public.agent_installers
  FOR ALL USING (
    customer_id IN (
      SELECT customer_id FROM public.customer_users 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view their API keys" ON public.customer_api_keys
  FOR ALL USING (
    customer_id IN (
      SELECT customer_id FROM public.customer_users 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view their audit logs" ON public.customer_audit_logs
  FOR SELECT USING (
    customer_id IN (
      SELECT customer_id FROM public.customer_users 
      WHERE user_id = auth.uid()
    )
  );

-- Allow everyone to view subscription plans
CREATE POLICY "Anyone can view active subscription plans" ON public.subscription_plans_epo
  FOR SELECT USING (is_active = true);

-- System policies for edge functions
CREATE POLICY "System can manage all customer data" ON public.customers
  FOR ALL USING (true);

CREATE POLICY "System can manage all subscriptions" ON public.customer_subscriptions
  FOR ALL USING (true);

CREATE POLICY "System can manage all usage records" ON public.usage_records
  FOR ALL USING (true);

CREATE POLICY "System can manage all audit logs" ON public.customer_audit_logs
  FOR ALL USING (true);

-- Create functions for common operations
CREATE OR REPLACE FUNCTION public.get_customer_for_user(user_uuid UUID)
RETURNS TABLE(customer_id UUID, role TEXT)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT cu.customer_id, cu.role
  FROM public.customer_users cu
  WHERE cu.user_id = user_uuid
  LIMIT 1;
$$;

-- Create trigger function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON public.customers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_customer_users_updated_at BEFORE UPDATE ON public.customer_users
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_customer_subscriptions_updated_at BEFORE UPDATE ON public.customer_subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_customer_endpoints_updated_at BEFORE UPDATE ON public.customer_endpoints
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_agent_installers_updated_at BEFORE UPDATE ON public.agent_installers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();