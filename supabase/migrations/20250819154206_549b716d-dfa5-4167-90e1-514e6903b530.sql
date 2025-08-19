-- Create comprehensive error logs table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.error_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  level TEXT NOT NULL CHECK (level IN ('error', 'warn', 'info', 'debug', 'log')),
  message TEXT NOT NULL,
  source TEXT,
  url TEXT,
  user_agent TEXT,
  session_id TEXT,
  user_id UUID REFERENCES auth.users(id),
  details JSONB,
  tags TEXT[] DEFAULT '{}',
  resolved BOOLEAN DEFAULT false,
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolved_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_error_logs_created_at ON public.error_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_error_logs_level ON public.error_logs(level);
CREATE INDEX IF NOT EXISTS idx_error_logs_user_id ON public.error_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_error_logs_session_id ON public.error_logs(session_id);
CREATE INDEX IF NOT EXISTS idx_error_logs_resolved ON public.error_logs(resolved);

-- Enable RLS
ALTER TABLE public.error_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for error logs
CREATE POLICY "Users can view their own error logs" 
ON public.error_logs 
FOR SELECT 
USING (auth.uid() = user_id OR auth.uid() IN (
  SELECT user_id FROM public.user_roles WHERE role = 'admin'
));

CREATE POLICY "System can insert error logs" 
ON public.error_logs 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Admins can update error logs" 
ON public.error_logs 
FOR UPDATE 
USING (auth.uid() IN (
  SELECT user_id FROM public.user_roles WHERE role = 'admin'
));

-- Create function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_error_logs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
DROP TRIGGER IF EXISTS update_error_logs_updated_at ON public.error_logs;
CREATE TRIGGER update_error_logs_updated_at
  BEFORE UPDATE ON public.error_logs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_error_logs_updated_at();

-- Create function to clean up old error logs (keep last 30 days)
CREATE OR REPLACE FUNCTION public.cleanup_old_error_logs()
RETURNS void AS $$
BEGIN
  DELETE FROM public.error_logs 
  WHERE created_at < now() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;