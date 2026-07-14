-- Add department_permissions column to worker_profiles table
ALTER TABLE worker_profiles
ADD COLUMN department_permissions TEXT[] DEFAULT ARRAY['conference', 'senate', 'academics', 'broadcast', 'podcast', 'medical'];

-- Add comment to explain the column
COMMENT ON COLUMN worker_profiles.department_permissions IS 'Array of departments the worker has permission to access';
