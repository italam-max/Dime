# 02 · Arquitectura

## Stack tecnológico

| Capa | Tecnología | Motivo |
|---|---|---|
| Framework | **Next.js 16 (App Router) + React 19 + TypeScript** | Full-stack en un solo proyecto, SSR para paneles rápidos, estándar actual |
| Estilos | **Tailwind CSS 4 + shadcn/ui** | Tokens de diseño centralizados, componentes accesibles y personalizables |
| Base de datos | **PostgreSQL** (producción) vía **Prisma ORM 6** | Modelo relacional natural para pacientes–citas–pagos; migraciones versionadas |
| Auth | **Sesión propia con jose** (JWT firmado en cookie httpOnly) | Sin dependencia de servicios externos; migrable a proveedores OAuth después |
| Formularios | **React Hook Form + Zod** | Validación compartida cliente/servidor, UX de formularios sólida |
| Calendario/fechas | **date-fns** | Manipulación de fechas ligera y tree-shakeable |
| Gráficas | **Recharts** | Gráficos React declarativos, fáciles de estilizar |
| Iconos | **lucide-react** | Set sobrio y consistente |

> **Nota sobre la base de datos en desarrollo:** en este equipo no hay Docker ni PostgreSQL local, así que el entorno de desarrollo usa **SQLite** (`prisma/dev.db`) con campos `String` en lugar de enums nativos (la validación de valores la hace Zod en aplicación). Al pasar a producción se cambia el `provider` a `postgresql` en `schema.prisma` y `DATABASE_URL`; el esquema ya está pensado para esa migración (fechas, relaciones e índices compatibles).

## Estructura de carpetas

```
Dime/
├─ docs/                    # Documento de bases (este entregable)
├─ prisma/
│  ├─ schema.prisma         # Modelo de datos
│  └─ seed.ts               # Datos de ejemplo
├─ src/
│  ├─ app/
│  │  ├─ (auth)/login/      # Pantalla de acceso
│  │  ├─ (app)/             # Área protegida
│  │  │  ├─ layout.tsx      # Sidebar + header
│  │  │  ├─ page.tsx        # Dashboard (reportes)
│  │  │  ├─ pacientes/      # Listado + ficha + formularios
│  │  │  ├─ agenda/         # Calendario semanal + lista del día
│  │  │  │  ├─ pagos/          # Registro, filtros y vista de pendientes
│  │  └─ api/               # Route handlers (Server Actions como regla general)
│  ├─ components/
│  │  ├─ ui/                # shadcn/ui
│  │  ├─ pacientes/ agenda/ pagos/ dashboard/  # Componentes de dominio por módulo
│  │  └─ app-sidebar.tsx    # Navegación lateral
│  ├─ lib/
│  │  ├─ prisma.ts          # Cliente Prisma (singleton)
│  │  ├─ session.ts         # Firma/verificación del JWT (jose)
│  │  ├─ auth.ts            # Sesión jose + getCurrentUser()
│  │  ├─ validations/       # Esquemas Zod por entidad
│  │  └─ utils.ts           # formateo de fechas/moneda (es-MX)
│  └─ proxy.ts              # Protección de rutas (Next 16: proxy, no middleware)
├─ .env.example
└─ README.md
```

## Modelo de datos

```
User (1) ───< Appointment (terapeuta, futuro multi-terapeuta)
Patient (1) ───< Appointment
Patient (1) ───< Payment
Appointment (0..1) ───< Payment

Patient:      id, nombre, apellidos, fechaNacimiento, sexo, telefono, email,
              direccion, contactoEmergencia*, antecedentes, notasInternas,
              isActive, createdAt, updatedAt
Appointment:  id, patientId, startAt, endAt, status, type, fee,
              sessionNotes*, sessionTasks*, createdAt, updatedAt
Payment:      id, patientId, appointmentId?, amount, method, status,
              paidAt?, concept, createdAt, updatedAt
User:         id, email, name, passwordHash, createdAt
```

- Estados como `String` validados por Zod (portabilidad SQLite → PostgreSQL).
- Índices: `Appointment(startAt)`, `Appointment(patientId)`, `Payment(patientId)`, `Patient(apellidos, nombre)`.

## Flujos principales

1. **Alta y seguimiento de paciente**: Terapeuta da de alta al paciente → agenda primera cita → al completar la sesión captura notas → registra el pago → la ficha del paciente acumula historial completo.
2. **Agenda diaria**: El terapeuta abre la agenda, ve el día, confirma asistencia al final de cada sesión y agenda el siguiente encuentro desde la misma pantalla.
3. **Cierre de mes**: Desde Reportes revisa ingresos, tasa de asistencia y pacientes con saldo pendiente.

## Decisiones técnicas

- **Server Actions sobre API routes**: menos boilerplate, revalidación declarativa con `revalidatePath`, todo el acceso a datos queda en el servidor.
- **Sesión propia con jose (JWT HS256 en cookie httpOnly, 7 días)**: cero acoplamiento a librerías de auth cuyo soporte de Next 16 aún madura; el secreto va en `SESSION_SECRET`. Migrable a OAuth añadiendo un proveedor sin tocar el modelo de datos.
- **Proxy en lugar de middleware**: en Next 16 la protección de rutas vive en `src/proxy.ts` (verificación optimista del JWT, sin DB en el proxy).
- **Sin estado global cliente**: el servidor es la fuente de verdad; los filtros usan search params.
- **Zod como única fuente de validación**: los mismos esquemas en formularios (cliente) y Server Actions (servidor).
