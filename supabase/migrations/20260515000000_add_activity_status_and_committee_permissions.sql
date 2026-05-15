-- ============================================================
-- FODAF — Actividades: estado + permisos por comité
-- ============================================================
-- Cambios:
--   * `activities.status` (`in_progress` | `finished`) — controla
--     si la actividad está abierta para edición o ya está cerrada.
--   * `activities.finished_at` — fecha de cierre.
--   * Helpers `is_activity_committee_member()` e
--     `is_activity_editable()`.
--   * RPCs `finish_activity()` / `reopen_activity()` para cambiar
--     el estado sin abrir UPDATE sobre `activities` a no-admins.
--   * RLS de gastos / productos / ventas pasa a delegar en
--     `is_activity_editable()`: admin O miembro del comité,
--     siempre que la actividad esté `in_progress`.
-- ============================================================

-- ------------------------------------------------------------
-- 1. Columnas nuevas en `activities`
-- ------------------------------------------------------------
alter table activities
  add column status text not null default 'in_progress'
    check (status in ('in_progress', 'finished'));

alter table activities
  add column finished_at timestamp with time zone;

-- ------------------------------------------------------------
-- 2. Helpers de permisos
-- ------------------------------------------------------------

-- `true` si el usuario autenticado pertenece al comité asignado
-- a la actividad. Si la actividad no tiene comité, devuelve `false`.
create or replace function public.is_activity_committee_member(p_activity_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1
    from activities a
    join team_members tm on tm.team_id = a.team_id
    where a.id = p_activity_id
      and tm.profile_id = auth.uid()
  );
$$;

-- `true` si la actividad puede ser modificada por el usuario:
-- admin (siempre que esté `in_progress`) o miembro del comité.
-- Una actividad `finished` es read-only para todos hasta que
-- el admin la reabra con `reopen_activity()`.
create or replace function public.is_activity_editable(p_activity_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1
    from activities a
    where a.id = p_activity_id
      and a.status = 'in_progress'
      and (public.is_admin() or public.is_activity_committee_member(p_activity_id))
  );
$$;

grant execute on function public.is_activity_committee_member(uuid) to authenticated;
grant execute on function public.is_activity_editable(uuid) to authenticated;

-- ------------------------------------------------------------
-- 3. RPCs para cambiar el estado
-- ------------------------------------------------------------

-- Marca una actividad como finalizada. Solo admin o un miembro
-- del comité asignado. Falla si ya está finalizada.
create or replace function public.finish_activity(p_activity_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_status text;
begin
  select status into v_status from activities where id = p_activity_id;

  if v_status is null then
    raise exception 'La actividad no existe.';
  end if;

  if v_status = 'finished' then
    raise exception 'La actividad ya está finalizada.';
  end if;

  if not (public.is_admin() or public.is_activity_committee_member(p_activity_id)) then
    raise exception 'No tienes permiso para finalizar esta actividad.';
  end if;

  update activities
  set status = 'finished',
      finished_at = timezone('utc'::text, now())
  where id = p_activity_id;
end;
$$;

-- Reabre una actividad finalizada. Solo admin. Falla si ya está
-- en curso.
create or replace function public.reopen_activity(p_activity_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_status text;
begin
  if not public.is_admin() then
    raise exception 'Solo un administrador puede reabrir una actividad.';
  end if;

  select status into v_status from activities where id = p_activity_id;

  if v_status is null then
    raise exception 'La actividad no existe.';
  end if;

  if v_status = 'in_progress' then
    raise exception 'La actividad ya está en curso.';
  end if;

  update activities
  set status = 'in_progress',
      finished_at = null
  where id = p_activity_id;
end;
$$;

grant execute on function public.finish_activity(uuid) to authenticated;
grant execute on function public.reopen_activity(uuid) to authenticated;

-- ------------------------------------------------------------
-- 4. RLS — escritura de gastos / productos / ventas pasa a
--    delegar en `is_activity_editable()`. SELECT sigue abierto.
-- ------------------------------------------------------------

-- activity_expenses
drop policy if exists "activity_expenses_insert_auth"  on activity_expenses;
drop policy if exists "activity_expenses_update_admin" on activity_expenses;
drop policy if exists "activity_expenses_delete_admin" on activity_expenses;

create policy "activity_expenses_insert_editable" on activity_expenses
  for insert to authenticated
  with check (public.is_activity_editable(activity_id));

create policy "activity_expenses_update_editable" on activity_expenses
  for update to authenticated
  using (public.is_activity_editable(activity_id))
  with check (public.is_activity_editable(activity_id));

create policy "activity_expenses_delete_editable" on activity_expenses
  for delete to authenticated
  using (public.is_activity_editable(activity_id));

-- activity_products
drop policy if exists "activity_products_insert_auth"  on activity_products;
drop policy if exists "activity_products_update_admin" on activity_products;
drop policy if exists "activity_products_delete_admin" on activity_products;

create policy "activity_products_insert_editable" on activity_products
  for insert to authenticated
  with check (public.is_activity_editable(activity_id));

create policy "activity_products_update_editable" on activity_products
  for update to authenticated
  using (public.is_activity_editable(activity_id))
  with check (public.is_activity_editable(activity_id));

create policy "activity_products_delete_editable" on activity_products
  for delete to authenticated
  using (public.is_activity_editable(activity_id));

-- activity_sales
drop policy if exists "activity_sales_insert_auth"  on activity_sales;
drop policy if exists "activity_sales_update_admin" on activity_sales;
drop policy if exists "activity_sales_delete_admin" on activity_sales;

create policy "activity_sales_insert_editable" on activity_sales
  for insert to authenticated
  with check (public.is_activity_editable(activity_id));

create policy "activity_sales_update_editable" on activity_sales
  for update to authenticated
  using (public.is_activity_editable(activity_id))
  with check (public.is_activity_editable(activity_id));

create policy "activity_sales_delete_editable" on activity_sales
  for delete to authenticated
  using (public.is_activity_editable(activity_id));
