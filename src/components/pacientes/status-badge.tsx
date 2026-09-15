import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// Tonalidades "Calma" para badges de estado (docs/03-design-system.md):
// - positivos (COMPLETADA/PAGADO/ACTIVO): salvia suave
// - intermedios (PENDIENTE/CONFIRMADA): neutro surface-muted
// - negativos (NO_ASISTIO/CANCELADA/INACTIVO): neutro atenuado
// - deuda (PARCIAL): terracota suave

const TONE = {
  positive: "bg-primary-soft text-primary",
  neutral: "bg-surface-muted text-muted-foreground",
  muted: "bg-surface-muted text-muted-foreground/80",
  warm: "bg-accent-warm-soft text-accent-warm",
} as const;

const APPOINTMENT_STATUS_LABELS: Record<string, string> = {
  PENDIENTE: "Pendiente",
  CONFIRMADA: "Confirmada",
  COMPLETADA: "Completada",
  NO_ASISTIO: "No asistió",
  CANCELADA: "Cancelada",
};

const APPOINTMENT_STATUS_TONES: Record<string, string> = {
  PENDIENTE: TONE.neutral,
  CONFIRMADA: TONE.neutral,
  COMPLETADA: TONE.positive,
  NO_ASISTIO: TONE.muted,
  CANCELADA: TONE.muted,
};

const PAYMENT_STATUS_LABELS: Record<string, string> = {
  PENDIENTE: "Pendiente",
  PAGADO: "Pagado",
  PARCIAL: "Parcial",
};

const PAYMENT_STATUS_TONES: Record<string, string> = {
  PENDIENTE: TONE.neutral,
  PAGADO: TONE.positive,
  PARCIAL: TONE.warm,
};

export function AppointmentStatusBadge({ status }: { status: string }) {
  return (
    <Badge variant="secondary" className={cn("border-transparent", APPOINTMENT_STATUS_TONES[status] ?? TONE.neutral)}>
      {APPOINTMENT_STATUS_LABELS[status] ?? status}
    </Badge>
  );
}

export function PaymentStatusBadge({ status }: { status: string }) {
  return (
    <Badge variant="secondary" className={cn("border-transparent", PAYMENT_STATUS_TONES[status] ?? TONE.neutral)}>
      {PAYMENT_STATUS_LABELS[status] ?? status}
    </Badge>
  );
}

const APPOINTMENT_TYPE_LABELS: Record<string, string> = {
  PRESENCIAL: "Presencial",
  ONLINE: "En línea",
};

export function AppointmentTypeLabel({ type }: { type: string }) {
  return <span className="text-muted-foreground">{APPOINTMENT_TYPE_LABELS[type] ?? type}</span>;
}

// Badge de estado Activo/Inactivo del paciente.
export function PatientActiveBadge({ isActive }: { isActive: boolean }) {
  return (
    <Badge
      variant="secondary"
      className={cn("border-transparent", isActive ? TONE.positive : TONE.muted)}
    >
      {isActive ? "Activo" : "Inactivo"}
    </Badge>
  );
}
