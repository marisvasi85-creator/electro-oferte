-- Repair RLS / grants so offer saves work for company members on any device.
-- Root causes this addresses:
-- 1) owners without company_members rows after multi-company migration
-- 2) missing GRANTs on tables used by next_offer_number (SECURITY INVOKER)
-- 3) RLS recursion / brittle EXISTS policies → helper SECURITY DEFINER
-- 4) next_offer_number blocked by offer_sequences RLS

-- Ensure every company owner is also a member.
insert into public.company_members(company_id, user_id, role)
select c.id, c.owner_id, 'owner'
from public.companies c
where c.owner_id is not null
on conflict (company_id, user_id) do update set role = excluded.role;

-- Table privileges for authenticated clients.
grant select, insert, update, delete on public.profiles to authenticated;
grant select, insert, update, delete on public.companies to authenticated;
grant select, insert, update, delete on public.company_members to authenticated;
grant select, insert, update, delete on public.clients to authenticated;
grant select, insert, update, delete on public.catalog_items to authenticated;
grant select, insert, update, delete on public.offers to authenticated;
grant select, insert, update, delete on public.offer_items to authenticated;
grant select, insert, update, delete on public.offer_sequences to authenticated;

-- Membership helper (avoids policy recursion and works from RLS checks).
create or replace function public.is_company_member(p_company_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.company_members cm
    where cm.company_id = p_company_id
      and cm.user_id = auth.uid()
  );
$$;

revoke all on function public.is_company_member(uuid) from public;
grant execute on function public.is_company_member(uuid) to authenticated;

drop policy if exists companies_delete_owner on public.companies;
create policy companies_delete_owner on public.companies
for delete to authenticated
using (owner_id = (select auth.uid()));

alter table public.profiles enable row level security;
drop policy if exists profiles_select_own on public.profiles;
drop policy if exists profiles_insert_own on public.profiles;
drop policy if exists profiles_update_own on public.profiles;
create policy profiles_select_own on public.profiles
for select to authenticated
using (id = (select auth.uid()));
create policy profiles_insert_own on public.profiles
for insert to authenticated
with check (id = (select auth.uid()));
create policy profiles_update_own on public.profiles
for update to authenticated
using (id = (select auth.uid()))
with check (id = (select auth.uid()));

-- Rebuild data policies on the helper.
drop policy if exists clients_company_access on public.clients;
drop policy if exists catalog_company_access on public.catalog_items;
drop policy if exists offers_company_access on public.offers;
drop policy if exists offer_items_company_access on public.offer_items;
drop policy if exists offer_sequences_company_access on public.offer_sequences;

create policy clients_company_access on public.clients
for all to authenticated
using (public.is_company_member(company_id))
with check (public.is_company_member(company_id));

create policy catalog_company_access on public.catalog_items
for all to authenticated
using (public.is_company_member(company_id))
with check (public.is_company_member(company_id));

create policy offers_company_access on public.offers
for all to authenticated
using (public.is_company_member(company_id))
with check (public.is_company_member(company_id));

create policy offer_items_company_access on public.offer_items
for all to authenticated
using (public.is_company_member(company_id))
with check (public.is_company_member(company_id));

create policy offer_sequences_company_access on public.offer_sequences
for all to authenticated
using (public.is_company_member(company_id))
with check (public.is_company_member(company_id));

-- Allocate offer numbers as SECURITY DEFINER after membership check.
create or replace function public.next_offer_number(
  p_year integer default extract(year from current_date)::integer,
  p_company_id uuid default null
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_company uuid;
  v_prefix text;
  v_next integer;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

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

revoke all on function public.next_offer_number(integer, uuid) from public;
grant execute on function public.next_offer_number(integer, uuid) to authenticated;

-- Self-heal RPC: ensure current user is member of companies they own.
create or replace function public.ensure_owner_memberships()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  insert into public.company_members(company_id, user_id, role)
  select c.id, c.owner_id, 'owner'
  from public.companies c
  where c.owner_id = auth.uid()
  on conflict (company_id, user_id) do update set role = 'owner';

  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

revoke all on function public.ensure_owner_memberships() from public;
grant execute on function public.ensure_owner_memberships() to authenticated;
