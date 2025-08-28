-- Migration: update category parent relationships and ordering
-- Date: 2025-08-28
-- Purpose: Establish proper parent -> child hierarchy among existing flat categories.

-- 1. Ensure every category has a slug
update public.categories
set slug = regexp_replace(lower(name), '[^a-z0-9]+', '-', 'g')
where slug is null;

-- 2. Nullify parent_id for intended top-level parents (idempotent)
update public.categories
set parent_id = null
where slug in (
  'playstation',
  'nintendo-switch',
  'xbox',
  'accesorios',
  'consolas'
);

-- 3. Assign children to PlayStation
update public.categories
set parent_id = (select id from public.categories where slug = 'playstation')
where slug in (
  'juegos-de-playstation-5',
  'juegos-de-playstation-4',
  'controles-de-playstation-5',
  'controles-de-playstation-4'
);

-- 4. Assign children to Nintendo Switch
update public.categories
set parent_id = (select id from public.categories where slug = 'nintendo-switch')
where slug in (
  'juegos-de-nintendo-switch',
  'controles-de-nintendo-switch',
  'memorias-de-nintendo-switch',
  'accesorios-de-nintendo-switch',
  'estuches-de-nintendo-switch'
);

-- 5. Assign children to Xbox
update public.categories
set parent_id = (select id from public.categories where slug = 'xbox')
where slug in (
  'juegos-de-xbox-series-x-xbox-one',
  'controles-de-xbox-series-x-xbox-one'
);

-- 6. Assign children to Accesorios (generic accessories not console-specific)
update public.categories
set parent_id = (select id from public.categories where slug = 'accesorios')
where slug in (
  'accesorios-iphone',
  'accesorios-varios'
);

-- (Currently no children for Consolas; may be added later e.g. 'PlayStation 5', 'Xbox Series X', etc.)

-- 7. Optional: Set ordering for parents & children (idempotent)
-- Parents: PlayStation(10), Xbox(20), Nintendo Switch(30), Consolas(40), Accesorios(50)
update public.categories set sort_order = 10 where slug = 'playstation';
update public.categories set sort_order = 20 where slug = 'xbox';
update public.categories set sort_order = 30 where slug = 'nintendo-switch';
update public.categories set sort_order = 40 where slug = 'consolas';
update public.categories set sort_order = 50 where slug = 'accesorios';

-- Children inherit blocks + incremental offsets
-- PlayStation children
update public.categories set sort_order = 11 where slug = 'juegos-de-playstation-5';
update public.categories set sort_order = 12 where slug = 'juegos-de-playstation-4';
update public.categories set sort_order = 13 where slug = 'controles-de-playstation-5';
update public.categories set sort_order = 14 where slug = 'controles-de-playstation-4';

-- Nintendo Switch children
update public.categories set sort_order = 31 where slug = 'juegos-de-nintendo-switch';
update public.categories set sort_order = 32 where slug = 'controles-de-nintendo-switch';
update public.categories set sort_order = 33 where slug = 'memorias-de-nintendo-switch';
update public.categories set sort_order = 34 where slug = 'accesorios-de-nintendo-switch';
update public.categories set sort_order = 35 where slug = 'estuches-de-nintendo-switch';

-- Xbox children
update public.categories set sort_order = 21 where slug = 'juegos-de-xbox-series-x-xbox-one';
update public.categories set sort_order = 22 where slug = 'controles-de-xbox-series-x-xbox-one';

-- Accesorios children
update public.categories set sort_order = 51 where slug = 'accesorios-iphone';
update public.categories set sort_order = 52 where slug = 'accesorios-varios';

-- 8. Helpful index for hierarchy queries (if not exists)
create index if not exists categories_parent_id_idx on public.categories(parent_id);

-- 9. Sanity report (visible in migration logs)
DO $$
DECLARE
  total int;
  with_parent int;
BEGIN
  select count(*), count(parent_id) into total, with_parent from public.categories;
  RAISE NOTICE 'Categories total: %, with parent: %', total, with_parent;
END$$;

-- End of migration
