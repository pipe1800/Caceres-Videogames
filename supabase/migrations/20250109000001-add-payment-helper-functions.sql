-- Add helper functions for payment status management

-- Function to get order by reference (handles both payment_reference and wompi_reference)
CREATE OR REPLACE FUNCTION get_order_by_reference(ref text)
RETURNS TABLE (
  id uuid,
  customer_name text,
  customer_email text,
  customer_phone text,
  customer_address text,
  total_amount numeric,
  payment_status text,
  status text,
  payment_reference text,
  payment_transaction_id text,
  wompi_reference text,
  wompi_transaction_id text,
  created_at timestamptz,
  updated_at timestamptz
) 
LANGUAGE plpgsql
AS $$
BEGIN
  -- First try to find by payment_reference
  RETURN QUERY 
  SELECT o.id, o.customer_name, o.customer_email, o.customer_phone, o.customer_address, 
         o.total_amount, o.payment_status, o.status, o.payment_reference, o.payment_transaction_id,
         o.wompi_reference, o.wompi_transaction_id, o.created_at, o.updated_at
  FROM orders o 
  WHERE o.payment_reference = ref;
  
  -- If no results, try wompi_reference (if the column exists)
  IF NOT FOUND THEN
    BEGIN
      RETURN QUERY 
      SELECT o.id, o.customer_name, o.customer_email, o.customer_phone, o.customer_address, 
             o.total_amount, o.payment_status, o.status, o.payment_reference, o.payment_transaction_id,
             o.wompi_reference, o.wompi_transaction_id, o.created_at, o.updated_at
      FROM orders o 
      WHERE o.wompi_reference = ref;
    EXCEPTION WHEN undefined_column THEN
      -- wompi_reference column doesn't exist, that's OK
      NULL;
    END;
  END IF;
END;
$$;

-- Function to update order payment status
CREATE OR REPLACE FUNCTION update_order_payment_status(
  order_id uuid,
  new_status text,
  transaction_id text
)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  -- Update with payment_transaction_id if the column exists
  BEGIN
    UPDATE orders 
    SET payment_status = new_status, 
        payment_transaction_id = transaction_id,
        status = CASE WHEN new_status = 'completed' THEN 'confirmed' ELSE status END,
        updated_at = now()
    WHERE id = order_id;
  EXCEPTION WHEN undefined_column THEN
    -- If payment_transaction_id doesn't exist, try wompi_transaction_id
    BEGIN
      UPDATE orders 
      SET payment_status = new_status, 
          wompi_transaction_id = transaction_id,
          status = CASE WHEN new_status = 'completed' THEN 'confirmed' ELSE status END,
          updated_at = now()
      WHERE id = order_id;
    EXCEPTION WHEN undefined_column THEN
      -- If neither exists, just update status
      UPDATE orders 
      SET payment_status = new_status,
          status = CASE WHEN new_status = 'completed' THEN 'confirmed' ELSE status END,
          updated_at = now()
      WHERE id = order_id;
    END;
  END;
END;
$$;
