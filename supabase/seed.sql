-- ============================================================
-- FODAF — Seed: usuarios y datos de prueba
-- ============================================================

-- UUIDs fijos para mantener referencias consistentes
-- Admin:   a1000000-0000-0000-0000-000000000001
-- Member1: a2000000-0000-0000-0000-000000000002
-- Member2: a3000000-0000-0000-0000-000000000003

-- ---- 1. Insertar usuarios en auth.users ----

insert into auth.users (
  id,
  instance_id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  recovery_token,
  email_change,
  email_change_token_new,
  email_change_token_current
) values
  (
    'a1000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'admin@fodaf.local',
    crypt('123456', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Carlos Parra (Admin)"}',
    now(),
    now(),
    '',
    '',
    '',
    '',
    ''
  ),
  (
    'a2000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'maria@fodaf.local',
    crypt('123456', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"María López"}',
    now(),
    now(),
    '',
    '',
    '',
    '',
    ''
  ),
  (
    'a3000000-0000-0000-0000-000000000003',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'juan@fodaf.local',
    crypt('123456', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Juan Medina"}',
    now(),
    now(),
    '',
    '',
    '',
    '',
    ''
  );

-- Identidades (requeridas por Supabase Auth para login con email)
insert into auth.identities (
  id,
  user_id,
  provider_id,
  identity_data,
  provider,
  last_sign_in_at,
  created_at,
  updated_at
) values
  (
    'a1000000-0000-0000-0000-000000000001',
    'a1000000-0000-0000-0000-000000000001',
    'admin@fodaf.local',
    '{"sub":"a1000000-0000-0000-0000-000000000001","email":"admin@fodaf.local"}',
    'email',
    now(),
    now(),
    now()
  ),
  (
    'a2000000-0000-0000-0000-000000000002',
    'a2000000-0000-0000-0000-000000000002',
    'maria@fodaf.local',
    '{"sub":"a2000000-0000-0000-0000-000000000002","email":"maria@fodaf.local"}',
    'email',
    now(),
    now(),
    now()
  ),
  (
    'a3000000-0000-0000-0000-000000000003',
    'a3000000-0000-0000-0000-000000000003',
    'juan@fodaf.local',
    '{"sub":"a3000000-0000-0000-0000-000000000003","email":"juan@fodaf.local"}',
    'email',
    now(),
    now(),
    now()
  );

-- ---- 2. Insertar perfiles en public.profiles ----

insert into profiles (id, full_name, role, phone) values
  ('a1000000-0000-0000-0000-000000000001', 'Carlos Parra (Admin)', 'admin', '+573001234567'),
  ('a2000000-0000-0000-0000-000000000002', 'María López', 'member', '+573009876543'),
  ('a3000000-0000-0000-0000-000000000003', 'Juan Medina', 'member', '+573005551234');

-- ---- 3. Contributions de prueba (enero y febrero 2026) ----

insert into contributions (profile_id, amount, deposit_date, status) values
  -- Carlos - enero (aprobado)
  ('a1000000-0000-0000-0000-000000000001', 120000, '2026-01-25', 'approved'),
  -- Carlos - febrero (aprobado)
  ('a1000000-0000-0000-0000-000000000001', 120000, '2026-02-20', 'approved'),
  -- María - enero (aprobado)
  ('a2000000-0000-0000-0000-000000000002', 120000, '2026-01-28', 'approved'),
  -- María - febrero (pendiente)
  ('a2000000-0000-0000-0000-000000000002', 120000, '2026-02-28', 'pending'),
  -- Juan - enero (aprobado)
  ('a3000000-0000-0000-0000-000000000003', 100000, '2026-01-30', 'approved'),
  -- Juan - febrero (pendiente)
  ('a3000000-0000-0000-0000-000000000003', 100000, '2026-02-28', 'pending');
