"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  completePortalTask,
  reopenPortalTask,
} from "@/app/(portal)/portal/acciones";

// Botón de un solo toque para marcar la tarea (o reabrirla si fue por error).
// El portal es mobile-first: área de toque generosa.
export function PortalTaskToggle({
  taskId,
  completed,
  title,
}: {
  taskId: string;
  completed: boolean;
  title: string;
}) {
  const [pending, startTransition] = useTransition();

  function handleClick() {
    startTransition(async () => {
      const result = completed
        ? await reopenPortalTask(taskId)
        : await completePortalTask(taskId);
      if (result.ok) {
        toast.success(completed ? "La tarea volvió a pendientes" : "¡Buen trabajo!");
      } else {
        toast.error(result.message ?? "No se pudo actualizar la tarea.");
      }
    });
  }

  if (completed) {
    return (
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={handleClick}
        disabled={pending}
        className="shrink-0 text-muted-foreground"
      >
        {pending ? "…" : "Deshacer"}
      </Button>
    );
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={handleClick}
      disabled={pending}
      aria-label={`Marcar como hecha: ${title}`}
      className="min-h-11 shrink-0 sm:min-h-9"
    >
      <Check aria-hidden />
      {pending ? "…" : "Hecha"}
    </Button>
  );
}
