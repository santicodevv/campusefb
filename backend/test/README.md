# Tests e2e

`app.e2e-spec.ts` levanta el `AppModule` completo contra Postgres y Redis reales y prueba:

- `GET /api/health` y `GET /api/health/db`.
- `POST /api/auth/login` con un usuario que el propio test siembra (`e2e.student@efb.test`) y borra al terminar.

En CI corre en el job **Backend e2e** (`.github/workflows/ci.yml`) con servicios `postgres` y `redis`.

## Correrlo en local

Desde la raíz del repo, levantar solo Postgres y Redis con `docker compose`:

```bash
docker compose up -d --wait postgres redis
```

Si los puertos 5432/6379 ya están ocupados por otro proyecto, usar otros:

```bash
DB_PORT=5440 REDIS_PORT=6380 docker compose up -d --wait postgres redis
```

En `backend/`, exportar las variables (ajustar `DB_PORT`/`REDIS_PORT` si se cambiaron arriba), aplicar las migraciones y correr los tests:

```bash
export NODE_ENV=test JWT_SECRET=e2e-secret DB_HOST=localhost DB_PORT=5432 REDIS_HOST=localhost REDIS_PORT=6379
npm run migration:run
npm run test:e2e
```

Con fish: `set -x NODE_ENV test` (y así con cada variable) en lugar de `export`.

El test usa la base `moddle_db` del compose (usuario `moddle_user` / `moddle_pass`, los valores por defecto de `database.config.ts`). No apuntarlo a una base con datos reales: el usuario sembrado se crea y se borra en cada corrida.

Para bajar los contenedores:

```bash
docker compose stop postgres redis
```

## Notas

- `uuid@13` solo se publica como ESM y Jest corre en CommonJS; `jest-e2e.json` lo mapea a `test/stubs/uuid.ts` (usa `crypto.randomUUID`).
- Con `NODE_ENV` distinto de `production`, TypeORM loguea cada query: la salida es larga, pero los resultados quedan al final.
