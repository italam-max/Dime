import Link from "next/link";
import {
  addDays,
  addWeeks,
  format,
  isSameDay,
  isSameWeek,
  isToday,
  startOfWeek,
} from "date-fns";
import { es } from "date-fns/locale";
import { CalendarOff, ChevronLeft, ChevronRight } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { cn, formatCurrency, patientFullName } from "@/lib/utils";
import { AppointmentActions } from "@/components/agenda/appointment-actions";
import { AppointmentPill, type PillAppointment } from "@/components/agenda/appointment-pill";
import { NewAppointmentDialog } from "@/components/agenda/new-appointment-dialog";
import { appointmentStatusLabel, toLocalISODate } from "@/components/agenda/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type AgendaView = "semana" | "dia";

// Acepta solo "yyyy-MM-dd" para evitar fechas inválidas en los search params.
function parseDayParam(value: string | string[] | undefined): Date | null {
  const v = Array.isArray(value) ? value[0] : value;
  if (!v || !/^\d{4}-\d{2}-\d{2}$/.test(v)) return null;
  const d = new Date(`${v}T00:00:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export default async function AgendaPage({ searchParams }: PageProps<"/agenda">) {
  const sp = await searchParams;
  const view: AgendaView = sp.vista === "dia" ? "dia" : "semana";
  const today = new Date();

  // Semana: el lunes indicado (o el de la semana actual). Día: la fecha indicada (o hoy).
  const monday =
    parseDayParam(sp.semana) ?? startOfWeek(today, { weekStartsOn: 1 });
  const day = parseDayParam(sp.fecha) ?? today;

  const anchor = view === "semana" ? monday : day;
  const days: Date[] =
    view === "semana"
      ? Array.from({ length: 7 }, (_, i) => addDays(monday, i))
      : [day];

  const rangeStart = days[0];
  const rangeEnd = addDays(days[days.length - 1], 1);

  const [appointments, patients] = await Promise.all([
    prisma.appointment.findMany({
      where: { startAt: { gte: rangeStart, lt: rangeEnd } },
      include: { patient: true },
      orderBy: { startAt: "asc" },
    }),
    prisma.patient.findMany({
      where: { isActive: true },
      orderBy: [{ apellidos: "asc" }, { nombre: "asc" }],
      select: { id: true, nombre: true, apellidos: true },
    }),
  ]);

  // Links de navegación que preservan la vista y la fecha.
  const semanaHref = (d: Date) =>
    `/agenda?vista=semana&semana=${toLocalISODate(startOfWeek(d, { weekStartsOn: 1 }))}`;
  const diaHref = (d: Date) => `/agenda?vista=dia&fecha=${toLocalISODate(d)}`;

  const prevHref =
    view === "semana" ? semanaHref(addWeeks(monday, -1)) : diaHref(addDays(day, -1));
  const nextHref =
    view === "semana" ? semanaHref(addWeeks(monday, 1)) : diaHref(addDays(day, 1));
  const todayHref = view === "semana" ? semanaHref(today) : diaHref(today);

  // Al cambiar de vista se conserva el periodo visible.
  const semanaViewHref = semanaHref(anchor);
  const diaViewHref = diaHref(isSameWeek(anchor, today, { weekStartsOn: 1 }) ? today : anchor);

  const periodLabel =
    view === "semana"
      ? `${format(monday, "d 'de' MMM", { locale: es })} – ${format(addDays(monday, 6), "d 'de' MMM 'de' yyyy", { locale: es })}`
      : capitalize(format(day, "EEEE, d 'de' MMMM 'de' yyyy", { locale: es }));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-medium text-foreground">Agenda</h1>
          <p className="mt-1 text-sm text-muted-foreground">{periodLabel}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1">
            <Button variant="outline" size="icon-sm" asChild aria-label="Anterior">
              <Link href={prevHref}>
                <ChevronLeft />
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href={todayHref}>Hoy</Link>
            </Button>
            <Button variant="outline" size="icon-sm" asChild aria-label="Siguiente">
              <Link href={nextHref}>
                <ChevronRight />
              </Link>
            </Button>
          </div>

          <div className="flex rounded-lg border border-border bg-surface p-0.5">
            <Link
              href={semanaViewHref}
              className={cn(
                "rounded-md px-3 py-1.5 text-sm transition-colors",
                view === "semana"
                  ? "bg-primary-soft font-medium text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Semana
            </Link>
            <Link
              href={diaViewHref}
              className={cn(
                "rounded-md px-3 py-1.5 text-sm transition-colors",
                view === "dia"
                  ? "bg-primary-soft font-medium text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Día
            </Link>
          </div>

          <NewAppointmentDialog patients={patients} />
        </div>
      </div>

      {view === "semana" ? (
        <WeekGrid
          days={days}
          appointments={appointments}
          hasPatients={patients.length > 0}
          newAppointment={<NewAppointmentDialog patients={patients} />}
        />
      ) : (
        <DayList
          day={day}
          appointments={appointments}
          hasPatients={patients.length > 0}
          newAppointment={<NewAppointmentDialog patients={patients} />}
        />
      )}
    </div>
  );
}

type AppointmentWithPatient = Omit<PillAppointment, "patient"> & {
  endAt: Date;
  fee: number | null;
  sessionNotes: string | null;
  sessionTasks: string | null;
  patient: { id: string; nombre: string; apellidos: string };
};

function WeekGrid({
  days,
  appointments,
  hasPatients,
  newAppointment,
}: {
  days: Date[];
  appointments: AppointmentWithPatient[];
  hasPatients: boolean;
  newAppointment: React.ReactNode;
}) {
  const weekHasAppointments = appointments.length > 0;

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-xl bg-surface shadow-[var(--shadow-soft)] ring-1 ring-foreground/10">
        {/* Encabezado: nombre del día + número, con marcador sutil en el día actual */}
        <div className="grid grid-cols-7 border-b border-border">
          {days.map((day) => (
            <div
              key={toLocalISODate(day)}
              className={cn(
                "flex flex-col items-center gap-1 px-2 py-3",
                isToday(day) && "bg-primary-soft/50"
              )}
            >
              <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                {format(day, "EEE", { locale: es })}
              </p>
              <p
                className={cn(
                  "flex size-7 items-center justify-center rounded-full text-sm font-medium tabular-nums",
                  isToday(day) ? "bg-primary text-primary-foreground" : "text-foreground"
                )}
              >
                {format(day, "d")}
              </p>
            </div>
          ))}
        </div>

        {/* Columnas con las citas del día, ordenadas por hora */}
        <div className="grid grid-cols-7 gap-px bg-border">
          {days.map((day) => {
            const dayAppointments = appointments.filter((a) => isSameDay(a.startAt, day));
            return (
              <div
                key={toLocalISODate(day)}
                className={cn(
                  "min-h-32 space-y-1.5 bg-surface p-1.5 align-top",
                  isToday(day) && "bg-primary-soft/30"
                )}
              >
                {dayAppointments.map((a) => (
                  <AppointmentPill key={a.id} appointment={a} />
                ))}
              </div>
            );
          })}
        </div>
      </div>

      {!weekHasAppointments && (
        <EmptyState
          title="Esta semana está en calma"
          description="Aún no hay citas agendadas. Puedes agendar la primera cuando quieras."
          hasPatients={hasPatients}
          action={newAppointment}
        />
      )}
    </div>
  );
}

function DayList({
  day,
  appointments,
  hasPatients,
  newAppointment,
}: {
  day: Date;
  appointments: AppointmentWithPatient[];
  hasPatients: boolean;
  newAppointment: React.ReactNode;
}) {
  if (appointments.length === 0) {
    return (
      <EmptyState
        title="Un día sin citas"
        description={`No hay sesiones agendadas para el ${format(day, "d 'de' MMMM", { locale: es })}.`}
        hasPatients={hasPatients}
        action={newAppointment}
      />
    );
  }

  return (
    <div className="space-y-3">
      {appointments.map((a) => (
        <Card
          key={a.id}
          className="flex-row items-center gap-4 px-5 py-4 animate-fade-in"
        >
          <div className="w-24 shrink-0 tabular-nums">
            <p className="text-sm font-medium text-foreground">
              {format(a.startAt, "h:mm a", { locale: es })}
            </p>
            <p className="text-xs text-muted-foreground">
              {format(a.endAt, "h:mm a", { locale: es })}
            </p>
          </div>

          <div className="min-w-0 flex-1 space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <Link
                href={`/pacientes/${a.patient.id}`}
                className="truncate font-medium text-foreground hover:text-primary"
              >
                {patientFullName(a.patient)}
              </Link>
              <Badge variant="secondary" className="font-normal">
                {a.type === "ONLINE" ? "En línea" : "Presencial"}
              </Badge>
              <Badge variant="secondary" className="bg-surface-muted font-normal text-muted-foreground">
                {appointmentStatusLabel(a.status)}
              </Badge>
            </div>
            {a.fee != null && (
              <p className="text-sm text-muted-foreground">{formatCurrency(a.fee)}</p>
            )}
          </div>

          <div className="shrink-0">
            <AppointmentActions
              appointment={{
                id: a.id,
                status: a.status,
                startAt: a.startAt,
                endAt: a.endAt,
                patientName: patientFullName(a.patient),
                sessionNotes: a.sessionNotes,
                sessionTasks: a.sessionTasks,
              }}
            />
          </div>
        </Card>
      ))}
    </div>
  );
}

function EmptyState({
  title,
  description,
  hasPatients,
  action,
}: {
  title: string;
  description: string;
  hasPatients: boolean;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl bg-surface px-6 py-14 text-center shadow-[var(--shadow-soft)] ring-1 ring-foreground/10">
      <span className="flex size-11 items-center justify-center rounded-full bg-primary-soft text-primary">
        <CalendarOff className="size-5" />
      </span>
      <div>
        <p className="font-display text-xl font-medium text-foreground">{title}</p>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
      {hasPatients ? (
        action
      ) : (
        <p className="text-sm text-muted-foreground">
          Registra un paciente primero para poder agendar citas.
        </p>
      )}
    </div>
  );
}
