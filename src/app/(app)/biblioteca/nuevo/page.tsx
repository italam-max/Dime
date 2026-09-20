import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createArticle } from "@/app/(app)/biblioteca/actions";
import { ArticleForm } from "@/components/biblioteca/article-form";

export const metadata: Metadata = {
  title: "Nuevo recurso · Dime",
};

export default function NuevoArticuloPage() {
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
        <h1 className="font-display text-4xl font-semibold text-foreground">Nuevo recurso</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Elige el tipo de recurso y llena los campos; revisa la vista previa a un lado. Solo
          es visible para tus pacientes cuando está publicado.
        </p>
      </div>

      <ArticleForm
        action={createArticle}
        submitLabel="Guardar recurso"
        successMessage="Recurso guardado"
        cancelHref="/biblioteca"
      />
    </div>
  );
}
