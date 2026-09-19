import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getPortalPatient } from "@/lib/auth";
import { PortalLoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Entrar a tu espacio · Dime",
};

// Reingreso del paciente con su cuenta (correo + contraseña). El alta inicial
// se hace con el enlace de invitación en /portal/ingresar.
export default async function PortalLoginPage() {
  const patient = await getPortalPatient();
  if (patient) redirect("/portal");

  return (
    <div className="mt-6 space-y-6">
      <header className="text-center">
        <h1 className="font-display text-3xl font-semibold text-foreground">Entra a tu espacio</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Usa el correo y la contraseña que definiste al activar tu cuenta.
        </p>
      </header>

      <div className="rounded-card bg-surface p-6 shadow-soft">
        <PortalLoginForm />
      </div>

      <p className="text-center text-sm text-muted-foreground">
        ¿Aún no activas tu cuenta? Pide a tu consultorio el enlace de invitación.
      </p>
    </div>
  );
}
