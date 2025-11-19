-- Create saved_cards table
CREATE TABLE IF NOT EXISTS saved_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  card_type VARCHAR(20) NOT NULL,
  card_last4 VARCHAR(4) NOT NULL,
  card_holder VARCHAR(100) NOT NULL,
  expiry_month VARCHAR(2) NOT NULL,
  expiry_year VARCHAR(2) NOT NULL,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE saved_cards ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own cards" ON saved_cards FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own cards" ON saved_cards FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own cards" ON saved_cards FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own cards" ON saved_cards FOR DELETE USING (auth.uid() = user_id);

SELECT 'Saved cards table created successfully!' AS message;