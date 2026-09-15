# 05 · Portal del paciente — seguimiento, no solo gestión

Especificación construible del módulo que integra al **paciente** a la plataforma. Convierte a Dime de herramienta de gestión del terapeuta en plataforma de **seguimiento terapéutico**: evaluaciones con puntuación automática, material psicoeducativo, tareas entre sesiones y consentimientos digitales.

Estado: **especificación aprobada para construcción**. Alcance por fases al final del documento.

---

## 1. Objetivos y principios

- Dar al paciente un **espacio propio, sereno y mínimo** donde vea solo lo que el terapeuta le comparte.
- Medir progreso con **instrumentos estandarizados** (PHQ-9, GAD-7, WHO-5) y curva de evolución.
- Cerrar el ciclo entre sesiones: tareas asignadas → paciente las marca → terapeuta ve cumplimiento.
- Garantizar privacidad: el paciente **nunca** ve notas clínicas (`sessionNotes`, `notasInternas`, `antecedentes`); el filtrado ocurre en el servidor, no en la UI.

**Regla de oro UX**: ninguna interacción del paciente debe tomar más de 2 minutos.

## 2. Módulos funcionales

### 2.1 Invitación y acceso (magic link)
- Desde la ficha del paciente, botón **"Invitar al portal"** (visible solo si el paciente no tiene acceso activo).
- El sistema genera un token aleatorio de 32 bytes (URL-safe), lo hashea (sha256) y guarda el hash con expiración (48 h) en `PortalAccess`.
- Se copia al portapapeles / se muestra un enlace listo para enviar por WhatsApp o correo (en MVP no se envía correo; el terapeuta lo comparte por su canal habitual — ver roadmap Fase A para email).
- El paciente abre el enlace (`/portal/ingresar?token=...`), acepta el **consentimiento informado** y queda con sesión activa (cookie httpOnly propia, 30 días renovables). Sin contraseña.
- El terapeuta puede **revocar** el acceso desde la ficha (invalida sesiones).

### 2.2 Consentimiento informado digital
- Primer paso obligatorio del flujo de invitación: pantalla de consentimiento con el texto configurado, checkbox "He leído y acepto" y botón deshabilitado hasta aceptar.
- Se persiste en `Consent` (tipo `PORTAL`, versión del texto, fecha, IP opcional).
- Sin consentimiento vigente no hay acceso al contenido del portal.
- El terapeuta ve en la ficha del paciente: "Portal activo · Consentimiento aceptado el …".

### 2.3 Home del portal (lo que ve el paciente)
Orden de pantallas: **Próxima cita → Tareas → Evaluaciones pendientes → Material asignado**.

- **Próxima cita**: tarjeta con fecha, hora y tipo. Sin opción de reprogramar en MVP (el terapeuta sigue siendo quien agenda).
- **Tareas**: lista con checkbox. Marcar hecha es un solo toque.
- **Evaluaciones pendientes**: botón prominente por cuestionario asignado.
- **Material**: tarjetas de artículos asignados con indicador "Leído" (se registra la primera apertura).

Estados vacíos serenos: "No tienes tareas pendientes. Buen trabajo." / "Tu espacio está en calma."

### 2.4 Evaluaciones (tests estandarizados)
**Instrumentos iniciales** (definidos como datos semilla, no código):

| Clave | Nombre | Ítems | Rango puntaje | Frecuencia típica |
|---|---|---|---|---|
| `PHQ9` | Cuestionario de salud del paciente (PHQ-9) | 9 | 0–27 | Semanal |
| `GAD7` | Escala de ansiedad generalizada (GAD-7) | 7 | 0–21 | Semanal |
| `WHO5` | Índice de bienestar de la OMS (WHO-5) | 5 | 0–25 | Quincenal |

Cada instrumento se define en `AssessmentInstrument` con sus ítems y opciones como JSON estructurado (texto del ítem + valores numéricos). La lógica de puntaje es `sum(values)` para estos tres; el campo `scoring` queda preparado para reglas futuras (rangos semáforo por instrumento, también JSON).

