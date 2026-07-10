-- Add weekly_availability column to worker_profiles table
ALTER TABLE public.worker_profiles
ADD COLUMN IF NOT EXISTS weekly_availability jsonb;
