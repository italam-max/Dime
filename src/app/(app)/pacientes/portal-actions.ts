"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generatePortalToken } from "@/lib/portal-token";
import { PATIENT_ROLE } from "@/lib/validations/user";

// Estado devuelto por las actions del widget del portal (serializable).
export interface PortalActionState {
  success?: boolean;
  link?: string;
  message?: string;
}

// Invita a un paciente al portal (o reemplaza una invitación anterior):
// genera un token nuevo de 32 bytes, guarda su sha256 con expiración de 48 h
// y devuelve el enlace completo para que el terapeuta lo comparta por su canal.
export async function inviteToPortal(
  patientId: string
): Promise<PortalActionState> {
  const user = await getCurrentUser();
  if (!user) return { message: "Tu sesión ha caducado. Vuelve a entrar." };

  const patient = await prisma.patient.findUnique({
    where: { id: patientId },
    select: { id: true, email: true },
  });
  if (!patient) return { message: "No se encontró el paciente." };

  // La cuenta del paciente se identifica con su correo: sin correo no puede
  // activarse. Se pide agregarlo a la ficha antes de invitar.
  if (!patient.email?.trim()) {
    return { message: "Agrega un correo a la ficha del paciente antes de invitarlo al portal." };
  }

  const { token, tokenHash } = generatePortalToken();
  const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000);

  // patientId es único: re-escribir la fila invalida cualquier enlace previo.
  await prisma.portalAccess.upsert({
    where: { patientId: patient.id },
    create: {
      patientId: patient.id,
      tokenHash,
      invitedAt: new Date(),
      expiresAt,
    },
    update: {
      tokenHash,
      invitedAt: new Date(),
      expiresAt,
      acceptedAt: null,
      revokedAt: null,
    },
  });

  revalidatePath(`/pacientes/${patientId}`);
  return {
    success: true,
    link: `/portal/ingresar?token=${token}`,
    message: "Enlace de invitación generado",
  };
}

// Revoca el acceso al portal: marca revokedAt e invalida las sesiones del paciente.
export async function revokePortalAccess(
  patientId: string
): Promise<PortalActionState> {
  const user = await getCurrentUser();
  if (!user) return { message: "Tu sesión ha caducado. Vuelve a entrar." };

  // Revocar corta el acceso por dos vías: marca la invitación y deshabilita la
  // cuenta de paciente (getPortalPatient exige la cuenta activa). Reinvitar y
  // reactivar la cuenta la vuelve a habilitar.
  await prisma.$transaction([
    prisma.portalAccess.updateMany({
      where: { patientId, revokedAt: null },
      data: { revokedAt: new Date() },
    }),
    prisma.user.updateMany({
      where: { patientId, role: PATIENT_ROLE },
      data: { isActive: false },
    }),
  ]);

  revalidatePath(`/pacientes/${patientId}`);
  return { success: true, message: "Acceso al portal revocado" };
}
