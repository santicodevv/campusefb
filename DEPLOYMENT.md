# Produccion EFB

Arquitectura recomendada:

- Vercel: frontend Vite (`frontend/`).
- Railway: backend NestJS (`backend/`) y Redis.
- Neon: PostgreSQL del backend.
- Moodle: plataforma academica y Web Services REST.
- Microsoft Entra ID: inicio de sesion institucional con Office 365.

## 1. Neon

1. Crea un proyecto PostgreSQL en Neon.
2. Copia la cadena pooled de produccion en `DATABASE_URL`.
3. Conserva `sslmode=require` en la cadena.
4. No actives `synchronize` manualmente: el backend ejecuta las migraciones al iniciar cuando `NODE_ENV=production`.
5. Tras el primer despliegue ejecuta una sola vez `npm run seed:roles` contra la base de datos de produccion, o usa la consola de Railway para ejecutar el comando en el servicio.

## 2. Railway

Crea un proyecto con estos servicios:

- Servicio backend desde el repositorio, con Root Directory `backend`.
- Servicio Redis administrado por Railway.

El `Dockerfile` del backend ya compila y arranca la aplicacion. En el servicio backend configura estas variables:

```env
NODE_ENV=production
PORT=3000
DATABASE_URL=${{Neon.DATABASE_URL}}
REDIS_URL=${{Redis.REDIS_URL}}
FRONTEND_URL=https://<dominio-vercel>
CORS_ORIGINS=https://<dominio-vercel>
JWT_SECRET=<secreto-largo-random>
JWT_EXPIRATION=8h
```

Agrega tambien las variables de Moodle, Microsoft y pagos indicadas en `backend/.env.example`. Railway debe generar un dominio publico para la API, por ejemplo `https://api-efb.up.railway.app`.

Verificaciones despues del despliegue:

- `GET https://<api>/api/health`
- `GET https://<api>/api/health/ready`
- `GET https://<api>/api/docs`

En Railway configura el healthcheck con `/api/health/ready`. No uses el dominio interno de Railway en Vercel, Moodle o Microsoft.

## 3. Vercel

1. Importa el repositorio.
2. Define Root Directory como `frontend`.
3. Framework: Vite.
4. Build command: `npm run build`.
5. Output directory: `dist`.
6. Agrega estas variables para Production y Preview segun corresponda:

```env
VITE_API_URL=https://<dominio-publico-railway>/api
VITE_MOODLE_URL=https://<dominio-publico-moodle>
```

El archivo `frontend/vercel.json` ya redirige las rutas de React al `index.html`.

## 4. Moodle: Web Services REST

En Moodle, con una cuenta administrativa:

1. Ve a `Administracion del sitio > Caracteristicas avanzadas` y activa Web Services.
2. Ve a `Administracion del sitio > Plugins > Web services > Protocolos` y activa REST.
3. Crea un usuario tecnico exclusivo para EFB, con correo institucional y sin usar una cuenta personal.
4. Crea un rol tecnico con solo las capacidades necesarias para leer usuarios, cursos, matriculas, categorias y calificaciones, y para crear/actualizar usuarios, cursos y matriculas.
5. Ve a `Plugins > Web services > Servicios externos`, crea un servicio personalizado para EFB y agrega estas funciones:

```text
core_user_get_users
core_course_get_courses
core_enrol_get_enrolled_users
core_grades_get_grade_items
gradereport_user_get_grade_items
core_grades_update_grades
enrol_manual_enrol_users
core_user_update_users
enrol_manual_unenrol_users
core_course_get_categories
core_user_create_users
core_course_create_courses
```

6. Autoriza al usuario tecnico en ese servicio.
7. Genera un token para ese usuario y servicio desde `Plugins > Web services > Gestionar tokens`.
8. Configura en Railway:

```env
MOODLE_URL=https://<dominio-moodle>/<subcarpeta-si-aplica>
MOODLE_TOKEN=<token-generado-en-moodle>
```

`MOODLE_URL` debe ser la URL base de Moodle, no la URL `/webservice/rest/server.php`; el backend agrega esa ruta.

### Webhook Moodle

El backend expone:

```text
POST https://<dominio-api>/api/integrations/moodle/webhook
Header: x-moodle-signature: <firma-hmac-sha256-en-hex>
```

Configura el mismo valor secreto en `MOODLE_WEBHOOK_SECRET`. Moodle estándar no incluye un interruptor universal para enviar este webhook; para usarlo necesitas un plugin/local plugin o integración que envíe el JSON y calcule HMAC-SHA256 sobre el cuerpo exacto. Si todavía no tienes ese plugin, deja el webhook sin uso y utiliza la sincronización programada del backend.

## 5. Microsoft 365 / Entra ID

1. Entra al portal de Azure y abre `Microsoft Entra ID > App registrations > New registration`.
2. Registra una aplicación web para EFB.
3. En `Authentication > Web > Redirect URIs`, agrega exactamente:

```text
https://<dominio-api>/api/auth/microsoft/callback
```

4. En `Certificates & secrets`, crea un client secret y guarda su valor una sola vez.
5. En `API permissions`, agrega Microsoft Graph `User.Read` como permiso delegado y concede consentimiento de administrador si la organización lo requiere.
6. Usa el Tenant ID de la organización, no `common`, si el acceso debe limitarse al dominio institucional.
7. Configura en Railway:

```env
MICROSOFT_TENANT_ID=<tenant-id>
MICROSOFT_CLIENT_ID=<application-client-id>
MICROSOFT_CLIENT_SECRET=<client-secret-value>
MICROSOFT_CALLBACK_URL=https://<dominio-api>/api/auth/microsoft/callback
ALLOWED_EMAIL_DOMAIN=<dominio-institucional>
FRONTEND_URL=https://<dominio-vercel>
```

No registres la URL de Vercel como callback: el callback lo recibe el backend y luego redirige al frontend.

## 6. Seguridad y salida a produccion

- Genera `JWT_SECRET` y `MOODLE_WEBHOOK_SECRET` con un gestor de secretos; no los subas al repositorio.
- No pongas tokens de Moodle, secretos de Microsoft ni `DATABASE_URL` en variables `VITE_*`: esas variables quedan expuestas al navegador.
- En Vercel y Railway usa HTTPS y dominios finales antes de crear los callbacks.
- Prueba primero en Preview/Staging con una base de datos Neon separada.
- Revisa logs de Railway y prueba login local, login Microsoft, consulta de cursos, sincronizacion y healthcheck.
- Configura backups y retencion en Neon antes de cargar datos reales.
- Si el frontend y la API usan dominios definitivos, actualiza `CORS_ORIGINS`, `FRONTEND_URL` y la Redirect URI de Entra con esos dominios exactos.
