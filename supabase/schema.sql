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

alter table orders
  add column if not exists mercadopago_preference_id text,
  add column if not exists mercadopago_payment_id text,
  add column if not exists coupon_code text;

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

create or replace function public.register_customer(payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  customer_record customers%rowtype;
  customer_name_value text := trim(payload ->> 'name');
  customer_phone_value text := regexp_replace(payload ->> 'phone', '[^0-9+]', '', 'g');
begin
  if length(customer_name_value) < 2 or length(customer_name_value) > 120 then
    raise exception 'Informe um nome válido';
  end if;
  if length(customer_phone_value) < 10 or length(customer_phone_value) > 16 then
    raise exception 'Informe um WhatsApp válido';
  end if;

  insert into customers (
    name, phone, address, birthday, preferences, accepts_whatsapp
  ) values (
    customer_name_value,
    customer_phone_value,
    nullif(trim(payload ->> 'address'), ''),
    nullif(payload ->> 'birthday', '')::date,
    case
      when nullif(trim(payload ->> 'preference'), '') is null then '{}'
      else array[trim(payload ->> 'preference')]
    end,
    coalesce((payload ->> 'accepts_whatsapp')::boolean, false)
  )
  on conflict (phone) do update set
    name = excluded.name,
    address = coalesce(excluded.address, customers.address),
    birthday = coalesce(excluded.birthday, customers.birthday),
    preferences = case
      when cardinality(excluded.preferences) > 0 then excluded.preferences
      else customers.preferences
    end,
    accepts_whatsapp = excluded.accepts_whatsapp
  returning * into customer_record;

  return to_jsonb(customer_record);
end;
$$;

revoke all on function public.register_customer(jsonb) from public;
grant execute on function public.register_customer(jsonb) to anon, authenticated;

create or replace function public.save_customer_admin(payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  customer_record customers%rowtype;
  customer_id_value uuid := nullif(payload ->> 'id', '')::uuid;
  customer_name_value text := trim(payload ->> 'name');
  customer_phone_value text := regexp_replace(payload ->> 'phone', '[^0-9+]', '', 'g');
  preference_value text := nullif(trim(payload ->> 'preference'), '');
begin
  if not public.is_admin() then
    raise exception 'Acesso administrativo necessário';
  end if;
  if length(customer_name_value) < 2 or length(customer_name_value) > 120 then
    raise exception 'Informe um nome válido';
  end if;
  if length(customer_phone_value) < 10 or length(customer_phone_value) > 16 then
    raise exception 'Informe um WhatsApp válido com DDD';
  end if;

  if customer_id_value is not null then
    update customers set
      name = customer_name_value,
      phone = customer_phone_value,
      address = nullif(trim(payload ->> 'address'), ''),
      neighborhood = nullif(trim(payload ->> 'neighborhood'), ''),
      birthday = nullif(payload ->> 'birthday', '')::date,
      preferences = case when preference_value is null then '{}' else array[preference_value] end,
      accepts_whatsapp = coalesce((payload ->> 'accepts_whatsapp')::boolean, false),
      updated_at = now()
    where id = customer_id_value
    returning * into customer_record;
  else
    insert into customers (
      name, phone, address, neighborhood, birthday, preferences, accepts_whatsapp
    ) values (
      customer_name_value,
      customer_phone_value,
      nullif(trim(payload ->> 'address'), ''),
      nullif(trim(payload ->> 'neighborhood'), ''),
      nullif(payload ->> 'birthday', '')::date,
      case when preference_value is null then '{}' else array[preference_value] end,
      coalesce((payload ->> 'accepts_whatsapp')::boolean, false)
    )
    on conflict (phone) do update set
      name = excluded.name,
      address = excluded.address,
      neighborhood = excluded.neighborhood,
      birthday = excluded.birthday,
      preferences = excluded.preferences,
      accepts_whatsapp = excluded.accepts_whatsapp,
      updated_at = now()
    returning * into customer_record;
  end if;

  if customer_record.id is null then
    raise exception 'Cliente não localizado';
  end if;
  return to_jsonb(customer_record);
end;
$$;

revoke all on function public.save_customer_admin(jsonb) from public;
grant execute on function public.save_customer_admin(jsonb) to authenticated;

create or replace function public.validate_coupon(
  coupon_code text,
  order_subtotal numeric
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  coupon_record coupons%rowtype;
  discount_value_calculated numeric(12,2) := 0;
begin
  select * into coupon_record
  from coupons
  where upper(code) = upper(trim(coupon_code))
    and active = true
    and (starts_at is null or starts_at <= now())
    and (expires_at is null or expires_at >= now())
    and (usage_limit is null or usage_count < usage_limit);

  if coupon_record.id is null then
    raise exception 'Cupom inválido, expirado ou indisponível';
  end if;
  if order_subtotal < coupon_record.minimum_order then
    raise exception 'Este cupom exige pedido mínimo de R$ %', coupon_record.minimum_order;
  end if;

  discount_value_calculated := case coupon_record.discount_type
    when 'percentage' then round(order_subtotal * least(coupon_record.discount_value, 100) / 100, 2)
    when 'fixed' then least(coupon_record.discount_value, order_subtotal)
    else 0
  end;

  return jsonb_build_object(
    'code', coupon_record.code,
    'discount_type', coupon_record.discount_type,
    'discount_value', coupon_record.discount_value,
    'minimum_order', coupon_record.minimum_order,
    'discount', discount_value_calculated
  );
end;
$$;

revoke all on function public.validate_coupon(text, numeric) from public;
grant execute on function public.validate_coupon(text, numeric) to anon, authenticated;

create or replace function public.create_store_order(payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  new_order_id uuid;
  customer_record_id uuid;
  order_number_value text;
  item jsonb;
  product_record products%rowtype;
  coupon_record coupons%rowtype;
  item_quantity integer;
  item_gift_wrap boolean;
  subtotal_value numeric(12,2) := 0;
  delivery_fee_value numeric(12,2) := 0;
  discount_value_calculated numeric(12,2) := 0;
  total_value numeric(12,2) := 0;
  customer_name_value text := trim(payload ->> 'customer_name');
  customer_phone_value text := regexp_replace(payload ->> 'customer_phone', '[^0-9+]', '', 'g');
  neighborhood_value text := trim(payload ->> 'neighborhood');
  coupon_code_value text := upper(trim(coalesce(payload ->> 'coupon_code', '')));
begin
  if length(customer_name_value) < 2 or length(customer_name_value) > 120 then
    raise exception 'Informe um nome válido';
  end if;
  if length(customer_phone_value) < 10 or length(customer_phone_value) > 16 then
    raise exception 'Informe um WhatsApp válido';
  end if;
  if jsonb_typeof(payload -> 'items') <> 'array'
     or jsonb_array_length(payload -> 'items') = 0 then
    raise exception 'O pedido precisa conter produtos';
  end if;
  if jsonb_array_length(payload -> 'items') > 50 then
    raise exception 'Quantidade de itens acima do limite';
  end if;

  for item in select * from jsonb_array_elements(payload -> 'items')
  loop
    item_quantity := greatest(1, least(99, (item ->> 'quantity')::integer));
    item_gift_wrap := coalesce((item ->> 'gift_wrap')::boolean, false);

    select * into product_record
    from products
    where id = (item ->> 'product_id')::uuid
      and is_active = true
    for share;

    if product_record.id is null then
      raise exception 'Produto indisponível';
    end if;
    if product_record.stock < item_quantity then
      raise exception 'Estoque insuficiente para %', product_record.name;
    end if;

    subtotal_value := subtotal_value
      + (product_record.price * item_quantity)
      + (case when item_gift_wrap then 9.90 * item_quantity else 0 end);
  end loop;

  select coalesce(fee, 0) into delivery_fee_value
  from delivery_zones
  where name = neighborhood_value and active = true;
  delivery_fee_value := coalesce(delivery_fee_value, 0);

  if coupon_code_value <> '' then
    select * into coupon_record
    from coupons
    where upper(code) = coupon_code_value
      and active = true
      and (starts_at is null or starts_at <= now())
      and (expires_at is null or expires_at >= now())
      and (usage_limit is null or usage_count < usage_limit)
    for update;

    if coupon_record.id is null then
      raise exception 'Cupom inválido, expirado ou indisponível';
    end if;
    if subtotal_value < coupon_record.minimum_order then
      raise exception 'Este cupom exige pedido mínimo de R$ %', coupon_record.minimum_order;
    end if;

    discount_value_calculated := case coupon_record.discount_type
      when 'percentage' then round(subtotal_value * least(coupon_record.discount_value, 100) / 100, 2)
      when 'fixed' then least(coupon_record.discount_value, subtotal_value)
      else 0
    end;
  end if;

  total_value := greatest(subtotal_value - discount_value_calculated, 0) + delivery_fee_value;
  order_number_value := 'AE-' || to_char(clock_timestamp(), 'YYMMDD-HH24MISS')
    || '-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 4));

  insert into customers (
    name, phone, address, neighborhood, birthday, accepts_whatsapp
  ) values (
    customer_name_value,
    customer_phone_value,
    nullif(trim(payload ->> 'address'), ''),
    nullif(neighborhood_value, ''),
    nullif(payload ->> 'birthday', '')::date,
    false
  )
  on conflict (phone) do update set
    name = excluded.name,
    address = coalesce(excluded.address, customers.address),
    neighborhood = coalesce(excluded.neighborhood, customers.neighborhood),
    birthday = coalesce(excluded.birthday, customers.birthday)
  returning id into customer_record_id;

  insert into orders (
    order_number, customer_id, customer_name, customer_phone,
    delivery_type, address, neighborhood, delivery_fee,
    subtotal, discount, total, status, gift_message, notes, coupon_code
  ) values (
    order_number_value,
    customer_record_id,
    customer_name_value,
    customer_phone_value,
    case when neighborhood_value = 'Retirada na loja' then 'pickup' else 'delivery' end,
    nullif(trim(payload ->> 'address'), ''),
    nullif(neighborhood_value, ''),
    delivery_fee_value,
    subtotal_value,
    discount_value_calculated,
    total_value,
    'awaiting_payment',
    nullif(left(payload ->> 'gift_message', 500), ''),
    nullif(left(payload ->> 'notes', 1000), ''),
    nullif(coupon_code_value, '')
  )
  returning id into new_order_id;

  for item in select * from jsonb_array_elements(payload -> 'items')
  loop
    item_quantity := greatest(1, least(99, (item ->> 'quantity')::integer));
    item_gift_wrap := coalesce((item ->> 'gift_wrap')::boolean, false);
    select * into product_record
    from products
    where id = (item ->> 'product_id')::uuid and is_active = true;

    insert into order_items (
      order_id, product_id, product_name, unit_price, quantity, gift_wrap
    ) values (
      new_order_id,
      product_record.id,
      product_record.name,
      product_record.price,
      item_quantity,
      item_gift_wrap
    );
  end loop;

  return jsonb_build_object(
    'id', new_order_id,
    'order_number', order_number_value,
    'discount', discount_value_calculated,
    'total', total_value
  );
end;
$$;

revoke all on function public.create_store_order(jsonb) from public;
grant execute on function public.create_store_order(jsonb) to anon, authenticated;

create or replace function public.get_order_payment_quote(order_number_value text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  order_record orders%rowtype;
  item_count_value integer;
begin
  select * into order_record
  from orders
  where order_number = trim(order_number_value)
    and status in ('awaiting_payment', 'received');

  if order_record.id is null then
    raise exception 'Pedido não encontrado ou indisponível para pagamento';
  end if;

  select coalesce(sum(quantity), 0)::integer into item_count_value
  from order_items
  where order_id = order_record.id;

  return jsonb_build_object(
    'order_number', order_record.order_number,
    'total', order_record.total,
    'item_count', item_count_value
  );
end;
$$;

revoke all on function public.get_order_payment_quote(text) from public;
grant execute on function public.get_order_payment_quote(text) to anon, authenticated;

create or replace function public.fulfill_paid_order()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  item_record record;
begin
  if new.status = 'paid' and old.status <> 'paid' then
    for item_record in
      select product_id, product_name, quantity
      from order_items
      where order_id = new.id
    loop
      update products
      set stock = stock - item_record.quantity
      where id = item_record.product_id
        and stock >= item_record.quantity;
      if not found then
        raise exception 'Estoque insuficiente para %', item_record.product_name;
      end if;
    end loop;
    update customers
    set loyalty_purchases = loyalty_purchases + 1
    where id = new.customer_id;

    if new.coupon_code is not null then
      update coupons
      set usage_count = usage_count + 1
      where upper(code) = upper(new.coupon_code);
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists orders_fulfill_payment on orders;
create trigger orders_fulfill_payment
before update of status on orders
for each row execute function public.fulfill_paid_order();

create index if not exists products_category_idx on products(category_id);
create index if not exists products_active_idx on products(is_active);
create index if not exists products_code_idx on products(code);
create index if not exists orders_status_idx on orders(status);
create index if not exists orders_created_at_idx on orders(created_at desc);
create index if not exists sales_created_at_idx on sales(created_at desc);
create index if not exists customers_birthday_idx on customers(birthday);
create index if not exists coupons_code_upper_idx on coupons(upper(code));

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

with seed (
  code, category_slug, name, slug, brand, product_type, description,
  cost_price, price, compare_at_price, stock, image_url, badge, adult_only
) as (values
  ('AND-001','perfumes-femininos','Aura Élégance','aura-elegance-and-001','Andora Selection','Eau de Parfum','Floral âmbar elegante, com saída luminosa e fundo envolvente.',98.00,189.90,229.90,12,'https://images.unsplash.com/photo-1541643600914-78b084683601?auto=format&fit=crop&w=900&q=86','Mais vendido',false),
  ('AND-002','perfumes-masculinos','Noble Intense','noble-intense-and-002','Andora Selection','Eau de Parfum','Madeiras nobres, especiarias quentes e assinatura marcante.',116.00,219.90,null,7,'https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&w=900&q=86','Lançamento',false),
  ('AND-003','perfumes-importados','Maison Dorée','maison-doree-and-003','Maison','Importado','Uma fragrância sofisticada para ocasiões inesquecíveis.',214.00,349.90,null,4,'https://images.unsplash.com/photo-1587017539504-67cfbddac569?auto=format&fit=crop&w=900&q=86','Exclusivo',false),
  ('AND-004','contratipos','Essência 214','essencia-214-and-004','Essencial','Contratipo','Alta fixação e personalidade, inspirada em grandes clássicos.',36.00,79.90,null,18,'https://images.unsplash.com/photo-1619994403073-2cec844b8e63?auto=format&fit=crop&w=900&q=86','Favorito',false),
  ('AND-005','chocolates','Caixa Cacau Nobre','caixa-cacau-nobre-and-005','Cacau Nobre','Chocolate fino','Seleção de bombons finos em embalagem especial.',38.00,69.90,null,20,'https://images.unsplash.com/photo-1549007994-cb92caebd54b?auto=format&fit=crop&w=900&q=86','Presenteável',false),
  ('AND-006','kits-presente','Ritual de Carinho','ritual-de-carinho-and-006','Andora','Kit','Perfume, chocolate fino, cartão e embalagem premium.',87.00,159.90,179.90,8,'https://images.unsplash.com/photo-1602173574767-37ac01994b2a?auto=format&fit=crop&w=900&q=86','Kit especial',false),
  ('AND-007','cosmeticos','Velvet Body Cream','velvet-body-cream-and-007','Andora Beauty','Hidratante','Textura aveludada, fragrância delicada e hidratação profunda.',24.50,54.90,null,15,'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?auto=format&fit=crop&w=900&q=86',null,false),
  ('AND-008','produtos-especiais','Noir Privé','noir-prive-and-008','Linha Íntima','Bem-estar','Item de bem-estar íntimo em embalagem reservada e envio discreto.',61.00,119.90,null,9,'https://images.unsplash.com/photo-1615634260167-c8cdede054de?auto=format&fit=crop&w=900&q=80','+18',true)
)
insert into products (
  code, category_id, name, slug, brand, product_type, description,
  cost_price, price, compare_at_price, stock, image_url, badge,
  adult_only, is_featured, is_promotion, is_launch, is_active
)
select
  seed.code, categories.id, seed.name, seed.slug, seed.brand,
  seed.product_type, seed.description, seed.cost_price, seed.price,
  seed.compare_at_price, seed.stock, seed.image_url, seed.badge,
  seed.adult_only,
  seed.code in ('AND-001','AND-002','AND-006'),
  seed.compare_at_price is not null,
  seed.code = 'AND-002',
  true
from seed
join categories on categories.slug = seed.category_slug
on conflict (code) do nothing;

insert into delivery_zones (name, fee) values
  ('Centro', 5.00),
  ('Bairro Novo', 7.00),
  ('Portelinha', 8.00),
  ('Outro bairro', 10.00),
  ('Retirada na loja', 0.00)
on conflict (name) do update set fee = excluded.fee, active = true;

insert into coupons (
  code, discount_type, discount_value, minimum_order, active
) values
  ('ANDORA15', 'percentage', 15.00, 0.00, true),
  ('BEMVINDA10', 'percentage', 10.00, 0.00, true)
on conflict (code) do nothing;

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
