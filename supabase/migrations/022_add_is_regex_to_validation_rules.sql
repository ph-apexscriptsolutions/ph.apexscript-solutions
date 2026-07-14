-- Add is_regex column to transcript_validation_rules table
ALTER TABLE transcript_validation_rules 
ADD COLUMN IF NOT EXISTS is_regex BOOLEAN DEFAULT false;
