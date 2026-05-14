-- ============================================================
-- FODAF — Migración: tabla fund_settings (parámetros anuales del fondo)
-- ============================================================
-- Centraliza los valores que cambian de año a año según los
-- estatutos (cuotas, bases, límites, multas, etc.).
--
-- Una fila por año (PK = year) para preservar la integridad
-- histórica: una liquidación de 2025 debe calcularse con los
-- parámetros de 2025, no con los vigentes hoy.
-- ============================================================

create table fund_settings (
  year integer primary key check (year >= 2020),

  -- Ingreso y admisión
  admission_fee numeric not null check (admission_fee >= 0),
  reentry_multiplier numeric not null default 2 check (reentry_multiplier >= 1),
  enrollment_deadline_day integer not null check (enrollment_deadline_day between 1 and 31),
  admission_exemption_year integer not null,
  legacy_member_cutoff_year integer not null,

  -- Ahorros
  min_savings_minor numeric not null check (min_savings_minor >= 0),
  min_savings_adult numeric not null check (min_savings_adult >= 0),
  payment_deadline_day_january integer not null check (payment_deadline_day_january between 1 and 31),
  payment_deadline_day_regular integer not null check (payment_deadline_day_regular between 1 and 31),

  -- Moras y sanciones
  missed_installments_for_expulsion integer not null check (missed_installments_for_expulsion > 0),
  loan_default_months_for_deduction integer not null check (loan_default_months_for_deduction > 0),
  penalty_absence numeric not null check (penalty_absence >= 0),
  penalty_late_arrival numeric not null check (penalty_late_arrival >= 0),

  -- Préstamos
  min_interest_rate numeric not null check (min_interest_rate >= 0),
  loan_limit_without_guarantor numeric not null check (loan_limit_without_guarantor >= 0),
  loan_savings_percentage_cap numeric not null check (loan_savings_percentage_cap between 0 and 100),

  -- Cierre anual y junta
  year_end_base numeric not null check (year_end_base >= 0),
  board_min_seniority_years integer not null check (board_min_seniority_years >= 0),

  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ------------------------------------------------------------
-- Trigger: mantiene updated_at al día en cada modificación.
-- ------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := timezone('utc'::text, now());
  return new;
end;
$$;

create trigger fund_settings_set_updated_at
  before update on fund_settings
  for each row execute function public.set_updated_at();

-- ------------------------------------------------------------
-- Parámetros vigentes 2026 (estatutos modificados en enero 2026).
-- Se insertan dentro de la migración —no en seed.sql— para que
-- producción también reciba la fila inicial.
-- ------------------------------------------------------------
insert into fund_settings (
  year,
  admission_fee, reentry_multiplier, enrollment_deadline_day,
  admission_exemption_year, legacy_member_cutoff_year,
  min_savings_minor, min_savings_adult,
  payment_deadline_day_january, payment_deadline_day_regular,
  missed_installments_for_expulsion, loan_default_months_for_deduction,
  penalty_absence, penalty_late_arrival,
  min_interest_rate, loan_limit_without_guarantor, loan_savings_percentage_cap,
  year_end_base, board_min_seniority_years
) values (
  2026,
  80000, 2, 31,
  2023, 2022,
  100000, 120000,
  30, 15,
  3, 2,
  30000, 10000,
  2, 500000, 80,
  350000, 3
);

-- ------------------------------------------------------------
-- RLS: lectura para cualquier autenticado; escritura solo admin.
-- A diferencia del resto de tablas, el INSERT también es solo
-- admin: crear la configuración de un año es una acción de gestión.
-- ------------------------------------------------------------
alter table fund_settings enable row level security;

create policy "fund_settings_select_auth" on fund_settings
  for select to authenticated using (true);
create policy "fund_settings_insert_admin" on fund_settings
  for insert to authenticated with check (public.is_admin());
create policy "fund_settings_update_admin" on fund_settings
  for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "fund_settings_delete_admin" on fund_settings
  for delete to authenticated using (public.is_admin());
