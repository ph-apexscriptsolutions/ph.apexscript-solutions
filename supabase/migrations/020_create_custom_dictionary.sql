-- Create custom_dictionary table for technical/medical/legal terms
CREATE TABLE IF NOT EXISTS custom_dictionary (
  id BIGSERIAL PRIMARY KEY,
  term TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL, -- financial, medical, legal, mining, technology, etc.
  department TEXT NOT NULL DEFAULT 'all', -- conference, medical, legal, political, academics, broadcast, podcast, all
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on term for faster lookups
CREATE INDEX IF NOT EXISTS idx_custom_dictionary_term ON custom_dictionary(term);

-- Create index on enabled status for faster queries
CREATE INDEX IF NOT EXISTS idx_custom_dictionary_enabled ON custom_dictionary(enabled);

-- Create index on category for filtering
CREATE INDEX IF NOT EXISTS idx_custom_dictionary_category ON custom_dictionary(category);

-- Create index on department for filtering
CREATE INDEX IF NOT EXISTS idx_custom_dictionary_department ON custom_dictionary(department);

-- Create unique constraint on term + department to allow same term in different departments
CREATE UNIQUE INDEX IF NOT EXISTS idx_custom_dictionary_term_department ON custom_dictionary(term, department);
