# EFB Frontend - Plan de Funcionalidades

## Tecnologías Instaladas

| Tecnología | Versión | Propósito |
|------------|---------|-----------|
| React | 19.2.0 | UI Library |
| Vite | 7.3.1 | Build tool |
| TypeScript | 5.9.3 | Type safety |
| TailwindCSS | 4.2.1 | Estilos |
| React Query | 5.90.21 | Server state |
| React Router | 7.13.1 | Navegación |
| React Hook Form | 7.71.2 | Formularios |
| Zod | 4.3.6 | Validación |
| Axios | 1.13.5 | HTTP client |
| Recharts | 3.7.0 | Gráficas |
| React Table | 8.21.3 | Tablas de datos |
| Lucide React | 0.575.0 | Iconos |
| date-fns | 4.1.0 | Fechas |
| react-hot-toast | 2.6.0 | Notificaciones |

---

## Arquitectura General

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   STUDENT    │  │   TEACHER    │  │    ADMIN     │          │
│  │   Dashboard  │  │   Dashboard  │  │   Dashboard  │          │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘          │
│         │                 │                  │                   │
│         └─────────────────┼──────────────────┘                   │
│                           │                                      │
│                    ┌──────▼──────┐                               │
│                    │   ROUTER    │                               │
│                    │ (Protected) │                               │
│                    └──────┬──────┘                               │
│                           │                                      │
│                    ┌──────▼──────┐                               │
│                    │ Auth Context│                               │
│                    │  (JWT/RBAC) │                               │
│                    └──────┬──────┘                               │
│                           │                                      │
│                    ┌──────▼──────┐                               │
│                    │ React Query │                               │
│                    │   (Cache)   │                               │
│                    └──────┬──────┘                               │
│                           │                                      │
│                    ┌──────▼──────┐                               │
│                    │    Axios    │                               │
│                    │ (API Client)│                               │
│                    └──────┬──────┘                               │
│                           │                                      │
└───────────────────────────┼─────────────────────────────────────┘
                            │
                            ▼
                 ┌──────────────────┐
                 │  BACKEND (NestJS)│
                 │  localhost:3000  │
                 └──────────────────┘
