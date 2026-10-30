# Proceso Scrum — EFB

Cómo trabaja el equipo de EFB (Escuela de Formación Bíblica): roles, ceremonias, tablero de Jira y cómo se conecta con GitHub.

- **Jira:** proyecto `EFB` en <https://welin1924-1793141597420.atlassian.net/jira/software/projects/EFB/boards/4>
- **GitHub:** <https://github.com/santicodevv/campusefb>
- **Sprint:** 2 semanas · **Equipo:** 2 a 5 personas

## Roles

| Rol | Responsabilidad |
|-----|-----------------|
| **Product Owner** | Dueño del backlog: prioriza, escribe criterios de aceptación y acepta o rechaza el trabajo en la Review. |
| **Scrum Master** | Facilita las ceremonias, cuida el proceso y elimina impedimentos. En un equipo chico lo puede asumir un dev, rotando por sprint. |
| **Equipo de desarrollo** | Estima, se compromete con el objetivo del sprint, desarrolla, revisa PRs de otros y mantiene el tablero al día. |

## Ceremonias

| Ceremonia | Cuándo | Duración | Resultado |
|-----------|--------|----------|-----------|
| **Sprint Planning** | Primer día del sprint | 2 h | Objetivo del sprint y tickets comprometidos (según la velocidad de los últimos sprints). |
| **Daily** | Todos los días, misma hora | 15 min | ¿Qué hice? ¿Qué haré? ¿Qué me bloquea? Se mira el tablero, no se resuelven problemas. |
| **Refinamiento** | Mitad del sprint | 1 h | Tickets del próximo sprint cumplen la Definition of Ready y están estimados. |
| **Sprint Review** | Último día | 1 h | Demo de lo terminado al PO; lo que no cumple el DoD vuelve al backlog. |
| **Retrospectiva** | Último día, después de la Review | 1 h | 1 a 3 acciones de mejora concretas, cargadas como tickets con label `proceso`. |

## Tipos de ticket y ramas

Cada rama nace de `main` y lleva la clave del ticket. El prefijo sale del tipo de trabajo:

| Ticket en Jira | Uso | Prefijo de rama | Tipo de commit |
|----------------|-----|-----------------|----------------|
| **Historia** | Funcionalidad con valor para el usuario | `feature/` | `feat` |
| **Tarea** | Trabajo técnico (tests, refactor, CI) | `chore/`, `refactor/`, `test/` | `chore`, `refactor`, `test` |
| **Error** | Algo que no funciona como debería | `fix/` | `fix` |
| **Tarea** de documentación | Docs y procesos | `docs/` | `docs` |
| **Epic** | Agrupa tickets de un área; no se trabaja directo | — | — |

Ejemplos:

```text
feature/EFB-31-exportar-transcript-pdf
fix/EFB-40-nota-mayor-a-100
test/EFB-12-tests-auth
docs/EFB-1-proceso-scrum
```

## Épicas

Una por área funcional (los módulos están en `backend/src/modules` y `frontend/src/modules`):

| Épica | Alcance |
|-------|---------|
| **EFB-2 Infraestructura y DevOps** | CI/CD, lint, proceso, protección de ramas, Docker, despliegue |
| **EFB-3 Gestión académica** | `academic`, `academic-projection`, `grades` |
| **EFB-4 Integración con Moodle** | `moodle-integration`, `sync`, `webhooks` |
| **EFB-5 Reportes y certificados** | `reports`, `transcripts` |
| **EFB-6 Identidad, usuarios y pagos** | `auth`, `users`, `uploads`, `payments` |
| **EFB-7 Portales web (frontend)** | `frontend/src/modules/{admin,teacher,student,auth}`, `shared` |

Todo ticket nuevo cuelga de una épica.

## Tablero

```text
Por hacer  →  En curso  →  En revisión  →  Listo
```

| Columna | Quién lo mueve | Cuándo |
|---------|----------------|--------|
| **Por hacer** | PO / equipo | Ticket comprometido en el sprint, sin empezar. |
| **En curso** | El dev, a mano | Al crear la rama y empezar a trabajar. Asignarse el ticket. |
| **En revisión** | **Automático** (GitHub Actions) | Al abrir, reabrir o marcar "listo para revisión" un PR con la clave. |
| **Listo** | **Automático** (GitHub Actions) | Al mergear el PR a `main`; deja un comentario con el link del PR. |

Límite recomendado: como mucho 2 tickets "En curso" por persona.

## Estimación

Story points en escala Fibonacci: **1, 2, 3, 5, 8, 13**. Se estima complejidad e incertidumbre, no horas.

