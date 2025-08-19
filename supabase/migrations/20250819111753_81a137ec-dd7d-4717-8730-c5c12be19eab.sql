-- Create EPO connections table
CREATE TABLE public.epo_connections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  server_url TEXT NOT NULL,
  username TEXT NOT NULL,
  port INTEGER DEFAULT 8443,
  status TEXT DEFAULT 'disconnected' CHECK (status IN ('connected', 'disconnected', 'error')),
  last_sync TIMESTAMP WITH TIME ZONE,
  version TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.epo_connections ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can manage their own EPO connections"
ON public.epo_connections
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage all EPO connections"
ON public.epo_connections
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for updated_at
CREATE TRIGGER update_epo_connections_updated_at
BEFORE UPDATE ON public.epo_connections
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for performance
CREATE INDEX idx_epo_connections_user_id ON public.epo_connections(user_id);