-- Feature tags shown under the price on product pages (labels live in the site's dictionaries).
alter table public.products add column if not exists features text[] not null default '{}'
  check (features <@ array['pfasFree','ceramic','induction','ovenSafe','dishwasher','microwave','woodHandle','glassLid','airtight']);
