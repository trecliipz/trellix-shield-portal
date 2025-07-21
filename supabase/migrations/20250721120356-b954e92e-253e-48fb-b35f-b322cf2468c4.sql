-- Create cyberattacks table for threat intelligence data
CREATE TABLE IF NOT EXISTS public.cyberattacks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  attack_type TEXT,
  severity TEXT NOT NULL DEFAULT 'medium',
  date_detected TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  source TEXT NOT NULL,
  external_url TEXT,
  indicators JSONB,
  affected_products TEXT[],
  industries TEXT[],
  attack_vectors TEXT[],
  business_impact TEXT,
  mitigation_steps TEXT[],
  source_credibility_score INTEGER DEFAULT 8,
  cvss_score NUMERIC,
  cwe_id TEXT,
  vendor_info JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.cyberattacks ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access
CREATE POLICY "Anyone can view cyberattacks" 
ON public.cyberattacks 
FOR SELECT 
USING (true);

CREATE POLICY "System can manage cyberattacks" 
ON public.cyberattacks 
FOR ALL 
USING (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_cyberattacks_updated_at
BEFORE UPDATE ON public.cyberattacks
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_cyberattacks_date_detected ON public.cyberattacks(date_detected DESC);
CREATE INDEX IF NOT EXISTS idx_cyberattacks_severity ON public.cyberattacks(severity);
CREATE INDEX IF NOT EXISTS idx_cyberattacks_source ON public.cyberattacks(source);