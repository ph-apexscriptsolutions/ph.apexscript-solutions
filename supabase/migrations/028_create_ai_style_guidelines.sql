-- Create ai_style_guidelines table for Admin AI Knowledge Base
CREATE TABLE IF NOT EXISTS public.ai_style_guidelines (
  id BIGSERIAL PRIMARY KEY,
  category TEXT NOT NULL DEFAULT 'General', -- e.g., 'Speaker Labels', 'Timestamps', 'Numbers & Currency', 'Punctuation', 'Department Guide'
  department TEXT NOT NULL DEFAULT 'all',    -- 'all', 'conference', 'senate', 'broadcast', 'podcast', 'academics', 'medical'
  title TEXT NOT NULL,                      -- Short rule summary e.g., 'Interrupted speech in Senate'
  rule_content TEXT NOT NULL,               -- Full explanation of the rule
  examples TEXT,                            -- Example correct vs incorrect formatting
  created_by TEXT,                          -- Admin email or name
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast retrieval
CREATE INDEX IF NOT EXISTS idx_ai_style_guidelines_dept ON public.ai_style_guidelines(department);
CREATE INDEX IF NOT EXISTS idx_ai_style_guidelines_cat ON public.ai_style_guidelines(category);

-- Insert starting seed guidelines
INSERT INTO public.ai_style_guidelines (category, department, title, rule_content, examples)
VALUES
  ('Speaker Labels', 'all', 'Standard Speaker Label Format', 'All speaker names must be capitalized followed by a colon and a single space.', 'Correct: JOHN DOE: Good morning.\nIncorrect: John Doe: Good morning / JOHN DOE - Good morning'),
  ('Timestamps', 'all', 'Inaudible & Crosstalk Timecodes', 'When speech is unclear, use [inaudible HH:MM:SS] or [crosstalk HH:MM:SS] with brackets and exact time.', 'Correct: We plan to [inaudible 00:14:22] next year.\nIncorrect: (inaudible 14:22) or [unclear]'),
  ('Numbers & Currency', 'all', 'Standard Numbers Rule', 'Spell out numbers zero through nine. Use numerals for 10 and above. Always use currency symbols with numerals.', 'Correct: We have four offices and 15 team members, spending $500.\nIncorrect: We have 4 offices and fifteen team members.'),
  ('Punctuation', 'all', 'False Starts & Self-Interruptions', 'Use an em-dash (—) without surrounding spaces when a speaker breaks off or interrupts themselves.', 'Correct: I thought that— well, I am not sure.\nIncorrect: I thought that -- well, I am not sure.'),
  ('Department Guide', 'senate', 'Congressional / Senate Titles', 'Always capitalize formal committee titles (Chairman, Senator, Representative, Ranking Member) when addressing members.', 'Correct: SENATOR SMITH: Thank you, Mr. Chairman.\nIncorrect: senator smith: thank you mr chairman')
ON CONFLICT DO NOTHING;
