-- Add department and online status to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS department text,
ADD COLUMN IF NOT EXISTS is_online boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS last_seen timestamp with time zone DEFAULT now();

-- Insert sample users for testing (only if they don't exist)
INSERT INTO public.profiles (id, name, email, department, is_online, last_seen)
SELECT 
  gen_random_uuid(),
  name,
  email,
  department,
  is_online,
  now()
FROM (VALUES
  ('John Doe', 'john.doe@company.com', 'IT Department', true),
  ('Jane Smith', 'jane.smith@company.com', 'Finance Department', true),
  ('Mike Johnson', 'mike.johnson@company.com', 'HR Department', false),
  ('Sarah Wilson', 'sarah.wilson@company.com', 'Marketing Department', true),
  ('David Brown', 'david.brown@company.com', 'Operations Department', false),
  ('Lisa Garcia', 'lisa.garcia@company.com', 'Sales Department', true)
) AS sample_users(name, email, department, is_online)
WHERE NOT EXISTS (
  SELECT 1 FROM public.profiles WHERE email = sample_users.email
);

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