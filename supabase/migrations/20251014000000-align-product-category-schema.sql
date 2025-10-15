BEGIN;

-- Step 1: ensure columns exist on products
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS category_id uuid,
  ADD COLUMN IF NOT EXISTS parent_category_id uuid;

-- Step 2: trigger to keep parent category aligned automatically
CREATE OR REPLACE FUNCTION public.set_product_category_hierarchy()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  parent uuid;
BEGIN
  IF NEW.category_id IS NULL THEN
    NEW.parent_category_id := NULL;
    RETURN NEW;
  END IF;

  SELECT parent_id INTO parent
  FROM public.categories
  WHERE id = NEW.category_id;

  IF parent IS NULL THEN
    NEW.parent_category_id := NEW.category_id;
  ELSE
    NEW.parent_category_id := parent;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_products_category_parent ON public.products;

CREATE TRIGGER trg_products_category_parent
BEFORE INSERT OR UPDATE ON public.products
FOR EACH ROW
EXECUTE FUNCTION public.set_product_category_hierarchy();

-- Step 3: backfill category assignments from legacy product_categories table
WITH primary_category AS (
  SELECT DISTINCT ON (pc.product_id)
    pc.product_id,
    pc.category_id
  FROM public.product_categories pc
  LEFT JOIN public.categories c ON c.id = pc.category_id
  ORDER BY pc.product_id, pc.created_at DESC NULLS LAST, c.parent_id NULLS LAST, c.sort_order NULLS LAST, c.name
)
UPDATE public.products p
SET category_id = primary_category.category_id
FROM primary_category
WHERE p.id = primary_category.product_id
  AND p.category_id IS DISTINCT FROM primary_category.category_id;

-- Step 4: ensure we have an "Uncategorized" fallback and assign any missing products
DO $$
DECLARE
  fallback_id uuid;
BEGIN
  SELECT id INTO fallback_id FROM public.categories WHERE slug = 'uncategorized' LIMIT 1;
  IF fallback_id IS NULL THEN
    INSERT INTO public.categories (name, slug, parent_id, sort_order, is_active)
    VALUES ('Uncategorized', 'uncategorized', NULL, 9999, TRUE)
    RETURNING id INTO fallback_id;
  END IF;

  UPDATE public.products
  SET category_id = fallback_id
  WHERE category_id IS NULL;
END
$$;

-- Step 5: enforce not-null and foreign keys
ALTER TABLE public.products
  ALTER COLUMN category_id SET NOT NULL,
  ALTER COLUMN parent_category_id SET NOT NULL;

ALTER TABLE public.products
  ADD CONSTRAINT products_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id) ON DELETE RESTRICT,
  ADD CONSTRAINT products_parent_category_id_fkey FOREIGN KEY (parent_category_id) REFERENCES public.categories(id) ON DELETE RESTRICT;

CREATE INDEX IF NOT EXISTS idx_products_category_id ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_parent_category_id ON public.products(parent_category_id);

-- Step 6: retire legacy product_categories table and policies
DROP POLICY IF EXISTS "Admins can manage product_categories" ON public.product_categories;
DROP POLICY IF EXISTS "Anyone can view product_categories" ON public.product_categories;

DROP TABLE IF EXISTS public.product_categories;

COMMIT;
