-- Add priority column to assignments table
ALTER TABLE assignments
ADD COLUMN IF NOT EXISTS is_priority BOOLEAN DEFAULT FALSE;

-- Add index for faster sorting by priority
CREATE INDEX IF NOT EXISTS idx_assignments_priority ON assignments(is_priority DESC, created_at DESC);