| Puntos | Referencia en este proyecto |
|--------|-----------------------------|
| 1 | Cambio trivial (reemplazar un `console.error` por `Logger`). |
| 2 | Cambio acotado en un archivo con un test. |
| 3 | Tests unitarios de un servicio o una pantalla simple. |
| 5 | Feature que toca backend y frontend, o tests de un módulo complejo. |
| 8 | Varias partes con incertidumbre; conviene partirlo. |
| 13 | Demasiado grande: dividir antes de meterlo en un sprint. |

En Jira el campo es **Story point estimate**.

## Definition of Ready

Un ticket puede entrar a un sprint cuando:

- [ ] Tiene título claro y descripción con contexto (qué y por qué).
- [ ] Tiene criterios de aceptación verificables en formato checklist.
- [ ] Está estimado en story points (≤ 8).
- [ ] Tiene épica padre, prioridad y labels (`testing`, `deuda-tecnica`, `devops`, `proceso`…).
- [ ] No tiene dependencias bloqueantes abiertas.

## Definition of Done

Un ticket está terminado cuando:

- [ ] Cumple todos los criterios de aceptación.
- [ ] El código está en `main` vía PR revisado y aprobado por al menos 1 persona.
- [ ] El CI pasa: `Backend` (build + tests), `Frontend` (lint + build) y `Ticket de Jira`.
- [ ] Hay tests para la lógica nueva o modificada.
- [ ] No quedan `console.log` ni código comentado de debug.
- [ ] Si cambia el esquema, incluye la migración de TypeORM.
- [ ] Docs actualizadas (README, `DEPLOYMENT.md`, Swagger) si cambia el uso o la configuración.
- [ ] El ticket está en **Listo** con el link al PR.

## Integración Jira ↔ GitHub

No se usa la app "GitHub for Jira": la integración la hacen dos workflows de GitHub Actions.

### `.github/workflows/jira.yml` — check "Ticket de Jira"

Falla si ni la rama ni el título del PR contienen `EFB-<n>`. Corre al abrir, editar, sincronizar o reabrir el PR, así que se arregla cambiando el título.

### `.github/workflows/jira-transiciones.yml` — mueve los tickets

| Evento del PR | Transición en Jira |
|---------------|--------------------|
| Abierto, reabierto o listo para revisión | → **En revisión** (si no existe la columna, → **En curso**) |
| Mergeado | → **Listo** + comentario "Mergeado a main en el PR #n" con link |
| Cerrado sin mergear | Nada |

Detalles:

- Usa la API REST v3 de Jira con los secretos del repo `JIRA_USER_EMAIL` y `JIRA_API_TOKEN`. Si faltan, emite un warning y termina en verde.
- Valida las credenciales primero con `/rest/api/3/myself` y muestra el código HTTP. Con credenciales malas Jira responde 404 en los tickets (como si no existieran), por eso se valida antes.
- Prueba la URL del sitio y después el gateway `https://api.atlassian.com/ex/jira/<cloudId>`, porque los tokens con alcances solo funcionan ahí.
- Mueve todas las claves `EFB-<n>` que encuentre en rama y título.

### Configurar o rotar el token

1. Crear un token en <https://id.atlassian.com/manage-profile/security/api-tokens> → **Create API token** (el normal, no el de alcances).
2. Probarlo en local antes de guardarlo (fish):

   ```fish
   read -s -P "Token: " JT
   curl -s -o /dev/null -w '%{http_code}\n' -u "<tu-email-atlassian>:$JT" https://welin1924-1793141597420.atlassian.net/rest/api/3/myself
   ```

   Tiene que imprimir `200`.
3. Guardarlo sin que pase por el portapapeles ni el historial:

   ```fish
   printf '%s' $JT | gh secret set JIRA_API_TOKEN --repo santicodevv/campusefb
   gh secret set JIRA_USER_EMAIL --repo santicodevv/campusefb --body "<tu-email-atlassian>"
   set -e JT
   ```

4. Verificar con `gh secret list --repo santicodevv/campusefb` que la fecha sea la de hoy.

Nunca pegues tokens en chats, tickets ni commits. Si pasa, revocalo de inmediato.

### Re-ejecutar el workflow

"Re-run" en Actions usa **la versión del workflow del evento original**. Para que corra una versión nueva del workflow, cerrá y reabrí el PR.

## Protección de `main`

`main` solo recibe cambios por PR. Configuración esperada (ticket EFB-10):

- PR obligatorio con 1 aprobación; se descartan aprobaciones al subir commits nuevos.
- Conversaciones resueltas antes de mergear.
- Checks requeridos: `Backend`, `Frontend`, `Ticket de Jira`, con la rama al día con `main`.
- Sin force-push ni borrado.
- Mientras haya un solo revisor, el rol Admin puede saltar la regla solo al mergear un PR.

Requiere GitHub Pro/Team o un repo público: en plan Free con repo privado GitHub no aplica rulesets.
