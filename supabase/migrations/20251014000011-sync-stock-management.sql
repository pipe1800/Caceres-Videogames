-- Align live database stock management with current schema snapshot.

-- Remove legacy triggers/functions so we can replace them safely.
DROP TRIGGER IF EXISTS update_stock_on_order_status_change ON public.orders;
DROP TRIGGER IF EXISTS update_stock_on_payment_confirmation ON public.orders;
DROP TRIGGER IF EXISTS restore_stock_on_order_cancel ON public.orders;
DROP TRIGGER IF EXISTS reserve_stock_on_order_insert ON public.orders;

DROP FUNCTION IF EXISTS public.update_product_stock_on_status_change();
DROP FUNCTION IF EXISTS public.update_product_stock_on_payment_confirmation();
DROP FUNCTION IF EXISTS public.reserve_product_stock_on_order_insert();
DROP FUNCTION IF EXISTS public.restore_product_stock();

-- Reserve stock immediately when an order is created so all payment methods decrease inventory.
CREATE OR REPLACE FUNCTION public.reserve_product_stock_on_order_insert()
RETURNS TRIGGER AS $$
DECLARE
  current_stock integer;
BEGIN
  IF NEW.quantity IS NULL OR NEW.quantity <= 0 THEN
    RAISE EXCEPTION 'Invalid quantity for product %', NEW.product_id;
  END IF;

  SELECT stock_count INTO current_stock
  FROM public.products
  WHERE id = NEW.product_id
  FOR UPDATE;

  IF current_stock IS NULL THEN
    RAISE EXCEPTION 'Product % not found', NEW.product_id;
  END IF;

  IF current_stock < NEW.quantity THEN
    RAISE EXCEPTION 'Insufficient stock for product %, available %, requested %',
      NEW.product_id, current_stock, NEW.quantity;
  END IF;

  UPDATE public.products
  SET 
    stock_count = current_stock - NEW.quantity,
    in_stock = CASE WHEN current_stock - NEW.quantity > 0 THEN true ELSE false END,
    updated_at = CURRENT_TIMESTAMP
  WHERE id = NEW.product_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Restore stock when an order is cancelled and re-reserve if it is reactivated.
CREATE OR REPLACE FUNCTION public.restore_product_stock()
RETURNS TRIGGER AS $$
DECLARE
  old_status text := lower(coalesce(OLD.status, ''));
  new_status text := lower(coalesce(NEW.status, ''));
  current_stock integer;
BEGIN
  IF old_status NOT IN ('cancelada', 'cancelled')
     AND new_status IN ('cancelada', 'cancelled') THEN
    UPDATE public.products
    SET 
      stock_count = stock_count + NEW.quantity,
      in_stock = CASE WHEN stock_count + NEW.quantity > 0 THEN true ELSE false END,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = NEW.product_id;
  ELSIF old_status IN ('cancelada', 'cancelled')
        AND new_status NOT IN ('cancelada', 'cancelled') THEN
    SELECT stock_count INTO current_stock
    FROM public.products
    WHERE id = NEW.product_id
    FOR UPDATE;

    IF current_stock IS NULL THEN
      RAISE EXCEPTION 'Product % not found', NEW.product_id;
    END IF;

    IF current_stock < NEW.quantity THEN
      RAISE EXCEPTION 'Insufficient stock to reactivate order for product %, available %, requested %',
        NEW.product_id, current_stock, NEW.quantity;
    END IF;

    UPDATE public.products
    SET 
      stock_count = current_stock - NEW.quantity,
      in_stock = CASE WHEN current_stock - NEW.quantity > 0 THEN true ELSE false END,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = NEW.product_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate triggers with the new helpers.
CREATE TRIGGER reserve_stock_on_order_insert
BEFORE INSERT ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.reserve_product_stock_on_order_insert();

CREATE TRIGGER restore_stock_on_order_cancel
AFTER UPDATE ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.restore_product_stock();

-- Ensure client roles can execute the helper functions.
GRANT ALL ON FUNCTION public.reserve_product_stock_on_order_insert() TO anon, authenticated, service_role;
GRANT ALL ON FUNCTION public.restore_product_stock() TO anon, authenticated, service_role;
