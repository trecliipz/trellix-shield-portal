-- Add new columns to support enhanced security update types and metadata
ALTER TABLE public.security_updates 
ADD COLUMN IF NOT EXISTS update_category TEXT,
ADD COLUMN IF NOT EXISTS criticality_level TEXT DEFAULT 'medium',
ADD COLUMN IF NOT EXISTS target_systems JSONB,
ADD COLUMN IF NOT EXISTS dependencies JSONB,
ADD COLUMN IF NOT EXISTS compatibility_info JSONB,
ADD COLUMN IF NOT EXISTS threat_coverage TEXT[],
ADD COLUMN IF NOT EXISTS deployment_notes TEXT;

-- Add check constraint for criticality levels
ALTER TABLE public.security_updates 
ADD CONSTRAINT check_criticality_level 
CHECK (criticality_level IN ('low', 'medium', 'high', 'critical'));

-- Add check constraint for update categories
ALTER TABLE public.security_updates 
ADD CONSTRAINT check_update_category 
CHECK (update_category IN ('endpoint', 'server', 'gateway', 'email', 'medical', 'tie', 'general'));

-- Update the type constraint to include all new security update types
ALTER TABLE public.security_updates 
DROP CONSTRAINT IF EXISTS security_updates_type_check;

ALTER TABLE public.security_updates 
ADD CONSTRAINT security_updates_type_check 
CHECK (type IN ('dat', 'datv3', 'meddat', 'engine', 'tie', 'exploit_prevention', 'amcore_dat', 'gateway_dat', 'email_dat', 'content'));

-- Create index for better performance on new columns
CREATE INDEX IF NOT EXISTS idx_security_updates_category ON public.security_updates(update_category);
CREATE INDEX IF NOT EXISTS idx_security_updates_criticality ON public.security_updates(criticality_level);
CREATE INDEX IF NOT EXISTS idx_security_updates_type_category ON public.security_updates(type, update_category);