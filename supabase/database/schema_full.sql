

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE SCHEMA IF NOT EXISTS "public";


ALTER SCHEMA "public" OWNER TO "pg_database_owner";


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE OR REPLACE FUNCTION "public"."ensure_category_slug"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  IF NEW.slug IS NULL OR length(trim(NEW.slug)) = 0 THEN
    NEW.slug = lower(regexp_replace(NEW.name,'[^a-z0-9]+','-','g'));
  END IF;
  RETURN NEW;
END$$;


ALTER FUNCTION "public"."ensure_category_slug"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_order_by_reference"("ref" "text") RETURNS TABLE("id" "uuid", "customer_name" "text", "customer_email" "text", "customer_phone" "text", "customer_address" "text", "total_amount" numeric, "payment_status" "text", "status" "text", "payment_reference" "text", "payment_transaction_id" "text", "wompi_reference" "text", "wompi_transaction_id" "text", "created_at" timestamp with time zone, "updated_at" timestamp with time zone)
    LANGUAGE "plpgsql"
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


ALTER FUNCTION "public"."get_order_by_reference"("ref" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."increment_product_likes"("p_id" "uuid") RETURNS integer
    LANGUAGE "sql" SECURITY DEFINER
    AS $$
  update public.products
    set likes_count = likes_count + 1,
        updated_at = now()
  where id = p_id
  returning likes_count;
$$;


ALTER FUNCTION "public"."increment_product_likes"("p_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."restore_product_stock"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  -- Only restore stock if status changed from non-cancelled to cancelled
  IF OLD.status != 'cancelled' AND NEW.status = 'cancelled' THEN
    UPDATE public.products
    SET 
      stock_count = stock_count + NEW.quantity,
      in_stock = true,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = NEW.product_id;
  END IF;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."restore_product_stock"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END$$;


ALTER FUNCTION "public"."set_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_order_payment_status"("order_id" "uuid", "new_status" "text", "transaction_id" "text") RETURNS "void"
    LANGUAGE "plpgsql"
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


ALTER FUNCTION "public"."update_order_payment_status"("order_id" "uuid", "new_status" "text", "transaction_id" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_product_stock_on_payment_confirmation"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
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
$$;


ALTER FUNCTION "public"."update_product_stock_on_payment_confirmation"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_product_stock_on_status_change"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
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
$$;


ALTER FUNCTION "public"."update_product_stock_on_status_change"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."admin_users" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "email" "text" NOT NULL,
    "password_hash" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."admin_users" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."categories" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "slug" "text" NOT NULL,
    "parent_id" "uuid",
    "sort_order" integer DEFAULT 0,
    "is_active" boolean DEFAULT true,
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."categories" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."orders" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "customer_name" "text" NOT NULL,
    "customer_email" "text" NOT NULL,
    "customer_phone" "text",
    "customer_address" "text",
    "product_id" "uuid" NOT NULL,
    "quantity" integer DEFAULT 1 NOT NULL,
    "total_amount" numeric(10,2) NOT NULL,
    "status" "text" DEFAULT 'pendiente'::"text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "payment_method" "text" DEFAULT 'pending'::"text",
    "payment_status" "text" DEFAULT 'pending'::"text",
    "wompi_transaction_id" "text",
    "wompi_payment_link_id" "text",
    "wompi_reference" "text",
    "payment_reference" "text",
    "payment_transaction_id" "text",
    CONSTRAINT "orders_payment_method_check" CHECK (("payment_method" = ANY (ARRAY['credit-debit'::"text", 'cash'::"text", 'bank-transfer'::"text", 'pending'::"text"]))),
    CONSTRAINT "orders_payment_status_check" CHECK (("payment_status" = ANY (ARRAY['pending'::"text", 'processing'::"text", 'completed'::"text", 'failed'::"text", 'refunded'::"text", 'approved'::"text", 'declined'::"text", 'expired'::"text", 'cancelled'::"text"]))),
    CONSTRAINT "orders_status_check" CHECK (("status" = ANY (ARRAY['pendiente'::"text", 'enviada'::"text", 'completada'::"text", 'cancelada'::"text"])))
);


ALTER TABLE "public"."orders" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."payments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "order_id" "uuid" NOT NULL,
    "amount" numeric NOT NULL,
    "currency" "text" DEFAULT 'USD'::"text",
    "payment_method" "text" NOT NULL,
    "processor" "text" DEFAULT 'wompi'::"text",
    "processor_transaction_id" "text",
    "processor_reference" "text",
    "processor_payment_link" "text",
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "processor_response" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "payments_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'processing'::"text", 'approved'::"text", 'declined'::"text", 'voided'::"text", 'error'::"text"])))
);


ALTER TABLE "public"."payments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."product_categories" (
    "product_id" "uuid" NOT NULL,
    "category_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."product_categories" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."products" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "sku" "text" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "price" numeric(10,2) NOT NULL,
    "original_price" numeric(10,2),
    "console" "text" NOT NULL,
    "is_new" boolean DEFAULT false,
    "is_on_sale" boolean DEFAULT false,
    "rating" numeric(2,1) DEFAULT 0,
    "review_count" integer DEFAULT 0,
    "features" "text"[] DEFAULT ARRAY[]::"text"[],
    "in_stock" boolean DEFAULT true,
    "stock_count" integer DEFAULT 0,
    "image_urls" "text"[] DEFAULT ARRAY[]::"text"[],
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "likes_count" integer DEFAULT 0 NOT NULL
);


