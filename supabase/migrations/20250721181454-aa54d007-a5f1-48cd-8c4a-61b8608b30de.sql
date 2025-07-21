
-- Create user organizations table
CREATE TABLE public.user_organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  organization_name TEXT NOT NULL,
  group_name TEXT NOT NULL,
  industry TEXT,
  organization_size TEXT,
  primary_contact_phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create endpoints table for machine inventory
CREATE TABLE public.endpoints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  organization_id UUID REFERENCES public.user_organizations(id) ON DELETE CASCADE NOT NULL,
  machine_name TEXT NOT NULL,
  os_type TEXT DEFAULT 'windows',
  deployment_status TEXT DEFAULT 'pending',
  agent_version TEXT,
  last_check_in TIMESTAMPTZ,
  health_status TEXT DEFAULT 'unknown',
  ip_address TEXT,
  mac_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, machine_name)
);

-- Create endpoint groups table
CREATE TABLE public.endpoint_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  organization_id UUID REFERENCES public.user_organizations(id) ON DELETE CASCADE NOT NULL,
  group_name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, group_name)
);

-- Create bulk operations table
CREATE TABLE public.bulk_operations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  operation_type TEXT NOT NULL, -- 'import', 'deploy', 'configure'
  status TEXT DEFAULT 'pending',
  total_items INTEGER DEFAULT 0,
  completed_items INTEGER DEFAULT 0,
  failed_items INTEGER DEFAULT 0,
  operation_data JSONB,
  error_log TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create pricing tiers table
CREATE TABLE public.pricing_tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tier_name TEXT NOT NULL UNIQUE,
  price_per_unit DECIMAL(10,2) NOT NULL,
  unit_size INTEGER NOT NULL, -- 1 for Professional/Enterprise, 5 for Starter
  features JSONB,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Insert default pricing tiers
INSERT INTO public.pricing_tiers (tier_name, price_per_unit, unit_size, features) VALUES
('Starter', 9.99, 5, '["Basic malware protection", "Real-time scanning", "Email support", "Basic reporting dashboard", "Automatic updates", "Windows & Mac support"]'::jsonb),
('Professional', 19.99, 1, '["Advanced threat detection", "TIE Intelligence integration", "Behavioral analysis", "Priority support (24/5)", "Advanced reporting & analytics", "Custom policy management", "Multi-platform support"]'::jsonb),
('Enterprise', 39.99, 1, '["AI-powered behavioral analysis", "Zero-day exploit protection", "Advanced persistent threat detection", "24/7 phone & chat support", "Compliance reporting (SOX, HIPAA)", "Dedicated security analyst"]'::jsonb);

-- Enable Row-Level Security
ALTER TABLE public.user_organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.endpoints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.endpoint_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bulk_operations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pricing_tiers ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for user_organizations
CREATE POLICY "Users can view their own organization" ON public.user_organizations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own organization" ON public.user_organizations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own organization" ON public.user_organizations
  FOR UPDATE USING (auth.uid() = user_id);

-- Create RLS policies for endpoints
CREATE POLICY "Users can view their own endpoints" ON public.endpoints
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own endpoints" ON public.endpoints
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own endpoints" ON public.endpoints
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own endpoints" ON public.endpoints
  FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for endpoint_groups
CREATE POLICY "Users can manage their own endpoint groups" ON public.endpoint_groups
  FOR ALL USING (auth.uid() = user_id);

-- Create RLS policies for bulk_operations
CREATE POLICY "Users can manage their own bulk operations" ON public.bulk_operations
  FOR ALL USING (auth.uid() = user_id);

-- Create RLS policies for pricing_tiers (public read)
CREATE POLICY "Anyone can view pricing tiers" ON public.pricing_tiers
  FOR SELECT USING (is_active = true);

-- Create trigger for updating updated_at columns
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_organizations_updated_at BEFORE UPDATE ON public.user_organizations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_endpoints_updated_at BEFORE UPDATE ON public.endpoints
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_endpoint_groups_updated_at BEFORE UPDATE ON public.endpoint_groups
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bulk_operations_updated_at BEFORE UPDATE ON public.bulk_operations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
