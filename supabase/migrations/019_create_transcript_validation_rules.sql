-- Create transcript_validation_rules table
CREATE TABLE IF NOT EXISTS transcript_validation_rules (
  id BIGSERIAL PRIMARY KEY,
  rule_name TEXT NOT NULL,
  department TEXT NOT NULL DEFAULT 'all',
  category TEXT NOT NULL,
  find TEXT NOT NULL,
  replace TEXT NOT NULL,
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on enabled status for faster queries
CREATE INDEX IF NOT EXISTS idx_transcript_validation_rules_enabled ON transcript_validation_rules(enabled);

-- Create index on category for filtering
CREATE INDEX IF NOT EXISTS idx_transcript_validation_rules_category ON transcript_validation_rules(category);

-- Create index on department for filtering
CREATE INDEX IF NOT EXISTS idx_transcript_validation_rules_department ON transcript_validation_rules(department);