ALTER TABLE "public"."products" OWNER TO "postgres";


COMMENT ON COLUMN "public"."products"."likes_count" IS 'Number of likes/favorites for the product';



ALTER TABLE ONLY "public"."admin_users"
    ADD CONSTRAINT "admin_users_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."admin_users"
    ADD CONSTRAINT "admin_users_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."categories"
    ADD CONSTRAINT "categories_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."categories"
    ADD CONSTRAINT "categories_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."categories"
    ADD CONSTRAINT "categories_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."orders"
    ADD CONSTRAINT "orders_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."orders"
    ADD CONSTRAINT "orders_wompi_reference_key" UNIQUE ("wompi_reference");



ALTER TABLE ONLY "public"."payments"
    ADD CONSTRAINT "payments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."product_categories"
    ADD CONSTRAINT "product_categories_pkey" PRIMARY KEY ("product_id", "category_id");



ALTER TABLE ONLY "public"."products"
    ADD CONSTRAINT "products_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."products"
    ADD CONSTRAINT "products_sku_key" UNIQUE ("sku");



CREATE INDEX "categories_parent_id_idx" ON "public"."categories" USING "btree" ("parent_id");



CREATE INDEX "idx_categories_parent_sort" ON "public"."categories" USING "btree" ("parent_id", "sort_order", "name");



CREATE INDEX "idx_orders_payment_reference" ON "public"."orders" USING "btree" ("payment_reference");



CREATE INDEX "idx_orders_payment_status" ON "public"."orders" USING "btree" ("payment_status");



CREATE INDEX "idx_orders_wompi_reference" ON "public"."orders" USING "btree" ("wompi_reference");



CREATE INDEX "idx_payments_order_id" ON "public"."payments" USING "btree" ("order_id");



CREATE INDEX "idx_payments_processor_transaction_id" ON "public"."payments" USING "btree" ("processor_transaction_id");



CREATE INDEX "idx_product_categories_category_id" ON "public"."product_categories" USING "btree" ("category_id");



CREATE INDEX "idx_product_categories_product_id" ON "public"."product_categories" USING "btree" ("product_id");



CREATE INDEX "idx_products_created_at" ON "public"."products" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_products_name_trgm" ON "public"."products" USING "gin" ("name" "public"."gin_trgm_ops");



CREATE OR REPLACE TRIGGER "restore_stock_on_order_cancel" AFTER UPDATE ON "public"."orders" FOR EACH ROW EXECUTE FUNCTION "public"."restore_product_stock"();



CREATE OR REPLACE TRIGGER "trg_categories_slug" BEFORE INSERT OR UPDATE ON "public"."categories" FOR EACH ROW EXECUTE FUNCTION "public"."ensure_category_slug"();



CREATE OR REPLACE TRIGGER "trg_categories_updated_at" BEFORE UPDATE ON "public"."categories" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_products_updated_at" BEFORE UPDATE ON "public"."products" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "update_orders_updated_at" BEFORE UPDATE ON "public"."orders" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_payments_updated_at" BEFORE UPDATE ON "public"."payments" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_stock_on_order_status_change" AFTER UPDATE ON "public"."orders" FOR EACH ROW EXECUTE FUNCTION "public"."update_product_stock_on_status_change"();



CREATE OR REPLACE TRIGGER "update_stock_on_payment_confirmation" AFTER UPDATE ON "public"."orders" FOR EACH ROW EXECUTE FUNCTION "public"."update_product_stock_on_payment_confirmation"();



ALTER TABLE ONLY "public"."categories"
    ADD CONSTRAINT "categories_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "public"."categories"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."orders"
    ADD CONSTRAINT "orders_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id");



