-- =============================================================================
-- Admin access  --  Supabase Dashboard -> SQL Editor -> New -> paste -> Run
--
-- Unlike supabase/schema.sql this script is safe to run more than once: it does
-- not drop the shop tables, so your catalog and your orders stay untouched.
--
-- It adds three things:
--
--   1. public.admins            -- the allow list of people who may edit
--   2. write policies           -- so an admin can add, edit and delete goods
--   3. public storage bucket    -- "product-images", for uploaded photos
--
-- There is deliberately no service role key in this app. Admin writes go out
-- with the same public anon key as everything else, and Postgres itself decides
-- who is allowed to write. That means the database is the security boundary,
-- not a check in a server action that someone can forget to add.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- The allow list
-- -----------------------------------------------------------------------------

create table if not exists public.admins (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.admins enable row level security;

-- Self referential on purpose: a signed in user can read their own row and
-- nothing else, so nobody can enumerate who else runs the shop.
drop policy if exists "admins can read their own row" on public.admins;
create policy "admins can read their own row"
  on public.admins
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

-- The table is managed by hand in the SQL editor, never from the app. Removing
-- these grants means a compromised session cannot promote itself to admin.
revoke insert, update, delete on public.admins from anon, authenticated;

-- -----------------------------------------------------------------------------
-- is_admin()
--
-- Used by the policies below so each one reads as a single sentence instead of
-- repeating the subquery. It is SECURITY DEFINER because a policy has to be
-- able to ask the question without tripping over the admins table's own RLS.
-- That is safe precisely because it hard codes the auth.uid() filter: it can
-- only ever report whether the *caller* is an admin, never who else is.
-- -----------------------------------------------------------------------------

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.admins
    where user_id = (select auth.uid())
  );
$$;

revoke execute on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;

-- -----------------------------------------------------------------------------
-- Product writes
--
-- Reading products is unchanged: "products are readable by everyone" from
-- schema.sql still covers it. These three policies add the write half, and they
-- only ever fire for a user id that exists in public.admins.
-- -----------------------------------------------------------------------------

drop policy if exists "admins can create products" on public.products;
create policy "admins can create products"
  on public.products
  for insert
  to authenticated
  with check (public.is_admin());

drop policy if exists "admins can update products" on public.products;
create policy "admins can update products"
  on public.products
  for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "admins can delete products" on public.products;
create policy "admins can delete products"
  on public.products
  for delete
  to authenticated
  using (public.is_admin());

-- -----------------------------------------------------------------------------
-- Order reads
--
-- "users can read their own orders" from schema.sql is untouched: a customer
-- still only ever sees their own rows. These two policies are the admin half,
-- so the admin area can list orders and the chart below can aggregate them.
-- -----------------------------------------------------------------------------

drop policy if exists "admins can read all orders" on public.orders;
create policy "admins can read all orders"
  on public.orders
  for select
  to authenticated
  using (public.is_admin());

drop policy if exists "admins can read all order items" on public.order_items;
create policy "admins can read all order items"
  on public.order_items
  for select
  to authenticated
  using (public.is_admin());

-- schema.sql gives orders select and insert only, never update, so changing an
-- order status needs a policy here. The action validates the status against a
-- fixed list, so this only ever writes pending / paid / shipped / cancelled.
drop policy if exists "admins can update orders" on public.orders;
create policy "admins can update orders"
  on public.orders
  for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- -----------------------------------------------------------------------------
-- daily_revenue
--
-- The admin chart needs a series, not every individual order, so the
-- aggregation happens in Postgres rather than shipping rows to the app.
--
-- security_invoker is the important part: the view runs with the *caller's*
-- permissions, so the policies above still apply. A customer querying this
-- view gets zero rows, not a leak of everyone's orders. The old default
-- (security_definer) would have exposed every order in the shop.
-- -----------------------------------------------------------------------------

create or replace view public.daily_revenue with (security_invoker = true) as
  select
    date_trunc('day', created_at) as day,
    count(*)::integer            as orders,
    coalesce(sum(total), 0)      as revenue
  from public.orders
  group by 1
  order by 1;

grant select on public.daily_revenue to authenticated;

-- -----------------------------------------------------------------------------
-- Product images
--
-- A public bucket, so next/image can fetch the photos without a signed URL.
-- Uploading, replacing and deleting still require an admin.
--
-- Storage has its own row level security, separate from the table policies
-- above, so each of these is scoped by bucket_id as well as by role.
-- -----------------------------------------------------------------------------

insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do update set public = excluded.public;

drop policy if exists "product images are publicly readable" on storage.objects;
create policy "product images are publicly readable"
  on storage.objects
  for select
  to anon, authenticated
  using (bucket_id = 'product-images');

drop policy if exists "admins can upload product images" on storage.objects;
create policy "admins can upload product images"
  on storage.objects
  for insert
  to authenticated
  with check (bucket_id = 'product-images' and public.is_admin());

drop policy if exists "admins can replace product images" on storage.objects;
create policy "admins can replace product images"
  on storage.objects
  for update
  to authenticated
  using (bucket_id = 'product-images' and public.is_admin());

drop policy if exists "admins can delete product images" on storage.objects;
create policy "admins can delete product images"
  on storage.objects
  for delete
  to authenticated
  using (bucket_id = 'product-images' and public.is_admin());

-- -----------------------------------------------------------------------------
-- Making yourself an admin
--
-- 1. Sign in to the shop with Google once, so Supabase has a user row for you.
-- 2. Copy your id from Authentication -> Users.
-- 3. Run this, with your own id in place of the placeholder:
--
--      insert into public.admins (user_id) values ('PASTE-YOUR-USER-ID-HERE');
--
-- To take the admin flag away again:
--
--      delete from public.admins where user_id = 'PASTE-YOUR-USER-ID-HERE';
--
-- Do not add an "is this user an admin" column to a client side table. The
-- app reads public.admins through the anon key, and the select policy above
-- already limits it to the caller's own row.
-- -----------------------------------------------------------------------------