-- Everything a product needs now lives in the database (the built-in catalog is gone).

-- Sizes in a collection, shown as size buttons on the product page:
-- [{ "code": "EK-RD-C22", "type": "stockpot", "sizeCm": 22, "volumeL": 2.8 }, ...]
alter table public.products add column if not exists variants jsonb not null default '[]'
  check (jsonb_typeof(variants) = 'array');

-- iPhone AR Quick Look files made from the model when it is saved, one per colour:
-- { "pink": "<slug>/<stamp>.pink.usdz", ... } (paths in the `models` bucket).
alter table public.product_models add column if not exists usdz jsonb not null default '{}'
  check (jsonb_typeof(usdz) = 'object');

-- Allow .usdz files in the models bucket (served with Apple's MIME type).
update storage.buckets
set allowed_mime_types = array['model/gltf-binary', 'model/vnd.usdz+zip', 'application/octet-stream']
where id = 'models';
