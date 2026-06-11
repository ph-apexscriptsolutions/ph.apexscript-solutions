-- Migration: remove comment column from worker profiles
-- Run this in Supabase SQL editor or include it in your migration pipeline

ALTER TABLE public.worker_profiles
DROP COLUMN IF EXISTS comment;
