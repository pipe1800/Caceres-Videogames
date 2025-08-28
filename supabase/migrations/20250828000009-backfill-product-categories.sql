-- Migration: Backfill product_categories from legacy products.category and products.categories[]
-- Created at: 2025-08-28
-- Phase 1: Ensure product_categories table exists
create table if not exists public.product_categories (
  product_id uuid references public.products(id) on delete cascade,
  category_id uuid references public.categories(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (product_id, category_id)
);

-- Helpful indexes
create index if not exists idx_product_categories_category_id on public.product_categories(category_id);
create index if not exists idx_product_categories_product_id on public.product_categories(product_id);

-- Backfill from single category column
insert into public.product_categories (product_id, category_id)
select p.id, c.id
from public.products p
join public.categories c on lower(c.name) = lower(p.category)
left join public.product_categories pc ON pc.product_id = p.id and pc.category_id = c.id
where coalesce(p.category,'') <> ''
  and pc.product_id is null;

-- Backfill from categories[] array column (if exists)
-- We guard with a DO block to avoid failure if column missing or not array type
DO $$
BEGIN
  -- Check if column exists
  IF exists (
    select 1 from information_schema.columns 
    where table_schema='public' and table_name='products' and column_name='categories'
  ) THEN
    -- Attempt backfill using unnest if it's an array
    BEGIN
      insert into public.product_categories (product_id, category_id)
      with prod as (
        select p.id, unnest(p.categories) as cat_name
        from public.products p
        where p.categories is not null
      )
      select prod.id, c.id
      from prod
      join public.categories c on lower(c.name) = lower(prod.cat_name)
      left join public.product_categories pc on pc.product_id = prod.id and pc.category_id = c.id
      where pc.product_id is null;
    EXCEPTION WHEN others THEN
      RAISE NOTICE 'Skipping categories[] backfill (column not array or other issue)';
    END;
  END IF;
END$$;

-- Diagnostics
raise notice 'Distinct products with legacy category: %', (select count(distinct id) from public.products where coalesce(category,'') <> '');
raise notice 'Distinct product/category pairs after backfill: %', (select count(*) from public.product_categories);

-- (Optional) Future Phase: After validating data, create a new migration to drop products.category and products.categories
-- This migration intentionally leaves legacy columns in place for a safe phased rollout.
