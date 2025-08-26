-- Phase B: Add scheduled jobs for daily operations

-- Enable pg_cron extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Schedule daily usage reconciliation at 2 AM UTC
SELECT cron.schedule(
  'daily-usage-reconciliation',
  '0 2 * * *', -- Daily at 2 AM UTC
  $$
  SELECT
    net.http_post(
        url:='https://enwjspegjxkqrcmzlzqg.supabase.co/functions/v1/reconcile-usage',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVud2pzcGVnanhrcXJjbXpsenFnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxODEwNDksImV4cCI6MjA2NTc1NzA0OX0.EIAEdQQk2H2xkMrX1EAO3iFzf3BrpC6vuww6PAHbqDQ"}'::jsonb,
        body:='{"automated": true, "source": "cron"}'::jsonb
    ) as request_id;
  $$
);

-- Schedule hourly health checks
SELECT cron.schedule(
  'hourly-health-check',
  '0 * * * *', -- Every hour
  $$
  SELECT
    net.http_post(
        url:='https://enwjspegjxkqrcmzlzqg.supabase.co/functions/v1/health-check',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVud2pzcGVnanhrcXJjbXpsenFnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxODEwNDksImV4cCI6MjA2NTc1NzA0OX0.EIAEdQQk2H2xkMrX1EAO3iFzf3BrpC6vuww6PAHbqDQ"}'::jsonb,
        body:='{"automated": true}'::jsonb
    ) as request_id;
  $$
);

-- Create a simple health_logs table to track system health over time
CREATE TABLE IF NOT EXISTS public.health_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
  overall_status TEXT NOT NULL,
  service_status JSONB NOT NULL DEFAULT '{}',
  details JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on health_logs (admin only)
ALTER TABLE public.health_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view health logs" ON public.health_logs
FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "System can insert health logs" ON public.health_logs
FOR INSERT WITH CHECK (true);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_health_logs_timestamp ON public.health_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_health_logs_status ON public.health_logs(overall_status);