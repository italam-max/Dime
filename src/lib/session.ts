import { SignJWT, jwtVerify } from "jose";

const SESSION_COOKIE = "session";
const SESSION_DAYS = 7;
const PORTAL_COOKIE = "portal_session";
const PORTAL_SESSION_DAYS = 30;

// Identidades soportadas por la sesión:
// - "therapist": sub = User.id (cookie `session`)
// - "portal":    sub = Patient.id (cookie `portal_session`)
export type SessionKind = "therapist" | "portal";

export interface SessionPayload {
  userId: string;
  kind: SessionKind;
  expiresAt: Date;
}

function getEncodedSecret(): Uint8Array {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error("SESSION_SECRET no está definida en el entorno");
  return new TextEncoder().encode(secret);
}

// Firma un JWT HS256 con el id del sujeto, el tipo de identidad y su expiración.
export async function encrypt(
  payload: Omit<SessionPayload, "kind"> & { kind?: SessionKind }
): Promise<string> {
  const kind = payload.kind ?? "therapist";
  return new SignJWT({ userId: payload.userId, kind })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(payload.expiresAt)
    .sign(getEncodedSecret());
}

// Verifica el JWT; devuelve null si es inválido o expiró. Los tokens firmados
// antes de la existencia del claim `kind` se tratan como "therapist".
export async function decrypt(token: string | undefined): Promise<SessionPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getEncodedSecret(), {
      algorithms: ["HS256"],
    });
    return {
      userId: String(payload.userId),
      kind: payload.kind === "portal" ? "portal" : "therapist",
      expiresAt: new Date(Number(payload.exp) * 1000),
    };
  } catch {
    return null;
  }
}

export const sessionCookieName = SESSION_COOKIE;
export const sessionMaxAgeSeconds = SESSION_DAYS * 24 * 60 * 60;
export const portalSessionCookieName = PORTAL_COOKIE;
export const portalSessionMaxAgeSeconds = PORTAL_SESSION_DAYS * 24 * 60 * 60;
