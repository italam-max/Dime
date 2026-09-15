import "server-only";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { CONSENT_PORTAL_VERSION } from "@/lib/consent-text";
import {
  encrypt,
  decrypt,
  sessionCookieName,
  sessionMaxAgeSeconds,
  portalSessionCookieName,
  portalSessionMaxAgeSeconds,
} from "@/lib/session";

// Crea la sesión y la guarda en una cookie httpOnly.
export async function createSession(userId: string): Promise<void> {
  const expiresAt = new Date(Date.now() + sessionMaxAgeSeconds * 1000);
  const token = await encrypt({ userId, expiresAt });
  const cookieStore = await cookies();

  cookieStore.set(sessionCookieName, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    expires: expiresAt,
    sameSite: "lax",
    path: "/",
  });
}

// Lee y verifica la sesión desde la cookie.
export async function getSession() {
  const token = (await cookies()).get(sessionCookieName)?.value;
  return decrypt(token);
}

// Elimina la cookie de sesión (cerrar sesión).
export async function destroySession(): Promise<void> {
  (await cookies()).delete(sessionCookieName);
}

// Usuario actual a partir de la sesión; null si no hay sesión válida.
export async function getCurrentUser() {
  const session = await getSession();
  if (!session || session.kind !== "therapist") return null;

  return prisma.user.findUnique({
    where: { id: session.userId },
    select: { id: true, email: true, name: true, createdAt: true },
  });
}

// --- Sesión del portal del paciente (kind: "portal") -----------------------

// Crea la sesión del portal: cookie `portal_session` con sub = patientId, 30 días.
export async function createPortalSession(patientId: string): Promise<void> {
  const expiresAt = new Date(Date.now() + portalSessionMaxAgeSeconds * 1000);
  const token = await encrypt({ userId: patientId, kind: "portal", expiresAt });
  const cookieStore = await cookies();

  cookieStore.set(portalSessionCookieName, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    expires: expiresAt,
    sameSite: "lax",
    path: "/",
  });
}

// Paciente actual a partir de la sesión del portal; null si no hay sesión válida.
//
// Semántica de expiración: la fecha `expiresAt` de PortalAccess aplica SOLO a
// la invitación de 48 h (antes de `acceptedAt`). Una vez aceptada, el acceso
// es válido mientras no se revoque (`revokedAt` null) y el paciente esté
// activo (`isActive`). La sesión JWT dura 30 días y se renueva al re-entrar
// con un enlace válido o al revalidar (cookie renovable en cada visita futura).
export async function getPortalPatient() {
  const token = (await cookies()).get(portalSessionCookieName)?.value;
  const session = await decrypt(token);
  if (!session || session.kind !== "portal") return null;

  const access = await prisma.portalAccess.findUnique({
    where: { patientId: session.userId },
    select: {
      revokedAt: true,
      acceptedAt: true,
      patient: { select: { id: true, nombre: true, apellidos: true, isActive: true } },
    },
  });

  if (!access) return null;
  if (access.revokedAt !== null) return null;
  if (access.acceptedAt === null) return null;
  if (!access.patient.isActive) return null;

  return access.patient;
}

// Elimina la cookie de sesión del portal.
export async function destroyPortalSession(): Promise<void> {
  (await cookies()).delete(portalSessionCookieName);
}

// Consentimiento PORTAL vigente (versión actual del texto). Es la barrera de
// acceso a TODO el portal: el layout no renderiza el contenido sin él y las
// server actions lo vuelven a comprobar antes de mutar nada.
export async function hasPortalConsent(patientId: string): Promise<boolean> {
  const consent = await prisma.consent.findFirst({
    where: { patientId, type: "PORTAL", version: CONSENT_PORTAL_VERSION },
    select: { id: true },
  });
  return consent !== null;
}
