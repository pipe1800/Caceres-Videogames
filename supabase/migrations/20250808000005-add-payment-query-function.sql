-- Create a function to safely query payments by order_id
CREATE OR REPLACE FUNCTION get_payment_by_order_id(order_id UUID)
RETURNS TABLE (
  id UUID,
  amount NUMERIC,
  status TEXT,
  processor_transaction_id TEXT,
  processor_reference TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.amount,
    p.status,
    p.processor_transaction_id,
    p.processor_reference,
    p.created_at,
    p.updated_at
  FROM payments p
  WHERE p.order_id = get_payment_by_order_id.order_id
  LIMIT 1;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_payment_by_order_id(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_payment_by_order_id(UUID) TO anon;
