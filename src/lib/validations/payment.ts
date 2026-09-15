import { z } from "zod";

export const PAYMENT_METHODS = ["EFECTIVO", "TRANSFERENCIA", "TARJETA", "OTRO"] as const;
export const PAYMENT_STATUSES = ["PENDIENTE", "PAGADO", "PARCIAL"] as const;

export const paymentSchema = z.object({
  patientId: z.string().min(1, "Selecciona un paciente"),
  appointmentId: z.string().optional().nullable(),
  amount: z.coerce.number().positive("El monto debe ser mayor a cero"),
  method: z.enum(PAYMENT_METHODS, "Selecciona un método de pago válido"),
  status: z.enum(PAYMENT_STATUSES, "Selecciona un estado de pago válido"),
  paidAt: z.coerce.date().optional().nullable(),
  concept: z.string().optional().nullable(),
});

export type PaymentInput = z.infer<typeof paymentSchema>;
