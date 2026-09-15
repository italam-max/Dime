import { z } from "zod";
import { ASSESSMENT_FREQUENCIES } from "@/lib/assessments/definitions";

// Asignación de un instrumento a un paciente (desde la ficha del terapeuta).
// La fecha llega como "yyyy-MM-dd" desde un input date y se convierte a Date.
export const assignAssessmentSchema = z.object({
  instrumentId: z.string().min(1, "Selecciona un instrumento"),
  frequency: z.enum(ASSESSMENT_FREQUENCIES),
  nextDueAt: z.coerce.date(),
});

// Respuestas del paciente: un entero por ítem, en el orden de los ítems.
// La validación de valores permitidos se hace contra las opciones del
// instrumento (son datos), aquí solo se exige forma básica.
export const assessmentAnswersSchema = z
  .array(z.number().int().min(0))
  .min(1, "La respuesta está vacía");

export type AssignAssessmentInput = z.infer<typeof assignAssessmentSchema>;
