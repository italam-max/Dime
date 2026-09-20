import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { updateArticle } from "@/app/(app)/biblioteca/actions";
import { ArticleForm } from "@/components/biblioteca/article-form";
import { ArticleAssignmentSection } from "@/components/biblioteca/article-assignment-section";

export const metadata: Metadata = {
  title: "Editar recurso · Dime",
};

export default async function EditarArticuloPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [article, activePatients] = await Promise.all([
    prisma.article.findUnique({
      where: { id },
      include: {
        assignments: {
          orderBy: { assignedAt: "desc" },
          include: { patient: { select: { id: true, nombre: true, apellidos: true } } },
        },
      },
    }),
    prisma.patient.findMany({
      where: { isActive: true },
      orderBy: [{ apellidos: "asc" }, { nombre: "asc" }],
      select: { id: true, nombre: true, apellidos: true },
    }),
  ]);

  if (!article) notFound();

  return (
    <div className="animate-fade-in space-y-6">
      <div>
        <Link
          href="/biblioteca"
          className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Volver a la biblioteca
        </Link>
        <h1 className="font-display text-4xl font-semibold text-foreground">Editar recurso</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {article.published
            ? "Publicado: tus pacientes pueden verlo en su portal cuando se lo asignes."
            : "Borrador: no es visible para los pacientes hasta que lo publiques."}
        </p>
      </div>

      <ArticleForm
        action={updateArticle}
        article={{
          id: article.id,
          title: article.title,
          category: article.category,
          format: article.format,
          summary: article.summary ?? "",
          body: article.body ?? "",
          keyPoints: article.keyPoints ?? "",
          url: article.url ?? "",
          published: article.published,
        }}
        submitLabel="Guardar cambios"
        successMessage="Cambios guardados"
        cancelHref="/biblioteca"
      />

      <ArticleAssignmentSection
        articleId={article.id}
        patients={activePatients}
        assignments={article.assignments.map((a) => ({
          id: a.id,
          assignedAt: a.assignedAt,
          readAt: a.readAt,
          patient: a.patient,
        }))}
      />
    </div>
  );
}
