import { z } from "zod";

// Categorías (tema) de los recursos psicoeducativos (Article.category).
export const ARTICLE_CATEGORIES = [
  "ANSIEDAD",
  "DEPRESION",
  "ESTRES",
  "SUENO",
  "GENERAL",
] as const;

export const ARTICLE_CATEGORY_LABELS: Record<string, string> = {
  ANSIEDAD: "Ansiedad",
  DEPRESION: "Depresión",
  ESTRES: "Estrés",
  SUENO: "Sueño",
  GENERAL: "General",
};

// Formato del recurso (Article.format). Define qué campos se piden y cómo se
// muestra. Los formatos de medios usan un enlace; artículo y ejercicio usan texto.
export const ARTICLE_FORMATS = [
  "ARTICULO",
  "VIDEO",
  "AUDIO",
  "INFOGRAFIA",
  "EJERCICIO",
] as const;
export type ArticleFormat = (typeof ARTICLE_FORMATS)[number];

export const ARTICLE_FORMAT_LABELS: Record<ArticleFormat, string> = {
  ARTICULO: "Artículo",
  VIDEO: "Video",
  AUDIO: "Audio",
  INFOGRAFIA: "Infografía",
  EJERCICIO: "Ejercicio",
};

// Ícono (nombre de lucide) por formato; se resuelve en los componentes cliente.
export const ARTICLE_FORMAT_ICON: Record<ArticleFormat, string> = {
  ARTICULO: "FileText",
  VIDEO: "Video",
  AUDIO: "Headphones",
  INFOGRAFIA: "Image",
  EJERCICIO: "Dumbbell",
};

// Ayuda contextual por formato para el formulario.
export const ARTICLE_FORMAT_HELP: Record<ArticleFormat, string> = {
  ARTICULO: "Texto para leer. Escribe el contenido en párrafos normales.",
  VIDEO: "Enlace a un video (YouTube, Vimeo…). Se mostrará incrustado.",
  AUDIO: "Enlace a un audio o podcast (por ejemplo un mp3 o Spotify).",
  INFOGRAFIA: "Enlace a una imagen o PDF con la infografía.",
  EJERCICIO: "Práctica guiada. Describe los pasos en párrafos y puntos clave.",
};

// Los formatos que se apoyan en un enlace (requieren url).
export const FORMATS_WITH_URL: ArticleFormat[] = ["VIDEO", "AUDIO", "INFOGRAFIA"];
// Los formatos basados en texto (requieren body).
export const FORMATS_WITH_BODY: ArticleFormat[] = ["ARTICULO", "EJERCICIO"];

export function isArticleFormat(value: string): value is ArticleFormat {
  return (ARTICLE_FORMATS as readonly string[]).includes(value);
}

// Esquema de alta/edición. El contenido requerido depende del formato:
// medios → enlace válido; texto → cuerpo con algo de contenido.
export const articleSchema = z
  .object({
    title: z.string().trim().min(1, "El título es obligatorio").max(200, "Máximo 200 caracteres"),
    category: z.enum(ARTICLE_CATEGORIES, { message: "Elige una categoría" }),
    format: z.enum(ARTICLE_FORMATS, { message: "Elige un formato" }),
    summary: z.string().trim().max(300, "Máximo 300 caracteres").optional().or(z.literal("")),
    body: z.string().trim().max(20000, "El contenido es demasiado largo").optional().or(z.literal("")),
    keyPoints: z.string().trim().max(4000, "Demasiados puntos clave").optional().or(z.literal("")),
    url: z.string().trim().max(2000, "El enlace es demasiado largo").optional().or(z.literal("")),
    published: z.boolean().default(false),
  })
  .superRefine((data, ctx) => {
    if (FORMATS_WITH_URL.includes(data.format)) {
      const url = data.url?.trim() ?? "";
      if (!url) {
        ctx.addIssue({ code: "custom", path: ["url"], message: "Pega el enlace del recurso." });
      } else if (!/^https?:\/\/.+/i.test(url)) {
        ctx.addIssue({ code: "custom", path: ["url"], message: "El enlace debe empezar con http:// o https://" });
      }
    }
    if (FORMATS_WITH_BODY.includes(data.format)) {
      const body = data.body?.trim() ?? "";
      if (body.length < 10) {
        ctx.addIssue({ code: "custom", path: ["body"], message: "Escribe el contenido (al menos 10 caracteres)." });
      }
    }
  });

export type ArticleInput = z.infer<typeof articleSchema>;
