// Utilidades compartidas del módulo agenda (cliente y servidor).

// Formato ISO local "yyyy-MM-dd" para search params y hidden inputs.
export function toLocalISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// Nombre abreviado para píldoras compactas: nombre + primer apellido.
export function shortPatientName(p: { nombre: string; apellidos: string }): string {
  return `${p.nombre} ${p.apellidos.split(" ")[0]}`;
}

// Color sutil por estado, según el design system "Calma".
export const APPOINTMENT_STATUS_STYLES: Record<string, string> = {
  CONFIRMADA: "bg-primary-soft text-primary",
  PENDIENTE: "bg-surface-muted text-foreground border border-dashed border-border",
  COMPLETADA: "bg-surface-muted/60 text-muted-foreground",
  NO_ASISTIO: "bg-transparent text-muted-foreground/60 line-through decoration-muted-foreground/40",
  CANCELADA: "bg-transparent text-muted-foreground/60 line-through decoration-muted-foreground/40",
};

export const APPOINTMENT_STATUS_LABELS: Record<string, string> = {
  PENDIENTE: "Pendiente",
  CONFIRMADA: "Confirmada",
  COMPLETADA: "Completada",
  NO_ASISTIO: "No asistió",
  CANCELADA: "Cancelada",
};

export function appointmentStatusStyle(status: string): string {
  return APPOINTMENT_STATUS_STYLES[status] ?? "bg-surface-muted text-muted-foreground";
}

export function appointmentStatusLabel(status: string): string {
  return APPOINTMENT_STATUS_LABELS[status] ?? status;
}
