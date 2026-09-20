import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getPortalPatient, hasPortalConsent } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ARTICLE_CATEGORY_LABELS } from "@/lib/validations/article";
import { ResourceContent } from "@/components/biblioteca/resource-content";
import { FormatBadge } from "@/components/biblioteca/format-badge";

export const metadata: Metadata = {
  title: "Material · Dime",
};

// Lectura de un artículo asignado: solo si la asignación pertenece al paciente
// de la sesión y el artículo está publicado. La primera apertura registra
// readAt (lo verá el terapeuta como "Leído").
export default async function PortalMaterialPage({
  params,
}: {
  params: Promise<{ articleId: string }>;
}) {
  const patient = await getPortalPatient();
  if (!patient) redirect("/portal/login");
  if (!(await hasPortalConsent(patient.id))) redirect("/portal/pausa");

  const { articleId } = await params;

  const assignment = await prisma.articleAssignment.findFirst({
    where: { articleId, patientId: patient.id, article: { published: true } },
    include: { article: true },
  });
  if (!assignment) notFound();

  if (!assignment.readAt) {
    await prisma.articleAssignment.update({
      where: { id: assignment.id },
      data: { readAt: new Date() },
    });
  }

  return (
    <article className="mt-4">
      <Link
        href="/portal"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Volver a mi espacio
      </Link>

      <header className="mt-4">
        <div className="flex flex-wrap items-center gap-2">
          <FormatBadge format={assignment.article.format} />
          <span className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
            {ARTICLE_CATEGORY_LABELS[assignment.article.category] ?? assignment.article.category}
          </span>
        </div>
        <h1 className="mt-2 font-display text-3xl font-semibold text-foreground">
          {assignment.article.title}
        </h1>
      </header>

      <div className="mt-6 rounded-card bg-surface p-6 shadow-soft">
        <ResourceContent
          format={assignment.article.format}
          summary={assignment.article.summary}
          body={assignment.article.body}
          keyPoints={assignment.article.keyPoints}
          url={assignment.article.url}
        />
      </div>
    </article>
  );
}
