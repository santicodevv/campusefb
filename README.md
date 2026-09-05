# EFB | Escuela de Formación Bíblica

Sistema de gestión académica integrado con Moodle para instituciones educativas.

## Características

- **Autenticación JWT** con roles (STUDENT, TEACHER, ADMIN)
- **Sincronización bidireccional** con Moodle (Mirror + Outbox Pattern)
- **Gestión de períodos académicos** con estados (planned, open, closed)
- **Registro de calificaciones** con validaciones y sincronización automática
- **Reportería avanzada** con exportación a Excel y PDF
- **Transcripts oficiales** con verificación digital (QR + SHA-256)
- **Observabilidad** con logging estructurado y health checks

## Stack Tecnológico

| Componente | Tecnología |
|------------|------------|
| **Frontend** | React 19 + TypeScript + Vite |
| **UI/Estilos** | TailwindCSS 4 |
| **Estado/Fetching** | React Query (TanStack Query) |
| **Backend** | NestJS (Node.js) |
| **Base de Datos** | PostgreSQL |
| **ORM** | TypeORM |
| **Cache/Queue** | Redis + BullMQ |
| **Documentación** | Swagger/OpenAPI |
| **Contenedores** | Docker |

## Requisitos Previos

- Node.js >= 18.x
- Docker y Docker Compose
- PostgreSQL 14+
- Redis 7+

## Instalación Rápida

```bash
# 1. Clonar el repositorio
git clone <repository-url>
cd campusefb

# 2. Copiar variables de entorno
cp .env.example .env

# 3. Levantar servicios con Docker
docker compose up -d postgres redis

# 4. Backend - Instalar dependencias y ejecutar
cd backend
npm install
npm run seed:roles          # Crear roles iniciales (STUDENT, TEACHER, ADMIN)
npm run start:dev           # Iniciar backend en puerto 3000

# 5. Frontend - En otra terminal
cd frontend
npm install
npm run dev                 # Iniciar frontend en puerto 5173
```

## URLs de Desarrollo

| Servicio | URL |
|----------|-----|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:3000/api |
| Swagger Docs | http://localhost:3000/api/docs |
| Health Check | http://localhost:3000/api/health |

## Variables de Entorno

### Backend (.env en raíz)

```env
# Base de datos
DB_NAME=moddle_db
DB_USER=moddle_user
DB_PASSWORD=moddle_pass
DB_HOST=localhost
DB_PORT=5432

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT
JWT_SECRET=your-super-secret-key-change-in-production
JWT_EXPIRATION=1h
JWT_REFRESH_EXPIRATION=7d

# Moodle
MOODLE_URL=https://your-moodle.edu
MOODLE_TOKEN=your-moodle-ws-token
MOODLE_WEBHOOK_SECRET=your-webhook-secret

# App
PORT=3000
NODE_ENV=development
CORS_ORIGINS=http://localhost:5173,http://localhost:3000
```

### Frontend (frontend/.env)

```env
VITE_API_URL=http://localhost:3000/api
```

## Estructura del Proyecto

```
campusefb/
├── backend/
│   ├── src/
│   │   ├── common/           # Decorators, guards, interceptors
│   │   ├── config/           # Configuraciones (DB, Redis)
│   │   └── modules/
│   │       ├── auth/         # Autenticación JWT
│   │       ├── users/        # Gestión de usuarios
│   │       ├── academic/     # Períodos, calificaciones
│   │       ├── moodle-integration/  # Entidades espejo
│   │       ├── sync/         # Outbox, auditoría
│   │       ├── reports/      # Reportería
│   │       ├── transcripts/  # Récords oficiales
│   │       ├── health/       # Health checks
│   │       └── webhooks/     # Webhooks Moodle
│   └── storage/              # Archivos generados
├── frontend/
│   ├── src/
│   │   ├── api/              # Servicios API (auth, users, courses, etc.)
│   │   ├── components/
│   │   │   ├── layout/       # MainLayout, Sidebar, Header
│   │   │   └── ui/           # Button, Input, Card, Modal, etc.
│   │   ├── context/          # AuthContext
│   │   ├── lib/              # Axios, utils, storage
│   │   ├── pages/
│   │   │   ├── admin/        # Dashboard, Users, Courses, Sync
│   │   │   ├── auth/         # Login, Register
│   │   │   ├── shared/       # Grades, Transcripts
│   │   │   ├── student/      # Dashboard, ReEnrolments
│   │   │   └── teacher/      # Dashboard, MyCourses
│   │   ├── router/           # AppRouter, routes, guards
│   │   └── types/            # TypeScript interfaces
│   └── .env
├── scripts/                  # SQL scripts
├── docker-compose.yml
└── .env
```

## API Endpoints

