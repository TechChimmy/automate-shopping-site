-- Promotions table SQL
-- Run this in your Supabase SQL Editor

CREATE TABLE IF NOT EXISTS promotions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  discount_percentage NUMERIC(5,2),
  discount_amount NUMERIC(10,2),
  code TEXT UNIQUE,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE promotions ENABLE ROW LEVEL SECURITY;

-- Promotions policies
CREATE POLICY "Everyone can view active promotions" ON promotions FOR SELECT USING (active = true);
CREATE POLICY "Admin can manage promotions" ON promotions FOR ALL USING (
  auth.uid() IN (SELECT id FROM users WHERE role = 'admin')
);
