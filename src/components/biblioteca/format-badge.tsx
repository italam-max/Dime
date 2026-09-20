import type { LucideIcon } from "lucide-react";
import { Dumbbell, FileText, Headphones, Image, Video } from "lucide-react";
import { cn } from "@/lib/utils";
import { ARTICLE_FORMAT_LABELS, type ArticleFormat } from "@/lib/validations/article";

// Metadata visual por formato: icono, clases del chip y color de acento (var CSS)
// para glows y detalles. Fuente única para el badge y la tarjeta de recurso.
export const FORMAT_META: Record<
  ArticleFormat,
  { icon: LucideIcon; chip: string; glow: string }
> = {
  ARTICULO: { icon: FileText, chip: "bg-primary-soft text-primary", glow: "var(--color-primary)" },
  VIDEO: {
    icon: Video,
    chip: "bg-accent-warm-soft text-accent-warm",
    glow: "var(--color-accent-warm)",
  },
  AUDIO: { icon: Headphones, chip: "bg-honey-soft text-honey", glow: "var(--color-honey)" },
  INFOGRAFIA: { icon: Image, chip: "bg-mint-soft text-mint", glow: "var(--color-mint)" },
  EJERCICIO: {
    icon: Dumbbell,
    chip: "bg-primary-soft text-primary-light",
    glow: "var(--color-primary-light)",
  },
};

export function formatMeta(format: string) {
  return FORMAT_META[format as ArticleFormat] ?? FORMAT_META.ARTICULO;
}

export function FormatBadge({ format }: { format: string }) {
  const meta = formatMeta(format);
  const Icon = meta.icon;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
        meta.chip
      )}
    >
      <Icon size={13} strokeWidth={2} aria-hidden />
      {ARTICLE_FORMAT_LABELS[format as ArticleFormat] ?? format}
    </span>
  );
}
