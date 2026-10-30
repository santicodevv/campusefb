# Guía para agentes

Sistema de gestión académica EFB: backend NestJS + TypeORM + PostgreSQL + Redis/BullMQ en `backend/`, frontend React 19 + Vite en `frontend/`, sincronizado con Moodle.

## Convención de trabajo (Jira `EFB` + GitHub)

Todo cambio sale de un ticket de Jira del proyecto `EFB` y lleva su clave:

- **Rama:** `<tipo>/EFB-<n>-desc-corta`, p. ej. `feature/EFB-12-tests-auth`, `fix/EFB-40-nota-mayor-a-100`, `docs/EFB-1-proceso-scrum`.
- **Commits:** Conventional Commits con la clave después del scope: `feat(reportes): EFB-12 exportar PDF`, `fix(grades): EFB-40 rechazar notas mayores a 100`.
- **PR:** contra `main`, con `EFB-<n>` en el título. El check "Ticket de Jira" falla si falta.
- Nunca hacer push directo a `main`.

Los workflows mueven el ticket solo: PR abierto → "En revisión"; PR mergeado → "Listo". Detalle en `docs/SCRUM.md`.

## Verificación antes de abrir un PR

```bash
cd backend && npm run build && npx jest
cd frontend && npx eslint . && npm run build
```

El lint del backend todavía tiene errores heredados (ticket EFB-11): no los mezcles con otros cambios.

## Reglas

- Usar `Logger` de `@nestjs/common` en el backend, no `console.*`.
- Cambios de esquema siempre con migración (`npm run migration:generate`).
- No commitear `.env` ni secretos. Los tokens de Jira viven solo en los secretos del repo.
