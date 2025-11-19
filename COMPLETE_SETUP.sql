-- ========================================
-- ShopSuite E-Commerce Platform
-- Complete Database Setup Script
-- Run this entire script in Supabase SQL Editor
-- ========================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ========================================
-- 1. CART TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS cart (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES products ON DELETE CASCADE NOT NULL,
  qty INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  CONSTRAINT cart_user_product_unique UNIQUE (user_id, product_id)
);

ALTER TABLE cart ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own cart" ON cart;
DROP POLICY IF EXISTS "Users can add to their cart" ON cart;
DROP POLICY IF EXISTS "Users can update their cart" ON cart;
DROP POLICY IF EXISTS "Users can delete from their cart" ON cart;

-- Cart policies
CREATE POLICY "Users can view their own cart" ON cart FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can add to their cart" ON cart FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their cart" ON cart FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete from their cart" ON cart FOR DELETE USING (auth.uid() = user_id);

-- ========================================
-- 2. WISHLIST TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS wishlist (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES products ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  CONSTRAINT wishlist_user_product_unique UNIQUE (user_id, product_id)
);

ALTER TABLE wishlist ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own wishlist" ON wishlist;
DROP POLICY IF EXISTS "Users can insert to own wishlist" ON wishlist;
DROP POLICY IF EXISTS "Users can delete own wishlist" ON wishlist;

-- Wishlist policies
CREATE POLICY "Users can view own wishlist" ON wishlist FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert to own wishlist" ON wishlist FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own wishlist" ON wishlist FOR DELETE USING (auth.uid() = user_id);

-- ========================================
-- 3. ORDERS TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS orders (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES products ON DELETE CASCADE NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  total_price NUMERIC(10,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own orders" ON orders;
DROP POLICY IF EXISTS "Users can create own orders" ON orders;
DROP POLICY IF EXISTS "Users can update own orders" ON orders;
DROP POLICY IF EXISTS "Admin can view all orders" ON orders;
DROP POLICY IF EXISTS "Admin can update all orders" ON orders;

-- Orders policies
CREATE POLICY "Users can view own orders" ON orders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own orders" ON orders FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own orders" ON orders FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admin can view all orders" ON orders FOR SELECT USING (
  auth.uid() IN (SELECT id FROM users WHERE role = 'admin')
);
CREATE POLICY "Admin can update all orders" ON orders FOR UPDATE USING (
  auth.uid() IN (SELECT id FROM users WHERE role = 'admin')
);

-- ========================================
-- 4. PROMOTIONS TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS promotions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  discount_percentage NUMERIC(5,2),
  discount_amount NUMERIC(10,2),
  code TEXT UNIQUE,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE promotions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Everyone can view active promotions" ON promotions;
DROP POLICY IF EXISTS "Admin can manage promotions" ON promotions;

-- Promotions policies
CREATE POLICY "Everyone can view active promotions" ON promotions FOR SELECT USING (active = true);
CREATE POLICY "Admin can manage promotions" ON promotions FOR ALL USING (
  auth.uid() IN (SELECT id FROM users WHERE role = 'admin')
);

-- ========================================
-- 5. UPDATE EXISTING ADMIN USER
-- ========================================
-- Set admin@shop.com to admin role
UPDATE users 
SET role = 'admin' 
WHERE email = 'admin@shop.com';

-- ========================================
-- 6. CREATE TRIGGERS FOR updated_at
-- ========================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Cart trigger
DROP TRIGGER IF EXISTS update_cart_updated_at ON cart;
CREATE TRIGGER update_cart_updated_at BEFORE UPDATE ON cart
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Orders trigger
DROP TRIGGER IF EXISTS update_orders_updated_at ON orders;
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Promotions trigger
DROP TRIGGER IF EXISTS update_promotions_updated_at ON promotions;
CREATE TRIGGER update_promotions_updated_at BEFORE UPDATE ON promotions
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- SETUP COMPLETE!
-- ========================================
SELECT 'Database setup completed successfully!' AS message;
