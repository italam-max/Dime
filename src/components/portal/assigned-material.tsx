import Link from "next/link";
import { Check } from "lucide-react";
import { getPortalPatient } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ARTICLE_CATEGORY_LABELS } from "@/lib/validations/article";
import { FormatBadge } from "@/components/biblioteca/format-badge";

// Material asignado que ve el paciente en su home: solo artículos publicados.
// La primera apertura ya quedó registrada en su momento; aquí solo se indica.
export async function AssignedMaterial() {
  const patient = await getPortalPatient();
  if (!patient) return null;

  const assignments = await prisma.articleAssignment.findMany({
    where: { patientId: patient.id, article: { published: true } },
    orderBy: { assignedAt: "desc" },
    include: {
      article: { select: { id: true, title: true, category: true, format: true } },
    },
  });

  if (assignments.length === 0) {
    return (
      <section className="rounded-card bg-surface p-6 shadow-soft">
        <h2 className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
          Recursos recomendados para ti
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Aún no tienes recursos asignados. Tu terapeuta te compartirá material aquí.
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-card bg-surface p-6 shadow-soft">
      <h2 className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
        Recursos recomendados para ti
      </h2>
      <ul className="mt-3 divide-y divide-border">
        {assignments.map((assignment) => (
          <li key={assignment.id}>
            <Link
              href={`/portal/material/${assignment.article.id}`}
              className="group flex items-center justify-between gap-4 py-3 first:pt-1 last:pb-0"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-foreground group-hover:text-primary">
                  {assignment.article.title}
                </p>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <FormatBadge format={assignment.article.format} />
                  <span className="text-xs text-muted-foreground">
                    {ARTICLE_CATEGORY_LABELS[assignment.article.category] ??
                      assignment.article.category}
                  </span>
                </div>
              </div>
              {assignment.readAt ? (
                <span className="flex shrink-0 items-center gap-1 text-xs text-primary">
                  <Check size={14} aria-hidden />
                  Leído
                </span>
              ) : (
                <span className="shrink-0 text-xs text-accent-warm">Sin leer</span>
              )}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
