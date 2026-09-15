import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { PAYMENT_METHODS, PAYMENT_STATUSES } from "@/lib/validations/payment";

const METHOD_LABELS: Record<(typeof PAYMENT_METHODS)[number], string> = {
  EFECTIVO: "Efectivo",
  TRANSFERENCIA: "Transferencia",
  TARJETA: "Tarjeta",
  OTRO: "Otro",
};

const STATUS_LABELS: Record<(typeof PAYMENT_STATUSES)[number], string> = {
  PAGADO: "Pagado",
  PENDIENTE: "Pendiente",
  PARCIAL: "Parcial",
};

// Badge de estado con las tonalidades del sistema "Calma":
// PAGADO en salvia suave; PENDIENTE/PARCIAL en terracota (PARCIAL con borde).
export function PaymentStatusBadge({ status }: { status: string }) {
  const label = STATUS_LABELS[status as keyof typeof STATUS_LABELS] ?? status;
  const className =
    status === "PAGADO"
      ? "bg-primary-soft text-primary"
      : status === "PARCIAL"
        ? "border-accent-warm/30 bg-accent-warm-soft text-accent-warm"
        : "bg-accent-warm-soft text-accent-warm";

  return <Badge className={cn(className)}>{label}</Badge>;
}

// Badge de método de pago en tono neutro atenuado.
export function PaymentMethodBadge({ method }: { method: string }) {
  const label = METHOD_LABELS[method as keyof typeof METHOD_LABELS] ?? method;
  return <Badge className="bg-surface-muted text-muted-foreground">{label}</Badge>;
}
