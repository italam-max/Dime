# Dime

Plataforma integral para el seguimiento de citas de terapia psicológica. El **paciente es el núcleo** del sistema: ficha clínica, agenda de citas, notas de sesión y pagos giran alrededor de él.

Estética *Calma*: minimalismo premium, colores sobrios, tipografía editorial. Todo el copy está en español.

## Módulos

- **Panel** — KPIs del mes (citas, tasa de asistencia, ingresos, pacientes activos), gráficas de ingresos/asistencia, próximas citas y saldos pendientes.
- **Pacientes** — alta, edición, baja lógica, búsqueda, filtros y ficha completa con historial de citas y pagos.
- **Agenda** — vista semanal y del día, creación de citas con validación de solapamiento, confirmar/reprogramar/cancelar, notas de sesión al completar.
- **Pagos** — registro de pagos por paciente/cita, estados (pendiente/pagado/parcial), vista de saldos pendientes.

La especificación completa está en [`docs/`](docs/01-requerimientos.md): requerimientos, arquitectura, design system y roadmap.

## Stack

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS 4 + shadcn/ui · Prisma 6 · PostgreSQL 16 · Docker · sesión propia con jose · React Hook Form + Zod · date-fns · Recharts.

## Requisitos

- Node.js 20+ y npm.
- Docker (para PostgreSQL local; mismo motor que producción).

## Setup

```bash
npm install
cp .env.example .env                          # Windows: copy .env.example .env
docker compose -f docker-compose.dev.yml up -d # levanta PostgreSQL local
npx prisma migrate deploy                      # aplica migraciones
npm run db:seed                                # datos de ejemplo (terapeuta, 6 pacientes, citas y pagos)
npm run dev                                    # http://localhost:3000
```

**Credenciales del seed:** `terapeuta@dime.app` / `dime1234`

## Scripts

| Comando | Descripción |
|---|---|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` / `npm start` | Build y servidor de producción |
| `npm run lint` | ESLint |
| `npm run db:migrate` | Migraciones de Prisma |
| `npm run db:seed` | Poblar la base con datos de ejemplo |

## Variables de entorno

Definidas en `.env` (ver `.env.example`):

- `DATABASE_URL` — cadena de conexión PostgreSQL (dev y prod usan el mismo motor).
- `SESSION_SECRET` — secreto HS256 para firmar la cookie de sesión (genera uno propio con `openssl rand -base64 48`).
- `DIME_DOMAIN` — (prod) dominio público para el reverse proxy.

## Docker / Producción

La app corre en Docker en producción. La imagen aplica las migraciones al
arrancar (`prisma migrate deploy` en `docker-entrypoint.sh`) y luego levanta Next.

```bash
docker compose up -d --build   # construye y despliega (usa el .env del servidor)
```

- `docker-compose.yml` — servicio `app` en la red externa `backend`, conectado
  al PostgreSQL compartido (`postgres_shared`) vía `DATABASE_URL`.
- `docker-compose.dev.yml` — solo PostgreSQL, para desarrollo en el host.
- Los cambios de esquema deben ser **migraciones reales** de Prisma
  (`npx prisma migrate dev --name algo`) y comitearse en `prisma/migrations/`;
  en prod solo se aplican migraciones versionadas.

El esquema guarda estados/tipos como `String` (no enums nativos); la validación
de valores vive en `src/lib/validations/`.

## Notas

- Los datos del seed son **ficticios**; no introducir datos reales de pacientes en desarrollo.
- El área de la aplicación exige autenticación (`src/proxy.ts`, convención de Next 16).
