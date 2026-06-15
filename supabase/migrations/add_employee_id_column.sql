-- Add employee_id column to worker_profiles table
ALTER TABLE worker_profiles ADD COLUMN employee_id TEXT;

-- Create an index on employee_id for faster lookups
CREATE INDEX idx_worker_profiles_employee_id ON worker_profiles(employee_id);
