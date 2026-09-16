import Link from "next/link";
import { getPortalPatient } from "@/lib/auth";
import { Logo } from "@/components/brand/logo";
import { logoutPortal } from "@/app/(portal)/portal/acciones";

// Shell del portal del paciente: sin sidebar, columna centrada y mobile-first.
// Solo logo Dime y la opción de salir cuando hay sesión activa.
export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const patient = await getPortalPatient();

  return (
    <div className="min-h-screen">
      <header className="mx-auto flex w-full max-w-xl items-center justify-between px-6 py-5">
        <Link href="/portal" aria-label="Dime · Portal" className="inline-flex">
          <Logo size={30} animated wordmarkClassName="text-2xl" />
        </Link>
        {patient && (
          <form action={logoutPortal}>
            <button
              type="submit"
              className="rounded-control px-3 py-2 text-sm font-medium text-muted-foreground transition-colors duration-150 ease-out hover:bg-surface-muted hover:text-foreground"
            >
              Salir
            </button>
          </form>
        )}
      </header>

      <main className="mx-auto w-full max-w-xl animate-fade-in px-6 pb-16">{children}</main>
    </div>
  );
}
