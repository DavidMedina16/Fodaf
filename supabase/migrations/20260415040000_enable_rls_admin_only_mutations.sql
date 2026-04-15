-- ============================================================
-- FODAF — RLS: solo admin puede UPDATE/DELETE en todas las tablas
-- ============================================================
-- Todos los miembros autenticados pueden SELECT e INSERT
-- (para mantener los flujos existentes: registrar aportes,
-- solicitar préstamos y retiros, registrar pagos, etc.)
-- Solo los usuarios con role='admin' pueden UPDATE o DELETE.
-- ============================================================

-- Helper: detecta si el usuario autenticado es admin.
create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- RPC que mantiene el flujo de "pago de préstamo completo" desde el cliente.
-- LoanPaymentModal llama a esta función en lugar de hacer update directo.
create or replace function public.mark_loan_paid_if_complete(p_loan_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_requested numeric;
  v_interest numeric;
  v_total_due numeric;
  v_total_paid numeric;
begin
  select requested_amount, interest_rate
  into v_requested, v_interest
  from loans
  where id = p_loan_id;

  if v_requested is null then
    return;
  end if;

  v_total_due := round(v_requested * (1 + v_interest / 100));

  select coalesce(sum(amount), 0)
  into v_total_paid
  from loan_payments
  where loan_id = p_loan_id;

  if v_total_paid >= v_total_due then
    update loans
    set status = 'paid'
    where id = p_loan_id;
  end if;
end;
$$;

grant execute on function public.mark_loan_paid_if_complete(uuid) to authenticated;

-- ------------------------------------------------------------
-- Habilitar RLS en todas las tablas
-- ------------------------------------------------------------
alter table profiles       enable row level security;
alter table contributions  enable row level security;
alter table loans          enable row level security;
alter table loan_payments  enable row level security;
alter table teams          enable row level security;
alter table team_members   enable row level security;
alter table activities     enable row level security;
alter table meetings       enable row level security;
alter table penalties      enable row level security;
alter table withdrawals    enable row level security;
alter table investments    enable row level security;

-- ------------------------------------------------------------
-- Policies por tabla
-- SELECT: cualquier autenticado
-- INSERT: cualquier autenticado (los flujos existentes lo requieren)
-- UPDATE/DELETE: solo admin
-- ------------------------------------------------------------

-- profiles
create policy "profiles_select_auth" on profiles
  for select to authenticated using (true);
create policy "profiles_insert_auth" on profiles
  for insert to authenticated with check (true);
create policy "profiles_update_admin" on profiles
  for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "profiles_delete_admin" on profiles
  for delete to authenticated using (public.is_admin());

-- contributions
create policy "contributions_select_auth" on contributions
  for select to authenticated using (true);
create policy "contributions_insert_auth" on contributions
  for insert to authenticated with check (true);
create policy "contributions_update_admin" on contributions
  for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "contributions_delete_admin" on contributions
  for delete to authenticated using (public.is_admin());

-- loans
create policy "loans_select_auth" on loans
  for select to authenticated using (true);
create policy "loans_insert_auth" on loans
  for insert to authenticated with check (true);
create policy "loans_update_admin" on loans
  for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "loans_delete_admin" on loans
  for delete to authenticated using (public.is_admin());

-- loan_payments
create policy "loan_payments_select_auth" on loan_payments
  for select to authenticated using (true);
create policy "loan_payments_insert_auth" on loan_payments
  for insert to authenticated with check (true);
create policy "loan_payments_update_admin" on loan_payments
  for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "loan_payments_delete_admin" on loan_payments
  for delete to authenticated using (public.is_admin());

-- teams
create policy "teams_select_auth" on teams
  for select to authenticated using (true);
create policy "teams_insert_auth" on teams
  for insert to authenticated with check (true);
create policy "teams_update_admin" on teams
  for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "teams_delete_admin" on teams
  for delete to authenticated using (public.is_admin());

-- team_members
create policy "team_members_select_auth" on team_members
  for select to authenticated using (true);
create policy "team_members_insert_auth" on team_members
  for insert to authenticated with check (true);
create policy "team_members_update_admin" on team_members
  for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "team_members_delete_admin" on team_members
  for delete to authenticated using (public.is_admin());

-- activities
create policy "activities_select_auth" on activities
  for select to authenticated using (true);
create policy "activities_insert_auth" on activities
  for insert to authenticated with check (true);
create policy "activities_update_admin" on activities
  for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "activities_delete_admin" on activities
  for delete to authenticated using (public.is_admin());

-- meetings
create policy "meetings_select_auth" on meetings
  for select to authenticated using (true);
create policy "meetings_insert_auth" on meetings
  for insert to authenticated with check (true);
create policy "meetings_update_admin" on meetings
  for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "meetings_delete_admin" on meetings
  for delete to authenticated using (public.is_admin());

-- penalties
create policy "penalties_select_auth" on penalties
  for select to authenticated using (true);
create policy "penalties_insert_auth" on penalties
  for insert to authenticated with check (true);
create policy "penalties_update_admin" on penalties
  for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "penalties_delete_admin" on penalties
  for delete to authenticated using (public.is_admin());

-- withdrawals
create policy "withdrawals_select_auth" on withdrawals
  for select to authenticated using (true);
create policy "withdrawals_insert_auth" on withdrawals
  for insert to authenticated with check (true);
create policy "withdrawals_update_admin" on withdrawals
  for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "withdrawals_delete_admin" on withdrawals
  for delete to authenticated using (public.is_admin());

-- investments
create policy "investments_select_auth" on investments
  for select to authenticated using (true);
create policy "investments_insert_auth" on investments
  for insert to authenticated with check (true);
create policy "investments_update_admin" on investments
  for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "investments_delete_admin" on investments
  for delete to authenticated using (public.is_admin());
