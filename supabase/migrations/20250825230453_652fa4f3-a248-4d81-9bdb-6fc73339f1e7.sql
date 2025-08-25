-- Create provisioning_jobs table to track customer setup status
CREATE TABLE public.provisioning_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  job_type TEXT NOT NULL DEFAULT 'customer_onboarding',
  status TEXT NOT NULL DEFAULT 'pending', -- pending, in_progress, completed, failed
  step_details JSONB DEFAULT '{}',
  current_step TEXT,
  total_steps INTEGER DEFAULT 5,
  completed_steps INTEGER DEFAULT 0,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);

-- Create webhook_events table to track Stripe webhook processing
CREATE TABLE public.webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_event_id TEXT UNIQUE NOT NULL,
  event_type TEXT NOT NULL,
  processed BOOLEAN DEFAULT FALSE,
  processing_error TEXT,
  data JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  processed_at TIMESTAMPTZ
);

-- Create usage_records table for billing reconciliation
CREATE TABLE public.usage_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES public.customer_subscriptions(id),
  record_date DATE NOT NULL,
  endpoint_count INTEGER NOT NULL DEFAULT 0,
  billable_endpoints INTEGER NOT NULL DEFAULT 0,
  overage_endpoints INTEGER DEFAULT 0,
  sync_source TEXT DEFAULT 'epo_api',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(customer_id, record_date)
);

-- Enable RLS
ALTER TABLE public.provisioning_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_records ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for provisioning_jobs
CREATE POLICY "Users can view their own provisioning jobs" ON public.provisioning_jobs
  FOR SELECT USING (customer_id IN (
    SELECT customer_id FROM public.customer_users WHERE user_id = auth.uid()
  ));

CREATE POLICY "System can manage provisioning jobs" ON public.provisioning_jobs
  FOR ALL USING (true);

-- Create RLS policies for webhook_events (admin only)
CREATE POLICY "Admins can manage webhook events" ON public.webhook_events
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Create RLS policies for usage_records
CREATE POLICY "Users can view their usage records" ON public.usage_records
  FOR SELECT USING (customer_id IN (
    SELECT customer_id FROM public.customer_users WHERE user_id = auth.uid()
  ));

CREATE POLICY "System can manage usage records" ON public.usage_records
  FOR ALL USING (true);

-- Create triggers for updated_at
CREATE TRIGGER update_provisioning_jobs_updated_at
  BEFORE UPDATE ON public.provisioning_jobs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for performance
CREATE INDEX idx_provisioning_jobs_customer_id ON public.provisioning_jobs(customer_id);
CREATE INDEX idx_provisioning_jobs_status ON public.provisioning_jobs(status);
CREATE INDEX idx_webhook_events_stripe_id ON public.webhook_events(stripe_event_id);
CREATE INDEX idx_webhook_events_processed ON public.webhook_events(processed);
CREATE INDEX idx_usage_records_customer_date ON public.usage_records(customer_id, record_date);
CREATE INDEX idx_usage_records_date ON public.usage_records(record_date);