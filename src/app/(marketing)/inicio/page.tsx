import type { Metadata } from "next";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import {
  ArrowRight,
  Baby,
  Brain,
  CalendarCheck,
  ClipboardCheck,
  Compass,
  HeartHandshake,
  LifeBuoy,
  MapPin,
  MessageCircle,
  Smartphone,
  Sprout,
  Users,
} from "lucide-react";
import { ForestBackdrop } from "@/components/brand/botanical";
import { Button } from "@/components/ui/button";
import { SITE, whatsappLink } from "@/lib/site";
import { BLOG_POSTS } from "@/content/blog";

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: "DIME · Apoyo psicoterapéutico en Nezahualcóyotl",
  description: SITE.description,
  keywords: [
    "psicólogo en Nezahualcóyotl",
    "terapia psicológica Nezahualcóyotl",
    "apoyo psicoterapéutico",
    "terapia de pareja Neza",
    "psicólogo infantil Estado de México",
    "gestión de emociones",
    "ansiedad",
    "salud mental",
  ],
  alternates: { canonical: "/inicio" },
  openGraph: {
    type: "website",
    locale: "es_MX",
    url: SITE.url,
    siteName: SITE.name,
    title: "DIME · Apoyo psicoterapéutico en Nezahualcóyotl",
    description: SITE.description,
  },
  twitter: { card: "summary_large_image", title: "DIME · Apoyo psicoterapéutico", description: SITE.description },
};

type Accent = "sage" | "mint" | "honey" | "iris" | "petal" | "warm";
const GLOW: Record<Accent, string> = {
  sage: "var(--color-primary)",
  mint: "var(--color-mint)",
  honey: "var(--color-honey)",
  iris: "var(--color-iris)",
  petal: "var(--color-petal)",
  warm: "var(--color-accent-warm)",
};
function chip(accent: Accent) {
  const g = GLOW[accent];
  return {
    background: `color-mix(in srgb, ${g} 16%, transparent)`,
    color: g,
    boxShadow: `0 0 22px -6px color-mix(in srgb, ${g} 60%, transparent)`,
  };
}
function cardGlow(accent: Accent) {
  return `radial-gradient(120% 90% at 100% 0%, color-mix(in srgb, ${GLOW[accent]} 14%, transparent), transparent 60%)`;
}

const SERVICIOS: { icon: LucideIcon; title: string; body: string; accent: Accent }[] = [
  {
    icon: Sprout,
    title: "Psicoterapia individual",
    body: "Un espacio propio para entender lo que sientes y encontrar formas más sanas de vivirlo.",
    accent: "sage",
  },
  {
    icon: HeartHandshake,
    title: "Terapia de pareja",
    body: "Acompañamiento para reconstruir la comunicación, el vínculo y los acuerdos.",
    accent: "petal",
  },
  {
    icon: Baby,
    title: "Niñas, niños y adolescentes",
    body: "Apoyo cercano para las emociones en la infancia y la adolescencia, con las familias.",
    accent: "honey",
  },
  {
    icon: Brain,
    title: "Evaluación psicológica",
    body: "Valoraciones y pruebas para orientar diagnósticos, decisiones y procesos.",
    accent: "iris",
  },
  {
    icon: Users,
    title: "Talleres y grupos",
    body: "Encuentros para aprender herramientas emocionales y acompañarte en comunidad.",
    accent: "mint",
  },
  {
    icon: LifeBuoy,
    title: "Orientación en momentos difíciles",
    body: "Contención cuando algo te rebasa y necesitas hablar con alguien pronto.",
    accent: "warm",
  },
];

const PROCESO: { icon: LucideIcon; title: string; body: string }[] = [
  { icon: MessageCircle, title: "Primer contacto", body: "Nos escribes y agendamos tu primera cita, sin compromiso de continuar." },
  { icon: Compass, title: "Valoración", body: "Escuchamos qué te trae y entendemos juntos qué necesitas." },
  { icon: ClipboardCheck, title: "Plan de acompañamiento", body: "Definimos un proceso a tu medida y la frecuencia que te haga sentido." },
  { icon: CalendarCheck, title: "Seguimiento", body: "Avanzamos sesión a sesión, con tu proceso también a la mano en la app." },
];

const PILARES = [
  { title: "Multidisciplinario", body: "Un equipo con distintas especialidades para acompañar cada proceso." },
  { title: "Cercano", body: "Sin juicios y a tu ritmo. Un trato humano de principio a fin." },
  { title: "Con seguimiento", body: "Herramientas entre sesiones para que el cambio se sostenga." },
];

function jsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": ["MedicalBusiness", "Psychologist"],
    name: SITE.name,
    description: SITE.description,
    url: SITE.url,
    telephone: SITE.phone,
    email: SITE.email,
    priceRange: "$$",
    areaServed: [SITE.city, "Los Reyes La Paz", "Chimalhuacán", "Ciudad de México"],
    address: {
      "@type": "PostalAddress",
      streetAddress: SITE.street,
      addressLocality: SITE.city,
      addressRegion: SITE.state,
      postalCode: SITE.postalCode,
      addressCountry: SITE.country,
    },
    geo: { "@type": "GeoCoordinates", latitude: SITE.geo.lat, longitude: SITE.geo.lng },
    openingHours: "Mo-Sa 09:00-20:00",
    sameAs: [SITE.social.facebook, SITE.social.instagram],
    medicalSpecialty: "Psychiatric",
  };
}

export default function LandingPage() {
  const posts = BLOG_POSTS.slice(0, 3);

  return (
    <div className="relative">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd()) }}
      />

      {/* Bosque vivo de fondo */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden" aria-hidden>
        <ForestBackdrop />
      </div>

      {/* ── Hero ── */}
      <section className="relative overflow-hidden">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              "radial-gradient(65% 60% at 50% 8%, color-mix(in srgb, var(--color-primary) 14%, transparent), transparent 72%)",
          }}
          aria-hidden
        />
        <div className="stagger-children relative mx-auto w-full max-w-3xl px-6 pt-24 pb-20 text-center sm:pt-32 sm:pb-24">
          <span className="inline-flex items-center gap-2 rounded-full bg-primary-soft px-3 py-1 text-xs font-medium text-primary">
            <MapPin size={13} strokeWidth={2} aria-hidden />
            Apoyo psicoterapéutico · Nezahualcóyotl
          </span>
          <h1 className="mt-6 font-display text-5xl font-semibold leading-[1.04] text-foreground sm:text-6xl">
            Un lugar para sentir, entender y crecer
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-muted-foreground">
            DIME es un grupo multidisciplinario de apoyo psicoterapéutico. Acompañamos tu proceso
            emocional con cercanía, en persona y a tu ritmo.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button asChild size="lg">
              <a href={whatsappLink()} target="_blank" rel="noopener noreferrer">
                Agendar una cita
                <ArrowRight data-icon="inline-end" />
              </a>
            </Button>
            <Button asChild variant="outline" size="lg">
              <a href="#servicios">Conocer nuestros servicios</a>
            </Button>
          </div>
        </div>
      </section>

      {/* ── Enfoque ── */}
      <section id="enfoque" className="reveal mx-auto w-full max-w-4xl px-6 py-16 text-center">
        <p className="text-xs font-semibold uppercase tracking-widest text-primary">Nuestro enfoque</p>
        <h2 className="mt-3 font-display text-3xl font-semibold leading-tight text-foreground sm:text-4xl">
          Las emociones se gestionan mejor acompañado
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
          No somos solo una app: somos un equipo de profesionales de la salud emocional. La
          tecnología acompaña el proceso, pero el centro siempre es la relación contigo.
        </p>
        <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {PILARES.map((p) => (
            <div key={p.title} className="rounded-xl bg-card p-6 text-left ring-1 ring-foreground/10">
              <h3 className="font-display text-xl font-medium text-foreground">{p.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{p.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Servicios ── */}
      <section id="servicios" className="reveal mx-auto w-full max-w-6xl px-6 py-16">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary">Servicios</p>
          <h2 className="mt-3 font-display text-3xl font-semibold text-foreground sm:text-4xl">
            Un equipo para cada proceso
          </h2>
          <p className="mt-3 text-muted-foreground">
            Distintas disciplinas para acompañar lo que estás viviendo, sea cual sea el momento.
          </p>
        </div>
        <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {SERVICIOS.map(({ icon: Icon, title, body, accent }) => (
            <div
              key={title}
              className="hover-lift relative overflow-hidden rounded-xl bg-card p-6 ring-1 ring-foreground/10"
              style={{ backgroundImage: cardGlow(accent) }}
            >
              <span
                className="flex size-11 items-center justify-center rounded-control"
                style={chip(accent)}
              >
                <Icon size={22} strokeWidth={1.8} aria-hidden />
              </span>
              <h3 className="mt-4 font-display text-xl font-medium text-foreground">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Proceso ── */}
      <section className="reveal mx-auto w-full max-w-6xl px-6 py-16">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary">Cómo acompañamos</p>
          <h2 className="mt-3 font-display text-3xl font-semibold text-foreground sm:text-4xl">
            Tu proceso, paso a paso
          </h2>
        </div>
        <ol className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {PROCESO.map(({ icon: Icon, title, body }, i) => (
            <li key={title} className="relative rounded-xl bg-card p-6 ring-1 ring-foreground/10">
              <div className="flex items-center justify-between">
                <span className="flex size-10 items-center justify-center rounded-control bg-primary-soft text-primary">
                  <Icon size={20} strokeWidth={1.8} aria-hidden />
                </span>
                <span className="font-display text-3xl font-semibold text-primary/30">
                  {String(i + 1).padStart(2, "0")}
                </span>
              </div>
              <h3 className="mt-4 font-display text-lg font-medium text-foreground">{title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{body}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* ── La app (herramienta) ── */}
      <section className="reveal mx-auto w-full max-w-6xl px-6 py-16">
        <div
          className="relative overflow-hidden rounded-card bg-card px-8 py-12 ring-1 ring-foreground/10 sm:px-12"
          style={{
            backgroundImage:
              "radial-gradient(70% 120% at 100% 0%, color-mix(in srgb, var(--color-mint) 12%, transparent), transparent 60%)",
          }}
        >
          <div className="flex flex-wrap items-center justify-between gap-8">
            <div className="max-w-xl">
              <span
                className="flex size-11 items-center justify-center rounded-control"
                style={chip("mint")}
              >
                <Smartphone size={22} strokeWidth={1.8} aria-hidden />
              </span>
              <h2 className="mt-4 font-display text-3xl font-semibold text-foreground">
                Tu proceso, también en tu bolsillo
              </h2>
              <p className="mt-3 text-muted-foreground">
                Con la app de Dime, tu terapeuta comparte tus citas, tareas entre sesiones y
                recursos. Una herramienta que acompaña el trabajo que hacemos juntos.
              </p>
            </div>
            <Button asChild variant="outline" size="lg">
              <a href={`${SITE.appUrl}/login`}>
                Entrar a la app
                <ArrowRight data-icon="inline-end" />
              </a>
            </Button>
          </div>
        </div>
      </section>

      {/* ── Blog ── */}
      <section className="reveal mx-auto w-full max-w-6xl px-6 py-16">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-primary">Recursos</p>
            <h2 className="mt-2 font-display text-3xl font-semibold text-foreground sm:text-4xl">
              Del blog
            </h2>
          </div>
          <Link
            href="/blog"
            className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
          >
            Ver todo
            <ArrowRight size={14} aria-hidden />
          </Link>
        </div>
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {posts.map((post) => (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              className="hover-lift group rounded-xl bg-card p-6 ring-1 ring-foreground/10"
            >
              <p className="text-xs font-medium uppercase tracking-wide text-primary">
                {post.category}
              </p>
              <h3 className="mt-2 font-display text-xl font-medium text-foreground transition-colors group-hover:text-primary">
                {post.title}
              </h3>
              <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-muted-foreground">
                {post.excerpt}
              </p>
              <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary">
                Leer
                <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" aria-hidden />
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* ── Contacto / Ubicación ── */}
      <section id="contacto" className="reveal mx-auto w-full max-w-6xl px-6 pb-24">
        <div
          className="relative overflow-hidden rounded-card bg-card px-8 py-12 ring-1 ring-foreground/10 sm:px-12"
          style={{
            backgroundImage:
              "radial-gradient(80% 120% at 0% 0%, color-mix(in srgb, var(--color-primary) 14%, transparent), transparent 60%)",
          }}
        >
          <div className="grid gap-10 lg:grid-cols-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-primary">Contacto</p>
              <h2 className="mt-3 font-display text-3xl font-semibold text-foreground sm:text-4xl">
                Empieza cuando estés listo
              </h2>
              <p className="mt-4 max-w-md text-muted-foreground">
                Escríbenos y agendamos tu primera cita. Estamos en Nezahualcóyotl para acompañarte de
                cerca.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Button asChild size="lg">
                  <a href={whatsappLink()} target="_blank" rel="noopener noreferrer">
                    <MessageCircle data-icon="inline-start" />
                    Escribir por WhatsApp
                  </a>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <a href={`tel:${SITE.phone.replace(/\s/g, "")}`}>Llamar</a>
                </Button>
              </div>
            </div>
            <dl className="space-y-4 text-sm">
              <div className="flex items-start gap-3">
                <MapPin size={18} className="mt-0.5 shrink-0 text-primary" aria-hidden />
                <div>
                  <dt className="font-medium text-foreground">Dirección</dt>
                  <dd className="text-muted-foreground">
                    {SITE.street}, {SITE.city}, {SITE.state}
                  </dd>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MessageCircle size={18} className="mt-0.5 shrink-0 text-primary" aria-hidden />
                <div>
                  <dt className="font-medium text-foreground">Teléfono</dt>
                  <dd className="text-muted-foreground">{SITE.phone}</dd>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CalendarCheck size={18} className="mt-0.5 shrink-0 text-primary" aria-hidden />
                <div>
                  <dt className="font-medium text-foreground">Horario</dt>
                  <dd className="text-muted-foreground">{SITE.hours}</dd>
                </div>
              </div>
            </dl>
          </div>
        </div>
      </section>
    </div>
  );
}
