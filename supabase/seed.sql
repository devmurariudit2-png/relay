-- Supabase Database Seeding Script
-- This file is executed automatically when you run `supabase start` or `supabase db reset`

-- Enable pgcrypto for password hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. Create a Default Admin User
-- We insert directly into auth.users. 
-- Note: Our `on_auth_user_created` trigger will automatically create a row in `public.profiles` as a 'member'.
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_user_meta_data,
  role,
  aud,
  created_at,
  updated_at
) VALUES (
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000000',
  'admin@relay.local',
  crypt('password123', gen_salt('bf')),
  now(),
  '{"full_name":"Relay Admin"}',
  'authenticated',
  'authenticated',
  now(),
  now()
) ON CONFLICT (id) DO NOTHING;

-- 2. Escalate the Default User to Admin
-- We bypass the trigger block because we are running as superuser/postgres role during seeding
UPDATE public.profiles 
SET role = 'admin' 
WHERE id = '00000000-0000-0000-0000-000000000001';

-- 3. Insert Dummy Transactions
INSERT INTO public.transactions (user_id, date, description, amount, source, status) VALUES
  ('00000000-0000-0000-0000-000000000001', CURRENT_DATE - INTERVAL '2 days', 'Stripe Payout', 5430.00, 'bank', 'matched'),
  ('00000000-0000-0000-0000-000000000001', CURRENT_DATE - INTERVAL '1 day', 'AWS Cloud Services', -1200.50, 'internal', 'pending'),
  ('00000000-0000-0000-0000-000000000001', CURRENT_DATE, 'Refund - Client Overcharge', -150.00, 'bank', 'exception')
ON CONFLICT DO NOTHING;

-- 4. Insert Dummy Tickets
INSERT INTO public.tickets (user_id, title, description, status, priority) VALUES
  ('00000000-0000-0000-0000-000000000001', 'Review Unmatched Transactions', 'There are 15 new unmatched ledger entries from the weekend batch.', 'open', 'high'),
  ('00000000-0000-0000-0000-000000000001', 'Update Webhook Secrets', 'Rotate the Stripe webhook secrets before moving to production.', 'resolved', 'medium')
ON CONFLICT DO NOTHING;

-- 5. Performance Indexes
-- Speeds up the subscription transaction limit check in CreateTransactionService
CREATE INDEX IF NOT EXISTS idx_transactions_user_created 
ON public.transactions(user_id, created_at);
