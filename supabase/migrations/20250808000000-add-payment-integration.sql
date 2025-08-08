-- Add payment-related columns to the orders table for WOMPI integration
ALTER TABLE public.orders 
ADD COLUMN payment_method text DEFAULT 'cash' CHECK (payment_method = ANY (ARRAY['cash'::text, 'card'::text])),
ADD COLUMN payment_status text DEFAULT 'pending' CHECK (payment_status = ANY (ARRAY['pending'::text, 'approved'::text, 'declined'::text, 'expired'::text, 'cancelled'::text])),
ADD COLUMN payment_reference text,
ADD COLUMN payment_transaction_id text,
ADD COLUMN wompi_payment_link_id text,
ADD COLUMN delivery_type text DEFAULT 'pickup' CHECK (delivery_type = ANY (ARRAY['pickup'::text, 'delivery'::text])),
ADD COLUMN delivery_point text,
ADD COLUMN delivery_department text,
ADD COLUMN delivery_municipality text,
ADD COLUMN delivery_address text,
ADD COLUMN delivery_reference_point text,
ADD COLUMN delivery_map_location text;

-- Create index for faster payment reference lookups
CREATE INDEX idx_orders_payment_reference ON public.orders(payment_reference);
CREATE INDEX idx_orders_payment_transaction_id ON public.orders(payment_transaction_id);
CREATE INDEX idx_orders_payment_status ON public.orders(payment_status);

-- Update the status constraint to include more order statuses
ALTER TABLE public.orders DROP CONSTRAINT orders_status_check;
ALTER TABLE public.orders ADD CONSTRAINT orders_status_check 
CHECK (status = ANY (ARRAY['pending'::text, 'processing'::text, 'confirmed'::text, 'shipped'::text, 'delivered'::text, 'cancelled'::text, 'refunded'::text]));

-- Create a payments table for detailed payment tracking
CREATE TABLE public.payments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL,
  payment_method text NOT NULL,
  payment_status text NOT NULL DEFAULT 'pending',
  payment_reference text,
  wompi_transaction_id text,
  wompi_payment_link_id text,
  amount_cents integer NOT NULL,
  currency text NOT NULL DEFAULT 'USD',
  payment_data jsonb,
  webhook_data jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  
  CONSTRAINT payments_pkey PRIMARY KEY (id),
  CONSTRAINT payments_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE,
  CONSTRAINT payments_payment_method_check CHECK (payment_method = ANY (ARRAY['cash'::text, 'card'::text, 'transfer'::text])),
  CONSTRAINT payments_payment_status_check CHECK (payment_status = ANY (ARRAY['pending'::text, 'approved'::text, 'declined'::text, 'expired'::text, 'cancelled'::text, 'refunded'::text]))
);

-- Create indexes for the payments table
CREATE INDEX idx_payments_order_id ON public.payments(order_id);
CREATE INDEX idx_payments_payment_reference ON public.payments(payment_reference);
CREATE INDEX idx_payments_wompi_transaction_id ON public.payments(wompi_transaction_id);
CREATE INDEX idx_payments_payment_status ON public.payments(payment_status);

-- Create a trigger to update the updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON public.payments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON public.orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
