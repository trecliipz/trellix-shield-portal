-- Enable pg_cron and pg_net extensions for scheduled tasks
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Schedule daily update fetch at 6 AM UTC
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