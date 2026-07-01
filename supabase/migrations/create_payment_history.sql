CREATE TABLE IF NOT EXISTS public.payment_history (
  id serial PRIMARY KEY,
  worker_id text NOT NULL,
  amount numeric(10, 2) NOT NULL,
  payment_date date NOT NULL DEFAULT CURRENT_DATE,
  bank_type text,
  reference_number text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  admin_deleted boolean DEFAULT false
);

CREATE INDEX IF NOT EXISTS idx_payment_history_worker_id ON public.payment_history(worker_id);
