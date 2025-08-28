-- Migration: add likes_count column to products and function to increment it
-- Adds a non-nullable likes_count with default 0 and a helper function for atomic increments.

alter table public.products
  add column if not exists likes_count integer not null default 0;

comment on column public.products.likes_count is 'Number of likes/favorites for the product';

-- Atomic increment function
create or replace function public.increment_product_likes(p_id uuid)
returns integer
language sql
security definer
as $$
  update public.products
    set likes_count = likes_count + 1,
        updated_at = now()
  where id = p_id
  returning likes_count;
$$;

revoke all on function public.increment_product_likes(uuid) from public;
grant execute on function public.increment_product_likes(uuid) to anon, authenticated, service_role;
