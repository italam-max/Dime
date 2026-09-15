import Link from "next/link";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Video } from "lucide-react";
import { cn } from "@/lib/utils";
import { appointmentStatusStyle, shortPatientName, toLocalISODate } from "./utils";

export type PillAppointment = {
  id: string;
  status: string;
  type: string;
  startAt: Date;
  patient: { nombre: string; apellidos: string };
};

// Píldora compacta de cita para la grilla semanal; enlaza a la vista del día.
export function AppointmentPill({ appointment }: { appointment: PillAppointment }) {
  const href = `/agenda?vista=dia&fecha=${toLocalISODate(appointment.startAt)}`;

  return (
    <Link
      href={href}
      className={cn(
        "block rounded-lg px-2 py-1 text-xs transition-colors hover:opacity-80",
        appointmentStatusStyle(appointment.status)
      )}
    >
      <span className="flex items-center gap-1 font-medium tabular-nums">
        {format(appointment.startAt, "h:mm a", { locale: es })}
        {appointment.type === "ONLINE" && <Video className="size-3 shrink-0" aria-label="En línea" />}
      </span>
      <span className="block truncate">{shortPatientName(appointment.patient)}</span>
    </Link>
  );
}
