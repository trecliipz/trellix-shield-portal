
-- Create agent_configurations table to store user-specific agent configs
CREATE TABLE public.agent_configurations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  organization_id UUID REFERENCES public.user_organizations(id),
  agent_version TEXT NOT NULL,
  epo_server_url TEXT,
  group_name TEXT,
  ou_name TEXT,
  deployment_policies JSONB DEFAULT '{}',
  auto_update_enabled BOOLEAN DEFAULT true,
  last_sync_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create agent_downloads table to track download history and assignments
CREATE TABLE public.agent_downloads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  agent_name TEXT NOT NULL,
  agent_version TEXT NOT NULL,
  file_name TEXT NOT NULL,
  download_url TEXT,
  file_size BIGINT DEFAULT 0,
  platform TEXT NOT NULL,
  status TEXT DEFAULT 'available' CHECK (status IN ('available', 'downloading', 'downloaded', 'installed', 'failed')),
  assigned_by_admin UUID REFERENCES auth.users,
  downloaded_at TIMESTAMP WITH TIME ZONE,
  installed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create admin_agent_packages table for centralized agent management
CREATE TABLE public.admin_agent_packages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  version TEXT NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('windows', 'macos', 'linux')),
  file_name TEXT NOT NULL,
  file_size BIGINT DEFAULT 0,
  description TEXT,
  features JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT true,
  is_recommended BOOLEAN DEFAULT false,
  deployment_target TEXT DEFAULT 'all' CHECK (deployment_target IN ('all', 'group', 'organization', 'manual')),
  created_by UUID REFERENCES auth.users,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add RLS policies for agent_configurations
ALTER TABLE public.agent_configurations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own agent configurations"
  ON public.agent_configurations
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own agent configurations"
  ON public.agent_configurations
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own agent configurations"
  ON public.agent_configurations
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all agent configurations"
  ON public.agent_configurations
  FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND email LIKE '%admin%'
  ));

-- Add RLS policies for agent_downloads
ALTER TABLE public.agent_downloads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own agent downloads"
  ON public.agent_downloads
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own agent downloads"
  ON public.agent_downloads
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all agent downloads"
  ON public.agent_downloads
  FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND email LIKE '%admin%'
  ));

-- Add RLS policies for admin_agent_packages
ALTER TABLE public.admin_agent_packages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active agent packages"
  ON public.admin_agent_packages
  FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage agent packages"
  ON public.admin_agent_packages
  FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND email LIKE '%admin%'
  ));

-- Create function to sync user agent configurations
CREATE OR REPLACE FUNCTION public.sync_user_agent_config(
  p_user_id UUID,
  p_agent_version TEXT,
  p_epo_config JSONB DEFAULT '{}'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  config_id UUID;
  org_id UUID;
BEGIN
  -- Get user's organization
  SELECT id INTO org_id
  FROM public.user_organizations
  WHERE user_id = p_user_id
  LIMIT 1;

  -- Upsert agent configuration
  INSERT INTO public.agent_configurations (
    user_id,
    organization_id,
    agent_version,
    epo_server_url,
    group_name,
    ou_name,
    deployment_policies,
    last_sync_at
  )
  VALUES (
    p_user_id,
    org_id,
    p_agent_version,
    p_epo_config->>'server_url',
    p_epo_config->>'group_name',
    p_epo_config->>'ou_name',
    p_epo_config,
    now()
  )
  ON CONFLICT (user_id)
  DO UPDATE SET
    agent_version = EXCLUDED.agent_version,
    epo_server_url = EXCLUDED.epo_server_url,
    group_name = EXCLUDED.group_name,
    ou_name = EXCLUDED.ou_name,
    deployment_policies = EXCLUDED.deployment_policies,
    last_sync_at = now(),
    updated_at = now()
  RETURNING id INTO config_id;

  RETURN config_id;
END;
$$;

-- Create function to assign agent to users
CREATE OR REPLACE FUNCTION public.assign_agent_to_users(
  p_agent_id UUID,
  p_user_ids UUID[],
  p_assigned_by UUID
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  assigned_count INTEGER := 0;
  user_id UUID;
  agent_data RECORD;
BEGIN
  -- Get agent package details
  SELECT * INTO agent_data
  FROM public.admin_agent_packages
  WHERE id = p_agent_id AND is_active = true;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Agent package not found or inactive';
  END IF;

  -- Assign to each user
  FOREACH user_id IN ARRAY p_user_ids LOOP
    INSERT INTO public.agent_downloads (
      user_id,
      agent_name,
      agent_version,
      file_name,
      platform,
      status,
      assigned_by_admin
    )
    VALUES (
      user_id,
      agent_data.name,
      agent_data.version,
      agent_data.file_name,
      agent_data.platform,
      'available',
      p_assigned_by
    )
    ON CONFLICT (user_id, agent_name, agent_version)
    DO UPDATE SET
      status = 'available',
      assigned_by_admin = p_assigned_by,
      updated_at = now();

    assigned_count := assigned_count + 1;
  END LOOP;

  RETURN assigned_count;
END;
$$;

-- Enable realtime for configuration sync
ALTER PUBLICATION supabase_realtime ADD TABLE public.agent_configurations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.agent_downloads;
ALTER PUBLICATION supabase_realtime ADD TABLE public.admin_agent_packages;

-- Add indexes for better performance
CREATE INDEX idx_agent_configurations_user_id ON public.agent_configurations(user_id);
CREATE INDEX idx_agent_downloads_user_id ON public.agent_downloads(user_id);
CREATE INDEX idx_agent_downloads_status ON public.agent_downloads(status);
CREATE INDEX idx_admin_agent_packages_active ON public.admin_agent_packages(is_active) WHERE is_active = true;
