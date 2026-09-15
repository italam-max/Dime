import type { Metadata } from "next";
import Link from "next/link";
import { BookOpen, FilePlus2 } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";
import { ARTICLE_CATEGORY_LABELS } from "@/lib/validations/article";
import { ArticleFilters } from "@/components/biblioteca/article-filters";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const metadata: Metadata = {
  title: "Biblioteca · Dime",
};

// Biblioteca del terapeuta: artículos psicoeducativos con buscador (título) y
// filtro por categoría vía search params.
export default async function BibliotecaPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; categoria?: string }>;
}) {
  const { q = "", categoria = "todas" } = await searchParams;

  const where = {
    AND: [
      q ? { title: { contains: q } } : {},
      categoria !== "todas" ? { category: categoria } : {},
    ],
  };

  const articles = await prisma.article.findMany({
    where,
    orderBy: { updatedAt: "desc" },
    include: { _count: { select: { assignments: true } } },
  });

  const isFiltering = q !== "" || categoria !== "todas";

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl font-semibold text-foreground">Biblioteca</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Tu material psicoeducativo, privado y solo tuyo.{" "}
            {articles.length === 1 ? "1 artículo" : `${articles.length} artículos`}.
          </p>
        </div>
        <Button asChild>
          <Link href="/biblioteca/nuevo">
            <FilePlus2 data-icon="inline-start" />
            Nuevo artículo
          </Link>
        </Button>
      </div>

      <ArticleFilters />

      {articles.length === 0 ? (
        <Card className="items-center gap-3 py-16 text-center">
          <BookOpen size={28} strokeWidth={1.6} className="text-muted-foreground" aria-hidden />
          <p className="font-display text-2xl text-foreground">
            {isFiltering ? "Sin resultados" : "Tu biblioteca está en calma"}
          </p>
          <p className="max-w-md text-sm text-muted-foreground">
            {isFiltering
              ? "No hay artículos que coincidan con tu búsqueda. Prueba con otra palabra o categoría."
              : "Crea tu primer artículo para empezar a compartir material psicoeducativo con tus pacientes."}
          </p>
          {!isFiltering && (
            <Button asChild className="mt-2">
              <Link href="/biblioteca/nuevo">
                <FilePlus2 data-icon="inline-start" />
                Nuevo artículo
              </Link>
            </Button>
          )}
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-xs uppercase tracking-widest text-muted-foreground">
                  Título
                </TableHead>
                <TableHead className="text-xs uppercase tracking-widest text-muted-foreground">
                  Categoría
                </TableHead>
                <TableHead className="text-xs uppercase tracking-widest text-muted-foreground">
                  Estado
                </TableHead>
                <TableHead className="text-xs uppercase tracking-widest text-muted-foreground">
                  Asignado a
                </TableHead>
                <TableHead className="text-xs uppercase tracking-widest text-muted-foreground">
                  Actualizado
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {articles.map((article) => (
                <TableRow key={article.id}>
                  <TableCell>
                    <Link
                      href={`/biblioteca/${article.id}/editar`}
                      className="font-medium text-foreground hover:text-primary hover:underline underline-offset-4"
                    >
                      {article.title}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {ARTICLE_CATEGORY_LABELS[article.category] ?? article.category}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={article.published ? "secondary" : "ghost"}>
                      {article.published ? "Publicado" : "Borrador"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {article._count.assignments === 1
                      ? "1 paciente"
                      : `${article._count.assignments} pacientes`}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(article.updatedAt, "d 'de' MMM yyyy")}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
