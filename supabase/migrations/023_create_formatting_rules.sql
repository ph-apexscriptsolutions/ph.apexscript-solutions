-- Drop existing table if it exists (to recreate with proper structure)
DROP TABLE IF EXISTS formatting_rules CASCADE;

-- Create formatting_rules table
CREATE TABLE formatting_rules (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  pattern TEXT NOT NULL,
  department TEXT NOT NULL DEFAULT 'all',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on department for faster filtering
CREATE INDEX idx_formatting_rules_department ON formatting_rules(department);
