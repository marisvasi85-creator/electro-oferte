-- Multi-company foundation for Frizeo Oferte.
-- Existing company data is preserved and assigned to its current company.

alter table public.companies
  add column if not exists industry text not null default 'electrical',
  add column if not exists logo_path text not null default '',
  add column if not exists accent_color text not null default '#2563eb',
  add column if not exists offer_prefix text not null default 'OF',
  add column if not exists onboarding_completed boolean not null default true;

alter table public.companies drop constraint if exists companies_owner_id_key;

create table if not exists public.company_members (
  company_id uuid not null references public.companies(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'admin', 'member')),
  created_at timestamptz not null default now(),
  primary key (company_id, user_id)
);

alter table public.company_members enable row level security;

insert into public.company_members(company_id, user_id, role)
select id, owner_id, 'owner'
from public.companies
on conflict (company_id, user_id) do update set role = 'owner';

alter table public.clients add column if not exists company_id uuid references public.companies(id) on delete cascade;
alter table public.catalog_items add column if not exists company_id uuid references public.companies(id) on delete cascade;
alter table public.offers add column if not exists company_id uuid references public.companies(id) on delete cascade;
alter table public.offer_items add column if not exists company_id uuid references public.companies(id) on delete cascade;
alter table public.offer_sequences add column if not exists company_id uuid references public.companies(id) on delete cascade;

update public.clients x set company_id = c.id from public.companies c where x.company_id is null and c.owner_id = x.owner_id;
update public.catalog_items x set company_id = c.id from public.companies c where x.company_id is null and c.owner_id = x.owner_id;
update public.offers x set company_id = c.id from public.companies c where x.company_id is null and c.owner_id = x.owner_id;
update public.offer_items x set company_id = c.id from public.companies c where x.company_id is null and c.owner_id = x.owner_id;
update public.offer_sequences x set company_id = c.id from public.companies c where x.company_id is null and c.owner_id = x.owner_id;

alter table public.clients alter column company_id set not null;
alter table public.catalog_items alter column company_id set not null;
alter table public.offers alter column company_id set not null;
alter table public.offer_items alter column company_id set not null;
alter table public.offer_sequences alter column company_id set not null;

alter table public.offers drop constraint if exists offers_owner_id_number_key;
alter table public.offers add constraint offers_company_id_number_key unique (company_id, number);

alter table public.offer_sequences drop constraint if exists offer_sequences_pkey;
alter table public.offer_sequences add primary key (company_id, year);

create index if not exists company_members_user_id_idx on public.company_members(user_id);
create index if not exists companies_owner_id_idx on public.companies(owner_id);
create index if not exists clients_company_id_idx on public.clients(company_id);
create index if not exists catalog_items_company_id_idx on public.catalog_items(company_id);
create index if not exists offers_company_id_idx on public.offers(company_id);
create index if not exists offer_items_company_id_idx on public.offer_items(company_id);
create index if not exists offer_sequences_owner_id_idx on public.offer_sequences(owner_id);

grant select, insert, update, delete on public.company_members to authenticated;

drop policy if exists company_members_select on public.company_members;
drop policy if exists company_members_insert on public.company_members;
drop policy if exists company_members_update on public.company_members;
drop policy if exists company_members_delete on public.company_members;

create policy company_members_select on public.company_members
for select to authenticated
using (user_id = (select auth.uid()));

create policy company_members_insert on public.company_members
for insert to authenticated
with check (
  user_id = (select auth.uid())
  and role = 'owner'
  and exists (
    select 1 from public.companies c
    where c.id = company_id and c.owner_id = (select auth.uid())
  )
);

create policy company_members_update on public.company_members
for update to authenticated
using (
  exists (
    select 1 from public.companies c
    where c.id = company_id and c.owner_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1 from public.companies c
    where c.id = company_id and c.owner_id = (select auth.uid())
  )
);

create policy company_members_delete on public.company_members
for delete to authenticated
using (
  user_id <> (select auth.uid())
  and exists (
    select 1 from public.companies c
    where c.id = company_id and c.owner_id = (select auth.uid())
  )
);

drop policy if exists companies_own_access on public.companies;
create policy companies_select_member on public.companies
for select to authenticated
using (
  owner_id = (select auth.uid())
  or exists (
    select 1 from public.company_members cm
    where cm.company_id = id and cm.user_id = (select auth.uid())
  )
);
create policy companies_insert_owner on public.companies
for insert to authenticated
with check (owner_id = (select auth.uid()));
create policy companies_update_admin on public.companies
for update to authenticated
using (
  owner_id = (select auth.uid())
  or exists (
    select 1 from public.company_members cm
    where cm.company_id = id and cm.user_id = (select auth.uid()) and cm.role in ('owner', 'admin')
  )
)
with check (
  owner_id = (select auth.uid())
  or exists (
    select 1 from public.company_members cm
    where cm.company_id = id and cm.user_id = (select auth.uid()) and cm.role in ('owner', 'admin')
  )
);

