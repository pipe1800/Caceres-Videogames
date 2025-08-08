-- Fix RLS policies for payments table to allow anonymous users to create payment records

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can view payments" ON payments;
DROP POLICY IF EXISTS "Anyone can create payments" ON payments;
DROP POLICY IF EXISTS "Anyone can update payments" ON payments;

-- Create policies that allow anonymous users to interact with payments
-- This is needed for the checkout flow where users aren't authenticated

-- Allow anyone to create payment records (needed for checkout)
CREATE POLICY "Anyone can create payments" ON payments
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Allow anyone to view payment records (might be needed for order confirmation)
CREATE POLICY "Anyone can view payments" ON payments
FOR SELECT
TO anon, authenticated
USING (true);

-- Allow anyone to update payment records (might be needed for status updates)
CREATE POLICY "Anyone can update payments" ON payments
FOR UPDATE
TO anon, authenticated
USING (true);

-- Ensure RLS is enabled
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