### Autenticación
| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/auth/login` | Iniciar sesión |
| POST | `/api/auth/register` | Registrar usuario |
| POST | `/api/auth/refresh` | Refrescar token |

### Períodos Académicos
| Método | Ruta | Roles | Descripción |
|--------|------|-------|-------------|
| GET | `/api/periods` | Todos | Listar períodos |
| POST | `/api/periods` | ADMIN | Crear período |
| POST | `/api/periods/:id/open` | ADMIN | Abrir período |
| POST | `/api/periods/:id/close` | ADMIN | Cerrar período |

### Calificaciones
| Método | Ruta | Roles | Descripción |
|--------|------|-------|-------------|
| POST | `/api/grades` | TEACHER, ADMIN | Registrar calificación |
| PATCH | `/api/grades/:id` | TEACHER, ADMIN | Actualizar calificación |
| GET | `/api/grades/student/:id` | STUDENT*, TEACHER, ADMIN | Ver calificaciones |
| GET | `/api/grades/course/:id` | TEACHER, ADMIN | Calificaciones por curso |

### Reportería
| Método | Ruta | Roles | Descripción |
|--------|------|-------|-------------|
| GET | `/api/reports/grades/by-student/:id` | STUDENT*, TEACHER, ADMIN | Reporte por estudiante |
| GET | `/api/reports/grades/by-course/:id` | TEACHER, ADMIN | Reporte por curso |
| GET | `/api/reports/grades/by-period/:id` | ADMIN | Reporte por período |
| GET | `/api/reports/global/summary` | ADMIN | Resumen global |

> Agregar `?format=excel` o `?format=pdf` para exportar

### Transcripts
| Método | Ruta | Roles | Descripción |
|--------|------|-------|-------------|
| POST | `/api/transcripts` | ADMIN | Generar transcript |
| GET | `/api/transcripts/:id/download` | STUDENT*, ADMIN | Descargar PDF |
| GET | `/api/transcripts/verify/:hash` | **Público** | Verificar autenticidad |
| PATCH | `/api/transcripts/:id/revoke` | ADMIN | Revocar documento |

### Health Checks
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/health` | Estado general |
| GET | `/api/health/db` | Estado de la BD |
| GET | `/api/health/live` | Liveness probe |
| GET | `/api/health/ready` | Readiness probe |

## Documentación API

Swagger UI disponible en: `http://localhost:3000/api/docs`

## Scripts Disponibles

### Backend (desde /backend)

```bash
# Desarrollo
npm run start:dev        # Iniciar en modo desarrollo (watch mode)
npm run build            # Compilar TypeScript
npm run start:prod       # Iniciar en producción

# Base de datos
npm run typeorm migration:run      # Ejecutar migraciones
npm run typeorm migration:revert   # Revertir última migración

# CLI
npm run seed:roles       # Crear roles iniciales (STUDENT, TEACHER, ADMIN)
npm run sync:moodle      # Sincronizar desde Moodle

# Calidad
npm run lint             # Ejecutar ESLint
npm run format           # Formatear con Prettier
npm run test             # Ejecutar tests
```

### Frontend (desde /frontend)

```bash
npm run dev              # Iniciar en desarrollo (Vite, :5173)
npm run build            # Compilar para producción
npm run preview          # Preview del build de producción
npm run lint             # Ejecutar ESLint
```

## Arquitectura

```
                    ┌─────────────────┐
                    │     Frontend    │
                    │ (React + Vite)  │
                    │   :5173         │
                    └────────┬────────┘
                             │ HTTP/REST
                             ▼
┌────────────────────────────────────────────────────┐
│                NestJS Backend :3000                 │
├─────────────┬─────────────┬─────────────┬──────────┤
│    Auth     │  Academic   │   Reports   │ Webhooks │
│   Module    │   Module    │   Module    │  Module  │
└─────────────┴──────┬──────┴─────────────┴──────────┘
                     │
         ┌───────────┼───────────┐
         ▼           ▼           ▼
    ┌─────────┐ ┌─────────┐ ┌─────────┐
    │PostgreSQL│ │  Redis  │ │ Moodle  │
    │  :5432   │ │  :6379  │ │  (API)  │
    └─────────┘ └─────────┘ └─────────┘
```

## Patrón de Sincronización

```
App → local_grades → outbox_events → BullMQ → Moodle API
                                         │
                                         ▼
                                   moodle_grades (mirror)
```

## Seguridad

- Passwords hasheados con bcrypt
- JWT con expiración configurable
- RBAC (Role-Based Access Control)
- Validación de entrada en todos los endpoints
- Rate limiting en endpoints públicos
- Tokens de Moodle cifrados

## Licencia

Propietario - Todos los derechos reservados
