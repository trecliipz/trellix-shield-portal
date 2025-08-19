-- Fix security_updates type constraint to allow the types being used by the edge function
ALTER TABLE public.security_updates 
DROP CONSTRAINT security_updates_type_check;

-- Add updated constraint with additional allowed types
ALTER TABLE public.security_updates 
ADD CONSTRAINT security_updates_type_check 
CHECK (type = ANY (ARRAY[
  'dat'::text, 
  'datv3'::text, 
  'meddat'::text, 
  'engine'::text, 
  'tie'::text, 
  'exploit_prevention'::text, 
  'amcore_dat'::text, 
  'gateway_dat'::text, 
  'email_dat'::text, 
  'content'::text,
  'policy_template'::text,
  'epo_policy'::text,
  'epo_dat'::text,
  'security_engine'::text,
  'epo'::text,
  'policy'::text
]));

-- Ensure criticality_level constraint allows the values being used
ALTER TABLE public.security_updates 
DROP CONSTRAINT IF EXISTS security_updates_criticality_level_check;

ALTER TABLE public.security_updates 
ADD CONSTRAINT security_updates_criticality_level_check 
CHECK (criticality_level = ANY (ARRAY[
  'low'::text,
  'medium'::text, 
  'high'::text,
  'critical'::text
]));