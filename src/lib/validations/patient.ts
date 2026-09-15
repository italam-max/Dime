import { z } from "zod";

// Esquema de alta/edición de paciente (core del sistema).
export const patientSchema = z.object({
  nombre: z.string().min(1, "El nombre es obligatorio"),
  apellidos: z.string().min(1, "Los apellidos son obligatorios"),
  fechaNacimiento: z.coerce.date().optional().nullable(),
  sexo: z.string().optional().nullable(),
  telefono: z.string().min(1, "El teléfono es obligatorio"),
  email: z.email("Ingresa un correo electrónico válido").optional().or(z.literal("")).nullable(),
  direccion: z.string().optional().nullable(),
  contactoEmergencia: z.string().optional().nullable(),
  antecedentes: z.string().optional().nullable(),
  notasInternas: z.string().optional().nullable(),
  isActive: z.boolean().default(true),
});

export type PatientInput = z.infer<typeof patientSchema>;
