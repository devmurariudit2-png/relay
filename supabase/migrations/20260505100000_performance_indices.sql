-- Relay Platform - Performance Indices
-- Added to support high-volume transaction querying and analytics

-- 1. Transactions Indices
-- Used for fetching a user's transactions quickly
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON public.transactions (user_id);

-- Used for filtering and aggregating by status
CREATE INDEX IF NOT EXISTS idx_transactions_status ON public.transactions (status);

-- Used for time-series queries and dashboard charts
CREATE INDEX IF NOT EXISTS idx_transactions_date ON public.transactions (date DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON public.transactions (created_at DESC);

-- Composite index for the common query: getting a user's transactions by status/date
CREATE INDEX IF NOT EXISTS idx_transactions_user_status_date ON public.transactions (user_id, status, date DESC);

-- 2. Audit Logs Indices
-- Fast lookup of audit history per user
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs (user_id);
-- Fast lookup by action type
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs (action);

-- 3. Tickets Indices
-- Fast lookup for user support dashboards
CREATE INDEX IF NOT EXISTS idx_tickets_user_status ON public.tickets (user_id, status);

-- 4. Profiles
-- Fast lookup by org_name for team features
CREATE INDEX IF NOT EXISTS idx_profiles_org_name ON public.profiles (org_name);
