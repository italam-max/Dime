import { cn } from "@/lib/utils";
import { appointmentStatusLabel, appointmentStatusStyle } from "./utils";

// Badge de estado para la lista del día y detalles.
export function AppointmentStatusBadge({ status }: { status: string }) {
  return (
    <span
      className={cn(
        "inline-flex h-5 w-fit items-center rounded-4xl px-2 text-xs font-medium whitespace-nowrap",
        appointmentStatusStyle(status)
      )}
    >
      {appointmentStatusLabel(status)}
    </span>
  );
}
