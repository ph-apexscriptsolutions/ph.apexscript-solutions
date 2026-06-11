CREATE TABLE IF NOT EXISTS public.dashboard_layout_settings (
  id serial PRIMARY KEY,
  assignment_header_template text NOT NULL DEFAULT '3fr 1fr 1fr',
  assignment_row_template text NOT NULL DEFAULT '3fr 1fr 1fr'
);
