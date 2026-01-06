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

### Sprint 1: Core Foundation ✅
- [x] Estructura de carpetas escalable
- [x] Path aliases (@core/*, @shared/*, @features/*, @layouts/*)
- [x] Modelos TypeScript (User, Auth, ApiResponse, enums)
- [x] Servicios core (StorageService, ApiService, AuthService)
- [x] Interceptors HTTP (auth, error)
- [x] Guards de rutas (auth, guest, role)
- [x] Configuración de environments

### Sprint 2: UI Foundation ✅
- [x] Sistema de estilos SCSS (variables, mixins, reset, utilities)
- [x] Componentes de formulario (Button, Input, Select, FormField)
- [x] Componentes de feedback (LoadingSpinner, EmptyState, Toast, ConfirmModal)
- [x] Componentes de datos (Card, StatCard, DataTable con paginación)
- [x] AuthLayout (pantalla de login con branding)
- [x] MainLayout (sidebar + header responsive)
- [x] Rutas base con lazy loading
- [x] Responsive en móvil y desktop

### Sprint 3: Autenticación y Dashboard
- [ ] Feature Auth (LoginComponent, validaciones, integración AuthService)
- [ ] Feature Dashboard (estadísticas, cards resumen, últimos movimientos)
- [ ] Logout completo (limpiar token, redirigir)
- **Criterios:** Login funcional, dashboard con info, rutas protegidas

### Sprint 4: Gestión de Miembros
- [ ] MembersService (CRUD completo)
- [ ] MembersListComponent con DataTable, búsqueda/filtros
- [ ] MemberFormComponent (crear/editar con validaciones)
- [ ] MemberDetailComponent (info, historial aportes, préstamos, multas)
- [ ] Rutas: /members, /members/new, /members/:id, /members/:id/edit
- **Criterios:** CRUD completo, validaciones, navegación fluida

### Sprint 5: Gestión de Aportes/Pagos
- [ ] ContributionsService y modelos
- [ ] ContributionsListComponent (filtros mes/año/estado, resumen)
- [ ] ContributionFormComponent (registro de pago, comprobante)
- [ ] PaymentCalendarComponent (vista mensual, indicadores visuales)
- **Criterios:** Registrar pagos, ver estado por mes, identificar morosos

### Sprint 6: Gestión de Préstamos
- [ ] LoansService, LoanInstallmentsService y modelos
- [ ] LoansListComponent (filtros, resumen)
- [ ] LoanRequestComponent (calculadora de cuotas, validar límites)
- [ ] LoanApprovalComponent (aprobar/rechazar solicitudes)
- [ ] LoanDetailComponent (amortización, registro de cuotas)
- **Criterios:** Solicitar préstamos, aprobar/rechazar, seguimiento cuotas

### Sprint 7: Multas, Eventos e Inversiones
- [ ] Módulo Multas (CRUD, integrar con detalle miembro)
- [ ] Módulo Eventos (CRUD con transacciones)
- [ ] Módulo Inversiones (CRUD con cálculo de rendimientos)
- **Criterios:** CRUDs funcionando con sus respectivos cálculos

### Sprint 8: Configuración y Reportes
- [ ] SettingsComponent (parámetros, gestión roles)
- [ ] ReportsService (estado fondo, morosidad, préstamos)
- [ ] Exportación a Excel y PDF
- **Criterios:** Configuración editable, reportes visuales, exportación funcional

## Notas Adicionales

- El fondo es de uso familiar/privado, no requiere registro público
- Priorizar simplicidad y usabilidad sobre complejidad
- Considerar modo offline/PWA para consultas básicas
