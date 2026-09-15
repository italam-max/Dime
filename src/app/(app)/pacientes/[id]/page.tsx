import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Pencil } from "lucide-react";
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

// Ficha clínica del paciente: datos generales, motivo de consulta, notas
// internas e historial completo de citas y pagos.
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

  const age = calculateAge(patient.fechaNacimiento);
  // Saldo pendiente: suma de pagos que no están PAGADOS (pendientes o parciales).
  const saldoPendiente = patient.payments
    .filter((payment) => payment.status !== "PAGADO")
    .reduce((sum, payment) => sum + payment.amount, 0);

  // Acceso al portal: estado de la invitación y último consentimiento aceptado.
  const [portalAccess, portalConsent] = await Promise.all([
    prisma.portalAccess.findUnique({ where: { patientId: patient.id } }),
    prisma.consent.findFirst({
      where: { patientId: patient.id, type: "PORTAL" },
      orderBy: { acceptedAt: "desc" },
    }),
  ]);

  const ahora = new Date();
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

  return (
    <div className="animate-fade-in space-y-6">
      <Link
        href="/pacientes"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Volver a pacientes
      </Link>

      {/* Encabezado: identidad del paciente y acciones principales */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-display text-4xl font-semibold text-foreground">
              {patientFullName(patient)}
            </h1>
            <PatientActiveBadge isActive={patient.isActive} />
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            {[
              age !== null ? `${age} años` : null,
              patient.telefono,
              patient.email,
            ]
              .filter(Boolean)
              .join(" · ")}
          </p>
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

      {/* Saldo pendiente: terracota suave cuando hay deuda, neutro cuando no. */}
      <Card
        className={cn(
          "flex-row items-center justify-between",
          saldoPendiente > 0 ? "bg-accent-warm-soft" : "bg-surface-muted"
        )}
      >
        <div>
          <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
            Saldo pendiente
          </p>
          <p
            className={cn(
              "mt-1 text-2xl font-semibold tabular-nums",
              saldoPendiente > 0 ? "text-accent-warm" : "text-foreground"
            )}
          >
            {formatCurrency(saldoPendiente)}
          </p>
        </div>
        <p className="text-sm text-muted-foreground">
          {saldoPendiente > 0
            ? "Suma de pagos pendientes o parciales del paciente."
            : "El paciente está al corriente."}
        </p>
      </Card>

      {/* Portal del paciente: invitación, acceso y consentimiento */}
      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle>Portal del paciente</CardTitle>
          {portalStatus === "active" && portalConsent && (
            <p className="text-xs text-muted-foreground">
              Consentimiento aceptado el {formatDate(portalConsent.acceptedAt, "d 'de' MMM yyyy")}
            </p>
          )}
        </CardHeader>
        <CardContent>
          <PortalWidget
            patientId={patient.id}
            status={portalStatus}
            acceptedAt={portalAccess?.acceptedAt ?? null}
            expiresAt={portalAccess?.expiresAt ?? null}
          />
        </CardContent>
      </Card>

      {/* Información general */}
      <Card>
        <CardHeader>
          <CardTitle>Información general</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-x-8 gap-y-4 sm:grid-cols-2">
          <InfoItem label="Fecha de nacimiento" value={patient.fechaNacimiento ? formatDate(patient.fechaNacimiento, "d 'de' MMM yyyy") : null} />
          <InfoItem label="Sexo" value={patient.sexo} />
          <InfoItem label="Dirección" value={patient.direccion} />
          <InfoItem label="Contacto de emergencia" value={patient.contactoEmergencia} />
        </CardContent>
      </Card>

      {/* Motivo de consulta / antecedentes */}
      <Card>
        <CardHeader>
          <CardTitle>Motivo de consulta y antecedentes</CardTitle>
        </CardHeader>
        <CardContent>
          {patient.antecedentes ? (
            <p className="whitespace-pre-line text-sm leading-relaxed">{patient.antecedentes}</p>
          ) : (
            <p className="text-sm text-muted-foreground">
              Aún no se registran antecedentes. Puedes agregarlos desde Editar.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Notas internas */}
      <Card>
        <CardHeader>
          <CardTitle>Notas internas</CardTitle>
        </CardHeader>
        <CardContent>
          {patient.notasInternas ? (
            <p className="whitespace-pre-line text-sm leading-relaxed">{patient.notasInternas}</p>
          ) : (
            <p className="text-sm text-muted-foreground">
              Sin notas internas. Solo tú puedes ver esta sección.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Tareas entre sesiones: activas, cumplimiento y completadas recientes */}
      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle>Tareas entre sesiones</CardTitle>
          {cumplimiento !== null && (
            <p className="text-xs text-muted-foreground">
              {cumplimiento}% de cumplimiento en las últimas 4 semanas
            </p>
          )}
        </CardHeader>
        <CardContent>
          {tareasActivas.length === 0 && tareasHechasRecientes.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Aún no hay tareas registradas. Se crean al completar una sesión con acuerdos.
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {tareasActivas.map((task) => (
                <li key={task.id} className="flex items-center justify-between gap-4 py-3 first:pt-0">
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
        </CardContent>
      </Card>

      {/* Evaluaciones: asignaciones, respuestas y evolución (componente auto-contenido) */}
      <AssessmentsSection patientId={patient.id} />

      {/* Material psicoeducativo asignado (componente auto-contenido) */}
      <MaterialSection patientId={patient.id} />

      {/* Historial de citas */}
      <Card>
        <CardHeader>
          <CardTitle>Historial de citas</CardTitle>
        </CardHeader>
        <CardContent className="px-0">
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
                        className="text-sm text-primary hover:underline underline-offset-4"
                      >
                        Ver en agenda
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Historial de pagos */}
      <Card>
        <CardHeader>
          <CardTitle>Historial de pagos</CardTitle>
        </CardHeader>
        <CardContent className="px-0">
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
                  const hasSaldo = payment.status === "PENDIENTE" || payment.status === "PARCIAL";
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
        </CardContent>
      </Card>
    </div>
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
