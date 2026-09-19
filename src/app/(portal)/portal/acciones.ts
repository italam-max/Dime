"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import {
  createPortalSession,
  destroyPortalSession,
  getPortalPatient,
  hasPortalConsent,
} from "@/lib/auth";
import { CONSENT_PORTAL_VERSION } from "@/lib/consent-text";
import { prisma } from "@/lib/prisma";
import { hashPortalToken } from "@/lib/portal-token";
import { PATIENT_ROLE, portalPasswordSchema } from "@/lib/validations/user";

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

// Activa la cuenta del paciente desde el enlace de alta: valida el token de
// nuevo, exige aceptar el aviso de privacidad y definir una contraseña, crea
// (o reactiva) su cuenta role PATIENT ligada a la ficha, registra el
// consentimiento, marca el enlace como usado y abre la sesión del portal.
export async function activatePortalAccount(
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

  const parsedPassword = portalPasswordSchema.safeParse(formData.get("password"));
  if (!parsedPassword.success) {
    return { message: parsedPassword.error.issues[0]?.message ?? "Contraseña inválida." };
  }

  // La cuenta se identifica con el correo de la ficha. Sin correo no hay cuenta.
  const patient = await prisma.patient.findUnique({
    where: { id: invitation.patientId },
    select: { email: true, nombre: true, apellidos: true },
  });
  if (!patient?.email) {
    return {
      message: "Tu ficha no tiene un correo registrado. Pide a tu consultorio que lo agregue.",
    };
  }
  const email = patient.email.trim().toLowerCase();

  // El correo no puede pertenecer a otra cuenta (staff u otro paciente).
  const clash = await prisma.user.findUnique({
    where: { email },
    select: { patientId: true },
  });
  if (clash && clash.patientId !== invitation.patientId) {
    return { message: "Ese correo ya está en uso por otra cuenta. Contacta a tu consultorio." };
  }

  const passwordHash = await bcrypt.hash(parsedPassword.data, 10);
  const name = `${patient.nombre} ${patient.apellidos}`.trim();

  const headerList = await headers();
  const ip = headerList.get("x-forwarded-for")?.split(",")[0]?.trim() || null;

  await prisma.$transaction([
    prisma.user.upsert({
      where: { patientId: invitation.patientId },
      create: {
        email,
        name,
        role: PATIENT_ROLE,
        patientId: invitation.patientId,
        passwordHash,
        isActive: true,
      },
      update: { email, name, passwordHash, isActive: true },
    }),
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

// Reingreso habitual del paciente: correo + contraseña de su cuenta PATIENT.
export async function loginPortal(
  _prev: PortalActionState,
  formData: FormData
): Promise<PortalActionState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  const invalid = { message: "El correo o la contraseña no coinciden. Inténtalo de nuevo." };
  if (!email || !password) return invalid;

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, passwordHash: true, role: true, isActive: true, patientId: true },
  });
  // Solo cuentas de paciente entran por aquí; no revela si el correo existe.
  if (!user || user.role !== PATIENT_ROLE || !user.patientId) return invalid;

  const matches = await bcrypt.compare(password, user.passwordHash);
  if (!matches) return invalid;

  if (!user.isActive) {
    return { message: "Tu acceso está deshabilitado. Contacta a tu consultorio." };
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });

  await createPortalSession(user.patientId);
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

// Cierra la sesión del portal y vuelve a la pantalla de inicio de sesión.
export async function logoutPortal(): Promise<void> {
  await destroyPortalSession();
  redirect("/portal/login");
}
