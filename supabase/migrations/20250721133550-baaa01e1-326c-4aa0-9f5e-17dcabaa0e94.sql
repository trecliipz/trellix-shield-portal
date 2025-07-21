
-- Fix the check_update_category constraint to include 'intelligence' and 'protection' values
ALTER TABLE public.security_updates DROP CONSTRAINT IF EXISTS check_update_category;

-- Add the updated constraint with all required values
ALTER TABLE public.security_updates ADD CONSTRAINT check_update_category 
CHECK (update_category IN ('endpoint', 'gateway', 'server', 'mobile', 'cloud', 'network', 'email', 'web', 'database', 'application', 'medical', 'intelligence', 'protection'));
