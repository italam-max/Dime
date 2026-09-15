import Link from "next/link";
import { BookOpen, Check } from "lucide-react";
import { getPortalPatient } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ARTICLE_CATEGORY_LABELS } from "@/lib/validations/article";

// Material asignado que ve el paciente en su home: solo artículos publicados.
// La primera apertura ya quedó registrada en su momento; aquí solo se indica.
export async function AssignedMaterial() {
  const patient = await getPortalPatient();
  if (!patient) return null;

  const assignments = await prisma.articleAssignment.findMany({
    where: { patientId: patient.id, article: { published: true } },
    orderBy: { assignedAt: "desc" },
    include: { article: { select: { id: true, title: true, category: true } } },
  });

  if (assignments.length === 0) {
    return (
      <section className="rounded-card bg-surface p-6 shadow-soft">
        <h2 className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
          Material para ti
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          No tienes material asignado por ahora.
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-card bg-surface p-6 shadow-soft">
      <h2 className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
        Material para ti
      </h2>
      <ul className="mt-3 divide-y divide-border">
        {assignments.map((assignment) => (
          <li key={assignment.id}>
            <Link
              href={`/portal/material/${assignment.article.id}`}
              className="group flex items-center justify-between gap-4 py-3 first:pt-1 last:pb-0"
            >
              <div className="flex min-w-0 items-start gap-3">
                <BookOpen
                  size={20}
                  strokeWidth={1.6}
                  className="mt-0.5 shrink-0 text-primary"
                  aria-hidden
                />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground group-hover:text-primary">
                    {assignment.article.title}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {ARTICLE_CATEGORY_LABELS[assignment.article.category] ??
                      assignment.article.category}
                  </p>
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
