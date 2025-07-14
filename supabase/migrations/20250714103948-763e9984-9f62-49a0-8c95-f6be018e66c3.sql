-- Create security_updates table for storing DAT packages and security updates
CREATE TABLE public.security_updates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('dat', 'engine', 'content')),
  platform TEXT NOT NULL,
  version TEXT NOT NULL,
  release_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  file_size BIGINT NOT NULL DEFAULT 0,
  file_name TEXT NOT NULL,
  sha256 TEXT,
  description TEXT,
  is_recommended BOOLEAN NOT NULL DEFAULT false,
  download_url TEXT,
  changelog TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create update_logs table for tracking update fetches
CREATE TABLE public.update_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  fetch_timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updates_found INTEGER NOT NULL DEFAULT 0,
  new_updates INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'success' CHECK (status IN ('success', 'failed', 'partial')),
  error_message TEXT,
  api_response_time INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.security_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.update_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for security_updates (public read access for authenticated users)
CREATE POLICY "Anyone can view security updates" 
ON public.security_updates 
FOR SELECT 
USING (true);

CREATE POLICY "System can manage security updates" 
ON public.security_updates 
FOR ALL 
USING (true)
WITH CHECK (true);

-- Create policies for update_logs (admin access only)
CREATE POLICY "System can manage update logs" 
ON public.update_logs 
FOR ALL 
USING (true)
WITH CHECK (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_security_updates_updated_at
BEFORE UPDATE ON public.security_updates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_security_updates_type ON public.security_updates(type);
CREATE INDEX idx_security_updates_platform ON public.security_updates(platform);
CREATE INDEX idx_security_updates_release_date ON public.security_updates(release_date DESC);
CREATE INDEX idx_update_logs_timestamp ON public.update_logs(fetch_timestamp DESC);