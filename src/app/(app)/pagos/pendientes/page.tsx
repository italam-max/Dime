import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Leaf } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatCurrency, formatDate, patientFullName } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  PaymentStatusBadge,
} from "@/components/pagos/payment-badges";
import { MarkPaidButton } from "@/components/pagos/mark-paid-button";

export const metadata: Metadata = {
  title: "Saldos pendientes · Dime",
};

// Pacientes con saldo > 0, agrupados por paciente con el detalle de sus pagos.
export default async function PagosPendientesPage() {
  const patients = await prisma.patient.findMany({
    where: { payments: { some: { status: { not: "PAGADO" } } } },
    include: {
      payments: {
        where: { status: { not: "PAGADO" } },
        orderBy: { createdAt: "desc" },
      },
    },
    orderBy: [{ isActive: "desc" }, { apellidos: "asc" }, { nombre: "asc" }],
  });

  return (
    <div className="animate-fade-in space-y-8">
      <div>
        <Link
          href="/pagos"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft size={16} aria-hidden />
          Volver a pagos
        </Link>
        <h1 className="mt-3 font-display text-4xl font-semibold text-foreground">
          Saldos pendientes
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Pacientes con pagos pendientes o parciales por cobrar.
        </p>
      </div>

      {patients.length === 0 ? (
        <div className="rounded-xl bg-surface px-6 py-20 text-center ring-1 ring-foreground/10">
          <Leaf
            size={28}
            strokeWidth={1.5}
            className="mx-auto text-primary"
            aria-hidden
          />
          <p className="mt-4 font-display text-2xl text-foreground">
            No hay saldos pendientes. Todo está al corriente.
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Cuando un paciente quede debiendo, su saldo aparecerá aquí.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {patients.map((patient) => {
            const total = patient.payments.reduce(
              (sum, p) => sum + p.amount,
              0
            );
            return (
              <Card key={patient.id}>
                <CardHeader className="flex-row items-center justify-between space-y-0">
                  <div>
                    <CardTitle className="font-display text-xl">
                      <Link
                        href={`/pacientes/${patient.id}`}
                        className="transition-colors hover:text-primary"
                      >
                        {patientFullName(patient)}
                      </Link>
                    </CardTitle>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {patient.payments.length}{" "}
                      {patient.payments.length === 1 ? "pago" : "pagos"} por
                      cobrar
                    </p>
                  </div>
                  <p className="text-2xl font-semibold tabular-nums text-accent-warm">
                    {formatCurrency(total)}
                  </p>
                </CardHeader>
                <CardContent className="space-y-3">
                  {patient.payments.map((payment) => (
                    <div
                      key={payment.id}
                      className="flex items-center justify-between gap-3 rounded-lg bg-surface-muted/60 px-3 py-2.5"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-foreground">
                          {payment.concept ?? "Pago"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Registrado el{" "}
                          {formatDate(payment.createdAt, "d 'de' MMM yyyy")}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <span className="text-sm font-medium tabular-nums">
                          {formatCurrency(payment.amount)}
                        </span>
                        <PaymentStatusBadge status={payment.status} />
                        <MarkPaidButton
                          paymentId={payment.id}
                          amount={payment.amount}
                        />
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