```

---

## Roles y Permisos

### STUDENT (Estudiante)
```
┌─────────────────────────────────────────────────────┐
│                    ESTUDIANTE                        │
├─────────────────────────────────────────────────────┤
│ ✅ Ver sus calificaciones                           │
│ ✅ Ver sus cursos matriculados                      │
│ ✅ Ver reportes personales                          │
│ ✅ Solicitar reinscripción                          │
│ ✅ Descargar récord académico (PDF)                 │
│ ✅ Ver historial por período                        │
│ ❌ Registrar/editar calificaciones                  │
│ ❌ Ver datos de otros estudiantes                   │
│ ❌ Gestionar usuarios/períodos                      │
└─────────────────────────────────────────────────────┘
```

### TEACHER (Profesor)
```
┌─────────────────────────────────────────────────────┐
│                     PROFESOR                         │
├─────────────────────────────────────────────────────┤
│ ✅ Ver cursos asignados                             │
│ ✅ Ver estudiantes de sus cursos                    │
│ ✅ Registrar calificaciones                         │
│ ✅ Editar calificaciones de sus cursos              │
│ ✅ Generar reportes de sus cursos                   │
│ ❌ Procesar reinscripciones                         │
│ ❌ Gestionar usuarios/períodos                      │
│ ❌ Ver cursos de otros profesores                   │
└─────────────────────────────────────────────────────┘
```

### ADMIN (Administrador)
```
┌─────────────────────────────────────────────────────┐
│                   ADMINISTRADOR                      │
├─────────────────────────────────────────────────────┤
│ ✅ Gestionar usuarios (CRUD)                        │
│ ✅ Asignar roles                                    │
│ ✅ Gestionar períodos académicos                    │
│ ✅ Procesar reinscripciones                         │
│ ✅ Ver reportes globales                            │
│ ✅ Ver estado de sincronización Moodle             │
│ ✅ Forzar sincronización manual                     │
│ ✅ Generar/revocar récords oficiales                │
│ ✅ Ver auditoría del sistema                        │
└─────────────────────────────────────────────────────┘
```

---

## Estructura de Rutas

```
/                           → Redirect a /login o /dashboard
│
├── /login                  → Página de login (pública)
├── /register               → Página de registro (pública)
│
├── /dashboard              → Dashboard según rol
│   │
│   ├── [STUDENT]
│   │   ├── /my-grades      → Mis calificaciones
│   │   ├── /my-courses     → Mis cursos
│   │   ├── /my-transcript  → Mi récord académico
│   │   └── /re-enrolment   → Solicitar reinscripción
│   │
│   ├── [TEACHER]
│   │   ├── /courses        → Mis cursos asignados
│   │   ├── /courses/:id    → Detalle del curso
│   │   ├── /grades/entry   → Registro de calificaciones
│   │   └── /reports        → Reportes de mis cursos
│   │
│   └── [ADMIN]
│       ├── /users          → Gestión de usuarios
│       ├── /users/:id      → Detalle/editar usuario
│       ├── /periods        → Gestión de períodos
│       ├── /re-enrolments  → Procesar reinscripciones
│       ├── /reports        → Reportes globales
│       ├── /transcripts    → Gestión de récords
│       ├── /sync           → Estado de sincronización
│       └── /audit          → Log de auditoría
│
└── /profile                → Perfil del usuario (todos)
```

---

## Páginas y Funcionalidades Detalladas

### 1. AUTENTICACIÓN

#### 1.1 Login (`/login`)
```
┌─────────────────────────────────────────────────────┐
│                      LOGIN                           │
├─────────────────────────────────────────────────────┤
│                                                      │
│                    [LOGO MODDLE]                     │
│                                                      │
│         ┌─────────────────────────────┐             │
│         │ Email                        │             │
│         └─────────────────────────────┘             │
│         ┌─────────────────────────────┐             │
│         │ Password              [👁]   │             │
│         └─────────────────────────────┘             │
│                                                      │
│         ┌─────────────────────────────┐             │
│         │        INICIAR SESIÓN       │             │
│         └─────────────────────────────┘             │
│                                                      │
│         ¿No tienes cuenta? Regístrate               │
│                                                      │
└─────────────────────────────────────────────────────┘

Funcionalidades:
- Validación de campos (email, password requeridos)
- Mostrar/ocultar password
- Mensaje de error en credenciales inválidas
- Redirect a dashboard según rol después de login
- Guardar token en cookies/localStorage
```

#### 1.2 Register (`/register`)
```
┌─────────────────────────────────────────────────────┐
│                    REGISTRO                          │
├─────────────────────────────────────────────────────┤
│                                                      │
│         ┌─────────────────────────────┐             │
│         │ Nombre                       │             │
│         └─────────────────────────────┘             │
│         ┌─────────────────────────────┐             │
│         │ Email                        │             │
│         └─────────────────────────────┘             │
│         ┌─────────────────────────────┐             │
│         │ Password                     │             │
│         └─────────────────────────────┘             │
│         ┌─────────────────────────────┐             │
│         │ Confirmar Password           │             │
│         └─────────────────────────────┘             │
│                                                      │
│         ┌─────────────────────────────┐             │
│         │         REGISTRARSE         │             │
│         └─────────────────────────────┘             │
│                                                      │
│         ¿Ya tienes cuenta? Inicia sesión            │
│                                                      │
└─────────────────────────────────────────────────────┘

