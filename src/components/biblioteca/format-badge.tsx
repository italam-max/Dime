import type { LucideIcon } from "lucide-react";
import { Dumbbell, FileText, Headphones, Image, Video } from "lucide-react";
import { cn } from "@/lib/utils";
import { ARTICLE_FORMAT_LABELS, type ArticleFormat } from "@/lib/validations/article";

// Icono + color por formato de recurso.
const FORMAT_META: Record<ArticleFormat, { icon: LucideIcon; className: string }> = {
  ARTICULO: { icon: FileText, className: "bg-primary-soft text-primary" },
  VIDEO: { icon: Video, className: "bg-accent-warm-soft text-accent-warm" },
  AUDIO: { icon: Headphones, className: "bg-honey-soft text-honey" },
  INFOGRAFIA: { icon: Image, className: "bg-mint-soft text-mint" },
  EJERCICIO: { icon: Dumbbell, className: "bg-surface-muted text-muted-foreground" },
};

export function FormatBadge({ format }: { format: string }) {
  const meta = FORMAT_META[format as ArticleFormat] ?? FORMAT_META.ARTICULO;
  const Icon = meta.icon;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
        meta.className
      )}
    >
      <Icon size={13} strokeWidth={2} aria-hidden />
      {ARTICLE_FORMAT_LABELS[format as ArticleFormat] ?? format}
    </span>
  );
}