ALTER TABLE ONLY "public"."payments"
    ADD CONSTRAINT "payments_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."product_categories"
    ADD CONSTRAINT "product_categories_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."product_categories"
    ADD CONSTRAINT "product_categories_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE CASCADE;



CREATE POLICY "Admins can manage categories" ON "public"."categories" USING (true);



CREATE POLICY "Admins can manage everything" ON "public"."products" USING (true);



CREATE POLICY "Admins can manage orders" ON "public"."orders" USING (true);



CREATE POLICY "Admins can manage product_categories" ON "public"."product_categories" USING (true);



CREATE POLICY "Admins can view admin_users" ON "public"."admin_users" FOR SELECT USING (true);



CREATE POLICY "Anyone can create orders" ON "public"."orders" FOR INSERT TO "authenticated", "anon" WITH CHECK (true);



CREATE POLICY "Anyone can create payments" ON "public"."payments" FOR INSERT TO "authenticated", "anon" WITH CHECK (true);



CREATE POLICY "Anyone can update orders" ON "public"."orders" FOR UPDATE TO "authenticated", "anon" USING (true);



CREATE POLICY "Anyone can update payments" ON "public"."payments" FOR UPDATE TO "authenticated", "anon" USING (true);



CREATE POLICY "Anyone can view categories" ON "public"."categories" FOR SELECT USING (true);



CREATE POLICY "Anyone can view orders" ON "public"."orders" FOR SELECT TO "authenticated", "anon" USING (true);



CREATE POLICY "Anyone can view payments" ON "public"."payments" FOR SELECT TO "authenticated", "anon" USING (true);



CREATE POLICY "Anyone can view product_categories" ON "public"."product_categories" FOR SELECT USING (true);



CREATE POLICY "Anyone can view products" ON "public"."products" FOR SELECT USING (true);



ALTER TABLE "public"."admin_users" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."categories" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."orders" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."payments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."product_categories" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."products" ENABLE ROW LEVEL SECURITY;


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



GRANT ALL ON FUNCTION "public"."ensure_category_slug"() TO "anon";
GRANT ALL ON FUNCTION "public"."ensure_category_slug"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."ensure_category_slug"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_order_by_reference"("ref" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_order_by_reference"("ref" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_order_by_reference"("ref" "text") TO "service_role";



REVOKE ALL ON FUNCTION "public"."increment_product_likes"("p_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."increment_product_likes"("p_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."increment_product_likes"("p_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."increment_product_likes"("p_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."restore_product_stock"() TO "anon";
GRANT ALL ON FUNCTION "public"."restore_product_stock"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."restore_product_stock"() TO "service_role";



GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_order_payment_status"("order_id" "uuid", "new_status" "text", "transaction_id" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."update_order_payment_status"("order_id" "uuid", "new_status" "text", "transaction_id" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_order_payment_status"("order_id" "uuid", "new_status" "text", "transaction_id" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."update_product_stock_on_payment_confirmation"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_product_stock_on_payment_confirmation"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_product_stock_on_payment_confirmation"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_product_stock_on_status_change"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_product_stock_on_status_change"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_product_stock_on_status_change"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";



GRANT ALL ON TABLE "public"."admin_users" TO "anon";
GRANT ALL ON TABLE "public"."admin_users" TO "authenticated";
GRANT ALL ON TABLE "public"."admin_users" TO "service_role";



GRANT ALL ON TABLE "public"."categories" TO "anon";
GRANT ALL ON TABLE "public"."categories" TO "authenticated";
GRANT ALL ON TABLE "public"."categories" TO "service_role";



GRANT ALL ON TABLE "public"."orders" TO "anon";
GRANT ALL ON TABLE "public"."orders" TO "authenticated";
GRANT ALL ON TABLE "public"."orders" TO "service_role";



GRANT ALL ON TABLE "public"."payments" TO "anon";
GRANT ALL ON TABLE "public"."payments" TO "authenticated";
GRANT ALL ON TABLE "public"."payments" TO "service_role";



GRANT ALL ON TABLE "public"."product_categories" TO "anon";
GRANT ALL ON TABLE "public"."product_categories" TO "authenticated";
GRANT ALL ON TABLE "public"."product_categories" TO "service_role";



GRANT ALL ON TABLE "public"."products" TO "anon";
GRANT ALL ON TABLE "public"."products" TO "authenticated";
GRANT ALL ON TABLE "public"."products" TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "service_role";






RESET ALL;
