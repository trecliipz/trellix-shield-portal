-- Add department and online status to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS department text,
ADD COLUMN IF NOT EXISTS is_online boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS last_seen timestamp with time zone DEFAULT now();

-- Drop existing policy if it exists and create new one
DROP POLICY IF EXISTS "Admins can view all profiles for deployment" ON public.profiles;

-- Add RLS policy for admins to view all profiles
CREATE POLICY "Admins can view all profiles for deployment"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() 
    AND p.email ILIKE '%admin%'
  )
);