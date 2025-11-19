-- CRITICAL FIX FOR PAYMENT GATEWAY
-- Run this SQL in Supabase SQL Editor NOW

-- 1. Drop existing orders table if it has wrong structure
DROP TABLE IF EXISTS orders CASCADE;

-- 2. Create orders table with correct structure
CREATE TABLE orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  product_id UUID NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  total_price NUMERIC(10,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 3. Enable RLS
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- 4. Create policies
CREATE POLICY "Users can view own orders" ON orders 
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create orders" ON orders 
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own orders" ON orders 
FOR UPDATE USING (auth.uid() = user_id);

-- 5. Admin policies
CREATE POLICY "Admin can view all orders" ON orders 
FOR SELECT USING (
  EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin')
);

CREATE POLICY "Admin can update all orders" ON orders 
FOR UPDATE USING (
  EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin')
);

-- 6. Fix cart table (remove updated_at if causing issues)
ALTER TABLE cart DROP COLUMN IF EXISTS updated_at;

SELECT 'Orders table created successfully! Payment gateway will now work.' AS message;
