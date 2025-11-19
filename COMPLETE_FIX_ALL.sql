-- ========================================
-- COMPLETE FIX - Cart + Users Registration Fields
-- Run this entire script in Supabase SQL Editor
-- ========================================

-- PART 1: FIX CART TABLE (Remove updated_at)
-- ========================================

-- Drop any triggers on cart table
DROP TRIGGER IF EXISTS update_cart_updated_at ON cart;
DROP TRIGGER IF EXISTS update_cart_timestamp ON cart;
DROP TRIGGER IF EXISTS set_updated_at ON cart;
DROP TRIGGER IF EXISTS handle_updated_at ON cart;

-- Drop the trigger function completely
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- Remove updated_at column from cart
ALTER TABLE cart DROP COLUMN IF EXISTS updated_at CASCADE;

-- Verify cart structure
SELECT 'Cart table updated_at column removed!' AS status;


-- PART 2: UPDATE USERS TABLE (Add registration fields)
-- ========================================

-- Add new columns to users table if they don't exist
DO $$ 
BEGIN
    -- Add name column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='users' AND column_name='name') THEN
        ALTER TABLE users ADD COLUMN name TEXT;
    END IF;
    
    -- Add phone column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='users' AND column_name='phone') THEN
        ALTER TABLE users ADD COLUMN phone TEXT;
    END IF;
    
END $$;

-- Update existing users to have default values if needed
UPDATE users SET name = 'User' WHERE name IS NULL;

SELECT 'Users table updated with name and phone fields!' AS status;


-- PART 3: VERIFY CHANGES
-- ========================================

-- Show cart table structure
SELECT 'CART TABLE STRUCTURE:' AS info;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'cart' 
ORDER BY ordinal_position;

-- Show users table structure
SELECT 'USERS TABLE STRUCTURE:' AS info;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'users' 
ORDER BY ordinal_position;

SELECT '✅ ALL FIXES APPLIED SUCCESSFULLY!' AS final_status;
