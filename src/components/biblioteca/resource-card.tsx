import Link from "next/link";
import { formatDate } from "@/lib/utils";
import { ARTICLE_CATEGORY_LABELS, ARTICLE_FORMAT_LABELS, type ArticleFormat } from "@/lib/validations/article";
import { formatMeta } from "@/components/biblioteca/format-badge";
import { Card } from "@/components/ui/card";

export interface ResourceCardData {
  id: string;
  title: string;
  format: string;
  category: string;
  published: boolean;
  updatedAt: Date;
  assignedCount: number;
}

// Tarjeta de recurso de la biblioteca: identidad propia (galería iluminada) con
// el lenguaje visual del dashboard — chip de icono con glow y resplandor del
// color del formato. Distinta de la tabla de pacientes.
export function ResourceCard({ resource }: { resource: ResourceCardData }) {
  const meta = formatMeta(resource.format);
  const Icon = meta.icon;

  return (
    <Link href={`/biblioteca/${resource.id}/editar`} className="group block">
      <Card
        className="hover-lift relative h-full overflow-hidden px-5"
        style={{
          backgroundImage: `radial-gradient(120% 90% at 100% 0%, color-mix(in srgb, ${meta.glow} 18%, transparent), transparent 60%)`,
        }}
      >
        <div className="flex items-start justify-between gap-3">
          <span
            className={`flex size-11 shrink-0 items-center justify-center rounded-control ${meta.chip}`}
            style={{ boxShadow: `0 0 22px -6px color-mix(in srgb, ${meta.glow} 60%, transparent)` }}
          >
            <Icon size={22} strokeWidth={1.8} aria-hidden />
          </span>
          <span
            className={
              resource.published
                ? "rounded-full bg-primary-soft px-2.5 py-1 text-xs font-medium text-primary"
                : "rounded-full bg-surface-muted px-2.5 py-1 text-xs font-medium text-muted-foreground"
            }
          >
            {resource.published ? "Publicado" : "Borrador"}
          </span>
        </div>

        <h3 className="mt-4 line-clamp-2 font-display text-xl font-medium text-foreground transition-colors group-hover:text-primary">
          {resource.title}
        </h3>

        <p className="mt-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {ARTICLE_FORMAT_LABELS[resource.format as ArticleFormat] ?? resource.format} ·{" "}
          {ARTICLE_CATEGORY_LABELS[resource.category] ?? resource.category}
        </p>

        <div className="mt-4 flex items-center justify-between border-t border-border pt-3 text-xs text-muted-foreground">
          <span>
            {resource.assignedCount === 0
              ? "Sin asignar"
              : resource.assignedCount === 1
                ? "1 paciente"
                : `${resource.assignedCount} pacientes`}
          </span>
          <span>{formatDate(resource.updatedAt, "d 'de' MMM yyyy")}</span>
        </div>
      </Card>
    </Link>
  );
}
