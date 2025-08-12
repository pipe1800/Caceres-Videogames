-- Categories master table
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text unique not null,
  created_at timestamptz not null default now()
);

alter table public.categories enable row level security;
create policy "Anyone can view categories" on public.categories for select using (true);
create policy "Admins can manage categories" on public.categories for all using (true);
