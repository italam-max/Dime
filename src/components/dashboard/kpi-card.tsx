import type { LucideIcon } from "lucide-react";
import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export interface KpiDelta {
  direction: "up" | "down" | "flat";
  text: string;
}

// Acentos botánicos: cada métrica tiene su color para dar vida y jerarquía
// sobre el fondo oscuro, sin saturar. `glow` alimenta el resplandor sutil.
export type KpiAccent = "sage" | "mint" | "warm" | "honey";

const ACCENTS: Record<KpiAccent, { chip: string; up: string; glow: string }> = {
  sage: { chip: "bg-primary-soft text-primary", up: "text-primary", glow: "var(--color-primary)" },
  mint: { chip: "bg-mint-soft text-mint", up: "text-mint", glow: "var(--color-mint)" },
  warm: {
    chip: "bg-accent-warm-soft text-accent-warm",
    up: "text-accent-warm",
    glow: "var(--color-accent-warm)",
  },
  honey: { chip: "bg-honey-soft text-honey", up: "text-honey", glow: "var(--color-honey)" },
};

interface KpiCardProps {
  label: string;
  value: string;
  delta?: KpiDelta;
  icon?: LucideIcon;
  accent?: KpiAccent;
}

// Tarjeta de KPI: cifra grande iluminada por un acento propio, chip de icono
// y un resplandor sutil en la esquina. La comparación con el periodo anterior
// se colorea según dirección (sube = acento, baja = terracota).
export function KpiCard({ label, value, delta, icon: Icon, accent = "sage" }: KpiCardProps) {
  const a = ACCENTS[accent];
  return (
    <Card
      className="hover-lift relative overflow-hidden px-4"
      style={{
        backgroundImage: `radial-gradient(130% 95% at 100% 0%, color-mix(in srgb, ${a.glow} 24%, transparent), transparent 60%)`,
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-1.5">
          <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
            {label}
          </p>
          <p
            className="text-3xl font-semibold tabular-nums text-foreground"
            style={{ textShadow: `0 0 24px color-mix(in srgb, ${a.glow} 30%, transparent)` }}
          >
            {value}
          </p>
          {delta && (
            <p
              className={cn(
                "flex items-center gap-1 text-xs",
                delta.direction === "up"
                  ? a.up
                  : delta.direction === "down"
                    ? "text-accent-warm"
                    : "text-muted-foreground"
              )}
            >
              {delta.direction === "up" && <ArrowUpRight size={14} aria-hidden />}
              {delta.direction === "down" && <ArrowDownRight size={14} aria-hidden />}
              {delta.direction === "flat" && <Minus size={14} aria-hidden />}
              {delta.text}
            </p>
          )}
        </div>
        {Icon && (
          <span
            className={cn(
              "flex size-10 shrink-0 items-center justify-center rounded-control",
              a.chip
            )}
            style={{ boxShadow: `0 0 20px -6px color-mix(in srgb, ${a.glow} 60%, transparent)` }}
          >
            <Icon size={20} strokeWidth={1.8} aria-hidden />
          </span>
        )}
      </div>
    </Card>
  );
}
