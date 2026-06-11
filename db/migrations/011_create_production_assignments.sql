-- Create production_assignments table
CREATE TABLE IF NOT EXISTS public.production_assignments (
  id serial PRIMARY KEY,
  worker_id text NOT NULL,
  filename text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  admin_deleted boolean DEFAULT false
);

-- Create index on worker_id for faster queries
CREATE INDEX IF NOT EXISTS idx_production_assignments_worker_id ON public.production_assignments(worker_id);
