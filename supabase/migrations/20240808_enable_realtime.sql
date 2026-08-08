-- Enable realtime for production_assignments table (if not already enabled)
do $$
begin
  if not exists (
    select 1 from pg_publication_tables 
    where pubname = 'supabase_realtime' and tablename = 'production_assignments'
  ) then
    alter publication supabase_realtime add table production_assignments;
  end if;
end $$;

-- Enable realtime for validator_issue_reports table (if not already enabled)
do $$
begin
  if not exists (
    select 1 from pg_publication_tables 
    where pubname = 'supabase_realtime' and tablename = 'validator_issue_reports'
  ) then
    alter publication supabase_realtime add table validator_issue_reports;
  end if;
end $$;

-- Enable realtime for assignment_issues table (if not already enabled)
do $$
begin
  if not exists (
    select 1 from pg_publication_tables 
    where pubname = 'supabase_realtime' and tablename = 'assignment_issues'
  ) then
    alter publication supabase_realtime add table assignment_issues;
  end if;
end $$;
