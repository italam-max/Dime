import { NextResponse } from "next/server";
import { sessionCookieName } from "@/lib/session";

// Limpia la cookie de sesión del terapeuta y vuelve al login. Se usa cuando la
// sesión es inválida (usuario inexistente o deshabilitado): evita el bucle de
// redirecciones entre el área protegida y /login.
export async function GET(request: Request) {
  const res = NextResponse.redirect(new URL("/login", request.url));
  res.cookies.delete(sessionCookieName);
  return res;
}
