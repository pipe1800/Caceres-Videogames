-- Fix RLS policies for orders table to allow anonymous users to create and update orders

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can view orders" ON orders;
DROP POLICY IF EXISTS "Anyone can create orders" ON orders;
DROP POLICY IF EXISTS "Anyone can update orders" ON orders;

-- Create policies that allow anonymous users to interact with orders
-- This is needed for the checkout flow where users aren't authenticated

-- Allow anyone to create order records (needed for checkout)
CREATE POLICY "Anyone can create orders" ON orders
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Allow anyone to view order records (might be needed for order confirmation)
CREATE POLICY "Anyone can view orders" ON orders
FOR SELECT
TO anon, authenticated
USING (true);

-- Allow anyone to update order records (needed for payment status updates)
CREATE POLICY "Anyone can update orders" ON orders
FOR UPDATE
TO anon, authenticated
USING (true);

-- Ensure RLS is enabled
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
