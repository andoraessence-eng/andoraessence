-- Andora Essence — estrutura de produção
-- Execute este arquivo uma única vez no SQL Editor do Supabase.

create extension if not exists "pgcrypto";

create table if not exists categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  adult_only boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references categories(id),
  code text unique,
  name text not null,
  slug text not null unique,
  brand text,
  product_type text,
  description text,
  cost_price numeric(12,2) not null default 0 check (cost_price >= 0),
  price numeric(12,2) not null check (price >= 0),
  compare_at_price numeric(12,2),
  stock integer not null default 0 check (stock >= 0),
  image_url text,
  badge text,
  adult_only boolean not null default false,
  is_featured boolean not null default false,
  is_promotion boolean not null default false,
  is_launch boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists customers (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique references auth.users(id) on delete set null,
  name text not null,
  phone text not null unique,
  address text,
  neighborhood text,
  birthday date,
  preferences text[] not null default '{}',
  accepts_whatsapp boolean not null default false,
  loyalty_purchases integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,
  customer_id uuid references customers(id),
  customer_name text not null,
  customer_phone text not null,
  delivery_type text not null check (delivery_type in ('pickup','delivery')),
  address text,
  neighborhood text,
  delivery_fee numeric(12,2) not null default 0,
  subtotal numeric(12,2) not null,
  discount numeric(12,2) not null default 0,
  total numeric(12,2) not null,
  status text not null default 'received' check (
    status in (
      'received','awaiting_payment','paid','separating',
      'out_for_delivery','delivered','cancelled'
    )
  ),
  pix_txid text,
  gift_message text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  product_id uuid references products(id),
  product_name text not null,
  unit_price numeric(12,2) not null,
  quantity integer not null check (quantity > 0),
  gift_wrap boolean not null default false
);

