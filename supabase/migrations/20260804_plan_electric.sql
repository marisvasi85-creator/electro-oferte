-- Plan Electric module: projects, pages (plan backgrounds), symbol instances.

create table if not exists public.plan_projects (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  company_id uuid references public.companies(id) on delete cascade,
  name text not null,
  client text not null default '',
  address text not null default '',
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.plan_pages (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.plan_projects(id) on delete cascade,
  name text not null default 'Plan 1',
  background_path text not null default '',
  width integer not null default 2480,
  height integer not null default 3508,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.plan_symbol_instances (
  id uuid primary key default gen_random_uuid(),
  page_id uuid not null references public.plan_pages(id) on delete cascade,
  symbol_type text not null,
  x double precision not null default 0,
  y double precision not null default 0,
  rotation double precision not null default 0,
  scale double precision not null default 1,
  label text not null default '',
  notes text not null default '',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists plan_projects_owner_id_idx on public.plan_projects(owner_id);
create index if not exists plan_projects_company_id_idx on public.plan_projects(company_id);
create index if not exists plan_pages_project_id_idx on public.plan_pages(project_id);
create index if not exists plan_symbol_instances_page_id_idx on public.plan_symbol_instances(page_id);

alter table public.plan_projects enable row level security;
alter table public.plan_pages enable row level security;
alter table public.plan_symbol_instances enable row level security;

grant select, insert, update, delete on public.plan_projects to authenticated;
grant select, insert, update, delete on public.plan_pages to authenticated;
grant select, insert, update, delete on public.plan_symbol_instances to authenticated;

drop policy if exists plan_projects_access on public.plan_projects;
create policy plan_projects_access on public.plan_projects
for all to authenticated
using (
  owner_id = (select auth.uid())
  or (
    company_id is not null
    and exists (
      select 1 from public.company_members cm
      where cm.company_id = plan_projects.company_id
        and cm.user_id = (select auth.uid())
    )
  )
)
with check (
  owner_id = (select auth.uid())
);

drop policy if exists plan_pages_access on public.plan_pages;
create policy plan_pages_access on public.plan_pages
for all to authenticated
using (
  exists (
    select 1 from public.plan_projects p
    where p.id = plan_pages.project_id
      and (
        p.owner_id = (select auth.uid())
        or (
          p.company_id is not null
          and exists (
            select 1 from public.company_members cm
            where cm.company_id = p.company_id and cm.user_id = (select auth.uid())
          )
        )
      )
  )
)
with check (
  exists (
    select 1 from public.plan_projects p
    where p.id = plan_pages.project_id and p.owner_id = (select auth.uid())
  )
);

drop policy if exists plan_symbol_instances_access on public.plan_symbol_instances;
create policy plan_symbol_instances_access on public.plan_symbol_instances
for all to authenticated
using (
  exists (
    select 1
    from public.plan_pages pg
    join public.plan_projects p on p.id = pg.project_id
    where pg.id = plan_symbol_instances.page_id
      and (
        p.owner_id = (select auth.uid())
        or (
          p.company_id is not null
          and exists (
            select 1 from public.company_members cm
            where cm.company_id = p.company_id and cm.user_id = (select auth.uid())
          )
        )
      )
  )
)
with check (
  exists (
    select 1
    from public.plan_pages pg
    join public.plan_projects p on p.id = pg.project_id
    where pg.id = plan_symbol_instances.page_id
      and p.owner_id = (select auth.uid())
  )
);

insert into storage.buckets(id, name, public, file_size_limit, allowed_mime_types)
values (
  'plan-backgrounds',
  'plan-backgrounds',
  true,
  20971520,
  array['image/png', 'image/jpeg', 'image/webp', 'application/pdf']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists plan_backgrounds_select on storage.objects;
drop policy if exists plan_backgrounds_insert on storage.objects;
drop policy if exists plan_backgrounds_update on storage.objects;
drop policy if exists plan_backgrounds_delete on storage.objects;

create policy plan_backgrounds_select on storage.objects
for select to authenticated
using (bucket_id = 'plan-backgrounds');

create policy plan_backgrounds_insert on storage.objects
for insert to authenticated
with check (
  bucket_id = 'plan-backgrounds'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

create policy plan_backgrounds_update on storage.objects
for update to authenticated
using (
  bucket_id = 'plan-backgrounds'
  and (storage.foldername(name))[1] = (select auth.uid())::text
)
with check (
  bucket_id = 'plan-backgrounds'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

create policy plan_backgrounds_delete on storage.objects
for delete to authenticated
using (
  bucket_id = 'plan-backgrounds'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);
