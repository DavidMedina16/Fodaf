-- ============================================================
-- FODAF — Migración: eliminar columnas no usadas de fund_settings
-- ============================================================
-- Se eliminan los parámetros que quedaron almacenados pero que
-- ningún módulo del código consume todavía: no hay lógica de
-- admisión, plazos de pago, expulsión por mora, descuento
-- automático de préstamos ni antigüedad de Junta implementada.
--
-- Solo se conservan los parámetros que sí manejan condicionales
-- o cálculos en la app (cuotas mínimas, multas, condiciones de
-- préstamo y base de fin de año).
-- ============================================================

alter table fund_settings
  drop column admission_fee,
  drop column reentry_multiplier,
  drop column enrollment_deadline_day,
  drop column admission_exemption_year,
  drop column legacy_member_cutoff_year,
  drop column payment_deadline_day_january,
  drop column payment_deadline_day_regular,
  drop column missed_installments_for_expulsion,
  drop column loan_default_months_for_deduction,
  drop column board_min_seniority_years;
