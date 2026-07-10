-- Migration 018: Create style_guides table and pre-populate departments
CREATE TABLE IF NOT EXISTS public.style_guides (
  id serial PRIMARY KEY,
  department text NOT NULL UNIQUE,
  file_url text,
  file_name text,
  updated_at timestamptz DEFAULT now()
);

INSERT INTO public.style_guides (department)
VALUES 
  ('Conference/Earnings Call'),
  ('Senate Hearings/Political'),
  ('Academics/Podcast'),
  ('Medical Transcription'),
  ('Broadcast')
ON CONFLICT (department) DO NOTHING;
