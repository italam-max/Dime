"use server";

import { revalidatePath } from "next/cache";
import { addMinutes } from "date-fns";
import { appointmentSchema } from "@/lib/validations/appointment";
import { tasksJsonSchema } from "@/lib/validations/task";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export interface AppointmentActionState {
  ok: boolean;
  message?: string;
  fieldErrors?: Record<string, string[] | undefined>;
}

const OVERLAP_MESSAGE = "Ese horario se cruza con otra cita. Elige otra hora.";

// Construye una fecha local a partir de "yyyy-MM-dd" + "HH:mm".
function buildStartAt(date: string, time: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(time)) return null;
  const d = new Date(`${date}T${time}:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}

// Dos citas se solapan si comparten cualquier punto de [startAt, endAt).
async function hasOverlap(startAt: Date, endAt: Date, excludeId?: string): Promise<boolean> {
  const conflict = await prisma.appointment.findFirst({
    where: {
      status: { not: "CANCELADA" },
      startAt: { lt: endAt },
      endAt: { gt: startAt },
      ...(excludeId ? { id: { not: excludeId } } : {}),
    },
    select: { id: true },
  });
  return Boolean(conflict);
}

// Crea una cita nueva (siempre como PENDIENTE) validando solapamiento.
export async function createAppointment(
  _prev: AppointmentActionState,
  formData: FormData
): Promise<AppointmentActionState> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, message: "Tu sesión expiró. Vuelve a entrar." };

  const startAt = buildStartAt(
    String(formData.get("date") ?? ""),
    String(formData.get("time") ?? "")
  );
  if (!startAt) {
    return {
      ok: false,
      message: "Elige una fecha y hora válidas.",
      fieldErrors: { date: ["Elige una fecha válida"] },
    };
  }
  const endAt = addMinutes(startAt, Number(formData.get("duration") ?? 60));

  const feeRaw = String(formData.get("fee") ?? "").trim();
  const parsed = appointmentSchema.safeParse({
    patientId: formData.get("patientId"),
    startAt,
    endAt,
    status: "PENDIENTE",
    type: formData.get("type"),
    fee: feeRaw === "" ? null : Number(feeRaw),
    sessionNotes: null,
    sessionTasks: null,
  });

  if (!parsed.success) {
    return {
      ok: false,
      message: "Revisa los datos de la cita.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  if (await hasOverlap(startAt, endAt)) {
    return { ok: false, message: OVERLAP_MESSAGE, fieldErrors: { time: [OVERLAP_MESSAGE] } };
  }

  await prisma.appointment.create({
    data: {
      patientId: parsed.data.patientId,
      startAt: parsed.data.startAt,
      endAt: parsed.data.endAt,
      status: "PENDIENTE",
      type: parsed.data.type,
      fee: parsed.data.fee ?? null,
    },
  });

  revalidatePath("/agenda");
  return { ok: true, message: "La cita quedó agendada." };
}

// Cambia el estado de una cita (transición simple, sin datos extra).
async function setStatus(
  formData: FormData,
  status: string,
  message: string
): Promise<AppointmentActionState> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, message: "Tu sesión expiró. Vuelve a entrar." };

  const id = String(formData.get("id") ?? "");
  const existing = await prisma.appointment.findUnique({ where: { id }, select: { id: true } });
  if (!existing) return { ok: false, message: "No encontramos esa cita." };

  await prisma.appointment.update({ where: { id }, data: { status } });
  revalidatePath("/agenda");
  return { ok: true, message };
}

export async function confirmAppointment(formData: FormData): Promise<AppointmentActionState> {
  return setStatus(formData, "CONFIRMADA", "La cita quedó confirmada.");
}

export async function cancelAppointment(formData: FormData): Promise<AppointmentActionState> {
  return setStatus(formData, "CANCELADA", "La cita fue cancelada.");
}

export async function noShowAppointment(formData: FormData): Promise<AppointmentActionState> {
  return setStatus(formData, "NO_ASISTIO", "Se registró la falta a la cita.");
}

// Completa la sesión guardando el resumen clínico y creando las tareas/acuerdos
// como Task reales (visibles en el portal del paciente). El campo legacy
// Appointment.sessionTasks se conserva solo para el contenido histórico.
export async function completeAppointment(
  _prev: AppointmentActionState,
  formData: FormData
): Promise<AppointmentActionState> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, message: "Tu sesión expiró. Vuelve a entrar." };

  const id = String(formData.get("id") ?? "");
  const existing = await prisma.appointment.findUnique({
    where: { id },
    select: { id: true, patientId: true },
  });
  if (!existing) return { ok: false, message: "No encontramos esa cita." };

  const sessionNotes = String(formData.get("sessionNotes") ?? "").trim() || null;

  // Tareas dinámicas enviadas como JSON: [{ title, dueDate }]; se ignoran
  // entradas vacías y JSON inválido (las tareas son opcionales).
  let tasks: { title: string; dueDate?: string }[] = [];
  try {
    const parsed = tasksJsonSchema.safeParse(JSON.parse(String(formData.get("tasksJson") ?? "[]")));
    if (parsed.success) {
      tasks = parsed.data
        .filter((task) => task.title.trim() !== "")
        .map((task) => ({ title: task.title.trim(), dueDate: task.dueDate || undefined }));
    }
  } catch {
    tasks = [];
  }

  await prisma.$transaction([
    prisma.appointment.update({
      where: { id },
      data: { status: "COMPLETADA", sessionNotes },
    }),
    ...(tasks.length > 0
      ? [
          prisma.task.createMany({
            data: tasks.map((task) => ({
              patientId: existing.patientId,
              appointmentId: existing.id,
              title: task.title,
              dueDate: task.dueDate ? new Date(`${task.dueDate}T12:00:00`) : null,
            })),
          }),
        ]
      : []),
  ]);

  revalidatePath("/agenda");
  revalidatePath(`/pacientes/${existing.patientId}`);
  return { ok: true, message: "Sesión completada. Las notas y tareas quedaron guardadas." };
}

// Reprograma manteniendo la duración original y el estado; valida solapamiento.
export async function rescheduleAppointment(
  _prev: AppointmentActionState,
  formData: FormData
): Promise<AppointmentActionState> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, message: "Tu sesión expiró. Vuelve a entrar." };

  const id = String(formData.get("id") ?? "");
  const existing = await prisma.appointment.findUnique({ where: { id } });
  if (!existing) return { ok: false, message: "No encontramos esa cita." };

  const startAt = buildStartAt(
    String(formData.get("date") ?? ""),
    String(formData.get("time") ?? "")
  );
  if (!startAt) {
    return {
      ok: false,
      message: "Elige una fecha y hora válidas.",
      fieldErrors: { date: ["Elige una fecha válida"] },
    };
  }
  const durationMinutes = Math.round(
    (existing.endAt.getTime() - existing.startAt.getTime()) / 60000
  );
  const endAt = addMinutes(startAt, durationMinutes);

  if (await hasOverlap(startAt, endAt, id)) {
    return { ok: false, message: OVERLAP_MESSAGE, fieldErrors: { time: [OVERLAP_MESSAGE] } };
  }

  await prisma.appointment.update({
    where: { id },
    data: { startAt, endAt },
  });

  revalidatePath("/agenda");
  return { ok: true, message: "La cita se reprogramó." };
}
