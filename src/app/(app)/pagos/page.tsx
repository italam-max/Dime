import type { Metadata } from "next";
import Link from "next/link";
import { startOfDay, startOfMonth } from "date-fns";
import { ArrowLeft, ArrowRight, WalletMinimal } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { cn, formatCurrency, formatDate, patientFullName } from "@/lib/utils";
import { PAYMENT_STATUSES } from "@/lib/validations/payment";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { RegisterPaymentDialog } from "@/components/pagos/register-payment-dialog";
import { PaymentSearchInput } from "@/components/pagos/payment-search-input";
import {
  PaymentMethodBadge,
  PaymentStatusBadge,
} from "@/components/pagos/payment-badges";
import { MarkPaidButton } from "@/components/pagos/mark-paid-button";

export const metadata: Metadata = {
  title: "Pagos · Dime",
};

const PAGE_SIZE = 15;

const ESTADO_OPTIONS = [
  { value: "todos", label: "Todos" },
  { value: "pendiente", label: "Pendientes" },
  { value: "pagado", label: "Pagados" },
  { value: "parcial", label: "Parciales" },
] as const;

const ESTADO_TO_STATUS: Record<string, string> = {
  pendiente: "PENDIENTE",
  pagado: "PAGADO",
  parcial: "PARCIAL",
};

