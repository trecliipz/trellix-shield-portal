-- Create epo_sessions table for secure session management
CREATE TABLE public.epo_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  connection_id UUID NOT NULL REFERENCES public.epo_connections(id) ON DELETE CASCADE,
  session_token TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, connection_id)
);

-- Enable RLS on epo_sessions
ALTER TABLE public.epo_sessions ENABLE ROW LEVEL SECURITY;

-- Create policies for epo_sessions
CREATE POLICY "Users can manage their own EPO sessions"
ON public.epo_sessions
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Add updated_at trigger
CREATE TRIGGER update_epo_sessions_updated_at
BEFORE UPDATE ON public.epo_sessions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();