-- Migration: add bank detail columns for worker profiles
-- Run this in Supabase SQL editor or include it in your migration pipeline

ALTER TABLE public.worker_profiles
ADD COLUMN IF NOT EXISTS bank_name text;

ALTER TABLE public.worker_profiles
ADD COLUMN IF NOT EXISTS account_number text;

ALTER TABLE public.worker_profiles
ADD COLUMN IF NOT EXISTS account_type text;

ALTER TABLE public.worker_profiles
ADD COLUMN IF NOT EXISTS routing_number text;
