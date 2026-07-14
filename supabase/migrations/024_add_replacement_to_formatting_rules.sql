-- Add replacement column to formatting_rules table
ALTER TABLE formatting_rules ADD COLUMN IF NOT EXISTS replacement TEXT;
