-- ============================================================
-- FODAF — Migración: rendimiento real obtenido en inversiones
-- ============================================================

alter table investments
  add column actual_return numeric check (actual_return >= 0);
