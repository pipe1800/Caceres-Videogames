-- Add multi-categories support to products
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS categories TEXT[] DEFAULT '{}';

-- Backfill categories for existing rows using console and category
UPDATE public.products p
SET categories = sub.cats
FROM (
  SELECT id,
         ARRAY(
           SELECT DISTINCT x
           FROM unnest(ARRAY[console, category]) AS x
           WHERE x IS NOT NULL AND x <> ''
         ) AS cats
  FROM public.products
) AS sub
WHERE p.id = sub.id
  AND (p.categories IS NULL OR array_length(p.categories, 1) IS NULL OR array_length(p.categories, 1) = 0);

-- Optional: ensure categories is never null
UPDATE public.products SET categories = '{}' WHERE categories IS NULL;
