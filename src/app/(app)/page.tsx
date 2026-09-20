import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  addMonths,
  addWeeks,
  differenceInCalendarMonths,
  differenceInCalendarWeeks,
  endOfMonth,
  endOfWeek,
  format,
  isToday,
  isTomorrow,
  startOfDay,
  startOfMonth,
  startOfWeek,
  subMonths,
  subWeeks,
} from "date-fns";
import { es } from "date-fns/locale";
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  ListTodo,
  Users,
  Wallet,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AppointmentsByStatusChart } from "@/components/dashboard/appointments-by-status-chart";
import { IncomeChart } from "@/components/dashboard/income-chart";
import { KpiCard, type KpiDelta } from "@/components/dashboard/kpi-card";
import { WeeklyAttendanceChart } from "@/components/dashboard/weekly-attendance-chart";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { cn, formatCurrency, formatDate, patientFullName } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Panel · Dime",
};

// La hora se calcula en la zona del consultorio (México), no en la del
// servidor: en producción el contenedor corre en UTC y el saludo saldría a
// deshoras. Intl da la hora local de esa zona sin depender del TZ del proceso.
function saludoPara(date: Date): string {
  const hour = Number(
    new Intl.DateTimeFormat("es-MX", {
      timeZone: "America/Mexico_City",
      hour: "numeric",
      hourCycle: "h23",
    }).format(date)
  );
  if (hour < 12) return "Buenos días";
  if (hour < 19) return "Buenas tardes";
  return "Buenas noches";
}

const ETIQUETA_ESTADO_CITA: Record<string, string> = {
  PENDIENTE: "Pendiente",
  CONFIRMADA: "Confirmada",
  COMPLETADA: "Completada",
  NO_ASISTIO: "No asistió",
  CANCELADA: "Cancelada",
};

const ETIQUETA_TIPO_CITA: Record<string, string> = {
  PRESENCIAL: "Presencial",
  ONLINE: "En línea",
};

// Estilo por estado de cita: toda la fila se tiñe del color del estado
// (confirmada = verde salvia, pendiente = amarillo miel, completada = menta,
// no asistió = terracota, cancelada = apagado). Así se lee el estado de un
// vistazo, con la fecha y la hora en ese mismo color.
const ESTADO_CITA_STYLE: Record<
  string,
  { border: string; bg: string; text: string }
> = {
  CONFIRMADA: { border: "border-primary", bg: "bg-primary-soft", text: "text-primary" },
  PENDIENTE: { border: "border-honey", bg: "bg-honey-soft", text: "text-honey" },
  COMPLETADA: { border: "border-mint", bg: "bg-mint-soft", text: "text-mint" },
  NO_ASISTIO: { border: "border-accent-warm", bg: "bg-accent-warm-soft", text: "text-accent-warm" },
  CANCELADA: { border: "border-border", bg: "bg-surface-muted", text: "text-muted-foreground" },
};

const estiloCita = (status: string) =>
  ESTADO_CITA_STYLE[status] ?? ESTADO_CITA_STYLE.CANCELADA;

