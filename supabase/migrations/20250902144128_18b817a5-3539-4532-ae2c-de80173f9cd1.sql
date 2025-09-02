-- Create conversion logs table for file conversion tracking
CREATE TABLE public.conversion_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  original_filename TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  input_format TEXT NOT NULL,
  output_format TEXT NOT NULL,
  conversion_type TEXT NOT NULL DEFAULT 'image', -- 'image', 'document', 'audio', 'video'
  status TEXT NOT NULL DEFAULT 'processing', -- 'processing', 'completed', 'failed'
  error_message TEXT,
  processing_time_ms INTEGER,
  download_url TEXT,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.conversion_logs ENABLE ROW LEVEL SECURITY;

-- Users can only see their own conversions
CREATE POLICY "Users can view their own conversions" 
ON public.conversion_logs 
FOR SELECT 
USING (auth.uid() = user_id);

-- Users can insert their own conversions
CREATE POLICY "Users can create their own conversions" 
ON public.conversion_logs 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Users can update their own conversions
CREATE POLICY "Users can update their own conversions" 
ON public.conversion_logs 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create conversion limits table for plan restrictions
CREATE TABLE public.conversion_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_type TEXT NOT NULL UNIQUE, -- 'starter', 'professional'
  daily_limit INTEGER NOT NULL,
  max_file_size_mb INTEGER NOT NULL,
  allowed_formats JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Insert plan limits
INSERT INTO public.conversion_limits (plan_type, daily_limit, max_file_size_mb, allowed_formats) VALUES
('starter', 10, 5, '["jpg", "png", "webp", "pdf"]'::jsonb),
('professional', 100, 50, '["jpg", "png", "webp", "pdf", "mp3", "mp4", "avi", "mov"]'::jsonb);

-- Function to check if user can convert
CREATE OR REPLACE FUNCTION public.can_user_convert(p_user_id UUID, p_file_size_mb INTEGER, p_format TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_plan_type TEXT;
  user_limits RECORD;
  daily_count INTEGER;
BEGIN
  -- Get user's plan type from subscription
  SELECT plan_type INTO user_plan_type
  FROM public.user_subscriptions
  WHERE user_id = p_user_id AND status = 'active'
  ORDER BY created_at DESC
  LIMIT 1;
  
  -- Default to starter if no active subscription
  IF user_plan_type IS NULL THEN
    user_plan_type := 'starter';
  END IF;
  
  -- Get plan limits
  SELECT * INTO user_limits
  FROM public.conversion_limits
  WHERE plan_type = user_plan_type;
  
  -- Check file size limit
  IF p_file_size_mb > user_limits.max_file_size_mb THEN
    RETURN FALSE;
  END IF;
  
  -- Check format support
  IF NOT (user_limits.allowed_formats ? p_format) THEN
    RETURN FALSE;
  END IF;
  
  -- Check daily limit
  SELECT COUNT(*) INTO daily_count
  FROM public.conversion_logs
  WHERE user_id = p_user_id
    AND created_at >= CURRENT_DATE
    AND status = 'completed';
  
  IF daily_count >= user_limits.daily_limit THEN
    RETURN FALSE;
  END IF;
  
  RETURN TRUE;
END;
$$;

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_conversion_logs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_conversion_logs_updated_at
  BEFORE UPDATE ON public.conversion_logs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_conversion_logs_updated_at();