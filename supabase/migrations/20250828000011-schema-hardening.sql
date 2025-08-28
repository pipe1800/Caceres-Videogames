-- Schema hardening & performance migration
-- Date: 2025-08-28

-- 1. Ensure pg_trgm for better ILIKE / fuzzy search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 2. Categories: ensure slug present & not null; generate missing slugs
UPDATE public.categories
SET slug = lower(regexp_replace(name,'[^a-z0-9]+','-','g'))
WHERE slug IS NULL;

ALTER TABLE public.categories
  ALTER COLUMN slug SET NOT NULL;

-- 3. Add helpful indexes (if not already created in earlier migrations)
CREATE INDEX IF NOT EXISTS idx_categories_parent_sort ON public.categories(parent_id, sort_order, name);
CREATE INDEX IF NOT EXISTS idx_products_created_at ON public.products(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_product_categories_category_id ON public.product_categories(category_id);
CREATE INDEX IF NOT EXISTS idx_product_categories_product_id ON public.product_categories(product_id);
CREATE INDEX IF NOT EXISTS idx_products_name_trgm ON public.products USING gin (name gin_trgm_ops);

-- 4. product_categories: add created_at timestamp (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='product_categories' AND column_name='created_at'
  ) THEN
    ALTER TABLE public.product_categories ADD COLUMN created_at timestamptz NOT NULL DEFAULT now();
  END IF;
END$$;

-- 5. Products array defaults (guard existence & type)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='image_urls') THEN
    EXECUTE 'ALTER TABLE public.products ALTER COLUMN image_urls SET DEFAULT ARRAY[]::text[]';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='features') THEN
    EXECUTE 'ALTER TABLE public.products ALTER COLUMN features SET DEFAULT ARRAY[]::text[]';
  END IF;
END$$;

-- 6. Auto-updated updated_at triggers
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_products_updated_at'
  ) THEN
    CREATE TRIGGER trg_products_updated_at BEFORE UPDATE ON public.products
      FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_categories_updated_at'
  ) THEN
    -- Add updated_at column if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='categories' AND column_name='updated_at') THEN
      ALTER TABLE public.categories ADD COLUMN updated_at timestamptz DEFAULT now();
    END IF;
    CREATE TRIGGER trg_categories_updated_at BEFORE UPDATE ON public.categories
      FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  END IF;
END$$;

-- 7. Slug auto-generation trigger (if slug omitted)
CREATE OR REPLACE FUNCTION public.ensure_category_slug()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.slug IS NULL OR length(trim(NEW.slug)) = 0 THEN
    NEW.slug = lower(regexp_replace(NEW.name,'[^a-z0-9]+','-','g'));
  END IF;
  RETURN NEW;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='trg_categories_slug') THEN
    CREATE TRIGGER trg_categories_slug BEFORE INSERT OR UPDATE ON public.categories
      FOR EACH ROW EXECUTE FUNCTION public.ensure_category_slug();
  END IF;
END$$;

-- 8. Diagnostics to help debugging missing subcategories
RAISE NOTICE 'Root categories count: %', (SELECT count(*) FROM public.categories WHERE parent_id IS NULL);
RAISE NOTICE 'Child categories count: %', (SELECT count(*) FROM public.categories WHERE parent_id IS NOT NULL);
RAISE NOTICE 'Example parent with children: %', (SELECT name FROM public.categories WHERE id IN (SELECT parent_id FROM public.categories WHERE parent_id IS NOT NULL LIMIT 1));
RAISE NOTICE 'Products count: %', (SELECT count(*) FROM public.products);
RAISE NOTICE 'Product/category links: %', (SELECT count(*) FROM public.product_categories);
