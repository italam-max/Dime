"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import {
  createPortalSession,
  destroyPortalSession,
  getPortalPatient,
  hasPortalConsent,
} from "@/lib/auth";
import { CONSENT_PORTAL_VERSION } from "@/lib/consent-text";
import { prisma } from "@/lib/prisma";
import { hashPortalToken } from "@/lib/portal-token";

export interface PortalActionState {
  ok?: boolean;
  message?: string;
}

// Invitación válida tal como la ve el paciente: token sin usar, sin expirar,
// sin revocar y paciente activo. Es la única vía de entrada al portal.
export interface ValidInvitation {
  patientId: string;
  patientName: string;
  expiresAt: Date;
}

export async function findValidInvitation(token: string): Promise<ValidInvitation | null> {
  if (!token) return null;

  const access = await prisma.portalAccess.findUnique({
    where: { tokenHash: hashPortalToken(token) },
    select: {
      expiresAt: true,
      acceptedAt: true,
      revokedAt: true,
      patient: { select: { id: true, nombre: true, apellidos: true, isActive: true } },
    },
  });

  if (!access) return null;
  if (access.acceptedAt !== null) return null; // un solo uso
  if (access.revokedAt !== null) return null;
  if (access.expiresAt.getTime() <= Date.now()) return null;
  if (!access.patient.isActive) return null;

  return {
    patientId: access.patient.id,
    patientName: `${access.patient.nombre} ${access.patient.apellidos}`,
    expiresAt: access.expiresAt,
  };
}

// Acepta la invitación: valida el token de nuevo, exige el checkbox de
// consentimiento, persiste el consentimiento y marca la invitación como usada.
export async function acceptPortalInvitation(
  _prev: PortalActionState,
  formData: FormData
): Promise<PortalActionState> {
  const token = String(formData.get("token") ?? "");
  const invitation = await findValidInvitation(token);
  if (!invitation) {
    return {
      message: "Este enlace ya no es válido o expiró. Pide a tu consultorio que te envíe uno nuevo.",
    };
  }

  if (formData.get("consent") !== "on") {
    return { message: "Para continuar necesitas aceptar el aviso de privacidad." };
  }

  const headerList = await headers();
  const ip =
    headerList.get("x-forwarded-for")?.split(",")[0]?.trim() || null;

  await prisma.$transaction([
    prisma.consent.create({
      data: {
        patientId: invitation.patientId,
        type: "PORTAL",
        version: CONSENT_PORTAL_VERSION,
        ip,
      },
    }),
    prisma.portalAccess.update({
      where: { patientId: invitation.patientId },
      data: { acceptedAt: new Date() },
    }),
  ]);

  await createPortalSession(invitation.patientId);
  redirect("/portal");
}

// Marca una tarea como hecha (completedAt = ahora).
export async function completePortalTask(taskId: string): Promise<PortalActionState> {
  const patient = await getPortalPatient();
  if (!patient) return { message: "Tu sesión ha caducado. Entra de nuevo con tu enlace." };
  if (!(await hasPortalConsent(patient.id))) {
    return { message: "Necesitamos una actualización de tu consentimiento. Contacta a tu consultorio." };
  }

  const task = await prisma.task.findUnique({ where: { id: taskId }, select: { patientId: true } });
  if (!task || task.patientId !== patient.id) return { message: "No encontramos esa tarea." };

  await prisma.task.update({ where: { id: taskId }, data: { completedAt: new Date() } });
  revalidatePath("/portal");
  return { ok: true, message: "Tarea marcada como hecha" };
}

// Reabre una tarea marcada por error (completedAt = null).
export async function reopenPortalTask(taskId: string): Promise<PortalActionState> {
  const patient = await getPortalPatient();
  if (!patient) return { message: "Tu sesión ha caducado. Entra de nuevo con tu enlace." };
  if (!(await hasPortalConsent(patient.id))) {
    return { message: "Necesitamos una actualización de tu consentimiento. Contacta a tu consultorio." };
  }

  const task = await prisma.task.findUnique({ where: { id: taskId }, select: { patientId: true } });
  if (!task || task.patientId !== patient.id) return { message: "No encontramos esa tarea." };

  await prisma.task.update({ where: { id: taskId }, data: { completedAt: null } });
  revalidatePath("/portal");
  return { ok: true, message: "La tarea volvió a pendientes" };
}

// Cierra la sesión del portal y vuelve a la pantalla de entrada.
export async function logoutPortal(): Promise<void> {
  await destroyPortalSession();
  redirect("/portal/ingresar");
}
