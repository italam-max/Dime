import { z } from "zod";

// Roles del STAFF. Son los que gestiona la herramienta Usuarios. Se guardan
// como String (portabilidad), validados aquí.
export const USER_ROLES = ["SUPERADMIN", "ADMIN", "THERAPIST"] as const;
export type UserRole = (typeof USER_ROLES)[number];

// Rol de las cuentas de paciente. Vive fuera de USER_ROLES a propósito: no se
// asigna desde la herramienta de staff ni aparece en su listado. Una cuenta
// PATIENT accede solo al portal (cookie portal_session), nunca al área de staff.
export const PATIENT_ROLE = "PATIENT" as const;

// Longitud mínima de contraseña, compartida por staff y pacientes.
export const PASSWORD_MIN = 8;

export const ROLE_LABELS: Record<UserRole, string> = {
  SUPERADMIN: "Super admin",
  ADMIN: "Administrador",
  THERAPIST: "Terapeuta",
};

// Descripción corta de cada rol para la UI.
export const ROLE_DESCRIPTIONS: Record<UserRole, string> = {
  SUPERADMIN: "Control total, incluida la gestión de usuarios.",
  ADMIN: "Gestión operativa del consultorio.",
  THERAPIST: "Acceso clínico: pacientes, agenda, pagos.",
};

export const createUserSchema = z.object({
  name: z.string().trim().min(1, "El nombre es obligatorio").max(120, "Máximo 120 caracteres"),
  email: z.string().trim().toLowerCase().email("Correo electrónico inválido"),
  role: z.enum(USER_ROLES),
  password: z
    .string()
    .min(8, "La contraseña debe tener al menos 8 caracteres")
    .max(200, "Máximo 200 caracteres"),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;

export function isUserRole(value: string): value is UserRole {
  return (USER_ROLES as readonly string[]).includes(value);
}

// Contraseña que define el propio paciente al activar su cuenta desde el portal.
export const portalPasswordSchema = z
  .string()
  .min(PASSWORD_MIN, `La contraseña debe tener al menos ${PASSWORD_MIN} caracteres`)
  .max(200, "Máximo 200 caracteres");
