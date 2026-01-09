# FODAF - Fondo de Ahorro Familiar

## Descripción del Proyecto

Aplicación web para gestionar un fondo de ahorro comunitario familiar. El sistema permite administrar:

- **Miembros**: Registro de integrantes del fondo con sus cuotas de ahorro mensual
- **Pagos**: Seguimiento de pagos mensuales con fechas límite
- **Préstamos**: Gestión de préstamos a miembros con tasas de interés
- **Eventos**: Organización de eventos para recaudación de fondos
- **Inversiones CDT**: Registro de inversiones en CDTs para aumentar el capital
- **Estatutos**: Reglas del fondo (límites de tiempo, multas por incumplimiento, etc.)

## Stack Tecnológico

### Backend
- **Framework**: NestJS 11
- **Lenguaje**: TypeScript 5.7
- **Base de datos**: MySQL
- **ORM**: TypeORM
- **Autenticación**: JWT (JSON Web Tokens)
- **Puerto**: 3000

### Frontend
- **Framework**: Angular 20 (Standalone Components)
- **Lenguaje**: TypeScript 5.9
- **Estilos**: SCSS
- **State Management**: Angular Signals
- **Puerto**: 4200

### Herramientas
- **Package Manager**: pnpm
- **Linting**: ESLint + Prettier
- **Testing**: Jest (backend), Karma + Jasmine (frontend)

## Estructura del Proyecto

```
Fodaf/
├── backend/                 # API REST NestJS (por implementar)
│   ├── src/
│   │   ├── modules/
│   │   ├── common/
│   │   └── config/
│   └── test/
│
├── frontend/                # Aplicación Angular
│   ├── src/
│   │   ├── styles/          # Sistema de estilos SCSS
│   │   │   ├── _variables.scss
│   │   │   ├── _mixins.scss
│   │   │   ├── _reset.scss
│   │   │   ├── _typography.scss
│   │   │   └── _utilities.scss
│   │   ├── app/
│   │   │   ├── core/        # Servicios singleton, guards, interceptors
│   │   │   │   ├── guards/  # authGuard, guestGuard, roleGuard
│   │   │   │   ├── interceptors/  # auth, error
│   │   │   │   ├── models/  # User, Auth, ApiResponse, enums
│   │   │   │   └── services/  # ApiService, AuthService, StorageService
│   │   │   ├── shared/      # Componentes reutilizables
│   │   │   │   ├── components/
│   │   │   │   │   ├── button/
│   │   │   │   │   ├── input/
│   │   │   │   │   ├── select/
│   │   │   │   │   ├── form-field/
│   │   │   │   │   ├── loading-spinner/
│   │   │   │   │   ├── empty-state/
│   │   │   │   │   ├── toast/
│   │   │   │   │   ├── confirm-modal/
│   │   │   │   │   ├── card/
│   │   │   │   │   ├── stat-card/
│   │   │   │   │   └── data-table/
│   │   │   │   └── services/  # ToastService
│   │   │   ├── features/    # Módulos de funcionalidad
│   │   │   │   ├── auth/    # Login
│   │   │   │   ├── dashboard/
│   │   │   │   ├── members/
│   │   │   │   ├── payments/
│   │   │   │   ├── loans/
│   │   │   │   ├── events/
│   │   │   │   └── investments/
│   │   │   └── layouts/
│   │   │       ├── auth-layout/    # Layout para login
│   │   │       └── main-layout/    # Layout principal con sidebar
│   │   │           ├── sidebar/
│   │   │           └── header/
│   │   └── environments/
│   └── public/
│
└── CLAUDE.md
```

## Entidades Principales

### Member (Miembro)
- id, nombre, email, teléfono
- cuotaMensual (monto de ahorro mensual)
- fechaIngreso
- estado (activo/inactivo)
- rol (admin/miembro)

### Payment (Pago)
- id, miembroId, monto
- fechaPago, fechaLimite
- mes, año
- estado (pendiente/pagado/vencido)
- comprobante

