import { NextRequest, NextResponse } from "next/server";
import {
  decrypt,
  sessionCookieName,
  portalSessionCookieName,
} from "@/lib/session";

// Verificación optimista: solo se leen las cookies (sin tocar la base de datos).
// El claim `kind` del JWT separa las dos identidades.
interface RequestSessions {
  therapist: boolean;
  portal: boolean;
}

async function readSessions(req: NextRequest): Promise<RequestSessions> {
  const [therapist, portal] = await Promise.all([
    decrypt(req.cookies.get(sessionCookieName)?.value),
    decrypt(req.cookies.get(portalSessionCookieName)?.value),
  ]);
  return {
    therapist: therapist?.kind === "therapist",
    portal: portal?.kind === "portal",
  };
}

// Dominios de la web pública (raíz). Configurables por entorno; por defecto el
// dominio de marketing y su www. El área de la plataforma vive en app.*.
const MARKETING_HOSTS = (process.env.MARKETING_HOSTS ?? "psicodime.net,www.psicodime.net")
  .split(",")
  .map((h) => h.trim().toLowerCase())
  .filter(Boolean);

export default async function proxy(req: NextRequest) {
  const path = req.nextUrl.pathname;
  const host = (req.headers.get("host") ?? "").split(":")[0].toLowerCase();

  // Web pública en el dominio raíz: se reescribe todo a /site y no exige sesión.
  // La plataforma (app.*) conserva su comportamiento.
  if (MARKETING_HOSTS.includes(host)) {
    if (!path.startsWith("/site")) {
      const url = req.nextUrl.clone();
      url.pathname = path === "/" ? "/site" : `/site${path}`;
      return NextResponse.rewrite(url);
    }
    return NextResponse.next();
  }

  // /site es la web pública: accesible sin sesión en cualquier host (útil para
  // previsualizarla en local o desde app.* directamente).
  if (path === "/site" || path.startsWith("/site/")) {
    return NextResponse.next();
  }

  const sessions = await readSessions(req);

  // Rutas públicas del portal: el alta con enlace (/portal/ingresar) solo necesita
  // el token, y el inicio de sesión (/portal/login) es la entrada del paciente ya
  // dado de alta. Se dejan pasar siempre: si la sesión portal es válida, la propia
  // página redirige al home. Redirigir aquí a ciegas crearía un ciclo infinito
  // cuando la cookie existe pero el acceso ya no es válido (cuenta deshabilitada o
  // paciente inactivo), porque el área /portal volvería a mandar aquí.
  if (path.startsWith("/portal/ingresar") || path.startsWith("/portal/login")) {
    return NextResponse.next();
  }

  // Área del portal: exige sesión portal. Un terapeuta va a su panel.
  if (path.startsWith("/portal")) {
    if (sessions.portal) return NextResponse.next();
    if (sessions.therapist) return NextResponse.redirect(new URL("/", req.nextUrl));
    return NextResponse.redirect(new URL("/portal/login", req.nextUrl));
  }

  // /login es pública; con sesión terapeuta se manda al panel.
  if (path === "/login") {
    if (sessions.therapist) return NextResponse.redirect(new URL("/", req.nextUrl));
    return NextResponse.next();
  }

  // Resto del área (app): exige sesión terapeuta. Un paciente va a su portal.
  if (!sessions.therapist) {
    if (sessions.portal) return NextResponse.redirect(new URL("/portal", req.nextUrl));
    return NextResponse.redirect(new URL("/login", req.nextUrl));
  }

  return NextResponse.next();
}

// El proxy corre en todas las rutas excepto assets estáticos e internos.
export const config = {
  matcher: ["/((?!api|_next/static|_next/image|_next/webpack-hmr|favicon.ico|.*\\.svg$).*)"],
};
