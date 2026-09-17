"use server";

import { revalidatePath } from "next/cache";
import { patientSchema } from "@/lib/validations/patient";
import { taskSchema } from "@/lib/validations/task";
import { prisma } from "@/lib/prisma";

// Estado devuelto por las actions de pacientes al cliente (serializable).
export interface PatientFormState {
  success?: boolean;
  patientId?: string;
  message?: string;
  errors?: Record<string, string[] | undefined>;
}

// Convierte cadenas vacías en null para los campos opcionales (z.coerce.date()
// falla con "", así que la fecha vacía debe llegar como null).
function emptyToNull(value: FormDataEntryValue | null): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed === "" ? null : value;
}

// Revalida el FormData con el esquema Zod (única fuente de validación).
function parsePatientForm(formData: FormData) {
  return patientSchema.safeParse({
    nombre: formData.get("nombre"),
    apellidos: formData.get("apellidos"),
    fechaNacimiento: emptyToNull(formData.get("fechaNacimiento")),
    sexo: emptyToNull(formData.get("sexo")),
    telefono: formData.get("telefono"),
    email: emptyToNull(formData.get("email")),
    direccion: emptyToNull(formData.get("direccion")),
    contactoEmergencia: emptyToNull(formData.get("contactoEmergencia")),
    antecedentes: emptyToNull(formData.get("antecedentes")),
    notasInternas: emptyToNull(formData.get("notasInternas")),
    isActive: formData.get("isActive") === "on" || formData.get("isActive") === "true",
  });
}

// Alta de paciente: valida, crea el registro y devuelve el id para que el
// cliente muestre el toast y navegue a la ficha creada.
export async function createPatient(
  _prev: PatientFormState,
  formData: FormData
): Promise<PatientFormState> {
  const parsed = parsePatientForm(formData);

  if (!parsed.success) {
    return {
      message: "Revisa los datos marcados e inténtalo de nuevo.",
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  const patient = await prisma.patient.create({
    data: { ...parsed.data, isActive: true },
  });

  revalidatePath("/pacientes");
  return { success: true, patientId: patient.id, message: "Paciente registrado" };
}

// Edición de paciente: el id viaja en el FormData (campo oculto del formulario).
export async function updatePatient(
  _prev: PatientFormState,
  formData: FormData
): Promise<PatientFormState> {
  const id = formData.get("id");
  if (typeof id !== "string" || id === "") {
    return { message: "No se encontró el paciente. Inténtalo de nuevo." };
  }

  const parsed = parsePatientForm(formData);

  if (!parsed.success) {
    return {
      message: "Revisa los datos marcados e inténtalo de nuevo.",
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  const patient = await prisma.patient.update({
    where: { id },
    data: parsed.data,
  });

  revalidatePath("/pacientes");
  revalidatePath(`/pacientes/${patient.id}`);
  return { success: true, patientId: patient.id, message: "Cambios guardados" };
}

// Baja lógica / reactivación: nunca se borra el paciente, solo se alterna isActive.
export async function togglePatientActive(
  patientId: string,
  isActive: boolean
): Promise<void> {
  await prisma.patient.update({
    where: { id: patientId },
    data: { isActive },
  });

  revalidatePath("/pacientes");
  revalidatePath(`/pacientes/${patientId}`);
}

// Crea una tarea entre sesiones directamente desde la ficha (sin sesión
// asociada). Visible para el paciente en su portal.
export async function createPatientTask(
  patientId: string,
  input: { title: string; dueDate?: string }
): Promise<{ ok: boolean; message?: string }> {
  const parsed = taskSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  }

  const patient = await prisma.patient.findUnique({
    where: { id: patientId },
    select: { id: true },
  });
  if (!patient) return { ok: false, message: "No se encontró el paciente." };

  await prisma.task.create({
    data: {
      patientId,
      title: parsed.data.title.trim(),
      dueDate: parsed.data.dueDate ? new Date(`${parsed.data.dueDate}T12:00:00`) : null,
    },
  });

  revalidatePath(`/pacientes/${patientId}`);
  return { ok: true, message: "Tarea agregada" };
}

// Marca una tarea como hecha (done = true) o la reabre (done = false).
export async function toggleTaskDone(
  taskId: string,
  done: boolean
): Promise<{ ok: boolean; message?: string }> {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    select: { patientId: true },
  });
  if (!task) return { ok: false, message: "No se encontró la tarea." };

  await prisma.task.update({
    where: { id: taskId },
    data: { completedAt: done ? new Date() : null },
  });

  revalidatePath(`/pacientes/${task.patientId}`);
  return { ok: true, message: done ? "Tarea marcada como hecha" : "Tarea reabierta" };
}
