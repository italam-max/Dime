"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Eye } from "lucide-react";
import type { ArticleFormState } from "@/app/(app)/biblioteca/actions";
import { ResourceContent } from "@/components/biblioteca/resource-content";
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
import {
  ARTICLE_CATEGORIES,
  ARTICLE_CATEGORY_LABELS,
  ARTICLE_FORMAT_HELP,
  ARTICLE_FORMAT_LABELS,
  ARTICLE_FORMATS,
  FORMATS_WITH_URL,
  type ArticleFormat,
} from "@/lib/validations/article";

// Valores iniciales para edición.
export interface ArticleInitialValues {
  id: string;
  title: string;
  category: string;
  format: string;
  summary: string;
  body: string;
  keyPoints: string;
  url: string;
  published: boolean;
}

interface ArticleFormProps {
  action: (prev: ArticleFormState, formData: FormData) => Promise<ArticleFormState>;
  article?: ArticleInitialValues;
  submitLabel: string;
  successMessage: string;
  cancelHref: string;
}

// Formulario de alta/edición de recurso: campos guiados según el formato
// (sin markdown). Validación en el Server Action (zod) y vista previa en vivo.
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
  const [format, setFormat] = useState<ArticleFormat>(
    (article?.format as ArticleFormat) ?? "ARTICULO"
  );
  const [summary, setSummary] = useState(article?.summary ?? "");
  const [body, setBody] = useState(article?.body ?? "");
  const [keyPoints, setKeyPoints] = useState(article?.keyPoints ?? "");
  const [url, setUrl] = useState(article?.url ?? "");
  const [published, setPublished] = useState(article?.published ?? false);

  const usaEnlace = FORMATS_WITH_URL.includes(format);

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
    formData.set("format", format);
    formData.set("summary", summary);
    formData.set("body", body);
    formData.set("keyPoints", keyPoints);
    formData.set("url", url);
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
              <Label>Tipo de recurso</Label>
              <Select value={format} onValueChange={(v) => setFormat(v as ArticleFormat)}>
                <SelectTrigger className="w-full" aria-invalid={!!state.errors?.format}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ARTICLE_FORMATS.map((f) => (
                    <SelectItem key={f} value={f}>
                      {ARTICLE_FORMAT_LABELS[f]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">{ARTICLE_FORMAT_HELP[format]}</p>
            </div>

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
              <Label htmlFor="summary">Resumen breve</Label>
              <Textarea
                id="summary"
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                placeholder="Una o dos frases que le digan al paciente de qué trata."
                maxLength={300}
                className="min-h-16"
                aria-invalid={!!state.errors?.summary}
              />
              <p className={errorClass(state.errors?.summary)} role="alert">
                {state.errors?.summary?.[0]}
              </p>
            </div>

            {usaEnlace ? (
              <div className="space-y-2">
                <Label htmlFor="url">Enlace del recurso</Label>
                <Input
                  id="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://…"
                  inputMode="url"
                  aria-invalid={!!state.errors?.url}
                />
                <p className="text-xs text-muted-foreground">
                  {format === "VIDEO"
                    ? "Pega el enlace de YouTube o Vimeo; se mostrará el video incrustado."
                    : format === "AUDIO"
                      ? "Pega el enlace del audio (por ejemplo un mp3)."
                      : "Pega el enlace de la imagen o el PDF de la infografía."}
                </p>
                <p className={errorClass(state.errors?.url)} role="alert">
                  {state.errors?.url?.[0]}
                </p>
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="body">Contenido</Label>
                  <Textarea
                    id="body"
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    placeholder={
                      "Escribe en párrafos normales.\n\nDeja una línea en blanco para separar un párrafo del siguiente."
                    }
                    className="min-h-56 leading-relaxed"
                    aria-invalid={!!state.errors?.body}
                  />
                  <p className="text-xs text-muted-foreground">
                    Sin formato técnico: solo escribe. Una línea en blanco = nuevo párrafo.
                  </p>
                  <p className={errorClass(state.errors?.body)} role="alert">
                    {state.errors?.body?.[0]}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="keyPoints">Puntos clave (opcional)</Label>
                  <Textarea
                    id="keyPoints"
                    value={keyPoints}
                    onChange={(e) => setKeyPoints(e.target.value)}
                    placeholder={"Un punto por línea\nOtro punto importante"}
                    className="min-h-24"
                  />
                  <p className="text-xs text-muted-foreground">
                    Un punto por línea. Se mostrarán como lista con viñetas.
                  </p>
                </div>
              </>
            )}

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
            {title.trim() && (
              <h3 className="mb-4 font-display text-2xl font-semibold text-foreground">{title}</h3>
            )}
            <ResourceContent
              format={format}
              summary={summary}
              body={body}
              keyPoints={keyPoints}
              url={url}
            />
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
