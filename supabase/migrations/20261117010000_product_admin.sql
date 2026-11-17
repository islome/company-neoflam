-- Product management from the 3D Studio (/[lang]/studio → Products).
-- Extra gallery photos per product (the main photo stays in image_url).
alter table public.products add column if not exists gallery text[] not null default '{}';

-- Public bucket for product photos uploaded in the Studio.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('product-images', 'product-images', true, 10485760, array['image/jpeg', 'image/png', 'image/webp', 'image/avif'])
on conflict (id) do nothing;
