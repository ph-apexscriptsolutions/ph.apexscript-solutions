-- Migration: add location column for worker profiles
-- Run this in Supabase SQL editor (or include in your migration pipeline)

ALTER TABLE public.worker_profiles
ADD COLUMN IF NOT EXISTS location text;
