-- Base de dados preparada para a integração da Andora Essence.
-- Execute no SQL Editor do Supabase e ative as políticas RLS antes de publicar.

create extension if not exists "pgcrypto";

create table categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  adult_only boolean not null default false,
  created_at timestamptz not null default now()
);

create table products (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references categories(id),
  name text not null,
  slug text not null unique,
  brand text,
  product_type text,
  description text,
  price numeric(10,2) not null check (price >= 0),
  compare_at_price numeric(10,2),
  stock integer not null default 0 check (stock >= 0),
  image_url text,
  is_featured boolean not null default false,
  is_promotion boolean not null default false,
  is_launch boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table customers (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique,
  name text not null,
  phone text not null unique,
  address text,
  neighborhood text,
  birthday date,
  preferences text[],
  accepts_whatsapp boolean not null default false,
  loyalty_purchases integer not null default 0,
  created_at timestamptz not null default now()
);

create table orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,
  customer_id uuid references customers(id),
  customer_name text not null,
  customer_phone text not null,
  delivery_type text not null check (delivery_type in ('pickup','delivery')),
  address text,
  neighborhood text,
  delivery_fee numeric(10,2) not null default 0,
  subtotal numeric(10,2) not null,
  discount numeric(10,2) not null default 0,
  total numeric(10,2) not null,
  status text not null default 'received' check (status in ('received','awaiting_payment','paid','separating','out_for_delivery','delivered','cancelled')),
  pix_txid text,
  gift_message text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  product_id uuid references products(id),
  product_name text not null,
  unit_price numeric(10,2) not null,
  quantity integer not null check (quantity > 0),
  gift_wrap boolean not null default false
);

create table favorites (
  customer_id uuid references customers(id) on delete cascade,
  product_id uuid references products(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (customer_id, product_id)
);

create table coupons (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  discount_type text not null check (discount_type in ('percentage','fixed','gift_wrap')),
  discount_value numeric(10,2) not null default 0,
  minimum_order numeric(10,2) not null default 0,
  active boolean not null default true,
  starts_at timestamptz,
  expires_at timestamptz,
  usage_limit integer,
  usage_count integer not null default 0
);

create table expenses (
  id uuid primary key default gen_random_uuid(),
  description text not null,
  category text not null,
  amount numeric(10,2) not null check (amount >= 0),
  expense_date date not null default current_date,
  payment_method text,
  created_at timestamptz not null default now()
);

create table delivery_zones (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  fee numeric(10,2) not null default 0,
  active boolean not null default true
);

insert into delivery_zones (name, fee) values
  ('Centro', 5.00),
  ('Bairro Novo', 7.00),
  ('Portelinha', 8.00),
  ('Outra localidade', 10.00);

create index products_category_idx on products(category_id);
create index products_active_idx on products(is_active);
create index orders_status_idx on orders(status);
create index orders_created_at_idx on orders(created_at desc);
create index customers_birthday_idx on customers(birthday);

alter table categories enable row level security;
alter table products enable row level security;
alter table customers enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;
alter table favorites enable row level security;
alter table coupons enable row level security;
alter table expenses enable row level security;
alter table delivery_zones enable row level security;

create policy "public can read active products" on products for select using (is_active = true);
create policy "public can read categories" on categories for select using (true);
create policy "public can read delivery zones" on delivery_zones for select using (active = true);
