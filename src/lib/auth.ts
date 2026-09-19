import "server-only";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { CONSENT_PORTAL_VERSION } from "@/lib/consent-text";
import { PATIENT_ROLE } from "@/lib/validations/user";
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

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { id: true, email: true, name: true, role: true, isActive: true, createdAt: true },
  });
  // Un usuario deshabilitado deja de tener sesión válida.
  if (!user || !user.isActive) return null;
  // Las cuentas de paciente jamás acceden al área de staff, aunque porten una
  // cookie de terapeuta: su lugar es el portal (getPortalPatient).
  if (user.role === "PATIENT") return null;
  return user;
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

  // La cookie del portal lleva el patientId. El acceso es válido mientras la
  // cuenta de paciente (role PATIENT) esté activa y su ficha activa. Deshabilitar
  // la cuenta desde el staff corta el acceso en el siguiente request.
  const account = await prisma.user.findFirst({
    where: { patientId: session.userId, role: PATIENT_ROLE, isActive: true },
    select: {
      patient: { select: { id: true, nombre: true, apellidos: true, isActive: true } },
    },
  });

  if (!account?.patient) return null;
  if (!account.patient.isActive) return null;

  return account.patient;
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
