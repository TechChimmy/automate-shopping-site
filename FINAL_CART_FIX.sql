-- ========================================
-- FINAL CART FIX - Remove all updated_at triggers and column
-- Run this in Supabase SQL Editor
-- ========================================

-- 1. Drop any triggers on cart table
DROP TRIGGER IF EXISTS update_cart_updated_at ON cart;
DROP TRIGGER IF EXISTS update_cart_timestamp ON cart;
DROP TRIGGER IF EXISTS set_updated_at ON cart;

-- 2. Drop the function if it exists
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- 3. Remove updated_at column from cart table
ALTER TABLE cart DROP COLUMN IF EXISTS updated_at CASCADE;

-- 4. Verify cart table structure (should only have: id, user_id, product_id, qty, created_at)
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'cart' 
ORDER BY ordinal_position;

SELECT 'Cart table fixed! updated_at column and all triggers removed.' AS message;
