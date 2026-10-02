-- =============================================================================
-- Shop schema  --  Supabase Dashboard -> SQL Editor -> New -> paste -> Run
--
-- WARNING: the script starts by dropping the three shop tables, so it wipes
-- existing shop data. It is meant for a fresh project (or a re-seed).
-- Run it once, then never again unless you are happy to lose the data.
-- =============================================================================

create extension if not exists pgcrypto;

-- -----------------------------------------------------------------------------
-- Tables
-- -----------------------------------------------------------------------------

drop table if exists public.order_items;
drop table if exists public.orders;
drop table if exists public.products;

create table public.products (
  id          uuid primary key default gen_random_uuid(),
  name        text          not null,
  description text          not null default '',
  price       numeric(10,2) not null check (price >= 0),
  image_url   text,
  stock       integer       not null default 0 check (stock >= 0),
  created_at  timestamptz   not null default now()
);

create table public.orders (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid          not null references auth.users (id) on delete cascade,
  total            numeric(10,2) not null check (total >= 0),
  status           text          not null default 'pending',
  customer_name    text          not null,
  customer_email   text          not null,
  shipping_address text          not null,
  created_at       timestamptz   not null default now()
);

create table public.order_items (
  id         uuid primary key default gen_random_uuid(),
  order_id   uuid          not null references public.orders (id) on delete cascade,
  product_id uuid          not null references public.products (id) on delete restrict,
  quantity   integer       not null check (quantity > 0),
  unit_price numeric(10,2) not null check (unit_price >= 0)
);

create index orders_user_id_created_at_idx on public.orders (user_id, created_at desc);
create index order_items_order_id_idx on public.order_items (order_id);

-- -----------------------------------------------------------------------------
-- Row Level Security
--
-- Products: readable by everyone (including anonymous visitors), writable by
-- nobody from the client -- there is deliberately no insert/update/delete
-- policy, so only the service role key (server side) can change them.
--
-- Orders / order items: a signed in user can only read and create their own
-- rows. RLS is what enforces this, the app never has to filter by user id to
-- stay safe.
-- -----------------------------------------------------------------------------

alter table public.products   enable row level security;
alter table public.orders     enable row level security;
alter table public.order_items enable row level security;

create policy "products are readable by everyone"
  on public.products
  for select
  to anon, authenticated
  using (true);

create policy "users can read their own orders"
  on public.orders
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "users can create their own orders"
  on public.orders
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "users can read their own order items"
  on public.order_items
  for select
  to authenticated
  using (
    exists (
      select 1 from public.orders
      where orders.id = order_items.order_id
        and orders.user_id = (select auth.uid())
    )
  );

create policy "users can create their own order items"
  on public.order_items
  for insert
  to authenticated
  with check (
    exists (
      select 1 from public.orders
      where orders.id = order_items.order_id
        and orders.user_id = (select auth.uid())
    )
  );

-- -----------------------------------------------------------------------------
-- Stock
--
-- Decreasing stock needs UPDATE on products, which no client policy allows, so
-- it happens in this function instead. It is SECURITY DEFINER, therefore it
-- re-checks by hand that the caller owns the order being paid for, and it locks
-- the rows (FOR UPDATE) so two customers buying the last item at the same time
-- cannot both succeed.
-- -----------------------------------------------------------------------------

create or replace function public.apply_stock_purchase(p_order_id uuid, p_items jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  item    jsonb;
  product public.products%rowtype;
begin
  if not exists (
    select 1 from public.orders
    where id = p_order_id and user_id = (select auth.uid())
  ) then
    raise exception 'You can only update stock for your own order'
      using errcode = '42501';
  end if;

  for item in select * from jsonb_array_elements(p_items)
  loop
    select * into product
      from public.products
      where id = (item ->> 'product_id')::uuid
      for update;

    if product.id is null then
      raise exception 'Product % no longer exists', item ->> 'product_id';
    end if;

    if product.stock < (item ->> 'quantity')::integer then
      raise exception 'Not enough stock left for %', product.name;
    end if;

    update public.products
      set stock = stock - (item ->> 'quantity')::integer
      where id = product.id;
  end loop;
end;
$$;

revoke execute on function public.apply_stock_purchase(uuid, jsonb) from public, anon;
grant execute on function public.apply_stock_purchase(uuid, jsonb) to authenticated;

-- -----------------------------------------------------------------------------
-- Seed data
-- -----------------------------------------------------------------------------

insert into public.products (name, description, price, image_url, stock) values
  (
    'Aurora Wireless Headphones',
    'Over-ear headphones with active noise cancelling, 40 hour battery and a case that charges them twice on the go. Bluetooth 5.3, USB-C fast charging.',
    129.00,
    'https://picsum.photos/seed/shop-aurora-headphones/900/900',
    24
  ),
  (
    'Ceramic Pour-Over Set',
    'Hand thrown stoneware dripper and carafe, 600 ml. Matte glaze, dishwasher safe, and a pack of 100 paper filters in the box.',
    48.50,
    'https://picsum.photos/seed/shop-pourover-set/900/900',
    40
  ),
  (
    'Stoneware Dinner Set, 16 pieces',
    'Four place settings in speckled stoneware. Goes from the oven to the table to the dishwasher. Lead free glaze.',
    142.00,
    'https://picsum.photos/seed/shop-dinner-set/900/900',
    12
  ),
  (
    'Linen Bedding Bundle',
    'Stone washed linen duvet cover plus two pillow cases in a washed oatmeal colour. Breathable, gets softer with every wash.',
    189.00,
    'https://picsum.photos/seed/shop-linen-bedding/900/900',
    18
  ),
  (
    'Merino Wool Throw',
    'Woven in a small mill from pure merino wool, 130 x 180 cm. Light enough for summer, warm enough for winter.',
    98.00,
    'https://picsum.photos/seed/shop-merino-throw/900/900',
    22
  ),
  (
    'Minimalist Desk Lamp',
    'Dimmable aluminium lamp with a warm to cool colour range and a weighted base. USB-C powered, so no cable on the desk.',
    64.00,
    'https://picsum.photos/seed/shop-desk-lamp/900/900',
    35
  ),
  (
    'Cast Iron Skillet 26 cm',
    'Pre seasoned pan with a helper handle. Works on induction, gas and electric, and gets better the more you cook in it.',
    72.00,
    'https://picsum.photos/seed/shop-cast-iron-skillet/900/900',
    16
  ),
  (
    'Bamboo Cutting Board Set',
    'Three boards in three sizes, end grain bamboo, with juice grooves on both sides. Oil them once and they last for years.',
    34.95,
    'https://picsum.photos/seed/shop-cutting-boards/900/900',
    50
  ),
  (
    'Scented Soy Candle Trio',
    'Three 200 g soy wax candles: cedar and vetiver, fig and leaf, amber and vanilla. Around 45 hours of burn time each.',
    28.00,
    'https://picsum.photos/seed/shop-candle-trio/900/900',
    60
  ),
  (
    'Insulated Water Bottle 750 ml',
    'Double walled stainless steel, keeps drinks cold for 24 hours and hot for 12. Leak proof lid, fits a bike bottle cage.',
    26.50,
    'https://picsum.photos/seed/shop-water-bottle/900/900',
    80
  );
