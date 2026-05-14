# FODAF - Fondo de Ahorro Familiar

## Descripción
Sistema financiero cerrado para gestionar los ahorros, préstamos, eventos y multas de una familia en Colombia.

## Idioma
- Responder siempre en **español**.
- Nombres de variables, funciones, composables y componentes en **inglés**.
- Textos visibles al usuario (labels, mensajes, placeholders) en **español**.

## Stack Tecnológico
- **Framework:** Nuxt 4 (plantilla minimal)
- **Gestor de paquetes:** pnpm
- **Base de datos y Autenticación:** Supabase (PostgreSQL)
- **Estilos:** Tailwind CSS
- **Lenguaje:** TypeScript con tipado estricto

## Comandos
- `pnpm dev` — Servidor de desarrollo (http://localhost:4111)
- `pnpm build` — Build de producción
- `npx supabase start` — Iniciar Supabase local (Studio: http://127.0.0.1:54323)
- `npx supabase stop` — Detener Supabase local
- `npx supabase migration new <nombre>` — Crear nueva migración
- `npx supabase migration up` — **Aplicar solo migraciones pendientes** (preserva datos). Úsalo en el día a día.
- `npx supabase db reset` — Resetear DB local (borra todo, re-aplica migraciones + seed). Úsalo solo cuando cambies el seed o modifiques una migración ya aplicada.

**Regla:** nunca editar una migración ya aplicada. Si necesitas un cambio, crear una nueva migración (`alter table`, etc.).

## Arquitectura y Convenciones
- Código fuertemente tipado con interfaces explícitas en TypeScript.
- Composables para lógica reutilizable (`app/composables/`).
- Separación de responsabilidades: componentes presentacionales vs lógica de negocio.
- Archivos de tipos en `types/`.
- **Parámetros del fondo:** los valores de negocio (cuotas, límites, multas, bases) **no se hardcodean**; se leen de la tabla `fund_settings` con el composable `useFundSettings()`. Ver sección "Parámetros Configurables del Fondo".
- Variables de entorno en `.env` (nunca se commitean).
- Migraciones SQL en `supabase/migrations/`.
- Datos de prueba en `supabase/seed.sql`.
- SSR desactivado (`ssr: false`) — la app corre 100% en cliente porque auth depende de localStorage.

## Manejo de Fechas y Zona Horaria
- **Zona horaria:** Colombia (UTC-5, `America/Bogota`).
- **Base de datos:** Los `created_at` se almacenan en UTC (`timestamptz`). Esto es correcto — Supabase Studio muestra UTC, pero la app convierte a hora local al consultar.
- **Inputs de fecha/hora:** Nunca usar `new Date().toISOString().slice(...)` para prellenar inputs `date` o `datetime-local`, porque `toISOString()` convierte a UTC y desfasa la hora/fecha.
- **Composable `useLocalDate()`** (`app/composables/useLocalDate.ts`):
  - `toLocalDate()` → string `YYYY-MM-DD` en hora local (para inputs `type="date"`).
  - `toLocalDatetime()` → string `YYYY-MM-DDTHH:mm` en hora local (para inputs `type="datetime-local"`).
  - Usar **siempre** este composable en cualquier módulo que necesite fechas por defecto.

## Patrones UI
- **Toasts:** Usar `useToast()` para notificaciones en toda acción CRUD.
  - `toast.success('Mensaje')` para éxito.
  - `toast.error('Mensaje')` para errores.
  - El componente `ToastContainer` ya está montado en `app.vue`.
  - No usar mensajes de error/éxito inline — usar siempre toast.
- **Modales:** Componentes con `Teleport to="body"` y transiciones.
- **Middlewares de ruta:** `auth` (requiere sesión), `guest` (redirige si tiene sesión), `admin` (requiere rol admin).

## Estructura de Base de Datos
Tablas en PostgreSQL (Supabase), relacionadas mediante UUIDs:
- `profiles` — (id, full_name, role, phone, created_at). Roles: `admin`, `member`.
- `contributions` — (id, profile_id, amount, deposit_date, status, created_at). Status: `pending`, `approved`, `rejected`.
- `loans` — (id, profile_id, guarantor_id, requested_amount, interest_rate, installments, status, created_at). Status: `pending`, `active`, `paid`, `defaulted`, `rejected`.
- `loan_payments` — (id, loan_id, amount, payment_date, created_at).
- `teams` — (id, name, term, created_at).
- `team_members` — (team_id, profile_id, role_title). PK compuesta. `role_title` es opcional y representa el cargo dentro del equipo (ej. "Presidente", "Tesorero", "Secretario").
- `activities` — (id, team_id, name, activity_date, costs, net_profits, created_at).
- `meetings` — (id, topic, meeting_date, created_at).
- `penalties` — (id, profile_id, meeting_id, reason, amount, status, created_at). Reason: `absence`, `late_arrival`, `other`. Status: `pending`, `paid`, `deducted_from_savings`.
- `withdrawals` — (id, profile_id, amount, status, created_at). Status: `pending`, `approved`, `rejected`. Representa solicitudes de retiro de ahorros.
- `investments` — (id, name, invested_amount, annual_interest_rate, start_date, end_date, status, actual_return, created_at). Status: `active`, `completed`. `actual_return` se llena cuando se finaliza la inversión y representa el rendimiento real obtenido (entra al Capital en Caja).
- `fund_settings` — (year [PK], min_savings_minor, min_savings_adult, penalty_absence, penalty_late_arrival, min_interest_rate, loan_limit_without_guarantor, loan_savings_percentage_cap, year_end_base, created_at, updated_at). Parámetros configurables del fondo, **una fila por año**. Se leen con el composable `useFundSettings()` y se editan desde `/admin/parametros`. Solo contiene los parámetros que el código consume; las reglas de estatutos sin lógica implementada no se parametrizan.

## Parámetros Configurables del Fondo
Los valores que cambian de año a año (cuotas, bases, límites, multas) **NO se hardcodean**. Viven en la tabla `fund_settings`, con **una fila por año** (`year` como PK).
- Leerlos **siempre** con el composable **`useFundSettings(year?)`** (`app/composables/useFundSettings.ts`) — año actual por defecto, con fallback al año configurado más reciente. La carga se cachea por año en estado global.
- El admin los edita desde la página **`/admin/parametros`** (selector de año + formulario por secciones).
- **Histórico por año:** una liquidación de un año pasado se calcula con los parámetros de ese año, no con los vigentes.
- Al agregar un parámetro nuevo: columna en una migración nueva, campo en la interfaz `FundSettings` (`types/database.ts`), y campo en `fieldGroups` de `/admin/parametros`.

## Reglas de Negocio y Estatutos (ESTRICTO)
Valores vigentes según los **estatutos modificados en enero de 2026**. Las reglas anotadas con el nombre de una columna (ej. `min_interest_rate`) son **parametrizables**: viven en `fund_settings` y la app las lee con `useFundSettings()`, nunca de constantes. Las reglas **sin anotación** están documentadas como estatuto pero **no parametrizadas ni enforced en código** (su lógica aún no está implementada).

### Ingresos
- Admisión de miembro nuevo: **$80.000 COP**.
- Reingreso: **el doble** de la admisión ($160.000 COP).
- Plazo máximo para ingresar al fondo: **31 de enero**.
- Excepción: nuevos integrantes a partir de 2023 están exentos del pago de admisión.
- "Asociados antiguos" se definen por el año de corte 2022.

### Ahorros
- Cuota mínima mensual para **menores**: **$100.000 COP** (`min_savings_minor`).
- Cuota mínima mensual para **mayores**: **$120.000 COP** (`min_savings_adult`).
- El valor del ahorro se define con el primer pago y **no se puede modificar durante el año en curso**.

### Fechas de Pago
- Cuota de **enero**: plazo máximo **día 30**.
- Cuota de **febrero a noviembre**: plazo máximo **día 15**.
- **Diciembre**: flexible según la fecha de la reunión de fin de año.

### Préstamos
- Solo se presta a **miembros activos** del fondo.
- Interés mínimo: **2%** (`min_interest_rate`).
- Sin fiador: hasta **$500.000 COP** (`loan_limit_without_guarantor`) o el **80% del valor ahorrado** (`loan_savings_percentage_cap`) — el menor.
- Para montos superiores: se requiere un **codeudor** que sea miembro del fondo con capacidad suficiente.

### Moras y Sanciones
- **Atraso de 3 cuotas de ahorro** → Expulsión del fondo. Durante el primer mes de atraso hay derecho, por única vez, a renegociación (primero con el Comité, luego con la Junta).
- **Mora de 2 meses en préstamos** → Descuento automático de sus ahorros o los de su codeudor.
- **Llegar 15 minutos tarde** a citaciones → Multa de **$10.000 COP** (`penalty_late_arrival`).
- **Inasistencia a reuniones** → Multa de **$30.000 COP** (`penalty_absence`), descontada de los ahorros.

### Utilidades y Cierre Anual
- A la **primera oportunidad de incumplimiento** en la fecha de pago del ahorro mensual, el miembro **pierde todo derecho a las utilidades anuales**.
- Al final del año se devuelven los aportes dejando una **base de $350.000 COP** en el fondo (`year_end_base`).

### Junta Directiva
- Se elige entre miembros con **3 años o más de antigüedad**.