Funcionalidades:
- Validación de campos
- Password mínimo 8 caracteres
- Confirmar password coincide
- Email único (mostrar error si existe)
- Redirect a login después de registro exitoso
```

---

### 2. DASHBOARD ESTUDIANTE

#### 2.1 Dashboard Principal
```
┌─────────────────────────────────────────────────────────────────┐
│ [≡] MODDLE                                    [🔔] [👤 Usuario] │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Bienvenido, [Nombre del Estudiante]                            │
│                                                                  │
│  ┌──────────────────┐  ┌──────────────────┐  ┌────────────────┐ │
│  │ 📚 Mis Cursos    │  │ 📊 Promedio      │  │ 📄 Récord      │ │
│  │      8           │  │     85.5         │  │   Disponible   │ │
│  └──────────────────┘  └──────────────────┘  └────────────────┘ │
│                                                                  │
│  Cursos Actuales                                                │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ Curso              │ Profesor        │ Calificación │ Estado││
│  ├─────────────────────────────────────────────────────────────┤│
│  │ Matemáticas I      │ Prof. García    │    92        │ ✅    ││
│  │ Física General     │ Prof. López     │    78        │ ✅    ││
│  │ Programación       │ Prof. Martínez  │    --        │ 🔄    ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

#### 2.2 Mis Calificaciones (`/my-grades`)
```
┌─────────────────────────────────────────────────────────────────┐
│ Mis Calificaciones                                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Filtrar por: [Período ▼] [Curso ▼]                             │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ Matemáticas I - Período 2024-01                             ││
│  ├─────────────────────────────────────────────────────────────┤│
│  │ Evaluación          │ Peso   │ Nota  │ Ponderado            ││
│  ├─────────────────────────────────────────────────────────────┤│
│  │ Parcial 1           │ 25%    │ 90    │ 22.5                 ││
│  │ Parcial 2           │ 25%    │ 85    │ 21.25                ││
│  │ Proyecto Final      │ 30%    │ 95    │ 28.5                 ││
│  │ Participación       │ 20%    │ 88    │ 17.6                 ││
│  ├─────────────────────────────────────────────────────────────┤│
│  │                              TOTAL:  │ 89.85                ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
└─────────────────────────────────────────────────────────────────┘

Funcionalidades:
- Filtrar por período académico
- Filtrar por curso
- Ver desglose de calificaciones por item
- Ver promedio ponderado
- Exportar a PDF
```

#### 2.3 Mi Récord Académico (`/my-transcript`)
```
┌─────────────────────────────────────────────────────────────────┐
│ Mi Récord Académico                                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                    RÉCORD ACADÉMICO                         ││
│  │                                                              ││
│  │  Estudiante: Juan Pérez                                     ││
│  │  ID: 2024-001                                               ││
│  │  Programa: Ingeniería en Sistemas                           ││
│  │                                                              ││
│  │  ─────────────────────────────────────────────────────────  ││
│  │  PERÍODO 2024-01                                            ││
│  │  ─────────────────────────────────────────────────────────  ││
│  │  Matemáticas I ............................ 89.85           ││
│  │  Física General ........................... 78.50           ││
│  │  Programación I ........................... 95.00           ││
│  │                                                              ││
│  │  Promedio del período: 87.78                                ││
│  │  Créditos aprobados: 12                                     ││
│  │                                                              ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
│  ┌─────────────────────────────┐                                │
│  │   📥 DESCARGAR RÉCORD PDF   │                                │
│  └─────────────────────────────┘                                │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘

Funcionalidades:
- Ver historial completo por períodos
- Promedio acumulado
- Créditos totales
- Generar y descargar PDF oficial
- QR de verificación (opcional)
```

