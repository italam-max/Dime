import type { Metadata } from "next";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  BookOpen,
  CalendarCheck,
  CalendarClock,
  CalendarX,
  CheckCircle2,
  ClipboardCheck,
  ClipboardList,
  Clock,
  ListTodo,
  Lock,
  Pencil,
  Smartphone,
  TrendingDown,
  TrendingUp,
  UserRound,
  Wallet,
} from "lucide-react";
import { subWeeks } from "date-fns";
import { prisma } from "@/lib/prisma";
import { calculateAge, formatCurrency, formatDate, patientFullName } from "@/lib/utils";
import {
  PatientActiveBadge,
  PaymentStatusBadge,
} from "@/components/pacientes/status-badge";
import { ToggleActiveButton } from "@/components/pacientes/toggle-active-button";
import { PortalWidget, type PortalAccessStatus } from "@/components/pacientes/portal-widget";
import { TaskToggleButton } from "@/components/pacientes/task-toggle-button";
import { AssessmentsSection } from "@/components/pacientes/assessments-section";
import { MaterialSection } from "@/components/pacientes/material-section";
import { NewAppointmentDialog } from "@/components/agenda/new-appointment-dialog";
import { FichaTabs } from "@/components/pacientes/ficha-tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Ficha del paciente · Dime",
};

type TimelineEvent = {
  key: string;
  date: Date;
  title: string;
  sub: string;
  tone: "sage" | "warm" | "upcoming";
  icon: LucideIcon;
};

