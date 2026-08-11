-- Create announcements table
CREATE TABLE IF NOT EXISTS announcements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  priority TEXT NOT NULL CHECK (priority IN ('normal', 'high', 'urgent')),
  deadline TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'completed')),
  target_type TEXT NOT NULL CHECK (target_type IN ('all', 'specific')),
  target_worker_ids UUID[] DEFAULT ARRAY[]::UUID[]
);

-- Create announcement_responses table
CREATE TABLE IF NOT EXISTS announcement_responses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  announcement_id UUID REFERENCES announcements(id) ON DELETE CASCADE,
  worker_id UUID REFERENCES users(id) ON DELETE CASCADE,
  response TEXT NOT NULL CHECK (response IN ('accepted', 'declined')),
  response_note TEXT,
  responded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(announcement_id, worker_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_announcements_created_by ON announcements(created_by);
CREATE INDEX IF NOT EXISTS idx_announcements_status ON announcements(status);
CREATE INDEX IF NOT EXISTS idx_announcements_created_at ON announcements(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_announcement_responses_announcement_id ON announcement_responses(announcement_id);
CREATE INDEX IF NOT EXISTS idx_announcement_responses_worker_id ON announcement_responses(worker_id);

-- Enable Row Level Security
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcement_responses ENABLE ROW LEVEL SECURITY;

-- RLS Policies for announcements
-- Admins can create announcements
CREATE POLICY "Admins can create announcements" ON announcements
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Admins can view all announcements
CREATE POLICY "Admins can view all announcements" ON announcements
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Workers can view announcements targeted to them or all
CREATE POLICY "Workers can view targeted announcements" ON announcements
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND (
        announcements.target_type = 'all'
        OR auth.uid() = ANY(announcements.target_worker_ids)
      )
    )
  );

-- RLS Policies for announcement_responses
-- Workers can create their own responses
CREATE POLICY "Workers can create responses" ON announcement_responses
  FOR INSERT
  TO authenticated
  WITH CHECK (
    worker_id = auth.uid()
  );

-- Admins can view all responses
CREATE POLICY "Admins can view all responses" ON announcement_responses
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Workers can view their own responses
CREATE POLICY "Workers can view their responses" ON announcement_responses
  FOR SELECT
  TO authenticated
  USING (worker_id = auth.uid());
