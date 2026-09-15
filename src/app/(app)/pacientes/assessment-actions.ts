"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { assignAssessmentSchema } from "@/lib/validations/assessment";

// Estado devuelto por las actions de evaluaciones al cliente (serializable).
export interface AssessmentActionState {
  ok?: boolean;
  message?: string;
}

// Asigna un instrumento a un paciente (frecuencia + próxima fecha).
// Solo el área del terapeuta: exige sesión terapeuta y valida con zod.
export async function assignAssessment(
  patientId: string,
  instrumentId: string,
  frequency: string,
  nextDueAt: string
): Promise<AssessmentActionState> {
  const user = await getCurrentUser();
  if (!user) return { message: "Tu sesión ha caducado. Vuelve a entrar." };

  const patient = await prisma.patient.findUnique({
    where: { id: patientId },
    select: { id: true },
  });
  if (!patient) return { message: "No se encontró el paciente." };

  const parsed = assignAssessmentSchema.safeParse({ instrumentId, frequency, nextDueAt });
  if (!parsed.success) {
    return { message: "Revisa los datos de la evaluación e inténtalo de nuevo." };
  }

  const instrument = await prisma.assessmentInstrument.findUnique({
    where: { id: parsed.data.instrumentId },
    select: { id: true, isActive: true },
  });
  if (!instrument || !instrument.isActive) {
    return { message: "El instrumento seleccionado ya no está disponible." };
  }

  await prisma.assessmentAssignment.create({
    data: {
      patientId: patient.id,
      instrumentId: instrument.id,
      frequency: parsed.data.frequency,
      nextDueAt: parsed.data.nextDueAt,
    },
  });

  revalidatePath(`/pacientes/${patientId}`);
  return { ok: true, message: "Evaluación asignada" };
}

// Desactiva una asignación: el paciente deja de verla en su portal y el
// widget del terapeuta la ignora. Las respuestas ya registradas se conservan.
export async function deactivateAssessment(
  assignmentId: string
): Promise<AssessmentActionState> {
  const user = await getCurrentUser();
  if (!user) return { message: "Tu sesión ha caducado. Vuelve a entrar." };

  const assignment = await prisma.assessmentAssignment.findUnique({
    where: { id: assignmentId },
    select: { id: true, patientId: true },
  });
  if (!assignment) return { message: "No se encontró la evaluación." };

  await prisma.assessmentAssignment.update({
    where: { id: assignment.id },
    data: { active: false },
  });

  revalidatePath(`/pacientes/${assignment.patientId}`);
  return { ok: true, message: "Evaluación desactivada" };
}
