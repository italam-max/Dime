import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { getPortalPatient } from "@/lib/auth";
import { portalSessionCookieName } from "@/lib/session";
import { CONSENT_PORTAL_TEXT } from "@/lib/consent-text";
import { formatDate } from "@/lib/utils";
import { findValidInvitation } from "@/app/(portal)/portal/acciones";
import { ConsentForm } from "./consent-form";

export const metadata: Metadata = {
  title: "Entrar a tu espacio · Dime",
};

// Pantalla de aceptación de invitación: valida el token del enlace y pide el
// consentimiento informado antes de abrir la sesión del portal.
export default async function PortalIngresarPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  // Con una sesión portal vigente no tiene sentido re-aceptar: directo al home.
  const patient = await getPortalPatient();
  if (patient) redirect("/portal");

  const { token } = await searchParams;
  const invitation = token ? await findValidInvitation(token) : null;

  // Cookie portal presente pero acceso no válido (revocado, paciente inactivo
  // o invitación aún sin aceptar): pantalla terminal SIN redirect. El proxy ya
  // no redirige esta ruta, así que no hay ciclo; la cookie se reemplaza cuando
  // el paciente entra con un enlace nuevo.
  if (!invitation && (await cookies()).get(portalSessionCookieName)) {
    return (
      <div className="mt-10 rounded-card bg-surface p-8 text-center shadow-soft">
        <ShieldCheck size={28} strokeWidth={1.6} className="mx-auto text-muted-foreground" aria-hidden />
        <h1 className="mt-4 font-display text-2xl font-semibold text-foreground">
          Tu acceso no está disponible
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Tu enlace de acceso ya no es válido o fue revocado. Contacta a tu
          consultorio y con gusto te enviarán uno nuevo para entrar a tu espacio.
        </p>
      </div>
    );
  }

  if (!invitation) {
    return (
      <div className="mt-10 rounded-card bg-surface p-8 text-center shadow-soft">
        <ShieldCheck size={28} strokeWidth={1.6} className="mx-auto text-muted-foreground" aria-hidden />
        <h1 className="mt-4 font-display text-2xl font-semibold text-foreground">
          Este enlace ya no es válido
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Puede haber expirado o haber sido usado anteriormente. Pide a tu consultorio que te
          envíe un enlace nuevo para entrar a tu espacio.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-4 space-y-6">
      <header className="text-center">
        <h1 className="font-display text-3xl font-semibold text-foreground">
          Hola, {invitation.patientName.split(" ")[0]}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Tu terapeuta te invitó a tu espacio personal. Antes de entrar, lee el aviso de
          privacidad.
        </p>
      </header>

      <div className="rounded-card bg-surface p-6 shadow-soft">
        <pre className="max-h-80 overflow-y-auto whitespace-pre-wrap font-sans text-sm leading-relaxed text-foreground">
          {CONSENT_PORTAL_TEXT}
        </pre>
      </div>

      <ConsentForm token={token ?? ""} />

      <p className="text-center text-xs text-muted-foreground">
        Este enlace vence el {formatDate(invitation.expiresAt, "d 'de' MMMM 'a las' h:mm a")}.
      </p>
    </div>
  );
}
