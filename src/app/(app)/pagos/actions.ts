"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { paymentSchema } from "@/lib/validations/payment";

export interface PaymentActionState {
  ok?: boolean;
  id?: string;
  message?: string;
}

// Registra un pago nuevo. La validación con Zod vive aquí (fuente única).
export async function createPayment(
  _prev: PaymentActionState,
  formData: FormData
): Promise<PaymentActionState> {
  const user = await getCurrentUser();
  if (!user) return { message: "Tu sesión expiró. Vuelve a entrar." };

  const status = formData.get("status");
  const rawPaidAt = formData.get("paidAt");
  const rawConcept = formData.get("concept");
  const rawAppointmentId = formData.get("appointmentId");

  const parsed = paymentSchema.safeParse({
    patientId: formData.get("patientId"),
    appointmentId: rawAppointmentId ? rawAppointmentId : null,
    amount: formData.get("amount"),
    method: formData.get("method"),
    status,
    // Solo aplica fecha de pago cuando el estado la requiere.
    paidAt:
      status === "PAGADO" || status === "PARCIAL"
        ? rawPaidAt
          ? new Date(`${rawPaidAt}T12:00:00`)
          : new Date()
        : null,
    concept: rawConcept && String(rawConcept).trim() !== "" ? rawConcept : null,
  });

  if (!parsed.success) {
    return { message: "Revisa los datos del pago e inténtalo de nuevo." };
  }

  const { patientId, appointmentId, amount, method, status: pStatus, paidAt, concept } =
    parsed.data;

  const payment = await prisma.payment.create({
    data: {
      patientId,
      appointmentId: appointmentId || null,
      amount,
      method,
      status: pStatus,
      paidAt,
      concept,
    },
  });

  revalidatePath("/pagos");
  revalidatePath("/pagos/pendientes");
  revalidatePath(`/pacientes/${patientId}`);
  return { ok: true, id: payment.id };
}

// Marca un pago PENDIENTE/PARCIAL como cobrado, con fecha de hoy.
export async function markPaymentAsPaid(
  paymentId: string
): Promise<PaymentActionState> {
  const user = await getCurrentUser();
  if (!user) return { message: "Tu sesión expiró. Vuelve a entrar." };

  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    select: { id: true, status: true, patientId: true },
  });
  if (!payment) return { message: "No encontramos ese pago." };
  if (payment.status === "PAGADO") {
    return { message: "Este pago ya estaba cobrado." };
  }

  await prisma.payment.update({
    where: { id: payment.id },
    data: { status: "PAGADO", paidAt: new Date() },
  });

  revalidatePath("/pagos");
  revalidatePath("/pagos/pendientes");
  revalidatePath(`/pacientes/${payment.patientId}`);
  return { ok: true, id: payment.id };
}
