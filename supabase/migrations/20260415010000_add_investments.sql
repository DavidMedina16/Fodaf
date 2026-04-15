-- ============================================================
-- FODAF — Migración: tabla investments (inversiones externas como CDT)
-- ============================================================

create table investments (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  invested_amount numeric not null check (invested_amount > 0),
  annual_interest_rate numeric not null,
  start_date date not null,
  end_date date not null,
  status text not null check (status in ('active', 'completed')) default 'active',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
