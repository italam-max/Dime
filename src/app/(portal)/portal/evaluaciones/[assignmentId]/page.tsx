import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { endOfDay } from "date-fns";
import { ArrowLeft, Leaf } from "lucide-react";
import { getPortalPatient, hasPortalConsent } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { AssessmentItem } from "@/lib/assessments/definitions";
import { EvaluationForm } from "./evaluation-form";

export const metadata: Metadata = {
  title: "Evaluación · Dime",
};

// Pantalla de respuesta de una evaluación asignada. La asignación solo se
// carga si pertenece al paciente de la sesión; si el JSON de ítems es
// inválido o la asignación no existe, se responde 404 (no se revela nada).
// El paciente nunca ve el puntaje ni los rangos: solo confirma el envío.
export default async function EvaluacionPage({
  params,
}: {
  params: Promise<{ assignmentId: string }>;
}) {
  const { assignmentId } = await params;
  const patient = await getPortalPatient();
  if (!patient) redirect("/portal/ingresar");
  if (!(await hasPortalConsent(patient.id))) redirect("/portal/pausa");

  const assignment = await prisma.assessmentAssignment.findFirst({
    where: { id: assignmentId, patientId: patient.id },
    select: {
      id: true,
      active: true,
      nextDueAt: true,
      instrument: { select: { name: true, items: true } },
    },
  });

  if (!assignment) notFound();

  let items: AssessmentItem[];
  try {
    const parsed = JSON.parse(assignment.instrument.items) as unknown;
    if (!Array.isArray(parsed) || parsed.length === 0) throw new Error("items inválidos");
    items = parsed as AssessmentItem[];
  } catch {
    notFound();
  }

  const pendiente =
    assignment.active && assignment.nextDueAt.getTime() <= endOfDay(new Date()).getTime();

  if (!pendiente) {
    return (
      <div className="mt-10 rounded-card bg-surface p-8 text-center shadow-soft">
        <Leaf size={28} strokeWidth={1.6} className="mx-auto text-muted-foreground" aria-hidden />
        <h1 className="mt-4 font-display text-2xl font-semibold text-foreground">
          No tienes evaluaciones pendientes por ahora.
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Cuando tu terapeuta te asigne una nueva evaluación, aparecerá aquí.
        </p>
        <Link
          href="/portal"
          className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-primary transition-colors hover:underline underline-offset-4"
        >
          <ArrowLeft size={16} aria-hidden />
          Volver a mi espacio
        </Link>
      </div>
    );
  }

  return (
    <div className="mt-4">
      <Link
        href="/portal"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Volver a mi espacio
      </Link>

      <header className="mt-4">
        <h1 className="font-display text-3xl font-semibold text-foreground">
          {assignment.instrument.name}
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Piensa en cómo te has sentido durante los últimos días. No hay respuestas
          correctas o incorrectas.
        </p>
      </header>

      <EvaluationForm assignmentId={assignment.id} items={items} />
    </div>
  );
}