Flujo:
1. Terapeuta asigna desde la ficha del paciente: instrumento + frecuencia (única, semanal, quincenal) + próxima fecha.
2. El paciente responde desde su portal (una pregunta por pantalla o lista compacta; máx. ~1 min).
3. Al enviar se calcula el puntaje, se guarda `AssessmentResponse` y se notifica al terapeuta (widget en su dashboard).
4. El terapeuta ve en la ficha: tabla de respuestas con puntaje + **gráfica de evolución** del instrumento en el tiempo (Recharts, misma paleta Calma).

Semáforo de interpretación (mostrar al terapeuta, nunca alarmista al paciente; al paciente solo "Gracias, tu respuesta quedó registrada"):

- PHQ-9: 0–4 leve · 5–9 leve-moderado · 10–14 moderado · 15–19 moderado-severo · 20–27 severo.
- GAD-7: 0–4 leve · 5–9 leve-moderado · 10–14 moderado · 15–21 severo.
- WHO-5: 0–12 bajo bienestar · 13–25 bienestar aceptable.

### 2.5 Base de conocimiento (material psicoeducativo)
- CRUD del terapeuta en `(app)/biblioteca`: artículos con título, categoría (`ANSIEDAD`, `DEPRESION`, `ESTRES`, `SUEÑO`, `GENERAL`), cuerpo en markdown renderizado, y estado (borrador/publicado).
- **Asignar a paciente** desde el artículo (multi-select) o desde la ficha del paciente. Registro en `ArticleAssignment` con `readAt` (primera apertura).
- La biblioteca es privada del terapeuta: sus artículos no se comparten entre cuentas.
- Seed inicial con 3 artículos de ejemplo en español (respiración diafragmática, higiene del sueño, qué es la ansiedad).

### 2.6 Tareas entre sesiones
- Evolución del campo `Appointment.sessionTasks` (String) a modelo `Task` propio.
- Al **completar una sesión**, el dialog existente de "Completar sesión" pasa a crear `Task` reales (lista dinámica de tareas con vencimiento opcional) en lugar de texto libre. Migración: el contenido histórico de `sessionTasks` se conserva como está (campo se mantiene en el esquema, marcado legacy, o se migra a tareas ya cumplidas — decisión en implementación, preferible conservar).
- El paciente marca tareas en su portal (`completedAt`).
- En la ficha del paciente, el terapeuta ve tareas activas con su estado y el % de cumplimiento de las últimas 4 semanas.
- Widget en el dashboard del terapeuta: "Tareas pendientes por paciente esta semana".

## 3. Modelo de datos (Prisma — adiciones)

```prisma
model PortalAccess {
  id         String    @id @default(cuid())
  patientId  String    @unique            // un acceso activo por paciente
  patient    Patient   @relation(...)
  tokenHash  String    @unique            // sha256 del token; el token en claro solo viaja en el enlace
  invitedAt  DateTime  @default(now())
  expiresAt  DateTime
  acceptedAt DateTime?
  revokedAt  DateTime?
  @@index([tokenHash])
}

model Consent {
  id         String   @id @default(cuid())
  patientId  String
  patient    Patient  @relation(...)
  type       String   // PORTAL (extensible: TRATAMIENTO_DATOS, MENOR_EDAD...)
  version    String   // hash corto o versión del texto mostrado
  acceptedAt DateTime @default(now())
  ip         String?
  @@index([patientId, type])
}

model AssessmentInstrument {
  id       String  @id @default(cuid())
  code     String  @unique              // PHQ9 | GAD7 | WHO5
  name     String
  items    String                        // JSON: [{ "text": "...", "options": [{label, value}] }]
  scoring  String                        // JSON: { "type": "sum", "ranges": [...] }
  isActive Boolean @default(true)
}

model AssessmentAssignment {
  id           String   @id @default(cuid())
  patientId    String
  patient      Patient  @relation(...)
  instrumentId String
  instrument   AssessmentInstrument @relation(...)
  frequency    String   // UNICA | SEMANAL | QUINCENAL
  nextDueAt    DateTime
  active       Boolean  @default(true)
  createdAt    DateTime @default(now())
  @@index([patientId, active])
  @@index([nextDueAt, active])          // query del home del paciente y del widget del terapeuta
}

model AssessmentResponse {
  id           String   @id @default(cuid())
  assignmentId String
  assignment   AssessmentAssignment @relation(...)
  answers      String                        // JSON: valores por ítem
  score        Int
  createdAt    DateTime @default(now())
  @@index([assignmentId, createdAt])
}

model Article {
  id        String   @id @default(cuid())
  title     String
  category  String                       // ANSIEDAD | DEPRESION | ESTRES | SUENO | GENERAL
  body      String                       // markdown
  published Boolean  @default(false)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  assignments ArticleAssignment[]
}

model ArticleAssignment {
  id        String   @id @default(cuid())
  articleId String
  article   Article  @relation(...)
  patientId String
  patient   Patient  @relation(...)
  assignedAt DateTime @default(now())
  readAt    DateTime?
  @@index([patientId])
}

model Task {
  id          String    @id @default(cuid())
  patientId   String
  patient     Patient   @relation(...)
  appointmentId String?             // sesión que la originó
  appointment Appointment? @relation(...)
  title       String
  dueDate     DateTime?
  completedAt DateTime?
  createdAt   DateTime  @default(now())
  @@index([patientId, completedAt])
}
```

