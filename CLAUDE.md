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
├── backend/                 # API REST NestJS
│   ├── src/
│   │   ├── modules/         # Módulos de la aplicación (por crear)
│   │   │   ├── members/     # Gestión de miembros
│   │   │   ├── payments/    # Gestión de pagos
│   │   │   ├── loans/       # Gestión de préstamos
│   │   │   ├── events/      # Gestión de eventos
│   │   │   ├── investments/ # Gestión de CDTs
│   │   │   └── auth/        # Autenticación
│   │   ├── common/          # Utilidades compartidas
│   │   └── config/          # Configuración de la app
│   └── test/
│
├── frontend/                # Aplicación Angular
│   ├── src/
│   │   ├── app/
│   │   │   ├── core/        # Servicios singleton, guards, interceptors
│   │   │   ├── shared/      # Componentes reutilizables
│   │   │   ├── features/    # Módulos de funcionalidad (por crear)
│   │   │   │   ├── dashboard/
│   │   │   │   ├── members/
│   │   │   │   ├── payments/
│   │   │   │   ├── loans/
│   │   │   │   ├── events/
│   │   │   │   └── investments/
│   │   │   └── layouts/     # Layouts de la aplicación
│   │   ├── assets/
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

## Próximos Pasos

1. [ ] Definir y configurar base de datos (PostgreSQL + TypeORM/Prisma)
2. [ ] Implementar autenticación (JWT)
3. [ ] Crear módulo de miembros (CRUD)
4. [ ] Crear módulo de pagos con seguimiento mensual
5. [ ] Crear módulo de préstamos
6. [ ] Crear módulo de eventos
7. [ ] Crear módulo de inversiones CDT
8. [ ] Crear dashboard con resumen general
9. [ ] Implementar reportes y estadísticas

## Notas Adicionales

- El fondo es de uso familiar/privado, no requiere registro público
- Priorizar simplicidad y usabilidad sobre complejidad
- Considerar modo offline/PWA para consultas básicas
