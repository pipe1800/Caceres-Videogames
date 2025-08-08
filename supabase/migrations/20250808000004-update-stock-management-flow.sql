-- Update triggers for proper stock management flow
-- This migration updates the stock management to work with payment confirmation flow

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS update_stock_on_order_create ON public.orders;
DROP TRIGGER IF EXISTS restore_stock_on_order_cancel ON public.orders;
DROP TRIGGER IF EXISTS update_stock_on_order_status_change ON public.orders;
DROP TRIGGER IF EXISTS update_stock_on_payment_confirmation ON public.orders;
DROP FUNCTION IF EXISTS update_product_stock();
DROP FUNCTION IF EXISTS restore_product_stock();
DROP FUNCTION IF EXISTS update_product_stock_on_status_change();
DROP FUNCTION IF EXISTS update_product_stock_on_payment_confirmation();

-- Create a function to update product stock when order status changes
CREATE OR REPLACE FUNCTION update_product_stock_on_status_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Only process stock changes for specific status transitions
  -- For cash orders: reduce stock when status changes to 'completed'
  -- For card orders: this will be handled by payment confirmation
  IF NEW.status = 'completed' AND OLD.status != 'completed' AND NEW.payment_method = 'cash' THEN
    -- Decrease stock count
    UPDATE public.products
    SET 
      stock_count = stock_count - NEW.quantity,
      in_stock = CASE 
        WHEN stock_count - NEW.quantity <= 0 THEN false 
        ELSE true 
      END,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = NEW.product_id;
    
    -- Check if stock would go negative
    IF (SELECT stock_count FROM public.products WHERE id = NEW.product_id) < 0 THEN
      RAISE EXCEPTION 'Insufficient stock for product';
    END IF;
  END IF;
  
  -- Restore stock when order is cancelled (for both payment methods)
  IF NEW.status = 'cancelled' AND OLD.status != 'cancelled' THEN
    UPDATE public.products
    SET 
      stock_count = stock_count + NEW.quantity,
      in_stock = true,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = NEW.product_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for order status changes
CREATE TRIGGER update_stock_on_order_status_change
AFTER UPDATE ON public.orders
FOR EACH ROW
EXECUTE FUNCTION update_product_stock_on_status_change();

-- Create a function to reduce stock when payment is confirmed
CREATE OR REPLACE FUNCTION update_product_stock_on_payment_confirmation()
RETURNS TRIGGER AS $$
BEGIN
  -- Only process when payment status changes to 'approved' for card payments
  IF NEW.payment_status = 'approved' AND OLD.payment_status != 'approved' AND NEW.payment_method IN ('credit-debit', 'card') THEN
    -- Decrease stock count
    UPDATE public.products
    SET 
      stock_count = stock_count - NEW.quantity,
      in_stock = CASE 
        WHEN stock_count - NEW.quantity <= 0 THEN false 
        ELSE true 
      END,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = NEW.product_id;
    
    -- Check if stock would go negative
    IF (SELECT stock_count FROM public.products WHERE id = NEW.product_id) < 0 THEN
      RAISE EXCEPTION 'Insufficient stock for product';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for payment confirmation
CREATE TRIGGER update_stock_on_payment_confirmation
AFTER UPDATE ON public.orders
FOR EACH ROW
EXECUTE FUNCTION update_product_stock_on_payment_confirmation();