Además:
- `Patient` gana relaciones: `portalAccess PortalAccess?`, `consents Consent[]`, `tasks Task[]`, `assessmentAssignments`, `articleAssignments`.
- Sesión del portal: **misma tabla `User` no aplica**; se usa `PortalAccess` como identidad. La cookie `portal_session` guarda un JWT (jose, como la sesión del terapeuta) con `sub = patientId`, `kind: "portal"`, 30 días, renovada en cada visita. El claim `kind` es lo que separa los mundos en `src/lib/auth.ts`.

## 4. Arquitectura y rutas

Nuevo grupo de rutas **sin sidebar** (layout propio, centrado, aún más minimalista que el área del terapeuta):

```
src/app/(portal)/
├─ layout.tsx                  # shell sobrio, solo logo Dime + salir
├─ portal/
│  ├─ ingresar/page.tsx        # ?token=... → valida, consentimiento, crea sesión
│  ├─ page.tsx                 # home: próxima cita, tareas, evaluaciones, material
│  ├─ evaluaciones/[assignmentId]/page.tsx   # responder instrumento
│  ├─ material/[articleId]/page.tsx          # leer artículo (registra readAt)
│  └─ acciones.ts              # server actions del portal (marcar tarea, enviar respuesta)
```

Área del terapeuta (extensiones):
```
src/app/(app)/
├─ biblioteca/                 # CRUD de artículos
└─ pacientes/[id]/             # + widget "Portal" (invitar/revocar/estado),
                               #   + pestaña o sección "Evaluaciones" (asignar + evolución),
                               #   + sección "Tareas" activas con cumplimiento
```

- Los server actions del portal validan siempre la sesión `kind: "portal"` y cargan solo datos del `patientId` del JWT. **Nunca** aceptan `patientId` como argumento de entrada.
- Instrumentos sembrados por migración de datos (script), no por seed de desarrollo únicamente: deben existir en producción.

## 5. Seguridad y privacidad (obligatorio, no opcional)

1. **Separación estricta de identidades**: sesión terapeuta (`kind: "therapist"`, tabla User) vs sesión portal (`kind: "portal"`, PortalAccess). El proxy existente se extiende: rutas `(app)` exigen therapist; rutas `(portal)` exigen portal; `/portal/ingresar` es pública.
2. **Filtrado en servidor**: ninguna query del portal incluye `sessionNotes`, `notasInternas`, `antecedentes`, `Appointment.fee` ni datos de otros pacientes. Revisión de cada SELECT al implementar.
3. **Token de invitación**: solo hash en base de datos, expiración 48 h, un solo uso (se marca `acceptedAt` y el token deja de funcionar), revocación inmediata con `revokedAt`. Reenviar invitación = token nuevo, hash reemplazado.
4. **Consentimiento**: sin registro `Consent(type: "PORTAL")` vigente, el portal responde 403 con pantalla de contacto al consultorio. Versionado del texto: si cambia la versión publicada, el paciente debe re-aceptar.
5. **Cifrado en tránsito** (HTTPS en producción) y cabeceras estándar; las respuestas de evaluaciones son datos sensibles — nunca cacheables (ya es comportamiento por defecto con cookies).
6. Marco normativo de referencia (México): LFPDPPP y NOM-024-SSA3-2012 (expediente clínico electrónico). El consentimiento PORTAL cubre aviso de privacidad simplificado; prever texto configurable por el terapeuta.
7. **Alta/baja de portal**: dar de baja al paciente (`isActive = false`) no borra su acceso histórico pero desactiva el login (check en validación de sesión).

