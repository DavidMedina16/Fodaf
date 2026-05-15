-- ============================================================
-- FODAF — Migración: Punto de Venta (POS) e Inventario de actividades
-- ============================================================
-- Reestructura el módulo de Actividades:
--   * Los totales financieros dejan de almacenarse manualmente en
--     `activities` (columnas `costs` y `net_profits`). Ahora se
--     derivan en tiempo real de gastos, inventario y ventas.
--   * `activity_expenses` — gastos generales del evento.
--   * `activity_products` — inventario de productos para el POS.
--   * `activity_sales`    — ventas registradas por los miembros.
-- ============================================================

-- ------------------------------------------------------------
-- 1. activities: eliminar los totales manuales (única fuente de
--    la verdad = expenses + products + sales).
-- ------------------------------------------------------------
alter table activities drop column costs;
alter table activities drop column net_profits;

-- ------------------------------------------------------------
-- 2. activity_expenses — gastos generales (ej. alquiler de sillas)
-- ------------------------------------------------------------
create table activity_expenses (
  id uuid default gen_random_uuid() primary key,
  activity_id uuid not null references activities(id) on delete cascade,
  description text not null,
  amount numeric not null check (amount > 0),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index activity_expenses_activity_id_idx on activity_expenses(activity_id);

-- ------------------------------------------------------------
-- 3. activity_products — inventario del evento
--    stock_quantity = cantidad física comprada/disponible.
-- ------------------------------------------------------------
create table activity_products (
  id uuid default gen_random_uuid() primary key,
  activity_id uuid not null references activities(id) on delete cascade,
  name text not null,
  cost_price numeric not null check (cost_price >= 0),
  selling_price numeric not null check (selling_price >= 0),
  stock_quantity integer not null check (stock_quantity >= 0),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index activity_products_activity_id_idx on activity_products(activity_id);

-- ------------------------------------------------------------
-- 4. activity_sales — ventas registradas desde el POS
--    total_price lo calcula un trigger a partir del precio de
--    venta del producto en el momento de la venta.
-- ------------------------------------------------------------
create table activity_sales (
  id uuid default gen_random_uuid() primary key,
  activity_id uuid not null references activities(id) on delete cascade,
  seller_id uuid not null references profiles(id),
  buyer_name text,
  product_id uuid not null references activity_products(id) on delete cascade,
  quantity integer not null check (quantity > 0),
  total_price numeric not null default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index activity_sales_activity_id_idx on activity_sales(activity_id);
create index activity_sales_product_id_idx on activity_sales(product_id);

-- Trigger: total_price = quantity * selling_price del producto.
-- Garantiza la "única fuente de la verdad" sin confiar en el cliente.
create or replace function public.set_sale_total_price()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  v_selling_price numeric;
begin
  select selling_price into v_selling_price
  from activity_products
  where id = new.product_id;

  new.total_price := coalesce(v_selling_price, 0) * new.quantity;
  return new;
end;
$$;

create trigger trg_set_sale_total_price
  before insert or update on activity_sales
  for each row execute function public.set_sale_total_price();

-- ------------------------------------------------------------
-- 5. RLS — mismo patrón que el resto del esquema:
--    SELECT/INSERT cualquier autenticado, UPDATE/DELETE solo admin.
--    (Los miembros registran ventas; el admin gestiona inventario
--    y gastos, y es el único que puede editar/eliminar.)
-- ------------------------------------------------------------
alter table activity_expenses enable row level security;
alter table activity_products enable row level security;
alter table activity_sales    enable row level security;

-- activity_expenses
create policy "activity_expenses_select_auth" on activity_expenses
  for select to authenticated using (true);
create policy "activity_expenses_insert_auth" on activity_expenses
  for insert to authenticated with check (true);
create policy "activity_expenses_update_admin" on activity_expenses
  for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "activity_expenses_delete_admin" on activity_expenses
  for delete to authenticated using (public.is_admin());

-- activity_products
create policy "activity_products_select_auth" on activity_products
  for select to authenticated using (true);
create policy "activity_products_insert_auth" on activity_products
  for insert to authenticated with check (true);
create policy "activity_products_update_admin" on activity_products
  for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "activity_products_delete_admin" on activity_products
  for delete to authenticated using (public.is_admin());

-- activity_sales
create policy "activity_sales_select_auth" on activity_sales
  for select to authenticated using (true);
create policy "activity_sales_insert_auth" on activity_sales
  for insert to authenticated with check (true);
create policy "activity_sales_update_admin" on activity_sales
  for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "activity_sales_delete_admin" on activity_sales
  for delete to authenticated using (public.is_admin());

-- ------------------------------------------------------------
-- 6. Realtime — el dashboard del admin y el POS de los miembros
--    se actualizan en vivo a medida que se registran ventas.
-- ------------------------------------------------------------
alter publication supabase_realtime add table activity_expenses;
alter publication supabase_realtime add table activity_products;
alter publication supabase_realtime add table activity_sales;
