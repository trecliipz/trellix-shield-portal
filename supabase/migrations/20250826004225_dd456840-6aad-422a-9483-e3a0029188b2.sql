
-- 1) Support ticketing (Support Portal)

CREATE TABLE IF NOT EXISTS public.support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  user_id UUID NOT NULL, -- creator (references auth.users; do not FK per guidelines)
  subject TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'open',        -- open | in_progress | resolved
  priority TEXT NOT NULL DEFAULT 'normal',    -- low | normal | high | urgent
  assigned_to UUID,                           -- support/admin user id (optional)
  last_activity_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.support_ticket_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,         -- commenter (references auth.users; do not FK per guidelines)
  body TEXT NOT NULL,
  is_internal BOOLEAN NOT NULL DEFAULT false, -- visible to admins only if true
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_ticket_comments ENABLE ROW LEVEL SECURITY;

-- Customer users: view/manage tickets for their customer
CREATE POLICY "Users can view their customer tickets" ON public.support_tickets
FOR SELECT USING (
  customer_id IN (
    SELECT customer_id FROM public.customer_users WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can create tickets for their customer" ON public.support_tickets
FOR INSERT WITH CHECK (
  user_id = auth.uid() AND
  customer_id IN (
    SELECT customer_id FROM public.customer_users WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can update their customer tickets" ON public.support_tickets
FOR UPDATE USING (
  customer_id IN (
    SELECT customer_id FROM public.customer_users WHERE user_id = auth.uid()
  )
);

-- Admins: full control
CREATE POLICY "Admins can manage all tickets" ON public.support_tickets
FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Comments visibility: same-customer or admin; internal comments only for admin
CREATE POLICY "Users can view ticket comments" ON public.support_ticket_comments
FOR SELECT USING (
  EXISTS (
    SELECT 1
    FROM public.support_tickets t
    JOIN public.customer_users cu ON cu.customer_id = t.customer_id
    WHERE t.id = support_ticket_comments.ticket_id
      AND (cu.user_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role))
  )
  AND (
    is_internal = false OR has_role(auth.uid(), 'admin'::app_role)
  )
);

CREATE POLICY "Users can add comments to customer tickets" ON public.support_ticket_comments
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.support_tickets t
    JOIN public.customer_users cu ON cu.customer_id = t.customer_id
    WHERE t.id = support_ticket_comments.ticket_id
      AND cu.user_id = auth.uid()
  )
);

CREATE POLICY "Admins can manage all comments" ON public.support_ticket_comments
FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Indexes
CREATE INDEX IF NOT EXISTS idx_support_tickets_customer ON public.support_tickets(customer_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON public.support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_support_tickets_priority ON public.support_tickets(priority);
CREATE INDEX IF NOT EXISTS idx_support_comments_ticket ON public.support_ticket_comments(ticket_id);

-- Update timestamps
CREATE TRIGGER trg_support_tickets_updated_at
BEFORE UPDATE ON public.support_tickets
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


-- 2) ePO events storage (webhook handler target)

CREATE TABLE IF NOT EXISTS public.epo_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id TEXT UNIQUE,
  customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  source TEXT NOT NULL DEFAULT 'epo',  -- epo | other
  event_type TEXT,
  payload JSONB NOT NULL DEFAULT '{}',
  processed BOOLEAN NOT NULL DEFAULT false,
  processing_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.epo_events ENABLE ROW LEVEL SECURITY;

-- Admin: full visibility and control
CREATE POLICY "Admins can manage epo events" ON public.epo_events
FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Customer users: can view their own events (non-internal)
CREATE POLICY "Users can view their epo events" ON public.epo_events
FOR SELECT USING (
  customer_id IN (
    SELECT customer_id FROM public.customer_users WHERE user_id = auth.uid()
  )
);

CREATE INDEX IF NOT EXISTS idx_epo_events_customer ON public.epo_events(customer_id);
CREATE INDEX IF NOT EXISTS idx_epo_events_created ON public.epo_events(created_at);


-- 3) API rate limiting ledger (for edge functions to consult/update)

CREATE TABLE IF NOT EXISTS public.api_rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier TEXT NOT NULL,               -- e.g., user:<uuid> or ip:<addr>
  window_start TIMESTAMPTZ NOT NULL DEFAULT now(),
  window_seconds INTEGER NOT NULL DEFAULT 60,
  request_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.api_rate_limits ENABLE ROW LEVEL SECURITY;

-- Admins can review the rate-limit ledger
CREATE POLICY "Admins can view api rate limits" ON public.api_rate_limits
FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

-- Note: No insert/update policies so only Edge Functions with service role can mutate.

CREATE UNIQUE INDEX IF NOT EXISTS idx_rate_limits_identifier_window
ON public.api_rate_limits(identifier, window_start);

CREATE INDEX IF NOT EXISTS idx_rate_limits_identifier ON public.api_rate_limits(identifier);

CREATE TRIGGER trg_api_rate_limits_updated_at
BEFORE UPDATE ON public.api_rate_limits
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
