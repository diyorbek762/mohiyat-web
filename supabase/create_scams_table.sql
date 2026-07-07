CREATE TABLE IF NOT EXISTS scam_patterns (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  description text NOT NULL,
  real_example text NOT NULL,
  match_criteria text NOT NULL,
  severity text DEFAULT 'high',
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- Enable RLS
ALTER TABLE scam_patterns ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read active scams (for Watchlist)
CREATE POLICY "Allow public read access on active scams" 
  ON scam_patterns FOR SELECT 
  USING (is_active = true);

-- Allow authenticated admins to do everything (Service role has full access anyway)
CREATE POLICY "Allow authenticated full access" 
  ON scam_patterns FOR ALL 
  USING (auth.role() = 'authenticated');
