"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Eye } from "lucide-react";
import type { ArticleFormState } from "@/app/(app)/biblioteca/actions";
import { MarkdownContent } from "@/components/biblioteca/markdown-content";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { ARTICLE_CATEGORIES, ARTICLE_CATEGORY_LABELS } from "@/lib/validations/article";

// Valores iniciales para edición.
export interface ArticleInitialValues {
  id: string;
  title: string;
  category: string;
  body: string;
  published: boolean;
}

interface ArticleFormProps {
  action: (prev: ArticleFormState, formData: FormData) => Promise<ArticleFormState>;
  article?: ArticleInitialValues;
  submitLabel: string;
  successMessage: string;
  cancelHref: string;
}

// Formulario de alta/edición de artículo: validación en el Server Action
// (zod) y vista previa del markdown en vivo a un lado. Al crear, navega a la
// edición para poder asignarlo a pacientes desde ahí.
export function ArticleForm({
  action,
  article,
  submitLabel,
  successMessage,
  cancelHref,
}: ArticleFormProps) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(action, {} as ArticleFormState);

  const [title, setTitle] = useState(article?.title ?? "");
  const [category, setCategory] = useState(article?.category ?? "");
  const [body, setBody] = useState(article?.body ?? "");
  const [published, setPublished] = useState(article?.published ?? false);

  useEffect(() => {
    if (state.ok && state.articleId) {
      toast.success(state.message ?? successMessage);
      if (!article) router.push(`/biblioteca/${state.articleId}/editar`);
    }
  }, [state, article, successMessage, router]);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData();
    formData.set("title", title);
    formData.set("category", category);
    formData.set("body", body);
    if (published) formData.set("published", "on");
    if (article) formData.set("id", article.id);
    formAction(formData);
  }

  const errorClass = (error: string[] | undefined) =>
    cn("text-xs text-danger", error ? "" : "hidden");

  return (
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
      {state.message && !state.ok && (
        <p className="text-sm text-danger" role="alert">
          {state.message}
        </p>
      )}

      <div className="grid items-start gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Contenido</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Título</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Respiración diafragmática: tu ancla en momentos de ansiedad"
                maxLength={200}
                aria-invalid={!!state.errors?.title}
              />
              <p className={errorClass(state.errors?.title)} role="alert">
                {state.errors?.title?.[0]}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Categoría</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger id="category" className="w-full" aria-invalid={!!state.errors?.category}>
                  <SelectValue placeholder="Elige una categoría" />
                </SelectTrigger>
                <SelectContent>
                  {ARTICLE_CATEGORIES.map((option) => (
                    <SelectItem key={option} value={option}>
                      {ARTICLE_CATEGORY_LABELS[option]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className={errorClass(state.errors?.category)} role="alert">
                {state.errors?.category?.[0]}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="body">Cuerpo (markdown)</Label>
              <Textarea
                id="body"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder={"## ¿En qué consiste?\n\nEscribe aquí el contenido…\n\n- Un punto clave\n- Otro punto clave"}
                className="min-h-80 font-mono text-xs leading-relaxed"
                aria-invalid={!!state.errors?.body}
              />
              <p className={errorClass(state.errors?.body)} role="alert">
                {state.errors?.body?.[0]}
              </p>
            </div>

            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              <input
                type="checkbox"
                className="size-4 accent-primary"
                checked={published}
                onChange={(e) => setPublished(e.target.checked)}
              />
              Publicado (visible y asignable para los pacientes)
            </label>
          </CardContent>
        </Card>

        <Card className="bg-surface-muted/60">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <Eye size={16} strokeWidth={1.8} className="text-muted-foreground" aria-hidden />
              Vista previa
            </CardTitle>
          </CardHeader>
          <CardContent>
            {body.trim() === "" ? (
              <p className="text-sm italic text-muted-foreground">
                Escribe en el editor para ver cómo se verá el artículo.
              </p>
            ) : (
              <MarkdownContent markdown={body} />
            )}
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center justify-end gap-3">
        <Button type="button" variant="ghost" onClick={() => router.push(cancelHref)}>
          Cancelar
        </Button>
        <Button type="submit" disabled={pending}>
          {pending ? "Guardando…" : submitLabel}
        </Button>
      </div>
    </form>
  );
}
