-- ============================================================
-- FODAF — Actividades: hora de inicio y estado `scheduled`
-- ============================================================
-- Antes, las actividades nacían siempre `in_progress` desde el
-- momento de la creación. Ahora se programa una hora de inicio
-- y, hasta que esa hora se cumple, la actividad queda en estado
-- `scheduled` (programada). Cuando llega el momento, pasa
-- automáticamente a `in_progress` — la transición se calcula
-- "on-read" con `effective_activity_status()`, sin necesidad de
-- un cron.
--
-- `start_at` se agrega como nullable para no romper actividades
-- previas creadas con la migración anterior; las nuevas son
-- siempre con hora (validación en cliente).
-- ============================================================

-- ------------------------------------------------------------
-- 1. Columna y nuevo valor de status
-- ------------------------------------------------------------
alter table activities add column start_at timestamp with time zone;

alter table activities drop constraint activities_status_check;
alter table activities add constraint activities_status_check
  check (status in ('scheduled', 'in_progress', 'finished'));

-- ------------------------------------------------------------
-- 2. Estado efectivo: una `scheduled` cuyo `start_at` ya pasó
--    se trata como `in_progress` para todos los efectos
--    prácticos (permisos, listas, badges).
-- ------------------------------------------------------------
create or replace function public.effective_activity_status(
  p_status text,
  p_start_at timestamp with time zone
)
returns text
language sql
immutable
set search_path = public
as $$
  select case
    when p_status = 'scheduled' and (p_start_at is null or p_start_at <= now())
      then 'in_progress'
    else p_status
  end;
$$;

grant execute on function public.effective_activity_status(text, timestamp with time zone) to authenticated;

-- ------------------------------------------------------------
-- 3. `is_activity_editable` usa el estado efectivo: admin o
--    miembro del comité, y la actividad NO está `finished`.
--    Una `scheduled` también es editable (el comité puede
--    registrar gastos / inventario antes del evento).
-- ------------------------------------------------------------
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
      and a.status <> 'finished'
      and (public.is_admin() or public.is_activity_committee_member(p_activity_id))
  );
$$;

-- ------------------------------------------------------------
-- 4. `finish_activity` ahora acepta cerrar tanto una
--    `scheduled` como una `in_progress` (el comité podría
--    cancelar una actividad que ni siquiera arrancó).
-- ------------------------------------------------------------
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

-- ------------------------------------------------------------
-- 5. `reopen_activity` decide entre `scheduled` e
--    `in_progress` según `start_at`: si la hora aún no llega,
--    la actividad vuelve a estar programada; si ya pasó,
--    arranca de inmediato.
-- ------------------------------------------------------------
create or replace function public.reopen_activity(p_activity_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_status text;
  v_start_at timestamp with time zone;
  v_new_status text;
begin
  if not public.is_admin() then
    raise exception 'Solo un administrador puede reabrir una actividad.';
  end if;

  select status, start_at into v_status, v_start_at from activities where id = p_activity_id;

  if v_status is null then
    raise exception 'La actividad no existe.';
  end if;

  if v_status <> 'finished' then
    raise exception 'La actividad no está finalizada.';
  end if;

  v_new_status := case
    when v_start_at is not null and v_start_at > now() then 'scheduled'
    else 'in_progress'
  end;

  update activities
  set status = v_new_status,
      finished_at = null
  where id = p_activity_id;
end;
$$;