#### 2.4 Reinscripción (`/re-enrolment`)
```
┌─────────────────────────────────────────────────────────────────┐
│ Solicitar Reinscripción                                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Período: [2024-02 ▼]                                           │
│                                                                  │
│  Cursos Disponibles:                                            │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ [✓] Matemáticas II          │ 4 créditos │ Lun-Mie 8:00    ││
│  │ [✓] Física II               │ 4 créditos │ Mar-Jue 10:00   ││
│  │ [ ] Química General         │ 3 créditos │ Vie 14:00       ││
│  │ [✓] Programación II         │ 4 créditos │ Lun-Mie 14:00   ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
│  Créditos seleccionados: 12 / Máximo: 20                        │
│                                                                  │
│  ┌─────────────────────────────┐                                │
│  │    ENVIAR SOLICITUD         │                                │
│  └─────────────────────────────┘                                │
│                                                                  │
│  Estado de solicitudes anteriores:                              │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ 2024-01 │ Aprobada   │ 12 créditos │ 15/01/2024            ││
│  │ 2023-02 │ Aprobada   │ 15 créditos │ 01/08/2023            ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
└─────────────────────────────────────────────────────────────────┘

Funcionalidades:
- Seleccionar período
- Ver cursos disponibles
- Seleccionar cursos (checkbox)
- Validar máximo de créditos
- Enviar solicitud
- Ver historial de solicitudes
- Ver estado (pendiente/aprobada/rechazada)
```

---

### 3. DASHBOARD PROFESOR

#### 3.1 Dashboard Principal
```
┌─────────────────────────────────────────────────────────────────┐
│ [≡] MODDLE                                    [🔔] [👤 Profesor]│
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Bienvenido, Prof. [Nombre]                                     │
│                                                                  │
│  ┌──────────────────┐  ┌──────────────────┐  ┌────────────────┐ │
│  │ 📚 Mis Cursos    │  │ 👥 Estudiantes   │  │ 📝 Pendientes  │ │
│  │      5           │  │      127         │  │      23        │ │
│  └──────────────────┘  └──────────────────┘  └────────────────┘ │
│                                                                  │
│  Mis Cursos                                                     │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ Curso              │ Estudiantes │ Sin calificar │ Acciones ││
│  ├─────────────────────────────────────────────────────────────┤│
│  │ Matemáticas I      │    32       │     5         │ [📝][📊]││
│  │ Matemáticas II     │    28       │     0         │ [📝][📊]││
│  │ Cálculo I          │    25       │     8         │ [📝][📊]││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

#### 3.2 Registro de Calificaciones (`/grades/entry`)
```
┌─────────────────────────────────────────────────────────────────┐
│ Registro de Calificaciones                                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Curso: [Matemáticas I ▼]   Evaluación: [Parcial 1 ▼]           │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ #  │ Estudiante          │ Nota (0-100) │ Comentario       ││
│  ├─────────────────────────────────────────────────────────────┤│
│  │ 1  │ Ana García          │ [  85  ]     │ [Buen trabajo  ] ││
│  │ 2  │ Carlos López        │ [  72  ]     │ [Revisar tema 3] ││
│  │ 3  │ María Rodríguez     │ [  95  ]     │ [Excelente     ] ││
│  │ 4  │ Pedro Martínez      │ [  68  ]     │ [              ] ││
│  │ 5  │ Laura Sánchez       │ [  90  ]     │ [              ] ││
│  │ ...│ ...                 │ ...          │ ...              ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │  💾 GUARDAR CALIFICACIONES  │  📤 SINCRONIZAR CON MOODLE   ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
└─────────────────────────────────────────────────────────────────┘

Funcionalidades:
- Seleccionar curso
- Seleccionar item de calificación
- Tabla editable con todos los estudiantes
- Validar rango de notas (0-100)
- Guardar borrador
- Guardar y sincronizar con Moodle
- Feedback/comentarios por estudiante
- Bulk edit (aplicar misma nota a varios)
```

#### 3.3 Reportes del Curso (`/courses/:id/reports`)
```
┌─────────────────────────────────────────────────────────────────┐
│ Reportes - Matemáticas I                                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  [Resumen] [Por Estudiante] [Por Evaluación] [Comparativo]      │
│                                                                  │
│  Estadísticas Generales                                         │
│  ┌──────────────────┐  ┌──────────────────┐  ┌────────────────┐ │
│  │ Promedio         │  │ Aprobados        │  │ Reprobados     │ │
│  │     78.5         │  │     85%          │  │     15%        │ │
│  └──────────────────┘  └──────────────────┘  └────────────────┘ │
│                                                                  │
│  Distribución de Notas                                          │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │     ████                                                    ││
│  │     ████  ████████                                          ││
│  │     ████  ████████  ████████████                            ││
│  │  ██ ████  ████████  ████████████  ████████                  ││
│  │  0-59  60-69   70-79    80-89      90-100                   ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
│  ┌─────────────────────────────┐                                │
│  │   📥 EXPORTAR A PDF/EXCEL   │                                │
│  └─────────────────────────────┘                                │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘

Funcionalidades:
- Estadísticas generales del curso
- Gráfica de distribución de notas
- Lista de estudiantes en riesgo
- Comparativo entre evaluaciones
- Exportar a PDF/Excel
```

---

### 4. DASHBOARD ADMINISTRADOR

#### 4.1 Dashboard Principal
```
┌─────────────────────────────────────────────────────────────────┐
│ [≡] MODDLE                                      [🔔] [👤 Admin] │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Panel de Administración                                        │
│                                                                  │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐   │
│  │ 👥 Usuarios│ │ 📚 Cursos  │ │ 📝 Matrículas│ │ 🔄 Sync   │   │
│  │    192     │ │     61     │ │     977     │ │   OK ✅    │   │
│  └────────────┘ └────────────┘ └────────────┘ └────────────┘   │
│                                                                  │
│  Actividad Reciente                                             │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ • Usuario admin@sebti.edu.do inició sesión (hace 5 min)     ││
│  │ • Sincronización Moodle completada (hace 10 min)            ││
│  │ • Nueva reinscripción pendiente - Juan Pérez (hace 1 hora) ││
│  │ • Período 2024-02 creado por admin (hace 2 horas)           ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
│  Reinscripciones Pendientes: 5                                  │
│  ┌─────────────────────────────┐                                │
│  │   VER REINSCRIPCIONES →     │                                │
│  └─────────────────────────────┘                                │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

#### 4.2 Gestión de Usuarios (`/users`)
```
┌─────────────────────────────────────────────────────────────────┐
│ Gestión de Usuarios                         [+ Nuevo Usuario]   │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Buscar: [________________________] [🔍]                        │
│  Filtrar: [Todos ▼] [Activos ▼] [Rol ▼]                        │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ ID │ Nombre          │ Email              │ Rol    │Acciones││
│  ├─────────────────────────────────────────────────────────────┤│
│  │ 1  │ Admin SEBTI     │ admin@sebti.edu.do │ ADMIN  │[✏][🗑]││
│  │ 2  │ Juan Pérez      │ juan@mail.com      │ STUDENT│[✏][🗑]││
│  │ 3  │ Prof. García    │ garcia@sebti.edu.do│ TEACHER│[✏][🗑]││
│  │ ...│ ...             │ ...                │ ...    │...     ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
│  Mostrando 1-10 de 192    [< 1 2 3 4 5 ... 20 >]               │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘

Funcionalidades:
- Listar todos los usuarios
- Buscar por nombre/email
- Filtrar por rol y estado
- Crear nuevo usuario
- Editar usuario existente
- Asignar/cambiar roles
- Activar/desactivar usuario
- Vincular con usuario Moodle
- Paginación
```

#### 4.3 Gestión de Períodos (`/periods`)
```
┌─────────────────────────────────────────────────────────────────┐
│ Gestión de Períodos Académicos               [+ Nuevo Período]  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ Código   │ Nombre            │ Inicio    │ Fin      │Estado ││
│  ├─────────────────────────────────────────────────────────────┤│
│  │ 2024-02  │ Segundo Sem 2024  │ 01/08/24  │ 15/12/24 │🟢 Open││
│  │ 2024-01  │ Primer Sem 2024   │ 15/01/24  │ 30/05/24 │🔴Closed│
│  │ 2023-02  │ Segundo Sem 2023  │ 01/08/23  │ 15/12/23 │🔴Closed│
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
│  Crear Nuevo Período                                            │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ Código: [2024-03    ]  Nombre: [Tercer Período 2024      ]  ││
│  │ Inicio: [📅 01/01/2025]  Fin: [📅 30/04/2025]               ││
│  │                                                              ││
│  │            [CREAR PERÍODO]                                   ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
└─────────────────────────────────────────────────────────────────┘

Funcionalidades:
- Listar períodos
- Crear nuevo período
- Editar período existente
- Abrir/cerrar período
- Ver cursos asociados al período
```

