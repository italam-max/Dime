import { BookOpen } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";
import { ARTICLE_CATEGORY_LABELS } from "@/lib/validations/article";
import {
  MaterialAssignControl,
  MaterialUnassignButton,
} from "@/components/pacientes/material-controls";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Sección "Material psicoeducativo" de la ficha del paciente: artículos
// asignados con su estado de lectura, alta de asignaciones desde artículos
// publicados y quita por asignación. Solo los publicados son visibles en el
// portal; los borradores asignados se indican con discreción.
export async function MaterialSection({ patientId }: { patientId: string }) {
  const user = await getCurrentUser();
  if (!user) return null;

  const [assignments, availableArticles] = await Promise.all([
    prisma.articleAssignment.findMany({
      where: { patientId },
      orderBy: { assignedAt: "desc" },
      include: {
        article: { select: { id: true, title: true, category: true, published: true } },
      },
    }),
    prisma.article.findMany({
      where: { published: true, assignments: { none: { patientId } } },
      orderBy: { title: "asc" },
      select: { id: true, title: true },
    }),
  ]);

  const visible = assignments.filter((a) => a.article.published);
  const drafts = assignments.filter((a) => !a.article.published);

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle>Material psicoeducativo</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {assignments.length === 0 ? (
          <div className="flex items-start gap-3 py-2">
            <BookOpen size={20} strokeWidth={1.6} className="mt-0.5 shrink-0 text-muted-foreground" aria-hidden />
            <p className="text-sm leading-relaxed text-muted-foreground">
              Aún no tienes material asignado a este paciente. Elige un artículo de tu
              biblioteca para acompañarlo entre sesiones.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {visible.map((assignment) => (
              <li
                key={assignment.id}
                className="flex items-center justify-between gap-4 py-2.5 first:pt-0 last:pb-0"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">
                    {assignment.article.title}
                  </p>
                  <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                    <span>{ARTICLE_CATEGORY_LABELS[assignment.article.category] ?? assignment.article.category}</span>
                    <span aria-hidden>·</span>
                    <span>
                      Asignado el {formatDate(assignment.assignedAt, "d 'de' MMM yyyy")}
                    </span>
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Badge variant={assignment.readAt ? "secondary" : "ghost"}>
                    {assignment.readAt
                      ? `Leído el ${formatDate(assignment.readAt, "d 'de' MMM yyyy")}`
                      : "Sin leer"}
                  </Badge>
                  <MaterialUnassignButton
                    assignmentId={assignment.id}
                    title={assignment.article.title}
                  />
                </div>
              </li>
            ))}
            {drafts.map((assignment) => (
              <li
                key={assignment.id}
                className="flex items-center justify-between gap-4 py-2.5 first:pt-0 last:pb-0"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm text-muted-foreground">
                    {assignment.article.title}
                  </p>
                  <p className="mt-0.5 text-xs italic text-muted-foreground">
                    Borrador · no visible en el portal hasta publicarlo
                  </p>
                </div>
                <MaterialUnassignButton
                  assignmentId={assignment.id}
                  title={assignment.article.title}
                />
              </li>
            ))}
          </ul>
        )}

        {availableArticles.length > 0 && (
          <div className="border-t border-border pt-4">
            <MaterialAssignControl patientId={patientId} articles={availableArticles} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
