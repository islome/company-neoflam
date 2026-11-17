-- 3D models for product pages, managed in the 3D Studio (/[lang]/studio).
-- Keyed by product slug (not a foreign key) so models also work for products
-- that still come from src/data/catalog.ts. A row here overrides the built-in
-- recipe model of the same slug. Writes happen only on the server with the
-- service role key, after the Studio password check.
create table if not exists public.product_models (
  slug           text primary key,
  source         text not null check (source in ('recipe', 'upload')),
  -- Public URL of the .glb in the `models` storage bucket.
  url            text not null,
  -- Path inside the bucket, used to remove the old file on replace/delete.
  storage_path   text not null,
  -- The recipe the model was built from (null for uploads), so it can be edited later.
  recipe         jsonb,
  -- Colour switcher options: [{ "key": "cream", "hex": "#ece5da" }, ...]
  colors         jsonb not null default '[]',
  -- Material names the colour switcher repaints.
  paint          text[] not null default '{}',
  -- Name of the glTF animation that opens the lid, if any.
  lid_animation  text,
  updated_at     timestamptz not null default now()
);

alter table public.product_models enable row level security;

create policy "Product models are public"
  on public.product_models for select
  to anon, authenticated
  using (true);

-- Public bucket for .glb files (read by model-viewer on product pages).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('models', 'models', true, 52428800, array['model/gltf-binary', 'application/octet-stream'])
on conflict (id) do nothing;
