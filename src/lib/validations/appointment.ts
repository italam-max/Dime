import { z } from "zod";

// Estados y tipos como String validados aquí (sin enums nativos, portabilidad SQLite → PostgreSQL).
export const APPOINTMENT_STATUSES = [
  "PENDIENTE",
  "CONFIRMADA",
  "COMPLETADA",
  "NO_ASISTIO",
  "CANCELADA",
] as const;

export const APPOINTMENT_TYPES = ["PRESENCIAL", "ONLINE"] as const;

export const appointmentSchema = z.object({
  patientId: z.string().min(1, "Selecciona un paciente"),
  startAt: z.coerce.date({ error: "Ingresa una fecha y hora de inicio válidas" }),
  endAt: z.coerce.date({ error: "Ingresa una fecha y hora de fin válidas" }),
  status: z.enum(APPOINTMENT_STATUSES, "Selecciona un estado válido"),
  type: z.enum(APPOINTMENT_TYPES, "Selecciona un tipo de sesión válido"),
  fee: z.coerce.number().min(0, "La tarifa no puede ser negativa").optional().nullable(),
  sessionNotes: z.string().optional().nullable(),
  sessionTasks: z.string().optional().nullable(),
});

export type AppointmentInput = z.infer<typeof appointmentSchema>;