create table if not exists sales (
  id uuid primary key default gen_random_uuid(),
  sale_number text not null unique,
  status text not null default 'paid' check (status in ('paid','pending','cancelled')),
  customer_name text,
  due_date date,
  revenue numeric(12,2) not null check (revenue >= 0),
  cost numeric(12,2) not null check (cost >= 0),
  profit numeric(12,2) not null,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create table if not exists sale_items (
  id uuid primary key default gen_random_uuid(),
  sale_id uuid not null references sales(id) on delete cascade,
  product_id uuid references products(id),
  product_code text not null,
  product_name text not null,
  unit_price numeric(12,2) not null,
  unit_cost numeric(12,2) not null,
  quantity integer not null check (quantity > 0)
);

create table if not exists sale_payments (
  id uuid primary key default gen_random_uuid(),
  sale_id uuid not null references sales(id) on delete cascade,
  method text not null check (method in ('Dinheiro','Pix','Débito','Crédito')),
  amount numeric(12,2) not null check (amount > 0)
);

create table if not exists favorites (
  customer_id uuid references customers(id) on delete cascade,
  product_id uuid references products(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (customer_id, product_id)
);

create table if not exists coupons (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  discount_type text not null check (
    discount_type in ('percentage','fixed','gift_wrap')
  ),
  discount_value numeric(12,2) not null default 0,
  minimum_order numeric(12,2) not null default 0,
  active boolean not null default true,
  starts_at timestamptz,
  expires_at timestamptz,
  usage_limit integer,
  usage_count integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists expenses (
  id uuid primary key default gen_random_uuid(),
  description text not null,
  category text not null,
  amount numeric(12,2) not null check (amount >= 0),
  expense_date date not null default current_date,
  payment_method text,
  is_recurring boolean not null default false,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create table if not exists recurring_expenses (
  id uuid primary key default gen_random_uuid(),
  description text not null,
  category text not null,
  amount numeric(12,2) not null check (amount >= 0),
  due_day integer not null check (due_day between 1 and 31),
  active boolean not null default true,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create table if not exists cash_withdrawals (
  id uuid primary key default gen_random_uuid(),
  amount numeric(12,2) not null check (amount > 0),
  reason text not null,
  responsible_user uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create table if not exists publications (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  subtitle text,
  theme text,
  image_url text,
  starts_at timestamptz,
  ends_at timestamptz,
  is_published boolean not null default false,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists customer_campaigns (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  audience_filter jsonb not null default '{}'::jsonb,
  message_template text not null,
  image_url text,
  status text not null default 'draft' check (
    status in ('draft','scheduled','sending','sent','cancelled')
  ),
  scheduled_at timestamptz,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create table if not exists delivery_zones (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  fee numeric(12,2) not null default 0,
  active boolean not null default true
);

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    lower(auth.jwt() ->> 'email') = 'andoraessence@gmail.com',
    false
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists products_touch_updated_at on products;
create trigger products_touch_updated_at
before update on products
for each row execute function public.touch_updated_at();

drop trigger if exists customers_touch_updated_at on customers;
create trigger customers_touch_updated_at
before update on customers
for each row execute function public.touch_updated_at();

drop trigger if exists publications_touch_updated_at on publications;
create trigger publications_touch_updated_at
before update on publications
for each row execute function public.touch_updated_at();

create or replace function public.complete_pos_sale(payload jsonb)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  new_sale_id uuid;
  item jsonb;
  payment jsonb;
  current_stock integer;
begin
  if not public.is_admin() then
    raise exception 'Acesso administrativo necessário';
  end if;

  if jsonb_array_length(payload -> 'items') = 0 then
    raise exception 'A venda precisa conter produtos';
  end if;

  for item in select * from jsonb_array_elements(payload -> 'items')
  loop
    select stock into current_stock
    from products
    where id = (item ->> 'product_id')::uuid
    for update;

    if current_stock is null then
      raise exception 'Produto não encontrado';
    end if;
    if current_stock < (item ->> 'quantity')::integer then
      raise exception 'Estoque insuficiente para %', item ->> 'product_name';
    end if;
  end loop;

  insert into sales (
    sale_number, status, customer_name, due_date,
    revenue, cost, profit, created_by
  ) values (
    payload ->> 'sale_number',
    payload ->> 'status',
    nullif(payload ->> 'customer_name', ''),
    nullif(payload ->> 'due_date', '')::date,
    (payload ->> 'revenue')::numeric,
    (payload ->> 'cost')::numeric,
    (payload ->> 'profit')::numeric,
    auth.uid()
  )
  returning id into new_sale_id;

  for item in select * from jsonb_array_elements(payload -> 'items')
  loop
    insert into sale_items (
      sale_id, product_id, product_code, product_name,
      unit_price, unit_cost, quantity
    ) values (
      new_sale_id,
      (item ->> 'product_id')::uuid,
      item ->> 'product_code',
      item ->> 'product_name',
      (item ->> 'unit_price')::numeric,
      (item ->> 'unit_cost')::numeric,
      (item ->> 'quantity')::integer
    );

    update products
    set stock = stock - (item ->> 'quantity')::integer
    where id = (item ->> 'product_id')::uuid;
  end loop;

  for payment in select * from jsonb_array_elements(payload -> 'payments')
  loop
    insert into sale_payments (sale_id, method, amount)
    values (
      new_sale_id,
      payment ->> 'method',
      (payment ->> 'amount')::numeric
    );
  end loop;

  return new_sale_id;
end;
$$;

revoke all on function public.complete_pos_sale(jsonb) from public;
grant execute on function public.complete_pos_sale(jsonb) to authenticated;

create index if not exists products_category_idx on products(category_id);
create index if not exists products_active_idx on products(is_active);
create index if not exists products_code_idx on products(code);
create index if not exists orders_status_idx on orders(status);
create index if not exists orders_created_at_idx on orders(created_at desc);
create index if not exists sales_created_at_idx on sales(created_at desc);
create index if not exists customers_birthday_idx on customers(birthday);

alter table categories enable row level security;
alter table products enable row level security;
alter table customers enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;
alter table sales enable row level security;
alter table sale_items enable row level security;
alter table sale_payments enable row level security;
alter table favorites enable row level security;
alter table coupons enable row level security;
alter table expenses enable row level security;
alter table recurring_expenses enable row level security;
alter table cash_withdrawals enable row level security;
alter table publications enable row level security;
alter table customer_campaigns enable row level security;
alter table delivery_zones enable row level security;

drop policy if exists "public read categories" on categories;
create policy "public read categories"
on categories for select using (true);

drop policy if exists "public read active products" on products;
create policy "public read active products"
on products for select using (is_active = true or public.is_admin());

drop policy if exists "public read delivery zones" on delivery_zones;
create policy "public read delivery zones"
on delivery_zones for select using (active = true or public.is_admin());

drop policy if exists "public read published content" on publications;
create policy "public read published content"
on publications for select using (
  public.is_admin()
  or (
    is_published = true
    and (starts_at is null or starts_at <= now())
    and (ends_at is null or ends_at >= now())
  )
);

drop policy if exists "public customer registration" on customers;
create policy "public customer registration"
on customers for insert with check (true);

drop policy if exists "customer self read" on customers;
create policy "customer self read"
on customers for select using (
  auth_user_id = auth.uid() or public.is_admin()
);

drop policy if exists "admin categories" on categories;
create policy "admin categories" on categories
for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "admin products" on products;
create policy "admin products" on products
for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "admin customers" on customers;
create policy "admin customers" on customers
for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "admin orders" on orders;
create policy "admin orders" on orders
for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "admin order items" on order_items;
create policy "admin order items" on order_items
for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "admin sales" on sales;
create policy "admin sales" on sales
for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "admin sale items" on sale_items;
create policy "admin sale items" on sale_items
for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "admin sale payments" on sale_payments;
create policy "admin sale payments" on sale_payments
for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "admin favorites" on favorites;
create policy "admin favorites" on favorites
for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "admin coupons" on coupons;
create policy "admin coupons" on coupons
for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "admin expenses" on expenses;
create policy "admin expenses" on expenses
for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "admin recurring expenses" on recurring_expenses;
create policy "admin recurring expenses" on recurring_expenses
for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "admin withdrawals" on cash_withdrawals;
create policy "admin withdrawals" on cash_withdrawals
for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "admin publications" on publications;
create policy "admin publications" on publications
for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "admin campaigns" on customer_campaigns;
create policy "admin campaigns" on customer_campaigns
for all using (public.is_admin()) with check (public.is_admin());

insert into categories (name, slug, adult_only) values
  ('Perfumes femininos', 'perfumes-femininos', false),
  ('Perfumes masculinos', 'perfumes-masculinos', false),
  ('Perfumes importados', 'perfumes-importados', false),
  ('Contratipos', 'contratipos', false),
  ('Chocolates', 'chocolates', false),
  ('Kits presente', 'kits-presente', false),
  ('Cosméticos', 'cosmeticos', false),
  ('Produtos Especiais', 'produtos-especiais', true)
on conflict (slug) do update set
  name = excluded.name,
  adult_only = excluded.adult_only;

insert into delivery_zones (name, fee) values
  ('Centro', 5.00),
  ('Bairro Novo', 7.00),
  ('Portelinha', 8.00),
  ('Outro bairro', 10.00),
  ('Retirada na loja', 0.00)
on conflict (name) do update set fee = excluded.fee, active = true;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  (
    'product-images',
    'product-images',
    true,
    5000000,
    array['image/jpeg','image/png','image/webp']
  ),
  (
    'campaign-images',
    'campaign-images',
    true,
    6000000,
    array['image/jpeg','image/png','image/webp']
  )
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "public read Andora images" on storage.objects;
create policy "public read Andora images"
on storage.objects for select using (
  bucket_id in ('product-images','campaign-images')
);

drop policy if exists "admin upload Andora images" on storage.objects;
create policy "admin upload Andora images"
on storage.objects for insert to authenticated
with check (
  bucket_id in ('product-images','campaign-images')
  and public.is_admin()
);

drop policy if exists "admin update Andora images" on storage.objects;
create policy "admin update Andora images"
on storage.objects for update to authenticated
using (public.is_admin()) with check (public.is_admin());

drop policy if exists "admin delete Andora images" on storage.objects;
create policy "admin delete Andora images"
on storage.objects for delete to authenticated
using (public.is_admin());
