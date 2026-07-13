-- Add department column to formatting_rules table
ALTER TABLE formatting_rules ADD COLUMN IF NOT EXISTS department TEXT NOT NULL DEFAULT 'all';

-- Create index on department for faster filtering
CREATE INDEX IF NOT EXISTS idx_formatting_rules_department ON formatting_rules(department);
