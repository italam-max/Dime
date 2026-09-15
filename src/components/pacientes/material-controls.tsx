"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { BookOpen, X } from "lucide-react";
import { assignArticle, unassignArticle } from "@/app/(app)/biblioteca/actions";
import { Button } from "@/components/ui/button";

// Select + botón para asignar un artículo publicado (no asignado aún) al
// paciente cuya ficha se está viendo.
export function MaterialAssignControl({
  patientId,
  articles,
}: {
  patientId: string;
  articles: { id: string; title: string }[];
}) {
  const [articleId, setArticleId] = useState("");
  const [pending, startTransition] = useTransition();

  function handleAssign() {
    if (!articleId) return;
    startTransition(async () => {
      const result = await assignArticle(articleId, [patientId]);
      if (result.ok) {
        toast.success(result.message ?? "Artículo asignado");
        setArticleId("");
      } else {
        toast.error(result.message ?? "No se pudo asignar el artículo.");
      }
    });
  }

  if (articles.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <label htmlFor="asignar-articulo" className="sr-only">
        Artículo para asignar
      </label>
      <select
        id="asignar-articulo"
        value={articleId}
        onChange={(e) => setArticleId(e.target.value)}
        className="h-9 min-w-64 flex-1 rounded-lg border border-input bg-transparent px-2.5 text-sm"
      >
        <option value="">Elige un artículo publicado…</option>
        {articles.map((article) => (
          <option key={article.id} value={article.id}>
            {article.title}
          </option>
        ))}
      </select>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleAssign}
        disabled={pending || articleId === ""}
      >
        <BookOpen data-icon="inline-start" />
        {pending ? "Asignando…" : "Asignar"}
      </Button>
    </div>
  );
}

// Quita una asignación concreta del paciente (con confirmación).
export function MaterialUnassignButton({
  assignmentId,
  title,
}: {
  assignmentId: string;
  title: string;
}) {
  const [pending, startTransition] = useTransition();

  function handleUnassign() {
    if (!window.confirm(`¿Quitar la asignación de “${title}”?`)) return;
    startTransition(async () => {
      const result = await unassignArticle(assignmentId);
      if (result.ok) {
        toast.success(result.message ?? "Asignación quitada");
      } else {
        toast.error(result.message ?? "No se pudo quitar la asignación.");
      }
    });
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={handleUnassign}
      disabled={pending}
      aria-label={`Quitar asignación de ${title}`}
      className="shrink-0 px-2 text-muted-foreground"
    >
      <X size={16} aria-hidden />
    </Button>
  );
}
