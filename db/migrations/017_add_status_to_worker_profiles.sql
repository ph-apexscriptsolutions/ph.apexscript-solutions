-- Migration: add status column for worker availability status
-- Run this in Supabase SQL editor (or include in your migration pipeline)

ALTER TABLE public.worker_profiles
ADD COLUMN IF NOT EXISTS status text DEFAULT 'offline' CHECK (status IN ('online', 'away', 'offline'));

-- Optional: set existing NULLs to default
UPDATE public.worker_profiles SET status = 'offline' WHERE status IS NULL;
