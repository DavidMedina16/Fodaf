-- ============================================================
-- FODAF — Actividades: comprador como referencia a `profiles`
-- ============================================================
-- Antes, `activity_sales.buyer_name` era texto libre. Ahora el
-- POS prefiere atribuir la venta a un miembro del fondo:
--   * `buyer_id` (FK a profiles) cuando el comprador es miembro.
--   * `buyer_name` (texto libre) queda como respaldo para
--     compradores externos (vecinos, invitados, etc.).
-- Ambos son opcionales; ventas sin comprador identificado siguen
-- siendo válidas. Solo se usa uno de los dos a la vez.
-- ============================================================

alter table activity_sales
  add column buyer_id uuid references profiles(id) on delete set null;

create index activity_sales_buyer_id_idx on activity_sales(buyer_id);

-- Solo uno de los dos puede estar presente (o ninguno).
alter table activity_sales
  add constraint activity_sales_buyer_one_of
  check (buyer_id is null or buyer_name is null);