### Loan (Préstamo)
- id, miembroId
- montoSolicitado, montoAprobado
- tasaInteres, plazoMeses
- fechaSolicitud, fechaAprobacion
- estado (solicitado/aprobado/rechazado/pagado)
- cuotasPagadas

### Event (Evento)
- id, nombre, descripción
- fecha, lugar
- metaRecaudacion, montoRecaudado
- estado (planificado/activo/finalizado)

### Investment (Inversión CDT)
- id, entidadFinanciera
- montoInvertido, tasaInteres
- fechaApertura, fechaVencimiento
- rendimientoEsperado
- estado (activo/vencido/renovado)

### Statute (Estatuto/Regla)
- id, titulo, descripción
- categoria (pagos/préstamos/multas/general)
- valor (porcentaje o monto si aplica)
- fechaVigencia

## Reglas de Negocio Clave

1. **Pagos**: Fecha límite mensual configurable. Multa por mora según estatutos.
2. **Préstamos**: Tasa de interés definida en estatutos. Límite según historial del miembro.
3. **Multas**: Aplicables por incumplimiento de pagos o reglas del fondo.
4. **CDTs**: Registro de inversiones con cálculo automático de rendimientos.

## Comandos de Desarrollo

```bash
# Backend
cd backend
pnpm install
pnpm run start:dev    # Desarrollo con hot reload

# Frontend
cd frontend
pnpm install
pnpm start            # Servidor de desarrollo
```

## Convenciones de Código

### Backend (NestJS)
- Usar decoradores de NestJS para inyección de dependencias
- DTOs para validación de entrada
- Entities/Models para representar datos
- Services para lógica de negocio
- Controllers solo para manejar HTTP requests/responses

### Frontend (Angular)
- Componentes standalone (sin NgModules)
- Signals para estado reactivo
- Services para llamadas HTTP y lógica compartida
- Guards para protección de rutas
- Interceptors para manejo de tokens/errores

## Progreso de Desarrollo

