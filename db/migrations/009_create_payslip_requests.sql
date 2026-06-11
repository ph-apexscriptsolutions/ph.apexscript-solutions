-- Create payslip_requests table
CREATE TABLE IF NOT EXISTS public.payslip_requests (
  id serial PRIMARY KEY,
  worker_id text NOT NULL,
  cutoff_start date NOT NULL,
  cutoff_end date NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  requested_at timestamptz NOT NULL DEFAULT now(),
  payslip_url text
);
