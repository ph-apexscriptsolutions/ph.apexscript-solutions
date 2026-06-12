-- Add active column to announcements if missing
ALTER TABLE IF EXISTS public.announcements
ADD COLUMN IF NOT EXISTS active boolean NOT NULL DEFAULT true;
