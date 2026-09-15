import { z } from "zod";

// Categorías de artículos psicoeducativos (valores persistidos en Article.category).
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

// Esquema de alta/edición de artículo de la biblioteca.
export const articleSchema = z.object({
  title: z.string().trim().min(1, "El título es obligatorio").max(200, "Máximo 200 caracteres"),
  category: z.enum(ARTICLE_CATEGORIES, { message: "Elige una categoría" }),
  body: z.string().trim().min(10, "El cuerpo necesita al menos 10 caracteres"),
  published: z.boolean().default(false),
});

export type ArticleInput = z.infer<typeof articleSchema>;
