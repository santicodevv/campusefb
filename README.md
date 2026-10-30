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

- Node.js 20.x (la misma versión que usan el Dockerfile y el CI)
- Docker y Docker Compose
- PostgreSQL 14+
- Redis 7+

## Instalación Rápida

```bash
# 1. Clonar el repositorio
git clone git@github.com:santicodevv/campusefb.git
cd campusefb

# 2. Copiar variables de entorno y ajustarlas a tu entorno local (ver "Variables de Entorno")
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

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

## Flujo de Trabajo

El equipo trabaja con Scrum en sprints de 2 semanas. Todo cambio sale de un ticket de Jira y entra a `main` por pull request.

- **Tablero:** [Jira · proyecto EFB](https://welin1924-1793141597420.atlassian.net/jira/software/projects/EFB/boards/4) (Por hacer → En curso → En revisión → Listo)
- **Proceso completo** (roles, ceremonias, estimación, Definition of Ready/Done): [docs/SCRUM.md](docs/SCRUM.md)
- **Guía rápida para contribuir:** [CONTRIBUTING.md](CONTRIBUTING.md)

### Paso a paso

1. Toma un ticket del sprint activo, asígnatelo y muévelo a **En curso**.
2. Crea una rama desde `main` actualizado con la clave del ticket:

   ```bash
   git switch main && git pull
   git switch -c feature/EFB-12-tests-auth
   ```

3. Commitea con [Conventional Commits](https://www.conventionalcommits.org/es/) y la clave: `test(auth): EFB-12 cubrir login y refresh de token`.
4. Abre un PR contra `main` con la clave en el título. El ticket pasa solo a **En revisión**.
5. Con 1 aprobación y el CI en verde, mergea. El ticket pasa solo a **Listo** y recibe un comentario con el link del PR.

### Convención de ramas

| Prefijo | Para |
|---------|------|
| `feature/EFB-<n>-desc` | Funcionalidad nueva (Historia) |
| `fix/EFB-<n>-desc` | Corrección de un Error |
| `test/`, `refactor/`, `chore/` + `EFB-<n>-desc` | Trabajo técnico (Tarea) |
| `docs/EFB-<n>-desc` | Documentación y procesos |

### Automatización (GitHub Actions)

| Workflow | Qué hace |
|----------|----------|
| [`ci.yml`](.github/workflows/ci.yml) | **Backend**: build + tests. **Frontend**: lint + build. |
| [`jira.yml`](.github/workflows/jira.yml) | **Ticket de Jira**: falla si ni la rama ni el título del PR tienen `EFB-<n>`. |
| [`jira-transiciones.yml`](.github/workflows/jira-transiciones.yml) | Mueve el ticket a *En revisión* al abrir el PR y a *Listo* al mergearlo. Usa los secretos `JIRA_USER_EMAIL` y `JIRA_API_TOKEN`. |

### Rama `main` protegida

- No se puede hacer push directo, force-push ni borrarla.
- Cada PR necesita 1 aprobación (se descarta si llegan commits nuevos) y las conversaciones resueltas.
- Checks obligatorios: `Backend`, `Frontend` y `Ticket de Jira`, con la rama al día con `main`.
- Cada merge a `main` despliega automáticamente el backend en Railway (ver [DEPLOYMENT.md](DEPLOYMENT.md)).

## URLs de Desarrollo

| Servicio | URL |
|----------|-----|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:3000/api |
| Swagger Docs | http://localhost:3000/api/docs |
| Health Check | http://localhost:3000/api/health |

## Variables de Entorno

### Backend (`backend/.env` o `.env` en la raíz)

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
├── .github/
│   ├── workflows/            # CI y automatización con Jira
│   └── pull_request_template.md
├── docs/
│   └── SCRUM.md              # Proceso de trabajo
├── backend/
│   ├── src/
│   │   ├── common/           # Decorators, guards, interceptors
│   │   ├── config/           # Configuraciones (DB, Redis)
│   │   ├── migrations/       # Migraciones de TypeORM
│   │   └── modules/
│   │       ├── auth/         # Autenticación JWT y Microsoft SSO
│   │       ├── users/        # Gestión de usuarios y perfiles
│   │       ├── uploads/      # Documentos subidos
│   │       ├── payments/     # Pagos
│   │       ├── academic/     # Períodos, cursos, calificaciones, reinscripción
│   │       ├── academic-projection/  # Proyección y avance por programa
│   │       ├── grades/       # Calificaciones
│   │       ├── moodle-integration/  # Entidades espejo
│   │       ├── sync/         # Outbox, auditoría
│   │       ├── reports/      # Reportería
│   │       ├── transcripts/  # Récords oficiales
│   │       ├── health/       # Health checks
│   │       └── webhooks/     # Webhooks Moodle
│   ├── test/                 # Tests e2e
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── app/              # Providers y router
│   │   ├── modules/
│   │   │   ├── admin/        # Portal de administración
│   │   │   ├── teacher/      # Portal docente
│   │   │   ├── student/      # Portal del estudiante
│   │   │   └── auth/         # Login y registro
│   │   └── shared/           # api, components, lib, pages, types
│   └── .env.example
├── docker-compose.yml
├── DEPLOYMENT.md             # Despliegue en Vercel, Railway y Neon
└── CONTRIBUTING.md
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
npm run migration:generate -- src/migrations/<Nombre>  # Generar migración a partir de las entidades
npm run migration:run       # Ejecutar migraciones
npm run migration:revert    # Revertir última migración

# CLI
npm run seed:roles       # Crear roles iniciales (STUDENT, TEACHER, ADMIN)
npm run sync:moodle      # Sincronizar desde Moodle

# Calidad
npm test                 # Tests unitarios (Jest)
npm run test:e2e         # Tests e2e (necesita Postgres y Redis)
npm run lint             # ESLint con --fix (modifica archivos)
npm run format           # Formatear con Prettier
```

Antes de abrir un PR conviene correr lo mismo que el CI:

```bash
cd backend && npm run build && npx jest
cd frontend && npx eslint . && npm run build
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
