-- Migration: Add base payment column for per-worker earnings rates
-- This allows admins to set different rates per 60KB for each worker tier

ALTER TABLE public.worker_profiles
ADD COLUMN IF NOT EXISTS base_payment_per_60kb integer DEFAULT 700;

-- Optional: set existing NULLs to default
UPDATE public.worker_profiles SET base_payment_per_60kb = 700 WHERE base_payment_per_60kb IS NULL;
