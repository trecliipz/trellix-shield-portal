-- Extend agent_configurations for custom tags and OU management
ALTER TABLE public.agent_configurations 
ADD COLUMN IF NOT EXISTS custom_tags JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS ou_groups JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS epo_credentials JSONB DEFAULT '{}';

-- Create user custom packages table
CREATE TABLE IF NOT EXISTS public.user_custom_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  base_package_id UUID REFERENCES public.admin_agent_packages(id) NOT NULL,
  package_name TEXT NOT NULL,
  custom_config JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on user_custom_packages
ALTER TABLE public.user_custom_packages ENABLE ROW LEVEL SECURITY;

-- Create policies for user_custom_packages
CREATE POLICY "Users can manage their own custom packages" 
ON public.user_custom_packages 
FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Update can_user_download function to allow test accounts unlimited access
CREATE OR REPLACE FUNCTION public.can_user_download(p_user_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  user_email text;
  subscription_record record;
BEGIN
  -- Get user email
  SELECT email INTO user_email FROM profiles WHERE id = p_user_id;
  
  -- Bypass for test accounts (any email containing 'test')
  IF user_email ILIKE '%test%' THEN
    RETURN true;
  END IF;
  
  -- Check subscription
  SELECT * INTO subscription_record 
  FROM user_subscriptions 
  WHERE user_id = p_user_id AND status = 'active';
  
  IF NOT FOUND THEN
    RETURN false;
  END IF;
  
  -- Check download limits
  IF subscription_record.max_downloads = -1 THEN
    RETURN true; -- Unlimited
  END IF;
  
  RETURN subscription_record.downloads_used < subscription_record.max_downloads;
END;
$function$;

-- Create function to check if user has paid subscription
CREATE OR REPLACE FUNCTION public.user_has_paid_subscription(p_user_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  user_email text;
  subscription_record record;
BEGIN
  -- Get user email
  SELECT email INTO user_email FROM profiles WHERE id = p_user_id;
  
  -- Test accounts always have access
  IF user_email ILIKE '%test%' THEN
    RETURN true;
  END IF;
  
  -- Check for active paid subscription
  SELECT * INTO subscription_record 
  FROM user_subscriptions 
  WHERE user_id = p_user_id 
    AND status = 'active' 
    AND plan_type != 'free';
  
  RETURN FOUND;
END;
$function$;

-- Create function to create custom agent package
CREATE OR REPLACE FUNCTION public.create_custom_package(
  p_user_id uuid,
  p_base_package_id uuid,
  p_package_name text,
  p_custom_config jsonb DEFAULT '{}'::jsonb
)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  package_id UUID;
BEGIN
  -- Insert custom package
  INSERT INTO public.user_custom_packages (
    user_id,
    base_package_id,
    package_name,
    custom_config
  ) VALUES (
    p_user_id,
    p_base_package_id,
    p_package_name,
    p_custom_config
  ) RETURNING id INTO package_id;

  RETURN package_id;
END;
$function$;

-- Add trigger for updated_at on user_custom_packages
CREATE TRIGGER update_user_custom_packages_updated_at
BEFORE UPDATE ON public.user_custom_packages
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();