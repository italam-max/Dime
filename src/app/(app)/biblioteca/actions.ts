"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { articleSchema } from "@/lib/validations/article";

// Estado devuelto por las actions de la biblioteca al cliente (serializable).
export interface ArticleFormState {
  ok?: boolean;
  articleId?: string;
  message?: string;
  errors?: Record<string, string[] | undefined>;
}

// Revalida el FormData con el esquema Zod (única fuente de validación).
function parseArticleForm(formData: FormData) {
  return articleSchema.safeParse({
    title: formData.get("title"),
    category: formData.get("category"),
    format: formData.get("format"),
    summary: formData.get("summary"),
    body: formData.get("body"),
    keyPoints: formData.get("keyPoints"),
    url: formData.get("url"),
    published: formData.get("published") === "on" || formData.get("published") === "true",
  });
}

// Normaliza los datos validados a columnas de Article: los opcionales vacíos se
// guardan como null y, según el formato, se limpia el campo que no aplica
// (texto en medios, enlace en texto).
function toArticleData(input: import("@/lib/validations/article").ArticleInput) {
  const usaEnlace = ["VIDEO", "AUDIO", "INFOGRAFIA"].includes(input.format);
  const blank = (v?: string) => (v && v.trim() !== "" ? v.trim() : null);
  return {
    title: input.title,
    category: input.category,
    format: input.format,
    summary: blank(input.summary),
    published: input.published,
    body: usaEnlace ? null : blank(input.body),
    keyPoints: usaEnlace ? null : blank(input.keyPoints),
    url: usaEnlace ? blank(input.url) : null,
  };
}

// Alta de artículo. Exige sesión de terapeuta: la biblioteca es privada por cuenta.
export async function createArticle(
  _prev: ArticleFormState,
  formData: FormData
): Promise<ArticleFormState> {
  const user = await getCurrentUser();
  if (!user) return { message: "Tu sesión ha caducado. Entra de nuevo." };

  const parsed = parseArticleForm(formData);
  if (!parsed.success) {
    return {
      message: "Revisa los datos marcados e inténtalo de nuevo.",
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  const article = await prisma.article.create({ data: toArticleData(parsed.data) });

  revalidatePath("/biblioteca");
  return { ok: true, articleId: article.id, message: "Artículo guardado" };
}

// Edición de artículo: el id viaja en el FormData (campo oculto del formulario).
export async function updateArticle(
  _prev: ArticleFormState,
  formData: FormData
): Promise<ArticleFormState> {
  const user = await getCurrentUser();
  if (!user) return { message: "Tu sesión ha caducado. Entra de nuevo." };

  const id = formData.get("id");
  if (typeof id !== "string" || id === "") {
    return { message: "No se encontró el artículo. Inténtalo de nuevo." };
  }

  const parsed = parseArticleForm(formData);
  if (!parsed.success) {
    return {
      message: "Revisa los datos marcados e inténtalo de nuevo.",
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  const article = await prisma.article.update({
    where: { id },
    data: toArticleData(parsed.data),
  });

  revalidatePath("/biblioteca");
  revalidatePath(`/biblioteca/${article.id}/editar`);
  return { ok: true, articleId: article.id, message: "Cambios guardados" };
}

// Borrado duro: las asignaciones (ArticleAssignment) cascadan por la relación.
export async function deleteArticle(articleId: string): Promise<{ ok?: boolean; message?: string }> {
  const user = await getCurrentUser();
  if (!user) return { message: "Tu sesión ha caducado. Entra de nuevo." };

  await prisma.article.delete({ where: { id: articleId } });

  revalidatePath("/biblioteca");
  return { ok: true, message: "Artículo eliminado" };
}

// Alterna borrador/publicado sin tocar el contenido.
export async function toggleArticlePublished(
  articleId: string
): Promise<{ ok?: boolean; message?: string }> {
  const user = await getCurrentUser();
  if (!user) return { message: "Tu sesión ha caducado. Entra de nuevo." };

  const article = await prisma.article.findUnique({
    where: { id: articleId },
    select: { published: true },
  });
  if (!article) return { message: "No se encontró el artículo." };

  await prisma.article.update({
    where: { id: articleId },
    data: { published: !article.published },
  });

  revalidatePath("/biblioteca");
  revalidatePath(`/biblioteca/${articleId}/editar`);
  return {
    ok: true,
    message: article.published ? "Artículo pasado a borrador" : "Artículo publicado",
  };
}

// Asigna un artículo a varios pacientes: crea assignments solo para pacientes
// activos que no lo tengan ya. Devuelve cuántas asignaciones nuevas creó.
export async function assignArticle(
  articleId: string,
  patientIds: string[]
): Promise<{ ok?: boolean; message?: string; assigned?: number }> {
  const user = await getCurrentUser();
  if (!user) return { message: "Tu sesión ha caducado. Entra de nuevo." };

  const article = await prisma.article.findUnique({
    where: { id: articleId },
    select: { id: true },
  });
  if (!article) return { message: "No se encontró el artículo." };

  const uniqueIds = [...new Set(patientIds)].filter((id) => id !== "");
  if (uniqueIds.length === 0) return { message: "Selecciona al menos un paciente." };

  const [activePatients, existing] = await Promise.all([
    prisma.patient.findMany({
      where: { id: { in: uniqueIds }, isActive: true },
      select: { id: true },
    }),
    prisma.articleAssignment.findMany({
      where: { articleId, patientId: { in: uniqueIds } },
      select: { patientId: true },
    }),
  ]);

  const alreadyAssigned = new Set(existing.map((a) => a.patientId));
  const newIds = activePatients.map((p) => p.id).filter((id) => !alreadyAssigned.has(id));

  if (newIds.length === 0) {
    return { message: "Esos pacientes ya tienen este artículo asignado." };
  }

  await prisma.articleAssignment.createMany({
    data: newIds.map((patientId) => ({ articleId, patientId })),
  });

  revalidatePath("/biblioteca");
  revalidatePath(`/biblioteca/${articleId}/editar`);
  for (const patientId of newIds) revalidatePath(`/pacientes/${patientId}`);
  return {
    ok: true,
    assigned: newIds.length,
    message:
      newIds.length === 1
        ? "Artículo asignado a 1 paciente"
        : `Artículo asignado a ${newIds.length} pacientes`,
  };
}

// Quita una asignación concreta (por su id).
export async function unassignArticle(
  assignmentId: string
): Promise<{ ok?: boolean; message?: string }> {
  const user = await getCurrentUser();
  if (!user) return { message: "Tu sesión ha caducado. Entra de nuevo." };

  const assignment = await prisma.articleAssignment.findUnique({
    where: { id: assignmentId },
    select: { patientId: true, articleId: true },
  });
  if (!assignment) return { message: "No se encontró la asignación." };

  await prisma.articleAssignment.delete({ where: { id: assignmentId } });

  revalidatePath("/biblioteca");
  revalidatePath(`/biblioteca/${assignment.articleId}/editar`);
  revalidatePath(`/pacientes/${assignment.patientId}`);
  return { ok: true, message: "Asignación quitada" };
}
