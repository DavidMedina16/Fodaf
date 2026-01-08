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

### Sprint 7: Gestión de Préstamos (Full Stack)
**Backend:**
- [ ] Cálculo automático de cuotas con interés
- [ ] Validar límites de préstamo según historial
- [ ] Endpoint para aprobar/rechazar préstamos
- [ ] Tabla de amortización

**Frontend:**
- [ ] LoansService conectado a /api/loans
- [ ] LoansListComponent (filtros, resumen)
- [ ] LoanRequestComponent (calculadora de cuotas)
- [ ] LoanApprovalComponent (aprobar/rechazar)
- [ ] LoanDetailComponent (tabla amortización, pagos)

**Criterios:** Flujo completo de préstamo funcional

---

### Sprint 8: Eventos, Inversiones y Multas (Full Stack)
**Backend:**
- [ ] Cálculo de rendimientos CDT automático
- [ ] Resumen de recaudación por evento
- [ ] Multas automáticas por mora (opcional)

**Frontend:**
- [ ] Módulo Eventos (lista, formulario, detalle con transacciones)
- [ ] Módulo Inversiones (lista, formulario, cálculo rendimientos)
- [ ] Módulo Multas (lista, asignar multa, integrar en detalle miembro)

**Criterios:** CRUDs funcionando con cálculos automáticos

---

### Sprint 9: Configuración y Reportes
**Backend:**
- [ ] Endpoints de reportes (estado fondo, morosidad, préstamos)
- [ ] Exportación de datos en JSON estructurado

**Frontend:**
- [ ] SettingsComponent (editar parámetros: tasa interés, cuota, multa)
- [ ] ReportsComponent (gráficos, tablas resumen)
- [ ] Exportación a Excel (xlsx)
- [ ] Exportación a PDF (jspdf)

**Criterios:** Configuración editable, reportes exportables

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
