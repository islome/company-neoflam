-- Neoflam product collections shown on /[lang]/products.
-- Until rows exist here, the site uses src/data/catalog.ts.
create table if not exists public.products (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique,
  name        text not null,
  category    text not null check (category in ('cookware', 'storage', 'tableware', 'gadget')),
  colors      text[] not null default '{}'
              check (colors <@ array['cream','white','yellow','pink','red','black','clear','multi']),
  price_uzs   integer check (price_uzs is null or price_uzs >= 0),
  image_url   text not null,
  tagline_uz  text not null default '',
  tagline_ru  text not null default '',
  tagline_en  text not null default '',
  sort_order  int not null default 0,
  added_at    date not null default current_date,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists products_category_idx on public.products (category) where is_active;

alter table public.products enable row level security;

create policy "Active products are public"
  on public.products for select
  to anon, authenticated
  using (is_active);
