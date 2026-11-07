-- Marktly Datenbank: im Supabase SQL Editor komplett ausführen.
-- Wichtig: Dein Admin-Profil wird NICHT automatisch freigeschaltet.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  is_admin boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text not null default '',
  category text not null default 'Sonstiges',
  sale_price numeric(10,2) not null check (sale_price > 0),
  cost_price numeric(10,2) not null default 0 check (cost_price >= 0),
  stock integer not null default 0 check (stock >= 0),
  image_url text not null default '',
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  customer_email text,
  total_amount numeric(10,2) not null default 0,
  payment_status text not null default 'pending'
    check (payment_status in ('pending','paid','refunded','failed')),
  payment_provider text,
  provider_reference text,
  created_at timestamptz not null default now()
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  product_name text not null,
  quantity integer not null check (quantity > 0),
  sale_price_snapshot numeric(10,2) not null,
  cost_price_snapshot numeric(10,2) not null
);

alter table public.profiles enable row level security;
alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

-- Kunden dürfen nur aktive Produkte lesen.
create policy "Public can view active products"
on public.products for select
using (active = true or exists (
  select 1 from public.profiles
  where profiles.id = auth.uid() and profiles.is_admin = true
));

-- Nur ein freigeschalteter Admin darf Produkte ändern.
create policy "Admins manage products"
on public.products for all
using (exists (select 1 from public.profiles where profiles.id = auth.uid() and profiles.is_admin = true))
with check (exists (select 1 from public.profiles where profiles.id = auth.uid() and profiles.is_admin = true));

-- Admin kann nur das eigene Profil lesen.
create policy "Users read own profile"
on public.profiles for select
using (id = auth.uid());

create policy "Admins read orders"
on public.orders for select
using (exists (select 1 from public.profiles where profiles.id = auth.uid() and profiles.is_admin = true));

create policy "Admins read order items"
on public.order_items for select
using (exists (select 1 from public.profiles where profiles.id = auth.uid() and profiles.is_admin = true));

-- Bildspeicher
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

create policy "Public read product images"
on storage.objects for select
using (bucket_id = 'product-images');

create policy "Admins upload product images"
on storage.objects for insert
with check (
  bucket_id = 'product-images'
  and exists (select 1 from public.profiles where profiles.id = auth.uid() and profiles.is_admin = true)
);

create policy "Admins update product images"
on storage.objects for update
using (
  bucket_id = 'product-images'
  and exists (select 1 from public.profiles where profiles.id = auth.uid() and profiles.is_admin = true)
);

create policy "Admins delete product images"
on storage.objects for delete
using (
  bucket_id = 'product-images'
  and exists (select 1 from public.profiles where profiles.id = auth.uid() and profiles.is_admin = true)
);

-- Nach dem Anlegen deines Benutzers im Supabase Auth Bereich:
-- Ersetze DEINE-USER-UUID und führe diese Zeile separat aus:
-- insert into public.profiles (id, is_admin) values ('DEINE-USER-UUID', true)
-- on conflict (id) do update set is_admin = true;
