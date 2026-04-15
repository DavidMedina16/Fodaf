-- Agrega el cargo (role_title) de cada integrante dentro de un comité / junta.
-- Ejemplos: 'Presidente', 'Tesorero', 'Secretario', 'Vocal'.

alter table team_members
  add column role_title text;
