-- Relay Platform - Idempotency
-- Added to prevent duplicate requests on network retries

CREATE TABLE IF NOT EXISTS public.idempotency_keys (
  key TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  path TEXT NOT NULL,
  method TEXT NOT NULL,
  request_body JSONB,
  response_status INT,
  response_body JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index for cleanup of old keys (e.g., older than 24h)
CREATE INDEX IF NOT EXISTS idx_idempotency_keys_created_at ON public.idempotency_keys (created_at);

ALTER TABLE public.idempotency_keys ENABLE ROW LEVEL SECURITY;
-- Internal use only, no RLS policies needed if accessed via service key, 
-- or we can add an admin policy if needed.
