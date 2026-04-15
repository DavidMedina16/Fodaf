-- ============================================================
-- FODAF — Migración inicial: esquema completo
-- ============================================================

-- Extensión para generar UUIDs
create extension if not exists "pgcrypto";

-- ---- Profiles ----
create table profiles (
  id uuid references auth.users not null primary key,
  full_name text not null,
  role text not null check (role in ('admin', 'member')) default 'member',
  phone text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ---- Contributions (cuotas de ahorro) ----
create table contributions (
  id uuid default gen_random_uuid() primary key,
  profile_id uuid references profiles(id) not null,
  amount numeric not null check (amount > 0),
  deposit_date date not null,
  status text not null check (status in ('pending', 'approved', 'rejected')) default 'pending',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ---- Loans (préstamos) ----
create table loans (
  id uuid default gen_random_uuid() primary key,
  profile_id uuid references profiles(id) not null,
  guarantor_id uuid references profiles(id),
  requested_amount numeric not null check (requested_amount > 0),
  interest_rate numeric not null,
  installments integer not null check (installments > 0),
  status text not null check (status in ('pending', 'active', 'paid', 'defaulted', 'rejected')) default 'pending',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ---- Loan Payments ----
create table loan_payments (
  id uuid default gen_random_uuid() primary key,
  loan_id uuid references loans(id) not null,
  amount numeric not null check (amount > 0),
  payment_date date not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ---- Teams ----
create table teams (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  term text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ---- Team Members ----
create table team_members (
  team_id uuid references teams(id) on delete cascade,
  profile_id uuid references profiles(id) on delete cascade,
  primary key (team_id, profile_id)
);

-- ---- Activities ----
create table activities (
  id uuid default gen_random_uuid() primary key,
  team_id uuid references teams(id),
  name text not null,
  activity_date date not null,
  costs numeric default 0,
  net_profits numeric default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ---- Meetings ----
create table meetings (
  id uuid default gen_random_uuid() primary key,
  topic text not null,
  meeting_date timestamp with time zone not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ---- Penalties (multas y sanciones) ----
create table penalties (
  id uuid default gen_random_uuid() primary key,
  profile_id uuid references profiles(id) not null,
  meeting_id uuid references meetings(id),
  reason text not null check (reason in ('absence', 'late_arrival', 'other')),
  amount numeric not null,
  status text not null check (status in ('pending', 'paid', 'deducted_from_savings')) default 'pending',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
