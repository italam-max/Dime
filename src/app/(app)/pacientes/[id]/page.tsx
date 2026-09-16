import type { Metadata } from "next";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  CalendarClock,
  CalendarDays,
  ClipboardList,
  ListTodo,
  Lock,
  Pencil,
  Smartphone,
  UserRound,
  Wallet,
} from "lucide-react";
import { subWeeks } from "date-fns";
import { prisma } from "@/lib/prisma";
import { calculateAge, formatCurrency, formatDate, patientFullName } from "@/lib/utils";
import {
  AppointmentStatusBadge,
  AppointmentTypeLabel,
  PatientActiveBadge,
  PaymentStatusBadge,
} from "@/components/pacientes/status-badge";
import { ToggleActiveButton } from "@/components/pacientes/toggle-active-button";
import { PortalWidget, type PortalAccessStatus } from "@/components/pacientes/portal-widget";
import { TaskToggleButton } from "@/components/pacientes/task-toggle-button";
import { AssessmentsSection } from "@/components/pacientes/assessments-section";
import { MaterialSection } from "@/components/pacientes/material-section";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Ficha del paciente · Dime",
};

// Ficha clínica del paciente: identidad y signos clave en el encabezado,
// y un espacio de trabajo a dos columnas (rail de contexto + seguimiento).
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

  // Saldo pendiente: suma de pagos que no están PAGADOS (pendientes o parciales).
  const saldoPendiente = patient.payments
    .filter((payment) => payment.status !== "PAGADO")
    .reduce((sum, payment) => sum + payment.amount, 0);

  // Signos clave para la tira de estadísticas del encabezado.
  const proximaCita = patient.appointments
    .filter((a) => a.startAt.getTime() > ahora.getTime() && a.status !== "CANCELADA")
    .sort((a, b) => a.startAt.getTime() - b.startAt.getTime())[0];
  const sesionesCompletadas = patient.appointments.filter((a) => a.status === "COMPLETADA").length;
  const noAsistio = patient.appointments.filter((a) => a.status === "NO_ASISTIO").length;
  const asistencia =
    sesionesCompletadas + noAsistio > 0
      ? Math.round((sesionesCompletadas / (sesionesCompletadas + noAsistio)) * 100)
      : null;

  // Acceso al portal: estado de la invitación y último consentimiento aceptado.
  const [portalAccess, portalConsent] = await Promise.all([
    prisma.portalAccess.findUnique({ where: { patientId: patient.id } }),
    prisma.consent.findFirst({
      where: { patientId: patient.id, type: "PORTAL" },
      orderBy: { acceptedAt: "desc" },
    }),
  ]);

  let portalStatus: PortalAccessStatus = "none";
  if (portalAccess?.revokedAt) portalStatus = "revoked";
  else if (portalAccess?.acceptedAt) portalStatus = "active";
  else if (portalAccess && portalAccess.expiresAt.getTime() > ahora.getTime()) {
    portalStatus = "pending";
  }

  // Tareas: activas y % de cumplimiento de las últimas 4 semanas.
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

  const contactChips = [
    age !== null ? `${age} años` : null,
    patient.sexo,
    patient.telefono,
    patient.email,
  ].filter(Boolean) as string[];

  return (
    <div className="animate-fade-in space-y-6">
      <Link
        href="/pacientes"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Volver a pacientes
      </Link>

      {/* ── Hero: identidad + signos clave ── */}
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
            <Button asChild variant="outline" size="sm">
              <Link href={`/pacientes/${patient.id}/editar`}>
                <Pencil data-icon="inline-start" />
                Editar
              </Link>
            </Button>
            <ToggleActiveButton patientId={patient.id} isActive={patient.isActive} />
          </div>
        </div>

        {/* Tira de signos clave */}
        <dl className="grid grid-cols-2 divide-x divide-y divide-border border-t border-border sm:grid-cols-4 sm:divide-y-0">
          <StatTile
            icon={CalendarClock}
            label="Próxima cita"
            value={proximaCita ? formatDate(proximaCita.startAt, "d 'de' MMM") : "Sin agendar"}
            sub={proximaCita ? formatDate(proximaCita.startAt, "h:mm a") : undefined}
            muted={!proximaCita}
          />
          <StatTile
            icon={CalendarDays}
            label="Sesiones"
            value={String(sesionesCompletadas)}
            sub="completadas"
          />
          <StatTile
            icon={ListTodo}
            label="Asistencia"
            value={asistencia !== null ? `${asistencia}%` : "—"}
            sub={asistencia !== null ? `${sesionesCompletadas}/${sesionesCompletadas + noAsistio}` : "sin datos"}
          />
          <StatTile
            icon={Wallet}
            label="Saldo"
            value={formatCurrency(saldoPendiente)}
            sub={saldoPendiente > 0 ? "pendiente" : "al corriente"}
            accent={saldoPendiente > 0}
          />
        </dl>
      </header>

      {/* ── Cuerpo a dos columnas ── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Rail de contexto (sticky en desktop) */}
        <aside className="stagger-children space-y-6 lg:sticky lg:top-6 lg:self-start">
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
        </aside>

        {/* Columna de trabajo clínico y seguimiento */}
        <div className="stagger-children space-y-6 lg:col-span-2">
          <SectionCard icon={ClipboardList} title="Motivo de consulta y antecedentes">
            {patient.antecedentes ? (
              <p className="whitespace-pre-line text-sm leading-relaxed">{patient.antecedentes}</p>
            ) : (
              <p className="text-sm text-muted-foreground">
                Aún no se registran antecedentes. Puedes agregarlos desde Editar.
              </p>
            )}
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

          {/* Evaluaciones y material: componentes auto-contenidos */}
          <AssessmentsSection patientId={patient.id} />
          <MaterialSection patientId={patient.id} />

          <SectionCard icon={CalendarDays} title="Historial de citas" contentClassName="px-0">
            {patient.appointments.length === 0 ? (
              <p className="px-(--card-spacing) pb-2 text-sm text-muted-foreground">
                Aún no tiene citas registradas. Puedes agendar la primera desde la agenda.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="pl-6 text-xs uppercase tracking-widest text-muted-foreground">
                      Fecha
                    </TableHead>
                    <TableHead className="text-xs uppercase tracking-widest text-muted-foreground">
                      Tipo
                    </TableHead>
                    <TableHead className="text-xs uppercase tracking-widest text-muted-foreground">
                      Estado
                    </TableHead>
                    <TableHead className="pr-6 text-right text-xs uppercase tracking-widest text-muted-foreground">
                      Acción
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {patient.appointments.map((appointment) => (
                    <TableRow key={appointment.id}>
                      <TableCell className="pl-6">
                        {formatDate(appointment.startAt, "d 'de' MMM yyyy, h:mm a")}
                      </TableCell>
                      <TableCell>
                        <AppointmentTypeLabel type={appointment.type} />
                      </TableCell>
                      <TableCell>
                        <AppointmentStatusBadge status={appointment.status} />
                      </TableCell>
                      <TableCell className="pr-6 text-right">
                        <Link
                          href="/agenda"
                          className="text-sm text-primary underline-offset-4 hover:underline"
                        >
                          Ver en agenda
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </SectionCard>

          <SectionCard icon={Wallet} title="Historial de pagos" contentClassName="px-0">
            {patient.payments.length === 0 ? (
              <p className="px-(--card-spacing) pb-2 text-sm text-muted-foreground">
                Aún no tiene pagos registrados.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="pl-6 text-xs uppercase tracking-widest text-muted-foreground">
                      Fecha
                    </TableHead>
                    <TableHead className="text-xs uppercase tracking-widest text-muted-foreground">
                      Concepto
                    </TableHead>
                    <TableHead className="text-right text-xs uppercase tracking-widest text-muted-foreground">
                      Monto
                    </TableHead>
                    <TableHead className="text-xs uppercase tracking-widest text-muted-foreground">
                      Estado
                    </TableHead>
                    <TableHead className="pr-6 text-right text-xs uppercase tracking-widest text-muted-foreground">
                      Saldo
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {patient.payments.map((payment) => {
                    const hasSaldo =
                      payment.status === "PENDIENTE" || payment.status === "PARCIAL";
                    return (
                      <TableRow key={payment.id}>
                        <TableCell className="pl-6 text-muted-foreground">
                          {formatDate(payment.paidAt ?? payment.createdAt, "d 'de' MMM yyyy")}
                        </TableCell>
                        <TableCell>{payment.concept ?? "Sesión"}</TableCell>
                        <TableCell className="text-right tabular-nums">
                          {formatCurrency(payment.amount)}
                        </TableCell>
                        <TableCell>
                          <PaymentStatusBadge status={payment.status} />
                        </TableCell>
                        <TableCell
                          className={cn(
                            "pr-6 text-right tabular-nums",
                            hasSaldo ? "font-medium text-accent-warm" : "text-muted-foreground"
                          )}
                        >
                          {hasSaldo ? formatCurrency(payment.amount) : "—"}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </SectionCard>
        </div>
      </div>
    </div>
  );
}

// Monograma con degradado salvia e iniciales del paciente.
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
    <div className="flex items-start gap-3 p-4 sm:p-5">
      <span
        className={cn(
          "mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg",
          accent ? "bg-accent-warm-soft text-accent-warm" : "bg-primary-soft text-primary"
        )}
      >
        <Icon size={16} strokeWidth={1.8} aria-hidden />
      </span>
      <div className="min-w-0">
        <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
          {label}
        </p>
        <p
          className={cn(
            "mt-1 truncate text-lg font-semibold tabular-nums",
            accent ? "text-accent-warm" : muted ? "text-muted-foreground" : "text-foreground"
          )}
        >
          {value}
        </p>
        {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
      </div>
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
        <CardTitle className="flex-1 text-base">{title}</CardTitle>
        {action}
      </CardHeader>
      <CardContent className={contentClassName}>{children}</CardContent>
    </Card>
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
