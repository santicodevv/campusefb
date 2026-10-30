# Cómo contribuir

El proceso completo (roles, ceremonias, tablero, DoR/DoD) está en [docs/SCRUM.md](docs/SCRUM.md). Esto es lo mínimo para el día a día.

## Flujo

1. Tomá un ticket del sprint activo en Jira (proyecto `EFB`), asignátelo y movelo a **En curso**.
2. Creá la rama desde `main` actualizado, con la clave del ticket:

   ```bash
   git switch main && git pull
   git switch -c feature/EFB-12-tests-auth
   ```

3. Commiteá con [Conventional Commits](https://www.conventionalcommits.org/es/) y la clave del ticket:

   ```text
   feat(reportes): EFB-31 exportar transcript a PDF
   fix(grades): EFB-40 rechazar notas mayores a 100
   test(auth): EFB-12 cubrir login y refresh de token
   ```

4. Abrí el PR contra `main` con la clave en el título (`feat(auth): EFB-12 tests del módulo de autenticación`) y completá la plantilla.
5. El ticket pasa solo a **En revisión**. Pedí revisión a otra persona.
6. Con el CI en verde y la aprobación, mergeá. El ticket pasa solo a **Listo** con el link del PR.

## Ramas

| Prefijo | Para |
|---------|------|
| `feature/EFB-<n>-desc` | Funcionalidad nueva (Historia) |
| `fix/EFB-<n>-desc` | Corrección de un Error |
| `test/`, `refactor/`, `chore/` + `EFB-<n>-desc` | Trabajo técnico (Tarea) |
| `docs/EFB-<n>-desc` | Documentación y procesos |

La clave va en mayúsculas (`EFB-12`) y la descripción en minúsculas con guiones. Sin clave `EFB-<n>` el check **Ticket de Jira** falla.

## Antes de abrir el PR

```bash
# backend
cd backend && npm run build && npx jest
# frontend
cd frontend && npx eslint . && npm run build
```

Es lo mismo que corre el CI (`.github/workflows/ci.yml`).
