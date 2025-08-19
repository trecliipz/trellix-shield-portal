
-- Create a table to log admin pings
CREATE TABLE public.network_ping_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  target TEXT NOT NULL,
  resolved_ip INET NULL,
  method TEXT NOT NULL DEFAULT 'http',
  port INTEGER NULL,
  status TEXT NOT NULL CHECK (status IN ('success','timeout','unreachable','error')),
  latency_ms INTEGER NULL CHECK (latency_ms IS NULL OR latency_ms >= 0),
  attempts INTEGER NOT NULL DEFAULT 1 CHECK (attempts > 0),
  attempt_index INTEGER NOT NULL DEFAULT 1 CHECK (attempt_index > 0),
  error_message TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.network_ping_logs ENABLE ROW LEVEL SECURITY;

-- Admins can manage all logs
CREATE POLICY "Admins can manage all network ping logs"
ON public.network_ping_logs
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Users can view their own logs (future-proofing if feature is broadened)
CREATE POLICY "Users can view their own network ping logs"
ON public.network_ping_logs
FOR SELECT
USING (auth.uid() = user_id);

-- updated_at trigger
CREATE TRIGGER update_network_ping_logs_updated_at
BEFORE UPDATE ON public.network_ping_logs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Helpful indexes
CREATE INDEX idx_network_ping_logs_user_created_at
  ON public.network_ping_logs (user_id, created_at DESC);

CREATE INDEX idx_network_ping_logs_target
  ON public.network_ping_logs (target);
