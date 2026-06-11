-- Add due_time and description columns to production_assignments table
ALTER TABLE IF EXISTS public.production_assignments
ADD COLUMN IF NOT EXISTS due_time text,
ADD COLUMN IF NOT EXISTS description text;
