CREATE TABLE IF NOT EXISTS public.announcements (
  id serial PRIMARY KEY,
  message text NOT NULL,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
