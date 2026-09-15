"use server";

import { revalidatePath } from "next/cache";
import { addDays, startOfDay } from "date-fns";
import { getPortalPatient, hasPortalConsent } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { assessmentAnswersSchema } from "@/lib/validations/assessment";
import {
  ASSESSMENT_FREQUENCIES,
  FREQUENCY_DAYS,
  type AssessmentItem,
} from "@/lib/assessments/definitions";

// Estado devuelto a la pantalla de respuesta del paciente (serializable).
// Nunca incluye el puntaje: el paciente solo recibe confirmación.
export interface PortalEvaluationState {
  ok?: boolean;
  message?: string;
}

// Guarda la respuesta de una evaluación y regenera la asignación según su
// frecuencia. Seguridad: valida sesión portal, la asignación debe pertenecer
// al paciente de la sesión y estar activa; las respuestas se validan contra
// las opciones reales de cada ítem (los ítems son datos, no código).
export async function submitAssessmentResponse(
  assignmentId: string,
  answers: number[]
): Promise<PortalEvaluationState> {
  const patient = await getPortalPatient();
  if (!patient) return { message: "Tu sesión ha caducado. Entra de nuevo con tu enlace." };
  if (!(await hasPortalConsent(patient.id))) {
    return { message: "Necesitamos una actualización de tu consentimiento. Contacta a tu consultorio." };
  }

  const assignment = await prisma.assessmentAssignment.findFirst({
    where: { id: assignmentId, patientId: patient.id },
    select: {
      id: true,
      active: true,
      frequency: true,
      instrument: { select: { items: true } },
    },
  });
  if (!assignment) return { message: "No encontramos esa evaluación." };
  if (!assignment.active) return { message: "Esta evaluación ya no está disponible." };

  let items: AssessmentItem[];
  try {
    const parsed = JSON.parse(assignment.instrument.items) as unknown;
    if (!Array.isArray(parsed) || parsed.length === 0) throw new Error("items inválidos");
    items = parsed as AssessmentItem[];
  } catch {
    return { message: "No pudimos cargar esta evaluación. Inténtalo más tarde." };
  }

  const parsedAnswers = assessmentAnswersSchema.safeParse(answers);
  if (!parsedAnswers.success || parsedAnswers.data.length !== items.length) {
    return { message: "Faltan respuestas. Revisa el cuestionario e inténtalo de nuevo." };
  }

  // Cada valor debe existir entre las opciones del ítem correspondiente.
  const valoresValidos = parsedAnswers.data.every((value, index) =>
    items[index].options.some((option) => option.value === value)
  );
  if (!valoresValidos) {
    return { message: "Hay respuestas no válidas. Inténtalo de nuevo." };
  }

  const score = parsedAnswers.data.reduce((suma, value) => suma + value, 0);

  // Regeneración: ÚNICA se cierra; SEMANAL/QUINCENAL se re-programan a
  // partir de hoy para no acumular atrasos si el paciente responde tarde.
  const frecuencia = ASSESSMENT_FREQUENCIES.includes(
    assignment.frequency as (typeof ASSESSMENT_FREQUENCIES)[number]
  )
    ? (assignment.frequency as (typeof ASSESSMENT_FREQUENCIES)[number])
    : "UNICA";
  const dias = FREQUENCY_DAYS[frecuencia];

  await prisma.$transaction([
    prisma.assessmentResponse.create({
      data: {
        assignmentId: assignment.id,
        answers: JSON.stringify(parsedAnswers.data),
        score,
      },
    }),
    prisma.assessmentAssignment.update({
      where: { id: assignment.id },
      data: {
        active: dias !== null,
        ...(dias !== null
          ? { nextDueAt: addDays(startOfDay(new Date()), dias) }
          : {}),
      },
    }),
  ]);

  revalidatePath("/portal");
  return { ok: true, message: "Respuesta registrada" };
}
