-- Create proper role-based access control system
-- 1. Create role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

-- 2. Create user_roles table
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role app_role NOT NULL,
    assigned_by UUID REFERENCES auth.users(id),
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 3. Create security definer function to check roles safely
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = _user_id AND role = _role
  );
$$;

-- 4. Create function to get current user role
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS app_role
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT role FROM public.user_roles 
  WHERE user_id = auth.uid() 
  ORDER BY CASE role 
    WHEN 'admin' THEN 1 
    WHEN 'moderator' THEN 2 
    WHEN 'user' THEN 3 
  END 
  LIMIT 1;
$$;

-- 5. Create RLS policies for user_roles table
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all roles"
ON public.user_roles
FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- 6. Replace insecure email-based admin policies with role-based ones

-- Fix profiles table policies
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles for deployment" ON public.profiles;

CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Fix user_subscriptions table policies  
DROP POLICY IF EXISTS "Admins can manage all subscriptions" ON public.user_subscriptions;
DROP POLICY IF EXISTS "Admins can view all user subscriptions" ON public.user_subscriptions;

CREATE POLICY "Admins can manage all subscriptions"
ON public.user_subscriptions
FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Fix admin_agent_packages table policies
DROP POLICY IF EXISTS "Admins can manage agent packages" ON public.admin_agent_packages;

CREATE POLICY "Admins can manage agent packages"
ON public.admin_agent_packages
FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Fix agent_configurations table policies
DROP POLICY IF EXISTS "Admins can manage all agent configurations" ON public.agent_configurations;

CREATE POLICY "Admins can manage all agent configurations" 
ON public.agent_configurations
FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Fix agent_downloads table policies
DROP POLICY IF EXISTS "Admins can manage all agent downloads" ON public.agent_downloads;

CREATE POLICY "Admins can manage all agent downloads"
ON public.agent_downloads
FOR ALL  
USING (public.has_role(auth.uid(), 'admin'));

-- Fix admin_users table policies
DROP POLICY IF EXISTS "Admins can manage admin users" ON public.admin_users;

CREATE POLICY "Admins can manage admin users"
ON public.admin_users
FOR ALL
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 7. Create function to assign initial admin role (run once manually)
CREATE OR REPLACE FUNCTION public.assign_admin_role(admin_email TEXT)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  admin_user_id UUID;
  role_id UUID;
BEGIN
  -- Get user ID by email
  SELECT id INTO admin_user_id
  FROM auth.users
  WHERE email = admin_email;
  
  IF admin_user_id IS NULL THEN
    RAISE EXCEPTION 'User with email % not found', admin_email;
  END IF;
  
  -- Assign admin role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (admin_user_id, 'admin')
  ON CONFLICT (user_id, role) DO NOTHING
  RETURNING id INTO role_id;
  
  RETURN role_id;
END;
$$;