// Ficha clínica: identidad y signos vitales en el encabezado; el resto del
// trabajo agrupado por intención en pestañas (Resumen, Evolución,
// Seguimiento, Historial).
export default async function PacienteDetallePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const patient = await prisma.patient.findUnique({
    where: { id },
    include: {
      appointments: { orderBy: { startAt: "desc" } },
      payments: { orderBy: { createdAt: "desc" } },
      tasks: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!patient) notFound();

  const ahora = new Date();
  const age = calculateAge(patient.fechaNacimiento);

  const saldoPendiente = patient.payments
    .filter((payment) => payment.status !== "PAGADO")
    .reduce((sum, payment) => sum + payment.amount, 0);

  const proximaCita = patient.appointments
    .filter((a) => a.startAt.getTime() > ahora.getTime() && a.status !== "CANCELADA")
    .sort((a, b) => a.startAt.getTime() - b.startAt.getTime())[0];
  const sesionesCompletadas = patient.appointments.filter((a) => a.status === "COMPLETADA").length;
  const noAsistio = patient.appointments.filter((a) => a.status === "NO_ASISTIO").length;
  const asistencia =
    sesionesCompletadas + noAsistio > 0
      ? Math.round((sesionesCompletadas / (sesionesCompletadas + noAsistio)) * 100)
      : null;

  const [portalAccess, portalConsent, responses, materialAssignments] = await Promise.all([
    prisma.portalAccess.findUnique({ where: { patientId: patient.id } }),
    prisma.consent.findFirst({
      where: { patientId: patient.id, type: "PORTAL" },
      orderBy: { acceptedAt: "desc" },
    }),
    prisma.assessmentResponse.findMany({
      where: { assignment: { patientId: patient.id } },
      orderBy: { createdAt: "asc" },
      select: {
        createdAt: true,
        score: true,
        assignment: { select: { instrument: { select: { code: true, name: true } } } },
      },
    }),
    prisma.articleAssignment.findMany({
      where: { patientId: patient.id },
      orderBy: { assignedAt: "desc" },
      take: 4,
      include: { article: { select: { title: true } } },
    }),
  ]);

  let portalStatus: PortalAccessStatus = "none";
  if (portalAccess?.revokedAt) portalStatus = "revoked";
  else if (portalAccess?.acceptedAt) portalStatus = "active";
  else if (portalAccess && portalAccess.expiresAt.getTime() > ahora.getTime()) {
    portalStatus = "pending";
  }

  const tareasActivas = patient.tasks.filter((task) => task.completedAt === null);
  const tareasHechasRecientes = patient.tasks
    .filter((task) => task.completedAt !== null)
    .sort((a, b) => b.completedAt!.getTime() - a.completedAt!.getTime())
    .slice(0, 5);
  const haceCuatroSemanas = subWeeks(ahora, 4);
  const [tareasCreadasMes, tareasCompletadasMes] = await Promise.all([
    prisma.task.count({
      where: { patientId: patient.id, createdAt: { gte: haceCuatroSemanas } },
    }),
    prisma.task.count({
      where: { patientId: patient.id, completedAt: { gte: haceCuatroSemanas } },
    }),
  ]);
  const cumplimiento =
    tareasCreadasMes > 0
      ? Math.round((tareasCompletadasMes / tareasCreadasMes) * 100)
      : null;

  // Evolución: instrumento con más mediciones (≥2), delta de las dos últimas.
  // En escalas de síntomas un descenso es mejora (salvia); un alza, atención.
  const porInstrumento = new Map<string, { name: string; scores: number[] }>();
  for (const r of responses) {
    const code = r.assignment.instrument.code;
    const entry = porInstrumento.get(code) ?? { name: r.assignment.instrument.name, scores: [] };
    entry.scores.push(r.score);
    porInstrumento.set(code, entry);
  }
  let trend: { code: string; delta: number; last: number } | null = null;
  for (const [code, { scores }] of porInstrumento) {
    if (scores.length >= 2 && (trend === null || scores.length > porInstrumento.get(trend.code)!.scores.length)) {
      trend = { code, delta: scores[scores.length - 1] - scores[scores.length - 2], last: scores[scores.length - 1] };
    }
  }

  const timeline = buildTimeline({
    appointments: patient.appointments,
    tasks: patient.tasks,
    responses,
    materialAssignments,
    proximaCita,
    ahora,
  });

  const pagosRecientes = patient.payments.slice(0, 4);

  const contactChips = [
    age !== null ? `${age} años` : null,
    patient.sexo,
    patient.telefono,
    patient.email,
  ].filter(Boolean) as string[];

  const tabs = [
    { id: "resumen", label: "Resumen", icon: "dashboard" as const },
    { id: "evolucion", label: "Evolución", icon: "activity" as const },
    { id: "seguimiento", label: "Seguimiento", icon: "list" as const },
  ];

  return (
    <div className="animate-fade-in space-y-6">
      <Link
        href="/pacientes"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Volver a pacientes
      </Link>

      {/* ── Hero: identidad + signos vitales ── */}
      <header className="overflow-hidden rounded-card bg-surface shadow-soft ring-1 ring-foreground/5">
        <div className="flex flex-wrap items-start gap-5 p-6">
          <Monogram name={patient.nombre} last={patient.apellidos} />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="font-display text-4xl font-semibold leading-none text-foreground">
                {patientFullName(patient)}
              </h1>
              <PatientActiveBadge isActive={patient.isActive} />
            </div>
            {contactChips.length > 0 && (
              <ul className="mt-3 flex flex-wrap gap-2">
                {contactChips.map((chip) => (
                  <li
                    key={chip}
                    className="rounded-full bg-surface-muted px-3 py-1 text-xs text-muted-foreground"
                  >
                    {chip}
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="flex items-center gap-2">
            <NewAppointmentDialog
              lockedPatient={{
                id: patient.id,
                nombre: patient.nombre,
                apellidos: patient.apellidos,
              }}
              triggerLabel="Agendar cita"
              triggerSize="sm"
            />
            <Button asChild variant="outline" size="sm">
              <Link href={`/pacientes/${patient.id}/editar`}>
                <Pencil data-icon="inline-start" />
                Editar
              </Link>
            </Button>
            <ToggleActiveButton patientId={patient.id} isActive={patient.isActive} />
          </div>
        </div>

        {/* Signos vitales: anillos + cifras clave */}
        <div className="border-t border-border p-6">
          <div className="flex items-center gap-8">
            <ProgressRing value={asistencia} label="Asistencia" tone="var(--color-primary)" />
            <ProgressRing value={cumplimiento} label="Adherencia" tone="var(--color-primary-light)" />
          </div>
          <dl className="mt-6 grid grid-cols-2 gap-x-4 gap-y-5 sm:grid-cols-4">
            <StatTile
              icon={CalendarClock}
              label="Próxima cita"
              value={proximaCita ? formatDate(proximaCita.startAt, "d MMM") : "Sin agendar"}
              sub={proximaCita ? formatDate(proximaCita.startAt, "h:mm a") : undefined}
              muted={!proximaCita}
            />
            <StatTile
              icon={CheckCircle2}
              label="Sesiones"
              value={String(sesionesCompletadas)}
              sub="completadas"
            />
            <StatTile
              icon={trend && trend.delta > 0 ? TrendingUp : TrendingDown}
              label="Evolución"
              value={trend ? `${trend.delta > 0 ? "+" : ""}${trend.delta}` : "—"}
              sub={trend ? `${trend.code} · ${trend.delta <= 0 ? "mejora" : "atención"}` : "sin datos"}
              accent={Boolean(trend && trend.delta > 0)}
            />
            <StatTile
              icon={Wallet}
              label="Saldo"
              value={formatCurrency(saldoPendiente)}
              sub={saldoPendiente > 0 ? "pendiente" : "al corriente"}
              accent={saldoPendiente > 0}
            />
          </dl>
        </div>
      </header>

      {/* ── Pestañas ── */}
      <FichaTabs tabs={tabs}>
        {/* Resumen */}
        <div data-tab="resumen" className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <SectionCard icon={ClipboardList} title="Motivo de consulta y antecedentes">
              {patient.antecedentes ? (
                <p className="whitespace-pre-line text-sm leading-relaxed">{patient.antecedentes}</p>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Aún no se registran antecedentes. Puedes agregarlos desde Editar.
                </p>
              )}
            </SectionCard>

            <SectionCard icon={Clock} title="Actividad reciente">
              <Timeline events={timeline} />
            </SectionCard>

            <SectionCard icon={Lock} title="Notas internas">
              {patient.notasInternas ? (
                <p className="whitespace-pre-line text-sm leading-relaxed">{patient.notasInternas}</p>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Sin notas internas. Solo tú puedes ver esta sección.
                </p>
              )}
            </SectionCard>
          </div>

          <div className="space-y-6">
            <SectionCard icon={UserRound} title="Información general">
              <div className="grid gap-x-8 gap-y-4 sm:grid-cols-2 lg:grid-cols-1">
                <InfoItem
                  label="Fecha de nacimiento"
                  value={
                    patient.fechaNacimiento
                      ? formatDate(patient.fechaNacimiento, "d 'de' MMM yyyy")
                      : null
                  }
                />
                <InfoItem label="Sexo" value={patient.sexo} />
                <InfoItem label="Dirección" value={patient.direccion} />
                <InfoItem label="Contacto de emergencia" value={patient.contactoEmergencia} />
              </div>
            </SectionCard>

            <SectionCard
              icon={Smartphone}
              title="Portal del paciente"
              action={
                portalStatus === "active" && portalConsent ? (
                  <p className="text-xs text-muted-foreground">
                    Consentimiento el {formatDate(portalConsent.acceptedAt, "d MMM yyyy")}
                  </p>
                ) : undefined
              }
            >
              <PortalWidget
                patientId={patient.id}
                status={portalStatus}
                acceptedAt={portalAccess?.acceptedAt ?? null}
                expiresAt={portalAccess?.expiresAt ?? null}
              />
            </SectionCard>

            <SectionCard icon={Wallet} title="Pagos">
              <div
                className={cn(
                  "flex items-baseline justify-between rounded-control px-4 py-3",
                  saldoPendiente > 0 ? "bg-accent-warm-soft" : "bg-surface-muted"
                )}
              >
                <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  {saldoPendiente > 0 ? "Saldo pendiente" : "Al corriente"}
                </span>
                <span
                  className={cn(
                    "text-xl font-semibold tabular-nums",
                    saldoPendiente > 0 ? "text-accent-warm" : "text-foreground"
                  )}
                >
                  {formatCurrency(saldoPendiente)}
                </span>
              </div>
              {pagosRecientes.length === 0 ? (
                <p className="mt-3 text-sm text-muted-foreground">
                  Aún no tiene pagos registrados.
                </p>
              ) : (
                <ul className="mt-2 divide-y divide-border">
                  {pagosRecientes.map((payment) => (
                    <li key={payment.id} className="flex items-center justify-between gap-3 py-2.5">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-foreground">
                          {payment.concept ?? "Sesión"}
                        </p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {formatDate(payment.paidAt ?? payment.createdAt, "d 'de' MMM yyyy")}
                        </p>
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-1">
                        <span className="text-sm font-semibold tabular-nums text-foreground">
                          {formatCurrency(payment.amount)}
                        </span>
                        <PaymentStatusBadge status={payment.status} />
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </SectionCard>
          </div>
        </div>

        {/* Evolución */}
        <div data-tab="evolucion">
          <AssessmentsSection patientId={patient.id} />
        </div>

        {/* Seguimiento */}
        <div data-tab="seguimiento" className="space-y-6">
          <SectionCard
            icon={ListTodo}
            title="Tareas entre sesiones"
            action={
              cumplimiento !== null ? (
                <p className="text-xs text-muted-foreground">
                  {cumplimiento}% de cumplimiento · 4 semanas
                </p>
              ) : undefined
            }
          >
            {tareasActivas.length === 0 && tareasHechasRecientes.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Aún no hay tareas registradas. Se crean al completar una sesión con acuerdos.
              </p>
            ) : (
              <ul className="divide-y divide-border">
                {tareasActivas.map((task) => (
                  <li
                    key={task.id}
                    className="flex items-center justify-between gap-4 py-3 first:pt-0"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground">{task.title}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {task.dueDate
                          ? `Para el ${formatDate(task.dueDate, "d 'de' MMM yyyy")}`
                          : "Sin fecha límite"}
                        {task.appointmentId ? " · Acordada en sesión" : ""}
                      </p>
                    </div>
                    <TaskToggleButton taskId={task.id} done={false} title={task.title} />
                  </li>
                ))}
                {tareasHechasRecientes.map((task) => (
                  <li
                    key={task.id}
                    className="flex items-center justify-between gap-4 py-3 text-muted-foreground"
                  >
                    <div className="min-w-0">
                      <p className="text-sm line-through">{task.title}</p>
                      <p className="mt-0.5 text-xs">
                        Hecha el {formatDate(task.completedAt!, "d 'de' MMM yyyy")}
                      </p>
                    </div>
                    <TaskToggleButton taskId={task.id} done title={task.title} />
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>

          <MaterialSection patientId={patient.id} />
        </div>
      </FichaTabs>
    </div>
  );
}

// Reúne los eventos recientes (pasados) de distintas fuentes para la línea
// de tiempo, ordenados del más reciente al más antiguo.
function buildTimeline({
  appointments,
  tasks,
  responses,
  materialAssignments,
  proximaCita,
  ahora,
}: {
  appointments: { id: string; startAt: Date; status: string; type: string }[];
  tasks: { id: string; title: string; createdAt: Date; completedAt: Date | null; dueDate: Date | null }[];
  responses: { createdAt: Date; score: number; assignment: { instrument: { code: string } } }[];
  materialAssignments: { id: string; assignedAt: Date; article: { title: string } }[];
  proximaCita?: { id: string; startAt: Date };
  ahora: Date;
}): TimelineEvent[] {
  const events: TimelineEvent[] = [];

  if (proximaCita) {
    events.push({
      key: `next-${proximaCita.id}`,
      date: proximaCita.startAt,
      title: "Próxima cita",
      sub: formatDate(proximaCita.startAt, "d 'de' MMM, h:mm a"),
      tone: "upcoming",
      icon: CalendarClock,
    });
  }
  for (const a of appointments) {
    if (a.startAt.getTime() > ahora.getTime()) continue;
    if (a.status === "COMPLETADA") {
      events.push({ key: `a-${a.id}`, date: a.startAt, title: "Sesión completada", sub: "Sesión de terapia", tone: "sage", icon: CalendarCheck });
    } else if (a.status === "NO_ASISTIO") {
      events.push({ key: `a-${a.id}`, date: a.startAt, title: "No asistió a la sesión", sub: "Ausencia registrada", tone: "warm", icon: CalendarX });
    }
  }
  for (const t of tasks) {
    if (t.completedAt) {
      events.push({ key: `t-${t.id}`, date: t.completedAt, title: "Tarea completada", sub: t.title, tone: "sage", icon: CheckCircle2 });
    } else if (t.dueDate && t.dueDate.getTime() < ahora.getTime()) {
      events.push({ key: `t-${t.id}`, date: t.dueDate, title: "Tarea vencida", sub: t.title, tone: "warm", icon: AlertCircle });
    }
  }
  for (const r of responses) {
    events.push({
      key: `r-${r.createdAt.getTime()}-${r.assignment.instrument.code}`,
      date: r.createdAt,
      title: `${r.assignment.instrument.code} respondido`,
      sub: `Puntaje ${r.score}`,
      tone: "sage",
      icon: ClipboardCheck,
    });
  }
  for (const m of materialAssignments) {
    events.push({ key: `m-${m.id}`, date: m.assignedAt, title: "Material asignado", sub: m.article.title, tone: "sage", icon: BookOpen });
  }

  return events.sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, 7);
}

// Línea de tiempo vertical con un chip de ícono por evento.
function Timeline({ events }: { events: TimelineEvent[] }) {
  if (events.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Aún no hay actividad registrada. Las sesiones, tareas y evaluaciones aparecerán aquí.
      </p>
    );
  }
  return (
    <ul className="relative">
      {events.map((e, i) => {
        const Icon = e.icon;
        const last = i === events.length - 1;
        return (
          <li key={e.key} className="relative flex gap-3 pb-5 last:pb-0">
            {!last && (
              <span className="absolute left-[15px] top-8 bottom-0 w-px bg-border" aria-hidden />
            )}
            <span
              className={cn(
                "relative z-10 flex size-8 shrink-0 items-center justify-center rounded-full",
                e.tone === "warm"
                  ? "bg-accent-warm-soft text-accent-warm"
                  : e.tone === "upcoming"
                    ? "bg-surface text-primary ring-1 ring-inset ring-primary/40"
                    : "bg-primary-soft text-primary"
              )}
            >
              <Icon size={15} strokeWidth={1.9} aria-hidden />
            </span>
            <div className="min-w-0 pt-1">
              <p className="text-sm font-medium text-foreground">
                {e.title}
                {e.tone === "upcoming" && (
                  <span className="ml-2 rounded-full bg-primary-soft px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wide text-primary">
                    Próxima
                  </span>
                )}
              </p>
              <p className="mt-0.5 truncate text-xs text-muted-foreground">
                {e.sub}
                {e.tone !== "upcoming" && ` · ${formatDate(e.date, "d 'de' MMM")}`}
              </p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

// Anillo de progreso animado (SVG). value 0–100 o null.
function ProgressRing({
  value,
  label,
  tone,
}: {
  value: number | null;
  label: string;
  tone: string;
}) {
  const r = 26;
  const circ = 2 * Math.PI * r;
  const off = circ * (1 - (value ?? 0) / 100);
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="relative size-16">
        <svg width="64" height="64" viewBox="0 0 64 64" className="-rotate-90">
          <circle cx="32" cy="32" r={r} fill="none" stroke="var(--color-surface-muted)" strokeWidth="6" />
          <circle
            className="progress-ring"
            cx="32"
            cy="32"
            r={r}
            fill="none"
            stroke={tone}
            strokeWidth="6"
            strokeLinecap="round"
            style={{
              strokeDasharray: circ,
              strokeDashoffset: off,
              ["--ring-circ" as string]: `${circ}`,
              ["--ring-off" as string]: `${off}`,
            }}
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-sm font-semibold tabular-nums text-foreground">
          {value !== null ? `${value}%` : "—"}
        </span>
      </div>
      <span className="text-[0.7rem] font-semibold uppercase tracking-widest text-muted-foreground">
        {label}
      </span>
    </div>
  );
}

// Celda de la tira de signos clave.
function StatTile({
  icon: Icon,
  label,
  value,
  sub,
  accent = false,
  muted = false,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  sub?: string;
  accent?: boolean;
  muted?: boolean;
}) {
  return (
    <div>
      <div className="flex items-center gap-2">
        <span
          className={cn(
            "flex size-6 shrink-0 items-center justify-center rounded-md",
            accent ? "bg-accent-warm-soft text-accent-warm" : "bg-primary-soft text-primary"
          )}
        >
          <Icon size={14} strokeWidth={1.9} aria-hidden />
        </span>
        <p className="truncate text-[0.7rem] font-semibold uppercase tracking-widest text-muted-foreground">
          {label}
        </p>
      </div>
      <p
        className={cn(
          "mt-2 truncate text-2xl font-semibold leading-none tabular-nums",
          accent ? "text-accent-warm" : muted ? "text-muted-foreground" : "text-foreground"
        )}
      >
        {value}
      </p>
      {sub && <p className="mt-1 text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}

// Tarjeta de sección homologada: cabecera con ícono salvia + título.
function SectionCard({
  icon: Icon,
  title,
  action,
  children,
  contentClassName,
}: {
  icon: LucideIcon;
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  contentClassName?: string;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-3 space-y-0">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-primary">
          <Icon size={18} strokeWidth={1.8} aria-hidden />
        </span>
        <CardTitle className="flex-1 text-lg">{title}</CardTitle>
        {action}
      </CardHeader>
      <CardContent className={contentClassName}>{children}</CardContent>
    </Card>
  );
}

function Monogram({ name, last }: { name: string; last: string }) {
  const initials = `${name.charAt(0)}${last.charAt(0)}`.toUpperCase();
  return (
    <span
      aria-hidden
      className="flex size-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary-light font-display text-2xl font-semibold text-primary-foreground shadow-soft"
    >
      {initials}
    </span>
  );
}

function InfoItem({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 text-sm text-foreground">{value ?? "—"}</p>
    </div>
  );
}
