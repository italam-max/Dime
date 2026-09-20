import type { Metadata } from "next";
import Link from "next/link";
import { CalendarClock, ListTodo, Search, UserPlus, Users, Wallet } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { PatientRow } from "@/components/pacientes/patient-row";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";

export const metadata: Metadata = {
  title: "Pacientes · Dime",
};

const PAGE_SIZE = 12;

const ESTADO_OPTIONS = [
  { value: "todos", label: "Todos" },
  { value: "activos", label: "Activos" },
  { value: "inactivos", label: "Inactivos" },
];

// Listado de pacientes: búsqueda por nombre/apellidos/teléfono (q), filtro por
// estado y paginación simple — todo vía search params, sin estado cliente.
export default async function PacientesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; estado?: string; page?: string }>;
}) {
  const { q = "", estado = "todos", page = "1" } = await searchParams;
  const currentPage = Math.max(1, Number.parseInt(page, 10) || 1);

  const where = {
    AND: [
      q
        ? {
            OR: [
              { nombre: { contains: q } },
              { apellidos: { contains: q } },
              { telefono: { contains: q } },
            ],
          }
        : {},
      estado === "activos" ? { isActive: true } : {},
      estado === "inactivos" ? { isActive: false } : {},
    ],
  };

  const [total, patients] = await Promise.all([
    prisma.patient.count({ where }),
    prisma.patient.findMany({
      where,
      orderBy: [{ apellidos: "asc" }, { nombre: "asc" }],
      skip: (currentPage - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true,
        nombre: true,
        apellidos: true,
        telefono: true,
        fechaNacimiento: true,
        isActive: true,
      },
    }),
  ]);

  // Enriquecimiento útil por paciente (solo los de esta página): próxima cita,
  // tareas pendientes y saldo (pagos PENDIENTE/PARCIAL, igual que el panel).
  const ids = patients.map((p) => p.id);
  const now = new Date();
  const [nextAppointments, pendingTasks, balances] = await Promise.all([
    ids.length
      ? prisma.appointment.findMany({
          where: {
            patientId: { in: ids },
            startAt: { gte: now },
            status: { in: ["PENDIENTE", "CONFIRMADA"] },
          },
          orderBy: { startAt: "asc" },
          select: { patientId: true, startAt: true },
        })
      : [],
    ids.length
      ? prisma.task.groupBy({
          by: ["patientId"],
          where: { patientId: { in: ids }, completedAt: null },
          _count: { _all: true },
        })
      : [],
    ids.length
      ? prisma.payment.groupBy({
          by: ["patientId"],
          where: { patientId: { in: ids }, status: { in: ["PENDIENTE", "PARCIAL"] } },
          _sum: { amount: true },
        })
      : [],
  ]);

  const nextByPatient = new Map<string, Date>();
  for (const appt of nextAppointments) {
    if (!nextByPatient.has(appt.patientId)) nextByPatient.set(appt.patientId, appt.startAt);
  }
  const tasksByPatient = new Map(pendingTasks.map((t) => [t.patientId, t._count._all]));
  const balanceByPatient = new Map(balances.map((b) => [b.patientId, b._sum.amount ?? 0]));

  // Resumen del consultorio (pacientes activos): cuántos necesitan atención.
  const [activos, conCita, conTareas, conSaldo] = await Promise.all([
    prisma.patient.count({ where: { isActive: true } }),
    prisma.appointment
      .findMany({
        where: {
          startAt: { gte: now },
          status: { in: ["PENDIENTE", "CONFIRMADA"] },
          patient: { isActive: true },
        },
        select: { patientId: true },
        distinct: ["patientId"],
      })
      .then((rows) => rows.length),
    prisma.task
      .findMany({
        where: { completedAt: null, patient: { isActive: true } },
        select: { patientId: true },
        distinct: ["patientId"],
      })
      .then((rows) => rows.length),
    prisma.payment
      .findMany({
        where: { status: { in: ["PENDIENTE", "PARCIAL"] }, patient: { isActive: true } },
        select: { patientId: true },
        distinct: ["patientId"],
      })
      .then((rows) => rows.length),
  ]);

  const resumen = [
    { icon: Users, value: activos, label: "activos", tone: "text-primary" },
    { icon: CalendarClock, value: conCita, label: "con cita próxima", tone: "text-primary" },
    { icon: ListTodo, value: conTareas, label: "con tareas", tone: "text-honey" },
    { icon: Wallet, value: conSaldo, label: "con saldo", tone: "text-accent-warm" },
  ];

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  function pageHref(targetPage: number): string {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (estado !== "todos") params.set("estado", estado);
    params.set("page", String(targetPage));
    return `/pacientes?${params.toString()}`;
  }

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl font-semibold text-foreground">
            Pacientes
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {total === 1 ? "1 paciente" : `${total} pacientes`} en tu consultorio.
          </p>
        </div>
        <Button asChild>
          <Link href="/pacientes/nuevo">
            <UserPlus data-icon="inline-start" />
            Nuevo paciente
          </Link>
        </Button>
      </div>

      {/* Franja de resumen del consultorio: identidad de tablero (no galería),
          con un resplandor sutil y cifras con presencia. */}
      <div
        className="relative overflow-hidden rounded-xl bg-card px-6 py-4 ring-1 ring-foreground/10"
        style={{
          backgroundImage:
            "radial-gradient(120% 140% at 0% 0%, color-mix(in srgb, var(--color-primary) 12%, transparent), transparent 55%)",
        }}
      >
        <div className="flex flex-wrap items-center gap-x-8 gap-y-3">
          {resumen.map(({ icon: Icon, value, label, tone }, i) => (
            <div key={label} className="flex items-center gap-3">
              {i > 0 && <span className="mr-5 hidden h-8 w-px bg-border sm:block" aria-hidden />}
              <Icon size={20} strokeWidth={1.8} className={tone} aria-hidden />
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-semibold tabular-nums text-foreground">{value}</span>
                <span className="text-sm text-muted-foreground">{label}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <form method="GET" action="/pacientes" className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-64 flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="Buscar por nombre, apellidos o teléfono"
            className="pl-8"
            aria-label="Buscar paciente"
          />
        </div>
        <select
          name="estado"
          defaultValue={estado}
          aria-label="Filtrar por estado"
          className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm"
        >
          {ESTADO_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <Button type="submit" variant="outline">
          Buscar
        </Button>
      </form>

      {patients.length === 0 ? (
        <EmptyState
          icon={q ? Search : Users}
          title={q ? "Sin resultados" : "Aún no tienes pacientes registrados"}
          description={
            q
              ? "No encontramos pacientes que coincidan con tu búsqueda. Prueba con otro nombre o teléfono."
              : "Empieza creando el primero. Su historial de citas y pagos quedará reunido aquí."
          }
          action={
            !q && (
              <Button asChild>
                <Link href="/pacientes/nuevo">
                  <UserPlus data-icon="inline-start" />
                  Nuevo paciente
                </Link>
              </Button>
            )
          }
        />
      ) : (
        <div className="stagger-children space-y-2.5">
          {patients.map((patient) => (
            <PatientRow
              key={patient.id}
              patient={{
                id: patient.id,
                nombre: patient.nombre,
                apellidos: patient.apellidos,
                telefono: patient.telefono,
                fechaNacimiento: patient.fechaNacimiento,
                isActive: patient.isActive,
                nextAppointmentAt: nextByPatient.get(patient.id) ?? null,
                pendingTasks: tasksByPatient.get(patient.id) ?? 0,
                balance: balanceByPatient.get(patient.id) ?? 0,
              }}
            />
          ))}
        </div>
      )}

      {total > PAGE_SIZE && (
        <nav
          className="flex items-center justify-between text-sm text-muted-foreground"
          aria-label="Paginación de pacientes"
        >
          <Button asChild variant="ghost" size="sm" aria-disabled={currentPage <= 1}>
            <Link href={pageHref(currentPage - 1)} tabIndex={currentPage <= 1 ? -1 : undefined}>
              ← Anterior
            </Link>
          </Button>
          <span>
            Página {currentPage} de {totalPages}
          </span>
          <Button asChild variant="ghost" size="sm" aria-disabled={currentPage >= totalPages}>
            <Link
              href={pageHref(currentPage + 1)}
              tabIndex={currentPage >= totalPages ? -1 : undefined}
            >
              Siguiente →
            </Link>
          </Button>
        </nav>
      )}
    </div>
  );
}
