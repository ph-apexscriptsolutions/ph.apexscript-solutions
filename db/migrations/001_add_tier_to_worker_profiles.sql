-- Migration: add tier column for worker pay tiers
-- Run this in Supabase SQL editor (or include in your migration pipeline)

ALTER TABLE public.worker_profiles
ADD COLUMN IF NOT EXISTS tier integer DEFAULT 1;

-- Optional: set existing NULLs to default
UPDATE public.worker_profiles SET tier = 1 WHERE tier IS NULL;