drop policy if exists clients_own_access on public.clients;
drop policy if exists catalog_delete_own on public.catalog_items;
drop policy if exists catalog_insert_own on public.catalog_items;
drop policy if exists catalog_select_access on public.catalog_items;
drop policy if exists catalog_update_own on public.catalog_items;
drop policy if exists offers_own_access on public.offers;
drop policy if exists offer_items_own_access on public.offer_items;
drop policy if exists offer_sequences_own_access on public.offer_sequences;

create policy clients_company_access on public.clients
for all to authenticated
using (exists (select 1 from public.company_members cm where cm.company_id = clients.company_id and cm.user_id = (select auth.uid())))
with check (exists (select 1 from public.company_members cm where cm.company_id = clients.company_id and cm.user_id = (select auth.uid())));

create policy catalog_company_access on public.catalog_items
for all to authenticated
using (exists (select 1 from public.company_members cm where cm.company_id = catalog_items.company_id and cm.user_id = (select auth.uid())))
with check (exists (select 1 from public.company_members cm where cm.company_id = catalog_items.company_id and cm.user_id = (select auth.uid())));

create policy offers_company_access on public.offers
for all to authenticated
using (exists (select 1 from public.company_members cm where cm.company_id = offers.company_id and cm.user_id = (select auth.uid())))
with check (exists (select 1 from public.company_members cm where cm.company_id = offers.company_id and cm.user_id = (select auth.uid())));

create policy offer_items_company_access on public.offer_items
for all to authenticated
using (exists (select 1 from public.company_members cm where cm.company_id = offer_items.company_id and cm.user_id = (select auth.uid())))
with check (exists (select 1 from public.company_members cm where cm.company_id = offer_items.company_id and cm.user_id = (select auth.uid())));

create policy offer_sequences_company_access on public.offer_sequences
for all to authenticated
using (exists (select 1 from public.company_members cm where cm.company_id = offer_sequences.company_id and cm.user_id = (select auth.uid())))
with check (exists (select 1 from public.company_members cm where cm.company_id = offer_sequences.company_id and cm.user_id = (select auth.uid())));

drop function if exists public.next_offer_number(integer);

create function public.next_offer_number(
  p_year integer default extract(year from current_date)::integer,
  p_company_id uuid default null
)
returns text
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_company uuid;
  v_prefix text;
  v_next integer;
begin
  select cm.company_id into v_company
  from public.company_members cm
  where cm.user_id = auth.uid()
    and (p_company_id is null or cm.company_id = p_company_id)
  order by cm.created_at
  limit 1;

  if v_company is null then
    raise exception 'No company available for this user';
  end if;

  select coalesce(nullif(offer_prefix, ''), 'OF') into v_prefix
  from public.companies
  where id = v_company;

  insert into public.offer_sequences(company_id, owner_id, year, last_number)
  values (v_company, auth.uid(), p_year, 1)
  on conflict (company_id, year) do update
    set last_number = public.offer_sequences.last_number + 1,
        updated_at = now()
  returning last_number into v_next;

  return v_prefix || '-' || p_year::text || '-' || lpad(v_next::text, 3, '0');
end;
$$;

grant execute on function public.next_offer_number(integer, uuid) to authenticated;

insert into storage.buckets(id, name, public, file_size_limit, allowed_mime_types)
values ('company-assets', 'company-assets', true, 2097152, array['image/png','image/jpeg'])
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists company_logos_insert on storage.objects;
drop policy if exists company_logos_update on storage.objects;
drop policy if exists company_logos_delete on storage.objects;

create policy company_logos_insert on storage.objects
for insert to authenticated
with check (
  bucket_id = 'company-assets'
  and exists (
    select 1 from public.company_members cm
    where cm.user_id = (select auth.uid())
      and cm.role in ('owner', 'admin')
      and cm.company_id::text = (storage.foldername(name))[1]
  )
);

create policy company_logos_update on storage.objects
for update to authenticated
using (
  bucket_id = 'company-assets'
  and exists (
    select 1 from public.company_members cm
    where cm.user_id = (select auth.uid())
      and cm.role in ('owner', 'admin')
      and cm.company_id::text = (storage.foldername(name))[1]
  )
)
with check (
  bucket_id = 'company-assets'
  and exists (
    select 1 from public.company_members cm
    where cm.user_id = (select auth.uid())
      and cm.role in ('owner', 'admin')
      and cm.company_id::text = (storage.foldername(name))[1]
  )
);

create policy company_logos_delete on storage.objects
for delete to authenticated
using (
  bucket_id = 'company-assets'
  and exists (
    select 1 from public.company_members cm
    where cm.user_id = (select auth.uid())
      and cm.role in ('owner', 'admin')
      and cm.company_id::text = (storage.foldername(name))[1]
  )
);
