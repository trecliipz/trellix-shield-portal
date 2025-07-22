
-- Create user subscriptions table for plan management
CREATE TABLE public.user_subscriptions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users NOT NULL,
  plan_type text NOT NULL CHECK (plan_type IN ('starter', 'professional', 'enterprise')),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'cancelled')),
  downloads_used integer DEFAULT 0,
  max_downloads integer DEFAULT -1, -- -1 means unlimited
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS on user subscriptions
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;

-- Users can view their own subscription
CREATE POLICY "Users can view their own subscription" 
  ON public.user_subscriptions 
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Admins can manage all subscriptions
CREATE POLICY "Admins can manage all subscriptions" 
  ON public.user_subscriptions 
  FOR ALL 
  USING (EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND email LIKE '%admin%'
  ));

-- System can insert subscriptions
CREATE POLICY "System can insert subscriptions" 
  ON public.user_subscriptions 
  FOR INSERT 
  WITH CHECK (true);

-- Create function to check if user can download
CREATE OR REPLACE FUNCTION public.can_user_download(p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_email text;
  subscription_record record;
BEGIN
  -- Get user email
  SELECT email INTO user_email FROM profiles WHERE id = p_user_id;
  
  -- Bypass for test@trellix.com
  IF user_email = 'test@trellix.com' THEN
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
$$;

-- Create function to increment download count
CREATE OR REPLACE FUNCTION public.increment_download_count(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE user_subscriptions 
  SET downloads_used = downloads_used + 1,
      updated_at = now()
  WHERE user_id = p_user_id AND status = 'active';
END;
$$;

-- Migrate admin users from localStorage to database (create admin_users table)
CREATE TABLE public.admin_users (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email text NOT NULL UNIQUE,
  name text NOT NULL,
  role text NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  temp_password text,
  created_by uuid REFERENCES auth.users,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on admin users
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- Admins can manage all admin users
CREATE POLICY "Admins can manage admin users" 
  ON public.admin_users 
  FOR ALL 
  USING (EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND email LIKE '%admin%'
  ));

-- Add default subscriptions for existing users
INSERT INTO public.user_subscriptions (user_id, plan_type, max_downloads)
SELECT id, 'professional', -1 
FROM auth.users 
WHERE email = 'test@trellix.com'
ON CONFLICT (user_id) DO NOTHING;
