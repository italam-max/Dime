import type { Metadata } from "next";
import Link from "next/link";
import { BookOpen, FilePlus2 } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { ArticleFilters } from "@/components/biblioteca/article-filters";
import { ResourceCard } from "@/components/biblioteca/resource-card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";

export const metadata: Metadata = {
  title: "Biblioteca · Dime",
};

// Biblioteca del terapeuta: galería de recursos psicoeducativos con secciones
// por formato, buscador (título) y filtro por categoría vía search params.
export default async function BibliotecaPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; categoria?: string; formato?: string }>;
}) {
  const { q = "", categoria = "todas", formato = "todos" } = await searchParams;

  const where = {
    AND: [
      q ? { title: { contains: q } } : {},
      categoria !== "todas" ? { category: categoria } : {},
      formato !== "todos" ? { format: formato } : {},
    ],
  };

  const articles = await prisma.article.findMany({
    where,
    orderBy: { updatedAt: "desc" },
    include: { _count: { select: { assignments: true } } },
  });

  const isFiltering = q !== "" || categoria !== "todas" || formato !== "todos";

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl font-semibold text-foreground">Biblioteca</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Tu material psicoeducativo, privado y solo tuyo.{" "}
            {articles.length === 1 ? "1 recurso" : `${articles.length} recursos`}.
          </p>
        </div>
        <Button asChild>
          <Link href="/biblioteca/nuevo">
            <FilePlus2 data-icon="inline-start" />
            Nuevo recurso
          </Link>
        </Button>
      </div>

      <ArticleFilters />

      {articles.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title={isFiltering ? "Sin resultados" : "Tu biblioteca está en calma"}
          description={
            isFiltering
              ? "No hay recursos que coincidan con tu búsqueda. Prueba con otra palabra, tipo o categoría."
              : "Crea tu primer recurso para empezar a compartir material con tus pacientes."
          }
          action={
            !isFiltering && (
              <Button asChild>
                <Link href="/biblioteca/nuevo">
                  <FilePlus2 data-icon="inline-start" />
                  Nuevo recurso
                </Link>
              </Button>
            )
          }
        />
      ) : (
        <div className="stagger-children grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {articles.map((article) => (
            <ResourceCard
              key={article.id}
              resource={{
                id: article.id,
                title: article.title,
                format: article.format,
                category: article.category,
                published: article.published,
                updatedAt: article.updatedAt,
                assignedCount: article._count.assignments,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