export default async function PagosPage({
  searchParams,
}: {
  searchParams: Promise<{ estado?: string; q?: string; page?: string }>;
}) {
  const { estado = "todos", q = "", page = "1" } = await searchParams;
  const now = new Date();

  // Filtro por estado (todos = sin filtro de estado).
  const statusFilter = ESTADO_TO_STATUS[estado];
  const statusWhere = statusFilter
    ? { status: statusFilter }
    : { status: { in: [...PAYMENT_STATUSES] as string[] } };

  // Búsqueda por nombre de paciente o concepto.
  const query = q.trim();
  const where = {
    ...statusWhere,
    ...(query
      ? {
          OR: [
            { patient: { nombre: { contains: query } } },
            { patient: { apellidos: { contains: query } } },
            { concept: { contains: query } },
          ],
        }
      : {}),
  };

  const pageNumber = Math.max(1, Number.parseInt(page, 10) || 1);

  const [payments, totalPayments, cobradoMes, cobradoHoy, pendienteTotal, patients] =
    await Promise.all([
      prisma.payment.findMany({
        where,
        include: { patient: { select: { id: true, nombre: true, apellidos: true } } },
        orderBy: { createdAt: "desc" },
        skip: (pageNumber - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
      }),
      prisma.payment.count({ where }),
      prisma.payment.aggregate({
        _sum: { amount: true },
        where: { status: "PAGADO", paidAt: { gte: startOfMonth(now) } },
      }),
      prisma.payment.aggregate({
        _sum: { amount: true },
        where: { status: "PAGADO", paidAt: { gte: startOfDay(now) } },
      }),
      prisma.payment.aggregate({
        _sum: { amount: true },
        where: { status: { in: ["PENDIENTE", "PARCIAL"] } },
      }),
      // Pacientes activos primero, para el select de "Registrar pago".
      prisma.patient.findMany({
        orderBy: [{ isActive: "desc" }, { apellidos: "asc" }, { nombre: "asc" }],
        select: { id: true, nombre: true, apellidos: true, isActive: true },
      }),
    ]);

  // Citas COMPLETADAS sin pago PAGADO asociado, como opciones de vinculación.
  const eligibleAppointments = await prisma.appointment.findMany({
    where: {
      status: "COMPLETADA",
      patientId: { in: patients.map((p) => p.id) },
      payments: { none: { status: "PAGADO" } },
    },
    select: { id: true, patientId: true, startAt: true, fee: true },
    orderBy: { startAt: "desc" },
  });

  const appointmentsByPatient: Record<
    string,
    { id: string; label: string }[]
  > = {};
  for (const a of eligibleAppointments) {
    const label = `${formatDate(a.startAt, "d 'de' MMM yyyy, h:mm a")}${
      a.fee != null ? ` · ${formatCurrency(a.fee)}` : ""
    }`;
    (appointmentsByPatient[a.patientId] ??= []).push({ id: a.id, label });
  }

  const kpis = [
    {
      label: "Cobrado este mes",
      value: formatCurrency(cobradoMes._sum.amount ?? 0),
    },
    {
      label: "Pendiente por cobrar",
      value: formatCurrency(pendienteTotal._sum.amount ?? 0),
      warm: (pendienteTotal._sum.amount ?? 0) > 0,
    },
    // Solo se muestra cuando hubo cobros el día de hoy.
    ...((cobradoHoy._sum.amount ?? 0) > 0
      ? [{ label: "Cobrado hoy", value: formatCurrency(cobradoHoy._sum.amount ?? 0) }]
      : []),
  ];

  const totalPages = Math.max(1, Math.ceil(totalPayments / PAGE_SIZE));
  const hasFilters = estado !== "todos" || query !== "";

  function pageHref(target: number): string {
    const params = new URLSearchParams();
    if (estado !== "todos") params.set("estado", estado);
    if (query) params.set("q", query);
    params.set("page", String(target));
    return `/pagos?${params.toString()}`;
  }

  return (
    <div className="animate-fade-in space-y-8">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl font-semibold text-foreground">
            Pagos
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Cobros y saldos de tus pacientes, en un solo lugar.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/pagos/pendientes"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-primary transition-colors hover:text-primary/80"
          >
            <WalletMinimal size={16} aria-hidden />
            Ver pendientes
          </Link>
          <RegisterPaymentDialog
            patients={patients.map((p) => ({
              id: p.id,
              label: patientFullName(p),
              isActive: p.isActive,
            }))}
            appointmentsByPatient={appointmentsByPatient}
          />
        </div>
      </div>

      <div className="stagger-children grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {kpis.map((kpi) => (
          <Card key={kpi.label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                {kpi.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p
                className={cn(
                  "text-3xl font-semibold tabular-nums",
                  "warm" in kpi && kpi.warm
                    ? "text-accent-warm"
                    : "text-foreground"
                )}
              >
                {kpi.value}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1">
          {ESTADO_OPTIONS.map((opt) => {
            const active = estado === opt.value;
            return (
              <Link
                key={opt.value}
                href={`/pagos${opt.value === "todos" ? "" : `?estado=${opt.value}`}${query ? `${opt.value === "todos" ? "?" : "&"}q=${encodeURIComponent(query)}` : ""}`}
                className={cn(
                  "rounded-full px-3 py-1.5 text-sm font-medium transition-colors duration-150 ease-out",
                  active
                    ? "bg-primary-soft text-primary"
                    : "text-muted-foreground hover:bg-surface-muted hover:text-foreground"
                )}
              >
                {opt.label}
              </Link>
            );
          })}
        </div>
        <PaymentSearchInput />
      </div>

      <div className="overflow-hidden rounded-xl bg-surface ring-1 ring-foreground/10">
        <Table>
          <TableHeader>
            <TableRow className="bg-surface-muted/50 hover:bg-surface-muted/50">
              <TableHead className="px-4 text-xs uppercase tracking-widest text-muted-foreground">
                Fecha
              </TableHead>
              <TableHead className="px-4 text-xs uppercase tracking-widest text-muted-foreground">
                Paciente
              </TableHead>
              <TableHead className="px-4 text-xs uppercase tracking-widest text-muted-foreground">
                Concepto
              </TableHead>
              <TableHead className="px-4 text-xs uppercase tracking-widest text-muted-foreground">
                Método
              </TableHead>
              <TableHead className="px-4 text-right text-xs uppercase tracking-widest text-muted-foreground">
                Monto
              </TableHead>
              <TableHead className="px-4 text-xs uppercase tracking-widest text-muted-foreground">
                Estado
              </TableHead>
              <TableHead className="px-4" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {payments.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={7} className="px-4 py-16 text-center">
                  <p className="font-display text-2xl text-foreground">
                    {hasFilters
                      ? "No hay pagos que coincidan con los filtros."
                      : "Aún no hay pagos registrados."}
                  </p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {hasFilters
                      ? "Prueba con otra búsqueda o quita los filtros."
                      : "Cuando registres tu primer pago, aparecerá aquí."}
                  </p>
                </TableCell>
              </TableRow>
            ) : (
              payments.map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell className="px-4 text-muted-foreground">
                    {payment.paidAt
                      ? formatDate(payment.paidAt, "d 'de' MMM yyyy, h:mm a")
                      : "—"}
                  </TableCell>
                  <TableCell className="px-4">
                    <Link
                      href={`/pacientes/${payment.patient.id}`}
                      className="font-medium text-foreground transition-colors hover:text-primary"
                    >
                      {patientFullName(payment.patient)}
                    </Link>
                  </TableCell>
                  <TableCell className="max-w-64 truncate px-4 text-muted-foreground">
                    {payment.concept ?? "—"}
                  </TableCell>
                  <TableCell className="px-4">
                    <PaymentMethodBadge method={payment.method} />
                  </TableCell>
                  <TableCell className="px-4 text-right font-medium tabular-nums">
                    {formatCurrency(payment.amount)}
                  </TableCell>
                  <TableCell className="px-4">
                    <PaymentStatusBadge status={payment.status} />
                  </TableCell>
                  <TableCell className="px-4 text-right">
                    {payment.status !== "PAGADO" && (
                      <MarkPaidButton
                        paymentId={payment.id}
                        amount={payment.amount}
                      />
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <p>
            Página {pageNumber} de {totalPages} · {totalPayments} pagos
          </p>
          <div className="flex items-center gap-2">
            {pageNumber > 1 ? (
              <Link
                href={pageHref(pageNumber - 1)}
                className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 font-medium text-foreground transition-colors hover:bg-surface-muted"
              >
                <ArrowLeft size={14} aria-hidden />
                Anterior
              </Link>
            ) : (
              <span className="inline-flex cursor-not-allowed items-center gap-1 px-2.5 py-1.5 opacity-40">
                <ArrowLeft size={14} aria-hidden />
                Anterior
              </span>
            )}
            {pageNumber < totalPages ? (
              <Link
                href={pageHref(pageNumber + 1)}
                className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 font-medium text-foreground transition-colors hover:bg-surface-muted"
              >
                Siguiente
                <ArrowRight size={14} aria-hidden />
              </Link>
            ) : (
              <span className="inline-flex cursor-not-allowed items-center gap-1 px-2.5 py-1.5 opacity-40">
                Siguiente
                <ArrowRight size={14} aria-hidden />
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
