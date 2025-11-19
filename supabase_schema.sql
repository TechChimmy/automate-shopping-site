-- E-Commerce Platform Database Schema
-- Run this in Supabase SQL Editor

-- Cart table
CREATE TABLE IF NOT EXISTS cart (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

-- Wishlist table
CREATE TABLE IF NOT EXISTS wishlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

-- Promotions table
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

-- Payment cards table (for demo cards)
CREATE TABLE IF NOT EXISTS payment_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  card_type TEXT NOT NULL, -- VISA, Mastercard, Rupay
  card_number TEXT NOT NULL,
  card_holder TEXT NOT NULL,
  expiry_date TEXT NOT NULL,
  cvv TEXT NOT NULL,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE cart ENABLE ROW LEVEL SECURITY;
ALTER TABLE wishlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE promotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_cards ENABLE ROW LEVEL SECURITY;

-- Cart policies
CREATE POLICY "Users can view own cart" ON cart FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert to own cart" ON cart FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own cart" ON cart FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own cart" ON cart FOR DELETE USING (auth.uid() = user_id);

-- Wishlist policies
CREATE POLICY "Users can view own wishlist" ON wishlist FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert to own wishlist" ON wishlist FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own wishlist" ON wishlist FOR DELETE USING (auth.uid() = user_id);

-- Promotions policies (admin only for write, everyone can read active ones)
CREATE POLICY "Everyone can view active promotions" ON promotions FOR SELECT USING (active = true OR auth.uid() IN (SELECT id FROM users WHERE role = 'admin'));
CREATE POLICY "Admin can manage promotions" ON promotions FOR ALL USING (auth.uid() IN (SELECT id FROM users WHERE role = 'admin'));

-- Payment cards policies
CREATE POLICY "Users can view own cards" ON payment_cards FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own cards" ON payment_cards FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own cards" ON payment_cards FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own cards" ON payment_cards FOR DELETE USING (auth.uid() = user_id);

-- Insert demo payment cards for testing
INSERT INTO payment_cards (user_id, card_type, card_number, card_holder, expiry_date, cvv) VALUES
((SELECT id FROM users LIMIT 1), 'VISA', '4111111111111111', 'John Doe', '12/25', '123'),
((SELECT id FROM users LIMIT 1), 'VISA', '4532015112830366', 'Jane Smith', '06/26', '456'),
((SELECT id FROM users LIMIT 1), 'Mastercard', '5425233430109903', 'Bob Johnson', '09/25', '789'),
((SELECT id FROM users LIMIT 1), 'Mastercard', '2221000010000015', 'Alice Williams', '03/27', '321'),
((SELECT id FROM users LIMIT 1), 'Rupay', '6073849700004947', 'Charlie Brown', '11/26', '654')
ON CONFLICT DO NOTHING;
