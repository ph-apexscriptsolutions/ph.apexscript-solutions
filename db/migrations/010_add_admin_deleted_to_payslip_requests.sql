-- Add admin_deleted column to payslip_requests table
ALTER TABLE public.payslip_requests
ADD COLUMN IF NOT EXISTS admin_deleted boolean DEFAULT false;
