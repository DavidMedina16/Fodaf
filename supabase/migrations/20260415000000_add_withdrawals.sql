-- ============================================================
-- FODAF — Migración: tabla withdrawals (retiros de ahorros)
-- ============================================================

create table withdrawals (
  id uuid default gen_random_uuid() primary key,
  profile_id uuid references profiles(id) not null,
  amount numeric not null check (amount > 0),
  status text not null check (status in ('pending', 'approved', 'rejected')) default 'pending',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
