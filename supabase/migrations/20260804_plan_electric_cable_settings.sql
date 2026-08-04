-- Plan Electric: page-level cable / calibration settings.

alter table public.plan_pages
  add column if not exists settings jsonb not null default '{}'::jsonb;