#### 4.4 Procesar Reinscripciones (`/re-enrolments`)
```
┌─────────────────────────────────────────────────────────────────┐
│ Gestión de Reinscripciones                                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Filtrar: [Período ▼] [Estado: Pendientes ▼]                    │
│                                                                  │
│  Solicitudes Pendientes (5)                                     │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ Estudiante      │ Período │ Cursos │ Créditos │ Acciones    ││
│  ├─────────────────────────────────────────────────────────────┤│
│  │ Juan Pérez      │ 2024-02 │   4    │    14    │ [✅][❌][👁]││
│  │ María López     │ 2024-02 │   3    │    12    │ [✅][❌][👁]││
│  │ Carlos García   │ 2024-02 │   5    │    18    │ [✅][❌][👁]││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
│  Leyenda: [✅ Aprobar] [❌ Rechazar] [👁 Ver detalle]           │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │  APROBAR SELECCIONADOS (3)  │  APLICAR A MOODLE            ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
└─────────────────────────────────────────────────────────────────┘

Funcionalidades:
- Ver solicitudes pendientes
- Filtrar por período/estado
- Ver detalle de solicitud
- Aprobar/rechazar individual
- Aprobar/rechazar en lote
- Aplicar cambios a Moodle (crear enrolments)
- Ver historial de decisiones
```

#### 4.5 Reportes Globales (`/reports`)
```
┌─────────────────────────────────────────────────────────────────┐
│ Reportes Globales                                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  [Por Período] [Por Curso] [Por Programa] [Comparativo]         │
│                                                                  │
│  Resumen Período 2024-02                                        │
│  ┌──────────────────┐  ┌──────────────────┐  ┌────────────────┐ │
│  │ Estudiantes      │  │ Promedio General │  │ Tasa Aprobación│ │
│  │     856          │  │      78.3        │  │     87%        │ │
│  └──────────────────┘  └──────────────────┘  └────────────────┘ │
│                                                                  │
│  Rendimiento por Programa                                       │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ Programa              │ Estudiantes │ Promedio │ Aprobación ││
│  ├─────────────────────────────────────────────────────────────┤│
│  │ Ing. Sistemas         │    120      │   82.5   │    92%     ││
│  │ Administración        │    180      │   76.8   │    85%     ││
│  │ Contabilidad          │    95       │   79.2   │    88%     ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
│  ┌─────────────────────────────┐                                │
│  │   📥 EXPORTAR REPORTE       │                                │
│  └─────────────────────────────┘                                │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘

Funcionalidades:
- Reportes por período
- Reportes por curso
- Reportes por programa/carrera
- Comparativo entre períodos
- Gráficas de tendencias
- Exportar a PDF/Excel
```

#### 4.6 Estado de Sincronización (`/sync`)
```
┌─────────────────────────────────────────────────────────────────┐
│ Estado de Sincronización con Moodle                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Estado General: 🟢 Conectado                                   │
│  Última sincronización: hace 45 segundos                        │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ Entidad          │ Registros │ Última Sync    │ Estado      ││
│  ├─────────────────────────────────────────────────────────────┤│
│  │ Usuarios         │    192    │ 13:25:00       │ ✅ OK       ││
│  │ Cursos           │     61    │ 13:25:02       │ ✅ OK       ││
│  │ Matrículas       │    977    │ 13:25:17       │ ✅ OK       ││
│  │ Items Calif.     │    823    │ 13:25:36       │ ✅ OK       ││
│  │ Calificaciones   │   2929    │ 13:26:04       │ ✅ OK       ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │  🔄 FORZAR SINCRONIZACIÓN COMPLETA                          ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
│  Errores Recientes (0)                                          │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ No hay errores recientes                                    ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
└─────────────────────────────────────────────────────────────────┘

Funcionalidades:
- Ver estado de conexión con Moodle
- Ver última sincronización por entidad
- Ver conteo de registros sincronizados
- Forzar sincronización manual
- Ver errores de sincronización
- Ver log de sincronizaciones
```

