-- Create separate tables for each announcement type

-- Website Updates table
CREATE TABLE IF NOT EXISTS website_updates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  message TEXT NOT NULL,
  content TEXT NOT NULL,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  admin_id TEXT
);

-- Assignment Workflow table
CREATE TABLE IF NOT EXISTS assignment_workflow (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  message TEXT NOT NULL,
  content TEXT NOT NULL,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  admin_id TEXT
);

-- General Announcements table
CREATE TABLE IF NOT EXISTS general_announcements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  message TEXT NOT NULL,
  content TEXT NOT NULL,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  admin_id TEXT
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_website_updates_created_at ON website_updates(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_assignment_workflow_created_at ON assignment_workflow(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_general_announcements_created_at ON general_announcements(created_at DESC);

-- Enable Row Level Security
ALTER TABLE website_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignment_workflow ENABLE ROW LEVEL SECURITY;
ALTER TABLE general_announcements ENABLE ROW LEVEL SECURITY;

-- RLS Policies for website_updates
CREATE POLICY "Admins can create website updates" ON website_updates
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM worker_profiles
      WHERE worker_profiles.id = auth.uid()
      AND worker_profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can view all website updates" ON website_updates
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM worker_profiles
      WHERE worker_profiles.id = auth.uid()
      AND worker_profiles.role = 'admin'
    )
  );

CREATE POLICY "Workers can view website updates" ON website_updates
  FOR SELECT
  TO authenticated
  USING (true);

-- RLS Policies for assignment_workflow
CREATE POLICY "Admins can create assignment workflow" ON assignment_workflow
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM worker_profiles
      WHERE worker_profiles.id = auth.uid()
      AND worker_profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can view all assignment workflow" ON assignment_workflow
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM worker_profiles
      WHERE worker_profiles.id = auth.uid()
      AND worker_profiles.role = 'admin'
    )
  );

CREATE POLICY "Workers can view assignment workflow" ON assignment_workflow
  FOR SELECT
  TO authenticated
  USING (true);

-- RLS Policies for general_announcements
CREATE POLICY "Admins can create general announcements" ON general_announcements
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM worker_profiles
      WHERE worker_profiles.id = auth.uid()
      AND worker_profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can view all general announcements" ON general_announcements
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM worker_profiles
      WHERE worker_profiles.id = auth.uid()
      AND worker_profiles.role = 'admin'
    )
  );

CREATE POLICY "Workers can view general announcements" ON general_announcements
  FOR SELECT
  TO authenticated
  USING (true);
