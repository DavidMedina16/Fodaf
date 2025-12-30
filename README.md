# FODAF - Fondo de Ahorro Familiar

Aplicación web para gestionar un fondo de ahorro comunitario familiar.

## Funcionalidades

- **Miembros**: Registro y gestión de integrantes del fondo
- **Aportes**: Seguimiento de aportes mensuales con fechas límite
- **Préstamos**: Gestión de préstamos con tasas de interés y cuotas
- **Eventos**: Organización de eventos para recaudación de fondos
- **Inversiones CDT**: Registro de inversiones para aumentar el capital
- **Multas**: Control de multas por incumplimiento

## Stack Tecnológico

| Backend | Frontend |
|---------|----------|
| NestJS 11 | Angular 20 |
| TypeScript 5.7 | TypeScript 5.9 |
| TypeORM | Angular Signals |
| MySQL | SCSS |
| JWT Auth | Standalone Components |

## Requisitos

- Node.js 20+
- pnpm
- MySQL 8+

## Instalación

```bash
# Clonar el repositorio
git clone https://github.com/DavidMedina16/Fodaf.git
cd Fodaf

# Backend
cd backend
pnpm install
cp .env.example .env  # Configurar variables de entorno
pnpm run start:dev

# Frontend (en otra terminal)
cd frontend
pnpm install
pnpm start
```

## Variables de Entorno

Crear archivo `backend/.env` basado en `.env.example`:

```env
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=root
DB_PASSWORD=tu_password
DB_DATABASE=fodaf
JWT_SECRET=tu_secret_key
```

## Estructura del Proyecto

```
Fodaf/
├── backend/          # API REST NestJS
│   ├── src/
│   │   ├── entities/     # Entidades TypeORM
│   │   └── modules/      # Módulos (auth, users, loans, etc.)
│   └── test/
│
├── frontend/         # Aplicación Angular
│   └── src/
│       └── app/
│
└── README.md
```

## Licencia

Proyecto privado de uso familiar.
