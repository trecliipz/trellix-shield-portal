-- Create admin_messages table for contact form and admin messages
CREATE TABLE public.admin_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general',
  priority TEXT NOT NULL DEFAULT 'medium',
  status TEXT NOT NULL DEFAULT 'new',
  admin_response TEXT,
  attachments JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.admin_messages ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can insert their own messages"
ON public.admin_messages
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own messages"
ON public.admin_messages
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all messages"
ON public.admin_messages
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create deployment_jobs table for tracking agent deployments
CREATE TABLE public.deployment_jobs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_user_id UUID NOT NULL REFERENCES auth.users(id),
  agent_id UUID NOT NULL REFERENCES public.admin_agent_packages(id),
  deployment_target TEXT NOT NULL,
  target_users JSONB DEFAULT '[]'::jsonb,
  total_users INTEGER NOT NULL DEFAULT 0,
  completed_users INTEGER NOT NULL DEFAULT 0,
  failed_users INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending',
  started_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.deployment_jobs ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Admins can manage deployment jobs"
ON public.deployment_jobs
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add triggers for updated_at
CREATE TRIGGER update_admin_messages_updated_at
  BEFORE UPDATE ON public.admin_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_deployment_jobs_updated_at
  BEFORE UPDATE ON public.deployment_jobs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();