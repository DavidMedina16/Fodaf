# FODAF - Fondo de Ahorro Familiar

Sistema financiero cerrado para gestionar los ahorros, préstamos, eventos y multas de una familia en Colombia.

## Stack Tecnológico

| Capa | Tecnología |
|------|-----------|
| Framework | [Nuxt 4](https://nuxt.com/) (SPA, SSR desactivado) |
| Lenguaje | TypeScript (tipado estricto) |
| Base de datos | [Supabase](https://supabase.com/) (PostgreSQL) |
| Autenticación | Supabase Auth |
| Estilos | [Tailwind CSS](https://tailwindcss.com/) |
| Gestor de paquetes | pnpm |

## Requisitos previos

- [Node.js](https://nodejs.org/) v18+
- [pnpm](https://pnpm.io/) v8+
- [Docker](https://www.docker.com/) (para Supabase local)
- [Supabase CLI](https://supabase.com/docs/guides/cli)

## Instalación

```bash
# 1. Clonar el repositorio
git clone <url-del-repo>
cd fodaf

# 2. Instalar dependencias
pnpm install

# 3. Configurar variables de entorno
cp .env.example .env
# Editar .env con las credenciales de Supabase

# 4. Iniciar Supabase local
npx supabase start

# 5. Aplicar migraciones y datos de prueba
npx supabase db reset

# 6. Iniciar servidor de desarrollo
pnpm dev
```

La app estará en http://localhost:3000 y Supabase Studio en http://127.0.0.1:54323.

## Variables de entorno

```env
SUPABASE_URL=http://127.0.0.1:54321
SUPABASE_KEY=tu_supabase_anon_key
```

## Comandos útiles

| Comando | Descripción |
|---------|-------------|
| `pnpm dev` | Servidor de desarrollo |
| `pnpm build` | Build de producción |
| `npx supabase start` | Iniciar Supabase local |
| `npx supabase stop` | Detener Supabase local |
| `npx supabase db reset` | Resetear BD (migraciones + seed) |
| `npx supabase migration new <nombre>` | Crear nueva migración |

## Estructura del proyecto

```
fodaf/
├── app/
│   ├── components/       # Componentes reutilizables (modales, toasts)
│   ├── composables/      # Lógica reutilizable (useSupabase, useToast, useLocalDate)
│   ├── layouts/          # Layout principal con navbar
│   ├── middleware/        # auth, guest, admin
│   └── pages/
│       ├── login.vue             # Inicio de sesión
│       ├── dashboard.vue         # Panel principal del miembro
│       ├── prestamos/
│       │   ├── index.vue         # Mis préstamos
│       │   └── solicitar.vue     # Solicitar préstamo
│       └── admin/
│           ├── index.vue         # Panel admin (aportes y préstamos)
│           ├── reuniones.vue     # Reuniones y multas
│           ├── actividades.vue   # Comités y actividades
│           └── balance.vue       # Balance general del fondo
├── supabase/
│   ├── migrations/       # Migraciones SQL
│   └── seed.sql          # Datos de prueba
├── types/                # Interfaces TypeScript
└── nuxt.config.ts
```

## Módulos

### Miembros
- Registro de aportes mensuales con aprobación del administrador.
- Solicitud de préstamos con cálculo de interés y cuotas.
- Seguimiento de pagos de préstamos.

### Administración
- Aprobación/rechazo de aportes y préstamos.
- Registro de reuniones con control de asistencia.
- Aplicación de multas por inasistencia o llegada tarde.
- Gestión de comités y actividades con costos y utilidades.
- Balance general del fondo.

## Roles

| Rol | Acceso |
|-----|--------|
| `admin` | Panel admin, gestión de aportes, préstamos, reuniones, actividades y balance |
| `member` | Dashboard personal, solicitar préstamos, registrar aportes |

## Base de datos

Tablas principales: `profiles`, `contributions`, `loans`, `loan_payments`, `teams`, `team_members`, `activities`, `meetings`, `penalties`.

Las migraciones están en `supabase/migrations/` y los datos de prueba en `supabase/seed.sql`.

## Licencia

Proyecto privado. Todos los derechos reservados.
