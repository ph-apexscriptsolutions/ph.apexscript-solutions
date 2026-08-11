-- Migration: Create dashboard_ui_styles table
-- Stores admin-configured card styles (production, worker details, bank details, stats)
-- so all users see the same styles regardless of their browser/device.

CREATE TABLE IF NOT EXISTS public.dashboard_ui_styles (
  id               integer PRIMARY KEY DEFAULT 1,
  production_style jsonb    DEFAULT NULL,
  worker_style     jsonb    DEFAULT NULL,
  bank_style       jsonb    DEFAULT NULL,
  stats_style      jsonb    DEFAULT NULL,
  worker_title     text     DEFAULT NULL,
  updated_at       timestamptz DEFAULT now()
);

-- Ensure only one row ever exists (id must always be 1)
ALTER TABLE public.dashboard_ui_styles
  ADD CONSTRAINT dashboard_ui_styles_single_row CHECK (id = 1);
