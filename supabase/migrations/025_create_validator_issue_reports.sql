-- Create validator_issue_reports table
CREATE TABLE validator_issue_reports (
  id BIGSERIAL PRIMARY KEY,
  worker_id TEXT NOT NULL,
  worker_name TEXT NOT NULL,
  transcript_content TEXT NOT NULL,
  issue_description TEXT NOT NULL,
  department TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on status for filtering
CREATE INDEX idx_validator_issue_reports_status ON validator_issue_reports(status);

-- Create index on created_at for sorting
CREATE INDEX idx_validator_issue_reports_created_at ON validator_issue_reports(created_at DESC);
