create table public.product_categories (
  product_id uuid not null,
  category_id uuid not null,
  constraint product_categories_pkey primary key (product_id, category_id),
  constraint product_categories_category_id_fkey foreign KEY (category_id) references categories (id) on delete CASCADE,
  constraint product_categories_product_id_fkey foreign KEY (product_id) references products (id) on delete CASCADE
) TABLESPACE pg_default;