// Comparación sutil con el mes anterior: porcentaje para conteos/dinero,
// puntos para la tasa de asistencia.
function deltaMesPasado(
  actual: number,
  anterior: number,
  unidad: "pct" | "pts"
): KpiDelta {
  if (unidad === "pts") {
    const diff = Math.round((actual - anterior) * 10) / 10;
    return {
      direction: diff > 0 ? "up" : diff < 0 ? "down" : "flat",
      text: `${diff > 0 ? "+" : ""}${diff} pts vs el mes pasado`,
    };
  }
  if (anterior === 0) {
    return actual > 0
      ? { direction: "up", text: "Sin datos del mes pasado" }
      : { direction: "flat", text: "Sin cambios respecto al mes pasado" };
  }
  const pct = Math.round(((actual - anterior) / anterior) * 100);
  return {
    direction: pct > 0 ? "up" : pct < 0 ? "down" : "flat",
    text: `${pct > 0 ? "+" : ""}${pct}% respecto al mes pasado`,
  };
}

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const ahora = new Date();
  const mesInicio = startOfMonth(ahora);
  const mesFin = endOfMonth(ahora);
  const mesAntInicio = startOfMonth(subMonths(ahora, 1));
  const mesAntFin = endOfMonth(subMonths(ahora, 1));

  // ── KPIs del mes en curso ──────────────────────────────────────────────
  const [
    citasMes,
    citasMesAnt,
    resumenMes,
    resumenMesAnt,
    ingresosMes,
    ingresosMesAnt,
    pacientesActivos,
    totalPacientes,
  ] = await Promise.all([
    prisma.appointment.count({
      where: { startAt: { gte: mesInicio, lte: mesFin } },
    }),
    prisma.appointment.count({
      where: { startAt: { gte: mesAntInicio, lte: mesAntFin } },
    }),
    prisma.appointment.groupBy({
      by: ["status"],
      where: { startAt: { gte: mesInicio, lte: mesFin } },
      _count: { _all: true },
    }),
    prisma.appointment.groupBy({
      by: ["status"],
      where: { startAt: { gte: mesAntInicio, lte: mesAntFin } },
      _count: { _all: true },
    }),
    prisma.payment.aggregate({
      _sum: { amount: true },
      where: { status: "PAGADO", paidAt: { gte: mesInicio, lte: mesFin } },
    }),
    prisma.payment.aggregate({
      _sum: { amount: true },
      where: { status: "PAGADO", paidAt: { gte: mesAntInicio, lte: mesAntFin } },
    }),
    prisma.patient.count({ where: { isActive: true } }),
    prisma.patient.count(),
  ]);

  const conteo = (filas: { status: string; _count: { _all: number } }[], status: string) =>
    filas.find((fila) => fila.status === status)?._count._all ?? 0;

  const completadasMes = conteo(resumenMes, "COMPLETADA");
  const noAsistioMes = conteo(resumenMes, "NO_ASISTIO");
  const sesionesMes = completadasMes + noAsistioMes;
  const tasaMes = sesionesMes > 0 ? (completadasMes / sesionesMes) * 100 : null;

  const completadasMesAnt = conteo(resumenMesAnt, "COMPLETADA");
  const noAsistioMesAnt = conteo(resumenMesAnt, "NO_ASISTIO");
  const sesionesMesAnt = completadasMesAnt + noAsistioMesAnt;
  const tasaMesAnt = sesionesMesAnt > 0 ? (completadasMesAnt / sesionesMesAnt) * 100 : null;

  const cobradoMes = ingresosMes._sum.amount ?? 0;
  const cobradoMesAnt = ingresosMesAnt._sum.amount ?? 0;

  // ── Ingresos por mes (últimos 12 meses) ────────────────────────────────
  const inicioDoceMeses = startOfMonth(subMonths(ahora, 11));
  const pagosCobrados = await prisma.payment.findMany({
    where: { status: "PAGADO", paidAt: { gte: inicioDoceMeses } },
    select: { paidAt: true, amount: true },
  });
  const ingresosPorMes = Array.from({ length: 12 }, (_, i) => ({
    mes: format(addMonths(inicioDoceMeses, i), "MMM", { locale: es }),
    ingresos: 0,
  }));
  for (const pago of pagosCobrados) {
    if (!pago.paidAt) continue;
    const indice = differenceInCalendarMonths(
      startOfMonth(pago.paidAt),
      inicioDoceMeses
    );
    if (indice >= 0 && indice < 12) ingresosPorMes[indice].ingresos += pago.amount;
  }
  const datosIngresos = ingresosPorMes.map((fila) => ({
    mes: fila.mes,
    ingresos: Math.round(fila.ingresos),
  }));
  const hayIngresos = datosIngresos.some((fila) => fila.ingresos > 0);

  // ── Citas por estado (mes en curso) ────────────────────────────────────
  const citasPorEstado = resumenMes
    .map((fila) => ({
      estado: ETIQUETA_ESTADO_CITA[fila.status] ?? fila.status,
      estadoKey: fila.status,
      citas: fila._count._all,
    }))
    .sort((a, b) => b.citas - a.citas);

  // ── Asistencia semanal (últimas 8 semanas) ─────────────────────────────
  const inicioOchoSemanas = startOfWeek(subWeeks(ahora, 7), { weekStartsOn: 1 });
  const citasRecientes = await prisma.appointment.findMany({
    where: {
      startAt: { gte: inicioOchoSemanas, lte: ahora },
      status: { in: ["COMPLETADA", "NO_ASISTIO"] },
    },
    select: { startAt: true, status: true },
  });
  const asistenciaSemanal = Array.from({ length: 8 }, (_, i) => {
    const inicio = addWeeks(inicioOchoSemanas, i);
    return {
      semana: format(inicio, "d MMM", { locale: es }),
      completadas: 0,
      noAsistieron: 0,
    };
  });
  for (const cita of citasRecientes) {
    const indice = differenceInCalendarWeeks(
      startOfWeek(cita.startAt, { weekStartsOn: 1 }),
      inicioOchoSemanas
    );
    const semana = asistenciaSemanal[indice];
    if (!semana) continue;
    if (cita.status === "COMPLETADA") semana.completadas += 1;
    else semana.noAsistieron += 1;
  }
  const hayAsistencia = asistenciaSemanal.some(
    (semana) => semana.completadas > 0 || semana.noAsistieron > 0
  );

  // ── Próximas citas ─────────────────────────────────────────────────────
  const proximasCitas = await prisma.appointment.findMany({
    where: {
      startAt: { gte: ahora },
      status: { in: ["PENDIENTE", "CONFIRMADA"] },
    },
    orderBy: { startAt: "asc" },
    take: 5,
    include: { patient: { select: { id: true, nombre: true, apellidos: true } } },
  });

  // ── Saldos pendientes (pagos no PAGADO, agrupados por paciente) ────────
  const pagosPendientes = await prisma.payment.findMany({
    where: { status: { in: ["PENDIENTE", "PARCIAL"] } },
    select: {
      amount: true,
      patient: { select: { id: true, nombre: true, apellidos: true } },
    },
  });
  const deudaPorPaciente = new Map<
    string,
    { id: string; nombre: string; deuda: number }
  >();
  for (const pago of pagosPendientes) {
    const acumulado = deudaPorPaciente.get(pago.patient.id) ?? {
      id: pago.patient.id,
      nombre: patientFullName(pago.patient),
      deuda: 0,
    };
    acumulado.deuda += pago.amount;
    deudaPorPaciente.set(pago.patient.id, acumulado);
  }
  const saldosPendientes = [...deudaPorPaciente.values()]
    .sort((a, b) => b.deuda - a.deuda)
    .slice(0, 5);

  // ── Tareas de la semana (pendientes que vencen esta semana o están atrasadas) ──
  const finSemana = endOfWeek(ahora, { weekStartsOn: 1 });
  const inicioSemana = startOfWeek(ahora, { weekStartsOn: 1 });
  // Tareas que los pacientes completaron dentro de esta semana (pulso de cumplimiento).
  const tareasCompletadasSemana = await prisma.task.count({
    where: {
      completedAt: { gte: inicioSemana, lte: finSemana },
      patient: { isActive: true },
    },
  });
  const tareasSemana = await prisma.task.findMany({
    where: {
      completedAt: null,
      dueDate: { lte: finSemana },
      patient: { isActive: true },
    },
    orderBy: [{ dueDate: "asc" }],
    take: 15,
    select: {
      id: true,
      title: true,
      dueDate: true,
      patient: { select: { id: true, nombre: true, apellidos: true } },
    },
  });
  const etiquetaVencimiento = (dueDate: Date): { texto: string; atrasada: boolean } => {
    if (isToday(dueDate)) return { texto: "Hoy", atrasada: false };
    if (isTomorrow(dueDate)) return { texto: "Mañana", atrasada: false };
    if (startOfDay(dueDate).getTime() < startOfDay(ahora).getTime()) {
      return { texto: `Atrasada · ${format(dueDate, "d MMM", { locale: es })}`, atrasada: true };
    }
    return { texto: format(dueDate, "EEEE, d 'de' MMM", { locale: es }), atrasada: false };
  };

  // ── Evaluaciones de la semana (asignaciones activas que vencen o están atrasadas) ──
  const evaluacionesSemana = await prisma.assessmentAssignment.findMany({
    where: {
      active: true,
      nextDueAt: { lte: finSemana },
      patient: { isActive: true },
    },
    orderBy: [{ nextDueAt: "asc" }],
    take: 15,
    select: {
      id: true,
      nextDueAt: true,
      patient: { select: { id: true, nombre: true, apellidos: true } },
      instrument: { select: { name: true } },
    },
  });

  return (
    <div className="animate-fade-in space-y-8">
      {/* ── Bienvenida ── */}
      <div>
        <h1 className="font-display text-4xl font-semibold text-foreground">
          {saludoPara(ahora)}, {user.name.split(" ")[0]}
        </h1>
        <p className="mt-2 text-sm capitalize text-muted-foreground">
          {formatDate(ahora, "EEEE, d 'de' MMMM 'de' yyyy")}
        </p>
      </div>

      {/* ── KPIs del mes ── */}
      <div className="stagger-children grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Citas del mes"
          value={String(citasMes)}
          icon={CalendarDays}
          accent="sage"
          delta={deltaMesPasado(citasMes, citasMesAnt, "pct")}
        />
        <KpiCard
          label="Tasa de asistencia"
          value={tasaMes === null ? "—" : `${Math.round(tasaMes)}%`}
          icon={CheckCircle2}
          accent="mint"
          delta={
            tasaMes === null || tasaMesAnt === null
              ? undefined
              : deltaMesPasado(tasaMes, tasaMesAnt, "pts")
          }
        />
        <KpiCard
          label="Ingresos del mes"
          value={formatCurrency(Math.round(cobradoMes))}
          icon={Wallet}
          accent="warm"
          delta={deltaMesPasado(Math.round(cobradoMes), Math.round(cobradoMesAnt), "pct")}
        />
        <KpiCard
          label="Pacientes activos"
          value={String(pacientesActivos)}
          icon={Users}
          accent="honey"
          delta={{ direction: "flat", text: `de ${totalPacientes} pacientes registrados` }}
        />
      </div>

      {/* ── Prioridad clínica: próximas citas y distribución por estado ── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="hover-lift">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="font-display text-xl font-medium normal-case text-foreground">
              Próximas citas
            </CardTitle>
            <Link
              href="/agenda"
              className="flex items-center gap-1 text-sm font-medium text-primary transition-colors hover:underline"
            >
              Ver agenda
              <ArrowRight size={14} aria-hidden />
            </Link>
          </CardHeader>
          <CardContent>
            {proximasCitas.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-8 text-center">
                <CalendarDays
                  size={20}
                  strokeWidth={1.6}
                  className="text-muted-foreground"
                  aria-hidden
                />
                <p className="text-sm text-muted-foreground">
                  No tienes citas próximas. Tu agenda está libre por ahora.
                </p>
                <Link
                  href="/agenda"
                  className="text-sm font-medium text-primary transition-colors hover:underline"
                >
                  Ir a la agenda
                </Link>
              </div>
            ) : (
              <ul className="space-y-2">
                {proximasCitas.map((cita) => {
                  const esHoy = isToday(cita.startAt);
                  const esManana = isTomorrow(cita.startAt);
                  const diaLabel = esHoy
                    ? "Hoy"
                    : esManana
                      ? "Mañana"
                      : format(cita.startAt, "EEE d 'de' MMM", { locale: es });
                  const s = estiloCita(cita.status);
                  return (
                    <li
                      key={cita.id}
                      className={cn(
                        "flex items-center gap-4 rounded-control border-l-[3px] py-2.5 pr-3 pl-3",
                        s.border,
                        s.bg
                      )}
                    >
                      <div className="w-32 shrink-0">
                        <p className={cn("text-xs font-semibold uppercase tracking-wide", s.text)}>
                          {diaLabel}
                        </p>
                        <p
                          className={cn(
                            "mt-0.5 text-xl font-bold tabular-nums whitespace-nowrap",
                            s.text
                          )}
                        >
                          {format(cita.startAt, "h:mm a", { locale: es })}
                        </p>
                      </div>
                      <div className="min-w-0 flex-1">
                        <Link
                          href={`/pacientes/${cita.patient.id}`}
                          className="block truncate text-sm font-medium text-foreground transition-colors hover:text-primary"
                        >
                          {patientFullName(cita.patient)}
                        </Link>
                        <p className="text-xs text-muted-foreground">
                          {ETIQUETA_TIPO_CITA[cita.type] ?? cita.type}
                        </p>
                      </div>
                      <span className={cn("inline-flex shrink-0 items-center gap-1.5 text-xs font-semibold", s.text)}>
                        <span className="size-1.5 rounded-full bg-current" aria-hidden />
                        {ETIQUETA_ESTADO_CITA[cita.status] ?? cita.status}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-display text-xl font-medium normal-case text-foreground">
              Citas por estado
            </CardTitle>
          </CardHeader>
          <CardContent>
            {citasPorEstado.length > 0 ? (
              <AppointmentsByStatusChart data={citasPorEstado} />
            ) : (
              <p className="flex h-[280px] items-center justify-center text-center text-sm text-muted-foreground">
                Este mes aún no tienes citas agendadas.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Seguimiento de la semana: tareas y evaluaciones (al principio) ── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="font-display text-xl font-medium normal-case text-foreground">
              Tareas de la semana
            </CardTitle>
            {tareasCompletadasSemana > 0 ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-mint-soft px-2.5 py-1 text-xs font-medium text-mint">
                <CheckCircle2 size={13} strokeWidth={2} aria-hidden />
                {tareasCompletadasSemana} completada{tareasCompletadasSemana === 1 ? "" : "s"}
              </span>
            ) : (
              <ListTodo size={18} strokeWidth={1.6} className="text-muted-foreground" aria-hidden />
            )}
          </CardHeader>
          <CardContent>
            {tareasSemana.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-8 text-center">
                <CheckCircle2
                  size={20}
                  strokeWidth={1.6}
                  className="text-primary"
                  aria-hidden
                />
                <p className="max-w-56 text-sm text-muted-foreground">
                  No hay tareas pendientes esta semana. Todo está en orden.
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-border">
                {tareasSemana.map((tarea) => {
                  const vencimiento = etiquetaVencimiento(tarea.dueDate!);
                  return (
                    <li key={tarea.id} className="py-3 first:pt-0 last:pb-0">
                      <Link
                        href={`/pacientes/${tarea.patient.id}`}
                        className="block truncate text-sm font-medium text-foreground transition-colors hover:text-primary"
                      >
                        {patientFullName(tarea.patient)}
                      </Link>
                      <div className="mt-0.5 flex items-center justify-between gap-2">
                        <p className="min-w-0 truncate text-xs text-muted-foreground">
                          {tarea.title}
                        </p>
                        <span
                          className={cn(
                            "shrink-0 text-xs tabular-nums",
                            vencimiento.atrasada ? "text-accent-warm" : "text-muted-foreground"
                          )}
                        >
                          {vencimiento.texto}
                        </span>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="font-display text-xl font-medium normal-case text-foreground">
              Evaluaciones de la semana
            </CardTitle>
            <ClipboardList
              size={18}
              strokeWidth={1.6}
              className="text-muted-foreground"
              aria-hidden
            />
          </CardHeader>
          <CardContent>
            {evaluacionesSemana.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-8 text-center">
                <CheckCircle2
                  size={20}
                  strokeWidth={1.6}
                  className="text-primary"
                  aria-hidden
                />
                <p className="max-w-56 text-sm text-muted-foreground">
                  No hay evaluaciones pendientes esta semana. El seguimiento va en orden.
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-border">
                {evaluacionesSemana.map((evaluacion) => {
                  const vencimiento = etiquetaVencimiento(evaluacion.nextDueAt);
                  return (
                    <li key={evaluacion.id} className="py-3 first:pt-0 last:pb-0">
                      <Link
                        href={`/pacientes/${evaluacion.patient.id}`}
                        className="block truncate text-sm font-medium text-foreground transition-colors hover:text-primary"
                      >
                        {patientFullName(evaluacion.patient)}
                      </Link>
                      <div className="mt-0.5 flex items-center justify-between gap-2">
                        <p className="min-w-0 truncate text-xs text-muted-foreground">
                          {evaluacion.instrument.name}
                        </p>
                        <span
                          className={cn(
                            "shrink-0 text-xs tabular-nums",
                            vencimiento.atrasada
                              ? "text-accent-warm"
                              : "text-muted-foreground"
                          )}
                        >
                          {vencimiento.texto}
                        </span>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Asistencia semanal ── */}
      <Card>
          <CardHeader>
            <CardTitle className="font-display text-xl font-medium normal-case text-foreground">
              Asistencia semanal
            </CardTitle>
          </CardHeader>
          <CardContent>
            {hayAsistencia ? (
              <WeeklyAttendanceChart data={asistenciaSemanal} />
            ) : (
              <p className="flex h-[280px] items-center justify-center text-sm text-muted-foreground">
                Las sesiones completadas y las inasistencias aparecerán aquí.
              </p>
            )}
          </CardContent>
        </Card>

      {/* ── Finanzas: saldos pendientes junto a ingresos por mes ── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="hover-lift">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="font-display text-xl font-medium normal-case text-foreground">
              Saldos pendientes
            </CardTitle>
            <Link
              href="/pagos"
              className="flex items-center gap-1 text-sm font-medium text-primary transition-colors hover:underline"
            >
              Ver pagos
              <ArrowRight size={14} aria-hidden />
            </Link>
          </CardHeader>
          <CardContent>
            {saldosPendientes.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-8 text-center">
                <CheckCircle2
                  size={20}
                  strokeWidth={1.6}
                  className="text-primary"
                  aria-hidden
                />
                <p className="max-w-56 text-sm text-muted-foreground">
                  Todos tus pacientes están al corriente. Puedes respirar tranquilo.
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-border">
                {saldosPendientes.map((saldo) => (
                  <li
                    key={saldo.id}
                    className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0"
                  >
                    <Link
                      href={`/pacientes/${saldo.id}`}
                      className="min-w-0 truncate text-sm font-medium text-foreground transition-colors hover:text-primary"
                    >
                      {saldo.nombre}
                    </Link>
                    <span className="shrink-0 text-sm font-medium tabular-nums text-accent-warm">
                      {formatCurrency(Math.round(saldo.deuda))}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-display text-xl font-medium normal-case text-foreground">
              Ingresos por mes
            </CardTitle>
          </CardHeader>
          <CardContent>
            {hayIngresos ? (
              <IncomeChart data={datosIngresos} />
            ) : (
              <p className="flex h-[280px] items-center justify-center text-sm text-muted-foreground">
                Aún no hay ingresos registrados en los últimos 12 meses.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