#### 4.7 Auditoría (`/audit`)
```
┌─────────────────────────────────────────────────────────────────┐
│ Log de Auditoría                                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Filtrar: [Fecha ▼] [Usuario ▼] [Acción ▼]                     │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ Fecha/Hora      │ Usuario     │ Acción         │ Detalles   ││
│  ├─────────────────────────────────────────────────────────────┤│
│  │ 23/02 13:25:00  │ Sistema     │ sync.completed │ [Ver]      ││
│  │ 23/02 13:20:15  │ admin       │ user.updated   │ [Ver]      ││
│  │ 23/02 13:15:30  │ admin       │ period.created │ [Ver]      ││
│  │ 23/02 12:00:00  │ prof.garcia │ grade.created  │ [Ver]      ││
│  │ 23/02 11:45:00  │ juan.perez  │ reenrol.submit │ [Ver]      ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
│  Mostrando 1-10 de 1,523    [< 1 2 3 4 5 ... 153 >]            │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘

Funcionalidades:
- Ver todas las acciones del sistema
- Filtrar por fecha, usuario, tipo de acción
- Ver detalle de cada acción (antes/después)
- Exportar log
- Paginación
```

---

## Estructura de Carpetas Propuesta

```
frontend/
├── public/
│   └── logo.svg
├── src/
│   ├── api/                    # Configuración de Axios y endpoints
│   │   ├── axios.ts
│   │   ├── auth.api.ts
│   │   ├── users.api.ts
│   │   ├── courses.api.ts
│   │   ├── grades.api.ts
│   │   ├── periods.api.ts
│   │   ├── reports.api.ts
│   │   ├── reenrolments.api.ts
│   │   ├── transcripts.api.ts
│   │   └── sync.api.ts
│   │
│   ├── components/             # Componentes reutilizables
│   │   ├── ui/                 # Componentes base (Button, Input, Table, etc.)
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Select.tsx
│   │   │   ├── Table.tsx
│   │   │   ├── Modal.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Badge.tsx
│   │   │   └── ...
│   │   ├── layout/             # Layout components
│   │   │   ├── Sidebar.tsx
│   │   │   ├── Header.tsx
│   │   │   ├── Footer.tsx
│   │   │   └── DashboardLayout.tsx
│   │   ├── forms/              # Form components
│   │   │   ├── LoginForm.tsx
│   │   │   ├── RegisterForm.tsx
│   │   │   ├── GradeEntryForm.tsx
│   │   │   └── ...
│   │   └── charts/             # Chart components
│   │       ├── GradeDistribution.tsx
│   │       ├── PerformanceChart.tsx
│   │       └── ...
│   │
│   ├── pages/                  # Páginas por ruta
│   │   ├── auth/
│   │   │   ├── LoginPage.tsx
│   │   │   └── RegisterPage.tsx
│   │   ├── student/
│   │   │   ├── DashboardPage.tsx
│   │   │   ├── MyGradesPage.tsx
│   │   │   ├── MyCoursesPage.tsx
│   │   │   ├── TranscriptPage.tsx
│   │   │   └── ReEnrolmentPage.tsx
│   │   ├── teacher/
│   │   │   ├── DashboardPage.tsx
│   │   │   ├── CoursesPage.tsx
│   │   │   ├── CourseDetailPage.tsx
│   │   │   ├── GradeEntryPage.tsx
│   │   │   └── ReportsPage.tsx
│   │   └── admin/
│   │       ├── DashboardPage.tsx
│   │       ├── UsersPage.tsx
│   │       ├── UserDetailPage.tsx
│   │       ├── PeriodsPage.tsx
│   │       ├── ReEnrolmentsPage.tsx
│   │       ├── ReportsPage.tsx
│   │       ├── TranscriptsPage.tsx
│   │       ├── SyncStatusPage.tsx
│   │       └── AuditPage.tsx
│   │
│   ├── hooks/                  # Custom hooks
│   │   ├── useAuth.ts
│   │   ├── useUser.ts
│   │   ├── useCourses.ts
│   │   ├── useGrades.ts
│   │   └── ...
│   │
│   ├── context/                # React Context
│   │   └── AuthContext.tsx
│   │
│   ├── lib/                    # Utilidades
│   │   ├── utils.ts
│   │   ├── cn.ts               # className utility
│   │   └── constants.ts
│   │
│   ├── types/                  # TypeScript types
│   │   ├── auth.types.ts
│   │   ├── user.types.ts
│   │   ├── course.types.ts
│   │   ├── grade.types.ts
│   │   └── ...
│   │
│   ├── router/                 # React Router config
│   │   ├── index.tsx
│   │   ├── ProtectedRoute.tsx
│   │   └── routes.ts
│   │
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css               # Tailwind imports
│
├── index.html
├── vite.config.ts
├── tailwind.config.js
├── tsconfig.json
└── package.json
```