### Sprint 1: Frontend Core Foundation ✅
- [x] Estructura de carpetas escalable
- [x] Path aliases (@core/*, @shared/*, @features/*, @layouts/*)
- [x] Modelos TypeScript (User, Auth, ApiResponse, enums)
- [x] Servicios core (StorageService, ApiService, AuthService)
- [x] Interceptors HTTP (auth, error)
- [x] Guards de rutas (auth, guest, role)
- [x] Configuración de environments

### Sprint 2: Frontend UI Foundation ✅
- [x] Sistema de estilos SCSS (variables, mixins, reset, utilities)
- [x] Componentes de formulario (Button, Input, Select, FormField)
- [x] Componentes de feedback (LoadingSpinner, EmptyState, Toast, ConfirmModal)
- [x] Componentes de datos (Card, StatCard, DataTable con paginación)
- [x] AuthLayout (pantalla de login con branding)
- [x] MainLayout (sidebar + header responsive)
- [x] Rutas base con lazy loading
- [x] Responsive en móvil y desktop

### Sprint 3: Frontend Auth UI y Dashboard UI ✅
- [x] Feature Auth (LoginComponent, validaciones, integración AuthService)
- [x] Feature Dashboard (estadísticas, cards resumen, últimos movimientos)
- [x] Logout completo (limpiar token, redirigir)
- **Estado:** UI lista, pendiente integración con backend

### Backend Foundation ✅ (Ya implementado)
- [x] Proyecto NestJS con estructura modular
- [x] TypeORM + MySQL configurado
- [x] Auth Module: login JWT, guards, estrategia
- [x] Users Module: CRUD completo con bcrypt
- [x] Roles Module: CRUD + seeder (Super Admin, Presidente, Tesoreria, Miembro)
- [x] Contributions Module: CRUD aportes/pagos
- [x] Loans Module: CRUD préstamos + cuotas
- [x] Fines Module: CRUD multas
- [x] Events Module: CRUD eventos + transacciones
- [x] Investments Module: CRUD inversiones CDT
- [x] Config Module: parámetros del sistema
- [x] Seeder: roles, admin (admin@fodaf.com/admin123), config inicial

---

### Sprint 4: Integración Auth + Dashboard Real ✅
**Backend:**
- [x] GET /api/dashboard/stats (totalAhorrado, miembros, préstamos, próximoPago)
- [x] GET /api/dashboard/recent-activity (últimos movimientos)
- [x] GET /api/dashboard/upcoming-payments (pagos próximos a vencer)
- [x] Ajustar respuesta de /auth/login para incluir role completo

**Frontend:**
- [x] Integrar login real con backend (admin@fodaf.com/admin123)
- [x] Mostrar datos reales del usuario en header/sidebar
- [x] Dashboard conectado a endpoints reales
- [x] Manejo de errores de conexión

**Criterios:** Login funcional end-to-end, dashboard con datos reales ✅

---

### Sprint 5: Gestion de Miembros (Full Stack) ✅
**Backend:**
- [x] Agregar filtros en GET /users (busqueda por nombre, email, estado)
- [x] Paginacion en listados
- [x] RBAC: solo admin puede crear/eliminar usuarios

**Frontend:**
- [x] MembersService conectado a /api/users
- [x] MembersListComponent con DataTable, busqueda/filtros
- [x] MemberFormComponent (crear/editar con validaciones)
- [x] MemberDetailComponent (info, historial aportes, prestamos, multas)
- [x] Rutas: /members, /members/new, /members/:id, /members/:id/edit

**Criterios:** CRUD completo funcionando, validaciones en ambos lados ✅

---

### Sprint 6: Gestión de Aportes/Pagos (Full Stack) ✅
**Backend:**
- [x] Filtros en GET /contributions (mes, año, estado, userId)
- [x] Endpoint resumen mensual y anual
- [x] Lógica automática: pendiente → vencido si pasa fecha límite
- [x] Endpoint para estado de aportes por usuario/año

**Frontend:**
- [x] ContributionsService conectado a /api/contributions
- [x] PaymentsListComponent (filtros mes/año/estado, resumen con StatCards)
- [x] PaymentFormComponent (crear/editar aportes con validaciones)
- [x] PaymentsCalendarComponent (vista anual por miembro con indicadores)
- [x] Rutas: /payments, /payments/new, /payments/:id/edit, /payments/calendar

**Criterios:** Registrar pagos, ver estado por mes, identificar morosos ✅

---

### Sprint 7: Gestión de Préstamos (Full Stack) ✅
**Backend:**
- [x] Cálculo automático de cuotas con interés (sistema francés)
- [x] Validar límites de préstamo según historial (3x aportes)
- [x] Endpoint para aprobar/rechazar préstamos (POST /loans/:id/approve, /reject)
- [x] Tabla de amortización (GET /loans/:id/amortization)
- [x] Filtros y paginación en GET /loans
- [x] Endpoint de simulación (GET /loans/simulate)
- [x] Endpoint de límite de crédito (GET /loans/user/:userId/credit-limit)

**Frontend:**
- [x] LoansService conectado a /api/loans
- [x] LoansListComponent (filtros por estado, resumen con StatCards, paginación)
- [x] LoanRequestComponent (calculadora de cuotas en tiempo real, validación de crédito)
- [x] LoanDetailComponent (tabla amortización, aprobar/rechazar, historial de cuotas)
- [x] Rutas: /loans, /loans/new, /loans/:id

**Criterios:** Flujo completo de préstamo funcional ✅

---

### Sprint 8: Eventos, Inversiones y Multas (Full Stack) ✅

#### Módulo Inversiones CDT ✅
**Backend:**
- [x] Cálculo automático de rendimientos CDT (interés simple: I = P × r × d/365)
- [x] Entidad Investment mejorada (interestRate, termDays, totalAtMaturity)
- [x] InvestmentCalculationService con simulación y cálculos
- [x] Filtros y paginación en GET /investments
- [x] Endpoint de resumen (GET /investments/summary)
- [x] Endpoint de simulación (GET /investments/simulate)
- [x] Endpoints de acciones: POST /investments/:id/finish, /renew

**Frontend:**
- [x] Modelo Investment y InvestmentsService
- [x] InvestmentsListComponent (filtros, StatCards, paginación, alertas vencimiento)
- [x] InvestmentFormComponent (calculadora en tiempo real)
- [x] InvestmentDetailComponent (progreso, rendimientos, acciones)
- [x] Rutas: /investments, /investments/new, /investments/:id, /investments/:id/edit

#### Módulo Eventos ✅
**Backend:**
- [x] Resumen de recaudación por evento (GET /events/:id/summary)
- [x] Filtros y paginación en GET /events (status, search, dateFrom, dateTo)
- [x] Endpoint de resumen global (GET /events/summary)
- [x] Endpoint cambiar estado (PATCH /events/:id/status)
- [x] CRUD de transacciones por evento

**Frontend:**
- [x] Modelos Event, EventTransaction, EventSummary
- [x] EventsService conectado a /api/events
- [x] EventsListComponent (filtros, StatCards, paginación, próximos eventos)
- [x] EventFormComponent (crear/editar eventos)
- [x] EventDetailComponent (resumen, progreso meta, transacciones con CRUD)
- [x] Rutas: /events, /events/new, /events/:id, /events/:id/edit

#### Módulo Multas ✅
**Backend:**
- [x] Filtros y paginación en GET /fines (status, category, userId, search)
- [x] Endpoint de resumen (GET /fines/summary)
- [x] Endpoint marcar como pagada (PATCH /fines/:id/pay)
- [x] Resumen de multas por usuario (GET /fines/user/:userId/summary)

**Frontend:**
- [x] Modelos Fine, FineCategory, FinesSummary
- [x] FinesService conectado a /api/fines
- [x] FinesListComponent (filtros, StatCards por categoría, paginación)
- [x] FineFormComponent (asignar multa a miembro con selección)
- [x] Navegación agregada en sidebar
- [x] Rutas: /fines, /fines/new, /fines/:id/edit

**Criterios:** CRUDs funcionando con cálculos automáticos ✅

---

### Sprint 9: Configuración y Reportes ✅
**Backend:**
- [x] Mejorar Config Module (tipo, categoría, descripción por configuración)
- [x] GET /config/system - Configuraciones como objeto agrupado
- [x] GET /config/system/by-category - Configuraciones por categoría
- [x] PATCH /config/system - Actualización masiva de configuraciones
- [x] PATCH /config/key/:key - Actualización por clave
- [x] Seeder mejorado con configuraciones categorizadas
- [x] Reports Module completo:
  - GET /reports/fund-status (estado general del fondo)
  - GET /reports/delinquency (reporte de morosidad)
  - GET /reports/loans (reporte de préstamos)
  - GET /reports/contributions (aportes por año)
  - GET /reports/export (exportación JSON estructurado)

**Frontend:**
- [x] Modelos TypeScript (config.model.ts, report.model.ts)
- [x] ConfigService conectado a /api/config
- [x] ReportsService conectado a /api/reports
- [x] SettingsComponent (formulario por categorías, edición masiva)
- [x] ReportsComponent con tabs (estado fondo, morosidad, préstamos, aportes)
- [x] Visualización de datos con gráficos de barras y estadísticas
- [x] Exportación a Excel (xlsx) con múltiples hojas
- [x] Exportación a PDF (jspdf + jspdf-autotable)
- [x] Navegación en sidebar (Reportes, Configuración)
- [x] Rutas: /settings, /reports

**Criterios:** Configuración editable, reportes exportables ✅

---

### Sprint 10: Pulido y Producción
- [ ] RBAC completo (permisos por rol)
- [ ] Tests unitarios críticos
- [ ] Swagger/OpenAPI documentación
- [ ] Docker Compose para desarrollo
- [ ] Mejoras de UX basadas en feedback
- [ ] Optimización de queries y performance

**Criterios:** Aplicación estable y lista para producción

## Notas Adicionales

- El fondo es de uso familiar/privado, no requiere registro público
- Priorizar simplicidad y usabilidad sobre complejidad
- Considerar modo offline/PWA para consultas básicas
