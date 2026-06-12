-- Ensure announcements table has required columns for message, title, content, active, created_at, and admin_id
ALTER TABLE IF EXISTS public.announcements
  ADD COLUMN IF NOT EXISTS message text NOT NULL DEFAULT '';

ALTER TABLE IF EXISTS public.announcements
  ADD COLUMN IF NOT EXISTS title text NOT NULL DEFAULT '';

ALTER TABLE IF EXISTS public.announcements
  ADD COLUMN IF NOT EXISTS content text NOT NULL DEFAULT '';

ALTER TABLE IF EXISTS public.announcements
  ADD COLUMN IF NOT EXISTS active boolean NOT NULL DEFAULT true;

ALTER TABLE IF EXISTS public.announcements
  ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();

ALTER TABLE IF EXISTS public.announcements
  ADD COLUMN IF NOT EXISTS admin_id text;

ALTER TABLE IF EXISTS public.announcements
  ALTER COLUMN admin_id DROP NOT NULL;
