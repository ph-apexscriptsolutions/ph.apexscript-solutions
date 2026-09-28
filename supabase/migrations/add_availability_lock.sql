-- Add is_availability_locked column to worker_profiles table (optional, as JSONB weekly_availability is also supported)
ALTER TABLE public.worker_profiles
ADD COLUMN IF NOT EXISTS is_availability_locked boolean DEFAULT false;
