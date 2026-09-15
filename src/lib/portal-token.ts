import { createHash, randomBytes } from "node:crypto";

// Token de invitación al portal: 32 bytes aleatorios URL-safe. Solo su sha256
// se guarda en base de datos; el token en claro viaja una sola vez en el enlace.
export function generatePortalToken(): { token: string; tokenHash: string } {
  const token = randomBytes(32).toString("base64url");
  return { token, tokenHash: hashPortalToken(token) };
}

export function hashPortalToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}
