-- Add solution fields to validator_issue_reports table
ALTER TABLE validator_issue_reports 
ADD COLUMN IF NOT EXISTS solution TEXT,
ADD COLUMN IF NOT EXISTS resolved_by TEXT,
ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMPTZ;

-- Add solution fields to assignment_issues table
ALTER TABLE assignment_issues 
ADD COLUMN IF NOT EXISTS solution TEXT,
ADD COLUMN IF NOT EXISTS resolved_by TEXT,
ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMPTZ;
