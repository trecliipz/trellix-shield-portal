-- Create a centralized error logs table for site-wide troubleshooting
CREATE TABLE IF NOT EXISTS public.error_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  level TEXT NOT NULL CHECK (level IN ('error','warn','info','debug','log')),
  message TEXT NOT NULL,
  source TEXT,
  url TEXT,
  user_agent TEXT,
  session_id TEXT,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  tags TEXT[] NOT NULL DEFAULT '{}'::text[],
  resolved BOOLEAN NOT NULL DEFAULT false
);

-- Helpful indexes
CREATE INDEX IF NOT EXISTS error_logs_created_at_idx ON public.error_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS error_logs_level_idx ON public.error_logs (level);
CREATE INDEX IF NOT EXISTS error_logs_session_idx ON public.error_logs (session_id);
CREATE INDEX IF NOT EXISTS error_logs_user_idx ON public.error_logs (user_id);

-- Enable Row Level Security
ALTER TABLE public.error_logs ENABLE ROW LEVEL SECURITY;

-- Allow anonymous and authenticated clients to INSERT logs so we can capture errors even before login
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'error_logs' AND policyname = 'Anyone can insert error logs'
  ) THEN
    CREATE POLICY "Anyone can insert error logs"
      ON public.error_logs
      FOR INSERT
      TO anon, authenticated
      WITH CHECK (true);
  END IF;
END $$;
