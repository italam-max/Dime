import type { Metadata } from "next";
import { Leaf } from "lucide-react";

export const metadata: Metadata = {
  title: "Tu espacio · Dime",
};

// Pantalla a la que redirigen las páginas del portal cuando el paciente tiene
// sesión válida pero su consentimiento PORTAL no está al día (versión
// desactualizada). No consulta ni muestra datos del paciente.
export default function PortalPausaPage() {
  return (
    <div className="mt-10 rounded-card bg-surface p-8 text-center shadow-soft">
      <Leaf size={28} strokeWidth={1.6} className="mx-auto text-muted-foreground" aria-hidden />
      <h1 className="mt-4 font-display text-2xl font-semibold text-foreground">
        Tu espacio está en pausa
      </h1>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
        Necesitamos una actualización de tu consentimiento para seguir mostrándote tu
        información. Contacta a tu consultorio y con gusto te ayudarán.
      </p>
    </div>
  );
}
