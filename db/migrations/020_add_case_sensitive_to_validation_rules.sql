-- Add case_sensitive column to transcript_validation_rules
ALTER TABLE transcript_validation_rules
ADD COLUMN IF NOT EXISTS case_sensitive BOOLEAN DEFAULT false;

-- Add is_regex column if it doesn't exist (for existing tables)
ALTER TABLE transcript_validation_rules
ADD COLUMN IF NOT EXISTS is_regex BOOLEAN DEFAULT false;

-- Add department column if it doesn't exist (for existing tables)
ALTER TABLE transcript_validation_rules
ADD COLUMN IF NOT EXISTS department TEXT DEFAULT 'all';
