-- Run this script in Supabase SQL Editor.
create extension if not exists pgcrypto;

create table if not exists public.products (
 id uuid primary key default gen_random_uuid(),
 name text not null,
 description text,
 mrp numeric(12,2) not null default 0 check (mrp >= 0),
 price numeric(12,2) not null default 0 check (price >= 0),
 stock integer not null default 0 check (stock >= 0),
 images text[] not null default '{}',
 active boolean not null default true,
 created_at timestamptz not null default now()
);

create table if not exists public.banners (
 id uuid primary key default gen_random_uuid(),
 slot text not null check (slot in ('top','slider')),
 image_url text not null,
 target_url text,
 active boolean not null default true,
 sort_order integer not null default 1,
 created_at timestamptz not null default now()
);

create table if not exists public.orders (
 id uuid primary key default gen_random_uuid(),
 user_id uuid references auth.users(id) on delete set null,
 customer_name text not null,
 phone text not null,
 address text not null,
 items jsonb not null,
 total numeric(12,2) not null check (total >= 0),
 status text not null default 'Pending' check (status in ('Pending','Confirmed','Processing','Shipped','Delivered','Cancelled')),
 created_at timestamptz not null default now()
);

alter table public.products enable row level security;
alter table public.banners enable row level security;
alter table public.orders enable row level security;

-- Public can read active products and active banners.
create policy "Public read active products" on public.products for select using (active = true);
create policy "Public read active banners" on public.banners for select using (active = true);

-- Admins are designated in app_metadata.role = 'admin'.
create policy "Admins manage products" on public.products for all
 using ((auth.jwt()->'app_metadata'->>'role') = 'admin')
 with check ((auth.jwt()->'app_metadata'->>'role') = 'admin');
create policy "Admins manage banners" on public.banners for all
 using ((auth.jwt()->'app_metadata'->>'role') = 'admin')
 with check ((auth.jwt()->'app_metadata'->>'role') = 'admin');

-- Customers can read only their own orders. Admins can read and update all orders.
create policy "Customers read own orders" on public.orders for select
 using (auth.uid() = user_id or (auth.jwt()->'app_metadata'->>'role') = 'admin');
create policy "Customers create orders" on public.orders for insert
 with check (user_id is null or auth.uid() = user_id);
create policy "Admins manage orders" on public.orders for all
 using ((auth.jwt()->'app_metadata'->>'role') = 'admin')
 with check ((auth.jwt()->'app_metadata'->>'role') = 'admin');

-- Recommended: create a private admin user in Supabase Auth, then set app_metadata.role = admin
-- from a trusted server/Admin API only. Never expose the service_role key in frontend code.

-- Store profile/settings (run this block if the core schema was already installed).
create table if not exists public.store_settings (
 id boolean primary key default true check (id = true),
 store_name text not null default 'My Store',
 about_text text not null default '',
 phone text not null default '',
 email text not null default '',
 address text not null default '',
 updated_at timestamptz not null default now()
);
alter table public.store_settings enable row level security;
drop policy if exists "Public read store settings" on public.store_settings;
create policy "Public read store settings" on public.store_settings for select using (true);
drop policy if exists "Admins manage store settings" on public.store_settings;
create policy "Admins manage store settings" on public.store_settings for all
 using ((auth.jwt()->'app_metadata'->>'role') = 'admin')
 with check ((auth.jwt()->'app_metadata'->>'role') = 'admin');
insert into public.store_settings (id) values (true) on conflict (id) do nothing;