## 6. UX — tono "Calma" para el paciente

- Tipografía igual (Inter para interfaz; Cormorant solo en el saludo/logo). Tamaños de toque ≥ 44 px en móvil (el paciente entra casi siempre desde el teléfono: **mobile-first**).
- Sin badges de estado clínicos alarmistas al paciente; los semáforos de puntaje son solo para el terapeuta.
- Microcopy de ejemplo: "Esta evaluación toma menos de un minuto." / "Gracias. Tu respuesta quedó registrada y la revisará tu terapeuta." / "No tienes tareas pendientes."
- El portal **no** muestra: precios, tarifas, historial de pagos, notas de ningún tipo, datos de otros pacientes.
- Modo oscuro: fuera de alcance (MVP), fondo porcelana siempre.

## 7. Fases de implementación

**Fase P1 — Acceso y tareas** (fundamento)
1. Modelos `PortalAccess`, `Consent`, `Task` + migración.
2. Extensión de `src/lib/auth.ts` (claim `kind`, cookie `portal_session`) y proxy (reglas por ruta).
3. Invitación/revocación desde ficha del paciente + flujo de aceptación con consentimiento.
4. Home del portal (próxima cita + tareas) y dialog de "Completar sesión" actualizado para crear `Task`.
5. Widget "Tareas de la semana" en dashboard del terapeuta.

**Fase P2 — Evaluaciones**
1. `AssessmentInstrument` + seed de PHQ-9/GAD-7/WHO-5 (ítems y rangos en JSON).
2. Asignación desde ficha del paciente (instrumento + frecuencia); cálculo de `nextDueAt`.
3. Pantalla de respuesta del paciente + persistencia con puntaje.
4. Sección "Evaluaciones" en la ficha: tabla + gráfica de evolución; regla de regeneración de asignación según frecuencia al responder.
5. Widget "Evaluaciones pendientes de la semana" en dashboard.

**Fase P3 — Biblioteca**
1. CRUD de artículos en `(app)/biblioteca` (markdown renderizado, sin editor WYSIWYG — textarea con preview).
2. Asignación a pacientes; lectura en portal con registro de `readAt`.
3. Seed con 3 artículos de ejemplo; entrada "Biblioteca" en el sidebar.

**Fase P4 — Pulido**
1. Reenvío de invitación, expiración visible, actividad del portal en ficha (último acceso).
2. Revisión de seguridad de la sección 5 como checklist verificado.
3. Vista previa "como paciente" para el terapeuta (opcional).

## 8. Criterios de aceptación

- Un paciente invitado puede entrar con el enlace, aceptar consentimiento, ver su próxima cita, responder un PHQ-9 y marcar una tarea — todo desde el teléfono, sin ayuda.
- Un paciente con sesión portal **no** puede abrir `/pacientes` ni ninguna ruta `(app)` (y viceversa): probado con curl y cookies cruzadas.
- El terapeuta ve: en la ficha, consentimiento vigente, tareas con cumplimiento y curva de evolución del PHQ-9; en el dashboard, widgets de tareas y evaluaciones pendientes.
- `npx tsc --noEmit` y `npm run build` sin errores; instrumentos creados por migración de datos.
- Ningún dato clínico sensible aparece en el HTML ni en las respuestas de las actions del portal (verificado inspeccionando payloads).
