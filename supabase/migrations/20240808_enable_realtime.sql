-- Enable realtime for production_assignments table
alter publication supabase_realtime add table production_assignments;

-- Enable realtime for validator_issue_reports table
alter publication supabase_realtime add table validator_issue_reports;

-- Enable realtime for assignment_issues table
alter publication supabase_realtime add table assignment_issues;
