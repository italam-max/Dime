import { z } from "zod";

// Tareas entre sesiones. Las fechas llegan como "yyyy-MM-dd" desde un input date.
export const taskSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "La tarea no puede estar vacía")
    .max(200, "Máximo 200 caracteres por tarea"),
  dueDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha de vencimiento inválida")
    .optional()
    .or(z.literal("")),
});

// Lista dinámica enviada desde el dialog "Completar sesión" como JSON.
export const tasksJsonSchema = z.array(taskSchema).max(20, "Máximo 20 tareas por sesión");

export type TaskInput = z.infer<typeof taskSchema>;