---

## Componentes UI Base Necesarios

| Componente | Descripción |
|------------|-------------|
| `Button` | Botones con variantes (primary, secondary, danger, ghost) |
| `Input` | Input de texto con label, error, iconos |
| `Select` | Dropdown select con búsqueda |
| `Checkbox` | Checkbox con label |
| `Table` | Tabla con sorting, paginación, selección |
| `Modal` | Modal/Dialog |
| `Card` | Card container |
| `Badge` | Badges para estados |
| `Alert` | Alertas y notificaciones |
| `Spinner` | Loading spinner |
| `Avatar` | Avatar de usuario |
| `Tabs` | Navegación por tabs |
| `Dropdown` | Menu dropdown |
| `Pagination` | Paginación |
| `DatePicker` | Selector de fecha |
| `FileUpload` | Subir archivos |
| `EmptyState` | Estado vacío |
| `Skeleton` | Loading skeleton |

---

## Resumen de Endpoints del Backend a Consumir

### Auth
- `POST /auth/login` - Login
- `POST /auth/register` - Registro
- `POST /auth/refresh` - Refresh token
- `GET /auth/profile` - Perfil actual

### Users
- `GET /users` - Listar usuarios (admin)
- `POST /users` - Crear usuario (admin)
- `GET /users/:id` - Detalle usuario
- `PATCH /users/:id` - Actualizar usuario
- `PUT /users/:id/roles` - Asignar roles

### Periods
- `GET /periods` - Listar períodos
- `POST /periods` - Crear período
- `PATCH /periods/:id` - Actualizar período
- `POST /periods/:id/close` - Cerrar período

### Grades
- `GET /grades` - Listar calificaciones
- `POST /grades` - Crear calificación
- `PATCH /grades/:id` - Actualizar calificación
- `GET /students/:id/grades` - Calificaciones de estudiante

### Reports
- `GET /reports/grades/by-student/:id` - Reporte por estudiante
- `GET /reports/grades/by-course/:id` - Reporte por curso
- `GET /reports/grades/by-period/:id` - Reporte por período

### Transcripts
- `POST /transcripts/generate` - Generar récord
- `GET /transcripts/mine` - Mis récords
- `GET /transcripts/:number` - Ver récord

### Sync
- `GET /integrations/moodle/status` - Estado sync
- `POST /integrations/moodle/sync/reconcile` - Forzar sync

---

## Próximos Pasos

Una vez aprobado este plan:

1. Configurar TailwindCSS en vite.config.ts
2. Crear estructura de carpetas
3. Configurar React Router con rutas protegidas
4. Crear AuthContext y hook useAuth
5. Configurar Axios con interceptors
6. Crear componentes UI base
7. Implementar páginas de autenticación
8. Implementar dashboards por rol
9. Implementar funcionalidades específicas

---