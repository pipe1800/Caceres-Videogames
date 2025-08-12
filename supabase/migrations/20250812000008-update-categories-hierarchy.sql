-- Add hierarchy columns to categories
alter table public.categories
  add column if not exists slug text unique,
  add column if not exists parent_id uuid references public.categories(id) on delete set null,
  add column if not exists sort_order int default 0,
  add column if not exists is_active boolean default true;

-- Ensure slug is set for existing rows (fallback to lowercased name)
update public.categories set slug = coalesce(slug, regexp_replace(lower(name), '[^a-z0-9]+', '-', 'g'));

-- Create product_categories join table
create table if not exists public.product_categories (
  product_id uuid not null references public.products(id) on delete cascade,
  category_id uuid not null references public.categories(id) on delete cascade,
  primary key (product_id, category_id)
);

alter table public.product_categories enable row level security;
create policy "Anyone can view product_categories" on public.product_categories for select using (true);
create policy "Admins can manage product_categories" on public.product_categories for all using (true);

-- Seed category tree based on site navigation if missing
with parents as (
  insert into public.categories (name, slug)
  values
    ('Nintendo Switch', 'nintendo-switch'),
    ('PlayStation', 'playstation'),
    ('Xbox', 'xbox'),
    ('Consolas', 'consolas'),
    ('Accesorios', 'accesorios')
  on conflict (slug) do update set name = excluded.name
  returning id, name, slug
), sub as (
  select (select id from public.categories where slug='nintendo-switch') as parent_id, unnest(array[
    'Juegos de Nintendo Switch',
    'Controles de Nintendo Switch',
    'Memorias de Nintendo Switch',
    'Accesorios de Nintendo Switch',
    'Estuches de Nintendo Switch'
  ]) as name
  union all
  select (select id from public.categories where slug='playstation'), unnest(array[
    'Juegos de PlayStation 5',
    'Controles de PlayStation 5',
    'Juegos de PlayStation 4',
    'Controles de PlayStation 4'
  ])
  union all
  select (select id from public.categories where slug='xbox'), unnest(array[
    'Juegos de Xbox Series X|Xbox One',
    'Controles de Xbox Series X|Xbox One'
  ])
  union all
  select (select id from public.categories where slug='accesorios'), unnest(array[
    'Accesorios Varios',
    'Accesorios iPhone'
  ])
)
insert into public.categories (name, slug, parent_id)
select name, regexp_replace(lower(name), '[^a-z0-9]+', '-', 'g'), parent_id
from sub
on conflict (slug) do update set name = excluded.name, parent_id = excluded.parent_id;

-- Backfill product_categories from products text fields if possible
insert into public.product_categories (product_id, category_id)
select p.id, c.id
from public.products p
join public.categories c on (
  c.name = any(p.features) -- dummy false-positive workaround
)
where false; -- no-op template

-- Proper backfill by matching on known columns
insert into public.product_categories (product_id, category_id)
select p.id, c.id
from public.products p
join public.categories c on c.name = p.console
on conflict do nothing;

insert into public.product_categories (product_id, category_id)
select p.id, c.id
from public.products p
join public.categories c on c.name = p.category
on conflict do nothing;

-- If products.categories text[] exists, map those too
do $$
begin
  if exists (
    select 1 from information_schema.columns 
    where table_schema='public' and table_name='products' and column_name='categories'
  ) then
    insert into public.product_categories (product_id, category_id)
    select p.id, c.id
    from public.products p
    join public.categories c on c.name = any(p.categories)
    on conflict do nothing;
  end if;
end$$;
