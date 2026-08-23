-- Add category column to announcements table
ALTER TABLE announcements 
ADD COLUMN IF NOT EXISTS category TEXT NOT NULL DEFAULT 'general' 
CHECK (category IN ('website_updates', 'assignment_workflow', 'general'));

-- Add active column if it doesn't exist
ALTER TABLE announcements 
ADD COLUMN IF NOT EXISTS active boolean NOT NULL DEFAULT true;

-- Update existing announcements to 'general' category
UPDATE announcements 
SET category = 'general' 
WHERE category IS NULL OR category = '';

-- Update existing announcements to active = true if null
UPDATE announcements 
SET active = true 
WHERE active IS NULL;
