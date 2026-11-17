-- Neoflam store locations in Uzbekistan, shown in the "Where to buy" section.
create table if not exists public.stores (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique,
  kind        text check (kind in ('main', 'regional')),
  city_uz     text not null,
  city_ru     text not null,
  city_en     text not null,
  name        text not null,
  address     text not null,
  hours       text not null default '',
  phone       text not null default '',
  map_url     text,
  lat         double precision,
  lng         double precision,
  sort_order  int  not null default 0,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Anyone may read active stores; only the service role (dashboard / API) writes.
alter table public.stores enable row level security;

create policy "Active stores are public"
  on public.stores for select
  to anon, authenticated
  using (is_active);

-- Replace the {{placeholders}} with real store details before running,
-- or edit the rows later in the Supabase table editor.
insert into public.stores (slug, kind, city_uz, city_ru, city_en, name, address, hours, phone, sort_order, lat, lng)
values
  ('tashkent-main',     'main',     'Toshkent',  'Ташкент',   'Tashkent',  'Neoflam', '{{address}}', '10:00 – 20:00', '{{+998 phone}}', 1, 41.3138, 69.2486),
  ('tashkent-regional', 'regional', 'Toshkent',  'Ташкент',   'Tashkent',  'Neoflam', '{{address}}', '10:00 – 20:00', '{{+998 phone}}', 2, 41.3111, 69.2797),
  ('samarkand',         null,       'Samarqand', 'Самарканд', 'Samarkand', 'Neoflam', '{{address}}', '10:00 – 20:00', '{{+998 phone}}', 3, 39.6542, 66.9597),
  ('namangan',          null,       'Namangan',  'Наманган',  'Namangan',  'Neoflam', '{{address}}', '10:00 – 20:00', '{{+998 phone}}', 4, 40.9983, 71.6726)
on conflict (slug) do nothing;
