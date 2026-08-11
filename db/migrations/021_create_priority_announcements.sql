-- Migration: Create priority_announcements and priority_announcement_responses tables

CREATE TABLE IF NOT EXISTS public.priority_announcements (
  id serial PRIMARY KEY,
  admin_id text,
  admin_name text DEFAULT 'Admin',
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  target_type text NOT NULL DEFAULT 'all', -- 'all' or 'specific'
  target_worker_ids jsonb DEFAULT '[]'::jsonb, -- array of worker IDs when target_type is 'specific'
  first_come_first_served boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'active', -- 'active', 'claimed', 'expired', 'closed'
  claimed_by_worker_id text,
  claimed_by_worker_name text,
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.priority_announcement_responses (
  id serial PRIMARY KEY,
  announcement_id integer REFERENCES public.priority_announcements(id) ON DELETE CASCADE,
  worker_id text NOT NULL,
  worker_name text NOT NULL DEFAULT '',
  worker_email text DEFAULT '',
  response text NOT NULL, -- 'accepted' or 'declined'
  note text DEFAULT '',
  responded_at timestamptz NOT NULL DEFAULT now()
);

-- Indices for performance
CREATE INDEX IF NOT EXISTS idx_priority_announcements_status ON public.priority_announcements(status);
CREATE INDEX IF NOT EXISTS idx_priority_announcements_created ON public.priority_announcements(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_priority_responses_announcement ON public.priority_announcement_responses(announcement_id);
CREATE INDEX IF NOT EXISTS idx_priority_responses_worker ON public.priority_announcement_responses(worker_id);
