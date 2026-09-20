import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";

// URL de la plataforma (área de terapeutas/pacientes). En prod es el subdominio
// app.*; configurable por entorno.
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://app.psicodime.net";

// Shell de la web pública (psicodime.net): encabezado con la marca y acceso a
// la plataforma, y pie sobrio. Sin sidebar; hereda el tema oscuro de la raíz.
export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/site" aria-label="Dime · Inicio" className="inline-flex">
            <Logo size={36} animated wordmarkClassName="text-3xl" />
          </Link>
          <nav className="flex items-center gap-2">
            <Link
              href="#caracteristicas"
              className="hidden rounded-control px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground sm:inline-flex"
            >
              Características
            </Link>
            <Button asChild size="sm">
              <a href={`${APP_URL}/login`}>Entrar</a>
            </Button>
          </nav>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-border">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-4 px-6 py-8 text-sm text-muted-foreground sm:flex-row">
          <div className="flex items-center gap-2">
            <Logo size={22} wordmarkClassName="text-lg" />
          </div>
          <p>© {new Date().getFullYear()} Dime · Psicodime. Tu consultorio, en calma.</p>
          <a href={`${APP_URL}/login`} className="font-medium text-primary hover:underline">
            Acceso profesional
          </a>
        </div>
      </footer>
    </div>
  );
}
