"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { deactivateAssessment } from "@/app/(app)/pacientes/assessment-actions";

// Desactiva una asignación activa (con confirmación para no dar de baja
// evaluaciones que el paciente aún debe responder por error).
export function DeactivateAssessmentButton({
  assignmentId,
  instrumentName,
}: {
  assignmentId: string;
  instrumentName: string;
}) {
  const [pending, startTransition] = useTransition();

  function handleClick() {
    if (
      !window.confirm(
        `¿Desactivar la evaluación "${instrumentName}"? El paciente dejará de verla en su portal.`
      )
    ) {
      return;
    }
    startTransition(async () => {
      const result = await deactivateAssessment(assignmentId);
      if (result.ok) {
        toast.success(result.message ?? "Evaluación desactivada");
      } else {
        toast.error(result.message ?? "No se pudo desactivar la evaluación.");
      }
    });
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={handleClick}
      disabled={pending}
      className="shrink-0 text-muted-foreground hover:text-foreground"
    >
      {pending ? "Desactivando…" : "Desactivar"}
    </Button>
  );
}
