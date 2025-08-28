-- Migration: Drop legacy category columns from products
-- Created at: 2025-08-28
-- Preconditions: Ensure product_categories backfill migration executed and validated.

DO $$
DECLARE
  legacy_pairs int;
  join_pairs int;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='products' AND column_name='category')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='products' AND column_name='categories') THEN
    RAISE NOTICE 'Legacy category columns already removed.';
    RETURN;
  END IF;

  -- Simple diagnostic counts (approximate)
  SELECT count(*) INTO legacy_pairs FROM products WHERE coalesce(category,'') <> '';
  SELECT count(*) INTO join_pairs FROM product_categories;
  RAISE NOTICE 'Legacy single category rows: %', legacy_pairs;
  RAISE NOTICE 'Join table pairs: %', join_pairs;

  -- Drop dependent default if any (safety, ignore errors)
  BEGIN
    ALTER TABLE products ALTER COLUMN category DROP DEFAULT;
  EXCEPTION WHEN undefined_column THEN
    -- ignore
  END;

  -- Drop columns if exist
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='products' AND column_name='categories') THEN
    EXECUTE 'ALTER TABLE products DROP COLUMN categories';
    RAISE NOTICE 'Dropped products.categories array column';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='products' AND column_name='category') THEN
    EXECUTE 'ALTER TABLE products DROP COLUMN category';
    RAISE NOTICE 'Dropped products.category column';
  END IF;
END$$;
