-- Fix the check constraint to include all security update categories
ALTER TABLE public.security_updates DROP CONSTRAINT IF EXISTS check_update_category;

-- Add updated constraint that includes all valid categories
ALTER TABLE public.security_updates ADD CONSTRAINT check_update_category 
CHECK (category IN ('dat', 'datv3', 'dat_file', 'amcore', 'engine', 'exploit', 'epo', 'policy', 'tie', 'content', 'meddat'));

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_security_updates_release_date ON public.security_updates(release_date DESC);
CREATE INDEX IF NOT EXISTS idx_security_updates_type ON public.security_updates(type);
CREATE INDEX IF NOT EXISTS idx_security_updates_category ON public.security_updates(category);

-- Make the cron job idempotent by unscheduling and rescheduling
SELECT cron.unschedule('daily-security-updates-fetch');

SELECT cron.schedule(
  'daily-security-updates-fetch',
  '0 6 * * *', -- Every day at 6 AM UTC
  $$
  SELECT
    net.http_post(
        url:='https://enwjspegjxkqrcmzlzqg.supabase.co/functions/v1/fetch-security-updates',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVud2pzcGVnanhrcXJjbXpsenFnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxODEwNDksImV4cCI6MjA2NTc1NzA0OX0.EIAEdQQk2H2xkMrX1EAO3iFzf3BrpC6vuww6PAHbqDQ"}'::jsonb,
        body:='{"time": "' || now() || '"}'::jsonb
    ) as request_id;
  $$
);