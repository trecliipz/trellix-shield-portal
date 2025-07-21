
-- Create ML models table to track active ML models and their performance
CREATE TABLE public.ml_models (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  model_type TEXT NOT NULL, -- 'behavioral_analysis', 'static_analysis', 'network_traffic', 'email_security'
  version TEXT NOT NULL,
  accuracy_rate NUMERIC(5,4) NOT NULL DEFAULT 0.0, -- percentage as decimal (e.g., 0.9875 for 98.75%)
  false_positive_rate NUMERIC(5,4) NOT NULL DEFAULT 0.0,
  training_status TEXT NOT NULL DEFAULT 'active', -- 'training', 'active', 'deprecated'
  last_updated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  deployment_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create ML metrics table for real-time performance data
CREATE TABLE public.ml_metrics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  model_id UUID REFERENCES public.ml_models(id) NOT NULL,
  metric_type TEXT NOT NULL, -- 'inference_time', 'throughput', 'confidence_score', 'detection_count'
  metric_value NUMERIC NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  metadata JSONB -- additional context data
);

-- Create threat classifications table for ML-classified threats
CREATE TABLE public.threat_classifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  threat_type TEXT NOT NULL,
  classification TEXT NOT NULL, -- 'malware', 'phishing', 'anomaly', 'safe'
  confidence_score NUMERIC(3,2) NOT NULL, -- 0.00 to 1.00
  model_id UUID REFERENCES public.ml_models(id) NOT NULL,
  source_data JSONB, -- original data that was classified
  classified_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create model training logs table
CREATE TABLE public.model_training_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  model_id UUID REFERENCES public.ml_models(id) NOT NULL,
  training_session_id TEXT NOT NULL,
  epoch INTEGER,
  loss_value NUMERIC,
  accuracy NUMERIC(5,4),
  training_time_minutes INTEGER,
  dataset_size INTEGER,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'running' -- 'running', 'completed', 'failed'
);

-- Enable Row Level Security
ALTER TABLE public.ml_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ml_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.threat_classifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.model_training_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access (since this is for display purposes)
CREATE POLICY "Anyone can view ML models" ON public.ml_models FOR SELECT USING (true);
CREATE POLICY "Anyone can view ML metrics" ON public.ml_metrics FOR SELECT USING (true);
CREATE POLICY "Anyone can view threat classifications" ON public.threat_classifications FOR SELECT USING (true);
CREATE POLICY "Anyone can view training logs" ON public.model_training_logs FOR SELECT USING (true);

-- System can manage all ML data
CREATE POLICY "System can manage ML models" ON public.ml_models FOR ALL USING (true);
CREATE POLICY "System can manage ML metrics" ON public.ml_metrics FOR ALL USING (true);
CREATE POLICY "System can manage threat classifications" ON public.threat_classifications FOR ALL USING (true);
CREATE POLICY "System can manage training logs" ON public.model_training_logs FOR ALL USING (true);

-- Insert sample ML models data
INSERT INTO public.ml_models (name, model_type, version, accuracy_rate, false_positive_rate, training_status) VALUES
  ('Behavioral Anomaly Detector', 'behavioral_analysis', 'v2.1.3', 0.9847, 0.0023, 'active'),
  ('Static File Analyzer', 'static_analysis', 'v1.8.9', 0.9762, 0.0031, 'active'),
  ('Network Traffic Classifier', 'network_traffic', 'v3.2.1', 0.9891, 0.0018, 'active'),
  ('Email Security Scanner', 'email_security', 'v2.4.7', 0.9723, 0.0042, 'active'),
  ('Advanced Threat Hunter', 'behavioral_analysis', 'v3.0.1', 0.9923, 0.0012, 'training');

-- Insert sample threat classifications
INSERT INTO public.threat_classifications (threat_type, classification, confidence_score, model_id, source_data) 
SELECT 
  CASE (random() * 4)::integer 
    WHEN 0 THEN 'file_upload'
    WHEN 1 THEN 'network_traffic'
    WHEN 2 THEN 'email_content'
    ELSE 'user_behavior'
  END,
  CASE (random() * 4)::integer 
    WHEN 0 THEN 'malware'
    WHEN 1 THEN 'phishing'
    WHEN 2 THEN 'anomaly'
    ELSE 'safe'
  END,
  0.7 + (random() * 0.3), -- confidence between 0.7 and 1.0
  (SELECT id FROM public.ml_models ORDER BY random() LIMIT 1),
  '{"sample": "data"}'::jsonb
FROM generate_series(1, 50);
