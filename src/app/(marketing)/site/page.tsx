import type { Metadata } from "next";
import type { LucideIcon } from "lucide-react";
import {
  ArrowRight,
  BookOpen,
  CalendarDays,
  ClipboardList,
  LineChart,
  ListTodo,
  Smartphone,
} from "lucide-react";
import { BotanicalSpray, ForestBackdrop } from "@/components/brand/botanical";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Dime · Tu consultorio, en calma",
  description:
    "Plataforma de psicoterapia para dar seguimiento a tus pacientes: agenda, pagos, tareas entre sesiones, evaluaciones y un portal sereno para cada paciente.",
};

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://app.psicodime.net";

type Accent = "sage" | "mint" | "honey" | "warm";
const ACCENT: Record<Accent, { chip: string; glow: string }> = {
  sage: { chip: "bg-primary-soft text-primary", glow: "var(--color-primary)" },
  mint: { chip: "bg-mint-soft text-mint", glow: "var(--color-mint)" },
  honey: { chip: "bg-honey-soft text-honey", glow: "var(--color-honey)" },
  warm: { chip: "bg-accent-warm-soft text-accent-warm", glow: "var(--color-accent-warm)" },
};

const FEATURES: { icon: LucideIcon; title: string; body: string; accent: Accent }[] = [
  {
    icon: LineChart,
    title: "Seguimiento clínico",
    body: "Cada paciente con su ficha viva: próxima cita, evolución, adherencia y notas, de un vistazo.",
    accent: "sage",
  },
  {
    icon: Smartphone,
    title: "Portal del paciente",
    body: "Un espacio sereno donde el paciente ve sus citas, tareas y recursos. Con su propia cuenta.",
    accent: "mint",
  },
  {
    icon: CalendarDays,
    title: "Agenda y pagos",
    body: "Agenda sesiones, registra asistencia y lleva el control de saldos sin salir de la app.",
    accent: "honey",
  },
  {
    icon: BookOpen,
    title: "Biblioteca de recursos",
    body: "Artículos, videos, audios e infografías que asignas a cada paciente como parte del tratamiento.",
    accent: "warm",
  },
  {
    icon: ClipboardList,
    title: "Evaluaciones",
    body: "Instrumentos estandarizados (PHQ-9, GAD-7, WHO-5) que el paciente responde y tú monitoreas.",
    accent: "sage",
  },
  {
    icon: ListTodo,
    title: "Tareas entre sesiones",
    body: "Asigna prácticas, revisa lo que el paciente completó y deja tus observaciones.",
    accent: "mint",
  },
];

export default function LandingPage() {
  return (
    <div className="relative">
      {/* ── Bosque de fondo (follaje grande en capas) ── */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden" aria-hidden>
        <ForestBackdrop />
      </div>

      {/* ── Hero ── */}
      <section className="relative overflow-hidden">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              "radial-gradient(65% 60% at 50% 10%, color-mix(in srgb, var(--color-primary) 14%, transparent), transparent 72%)",
          }}
          aria-hidden
        />

        <div className="relative mx-auto w-full max-w-3xl px-6 pt-24 pb-20 text-center sm:pt-32 sm:pb-24">
          <span className="inline-flex items-center gap-2 rounded-full bg-primary-soft px-3 py-1 text-xs font-medium text-primary">
            Plataforma para psicoterapia
          </span>
          <h1 className="mt-6 font-display text-5xl font-semibold leading-[1.05] text-foreground sm:text-6xl">
            Tu consultorio, en calma
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-muted-foreground">
            Da seguimiento a tus pacientes en un solo lugar: agenda, pagos, tareas entre sesiones,
            evaluaciones y un portal sereno para cada persona que acompañas.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button asChild size="lg">
              <a href={`${APP_URL}/login`}>
                Entrar a la plataforma
                <ArrowRight data-icon="inline-end" />
              </a>
            </Button>
            <Button asChild variant="outline" size="lg">
              <a href="#caracteristicas">Conocer más</a>
            </Button>
          </div>
        </div>
      </section>

      {/* ── Características ── */}
      <section id="caracteristicas" className="mx-auto w-full max-w-6xl px-6 py-16">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-3xl font-semibold text-foreground sm:text-4xl">
            Todo tu seguimiento, sin fricción
          </h2>
          <p className="mt-3 text-muted-foreground">
            Diseñado con y para psicoterapeutas. Menos administración, más presencia con tu paciente.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, body, accent }) => {
            const a = ACCENT[accent];
            return (
              <div
                key={title}
                className="relative overflow-hidden rounded-xl bg-card p-6 ring-1 ring-foreground/10"
                style={{
                  backgroundImage: `radial-gradient(120% 90% at 100% 0%, color-mix(in srgb, ${a.glow} 14%, transparent), transparent 60%)`,
                }}
              >
                <span
                  className={`flex size-11 items-center justify-center rounded-control ${a.chip}`}
                  style={{
                    boxShadow: `0 0 20px -6px color-mix(in srgb, ${a.glow} 60%, transparent)`,
                  }}
                >
                  <Icon size={22} strokeWidth={1.8} aria-hidden />
                </span>
                <h3 className="mt-4 font-display text-xl font-medium text-foreground">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{body}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="mx-auto w-full max-w-6xl px-6 pb-20">
        <div
          className="relative overflow-hidden rounded-card bg-card px-8 py-14 text-center ring-1 ring-foreground/10"
          style={{
            backgroundImage:
              "radial-gradient(80% 120% at 0% 0%, color-mix(in srgb, var(--color-primary) 14%, transparent), transparent 60%)",
          }}
        >
          <BotanicalSpray className="pointer-events-none absolute -bottom-10 -right-6 w-44 opacity-[0.08]" />
          <h2 className="relative font-display text-3xl font-semibold text-foreground sm:text-4xl">
            Lleva tu consultorio a Dime
          </h2>
          <p className="relative mx-auto mt-3 max-w-lg text-muted-foreground">
            Un lugar sereno para tu práctica clínica y para el proceso de cada paciente.
          </p>
          <div className="relative mt-8">
            <Button asChild size="lg">
              <a href={`${APP_URL}/login`}>
                Entrar
                <ArrowRight data-icon="inline-end" />
              </a>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
