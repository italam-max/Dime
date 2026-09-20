import Link from "next/link";
import { MapPin } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { SITE, whatsappLink } from "@/lib/site";

// Shell de la web pública (psicodime.net): DIME, apoyo psicoterapéutico en
// Nezahualcóyotl. Encabezado con navegación + acceso a la plataforma y pie con
// datos locales. Sin sidebar; hereda el tema oscuro de la raíz.
export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/75 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/inicio" aria-label="DIME · Inicio" className="inline-flex">
            <Logo size={38} animated wordmarkClassName="text-3xl" />
          </Link>
          <nav className="flex items-center gap-1">
            <Link
              href="/inicio#enfoque"
              className="hidden rounded-control px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground md:inline-flex"
            >
              Enfoque
            </Link>
            <Link
              href="/inicio#servicios"
              className="hidden rounded-control px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground md:inline-flex"
            >
              Servicios
            </Link>
            <Link
              href="/blog"
              className="hidden rounded-control px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground md:inline-flex"
            >
              Blog
            </Link>
            <Link
              href="/inicio#contacto"
              className="hidden rounded-control px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground sm:inline-flex"
            >
              Contacto
            </Link>
            <Button asChild size="sm" className="ml-1">
              <a href={whatsappLink()} target="_blank" rel="noopener noreferrer">
                Agendar cita
              </a>
            </Button>
          </nav>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-border">
        <div className="mx-auto grid w-full max-w-6xl gap-8 px-6 py-12 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-3">
            <Logo size={28} wordmarkClassName="text-2xl" />
            <p className="text-sm leading-relaxed text-muted-foreground">
              Apoyo psicoterapéutico para la gestión de emociones. Un equipo multidisciplinario en
              Nezahualcóyotl.
            </p>
          </div>

          <div className="space-y-2 text-sm">
            <p className="font-medium text-foreground">Explora</p>
            <Link href="/inicio#servicios" className="block text-muted-foreground hover:text-foreground">
              Servicios
            </Link>
            <Link href="/inicio#enfoque" className="block text-muted-foreground hover:text-foreground">
              Nuestro enfoque
            </Link>
            <Link href="/blog" className="block text-muted-foreground hover:text-foreground">
              Blog
            </Link>
            <a href={`${SITE.appUrl}/login`} className="block text-primary hover:underline">
              Acceso a la app
            </a>
          </div>

          <div className="space-y-2 text-sm">
            <p className="font-medium text-foreground">Contacto</p>
            <p className="text-muted-foreground">{SITE.phone}</p>
            <a href={`mailto:${SITE.email}`} className="block text-muted-foreground hover:text-foreground">
              {SITE.email}
            </a>
            <a
              href={whatsappLink()}
              target="_blank"
              rel="noopener noreferrer"
              className="block text-primary hover:underline"
            >
              Escríbenos por WhatsApp
            </a>
          </div>

          <div className="space-y-2 text-sm">
            <p className="font-medium text-foreground">Dónde estamos</p>
            <p className="flex items-start gap-1.5 text-muted-foreground">
              <MapPin size={15} className="mt-0.5 shrink-0 text-primary" aria-hidden />
              <span>
                {SITE.street}
                <br />
                {SITE.city}, {SITE.state}
              </span>
            </p>
            <p className="text-muted-foreground">{SITE.hours}</p>
          </div>
        </div>
        <div className="border-t border-border">
          <p className="mx-auto w-full max-w-6xl px-6 py-5 text-xs text-muted-foreground">
            © {new Date().getFullYear()} {SITE.legalName} · Nezahualcóyotl, Estado de México.
          </p>
        </div>
      </footer>
    </div>
  );
}
