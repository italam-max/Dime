"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Check, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toggleTaskDone } from "@/app/(app)/pacientes/actions";

// Marca una tarea como hecha o la reabre (lado terapeuta, desde la ficha).
export function TaskToggleButton({
  taskId,
  done,
  title,
}: {
  taskId: string;
  done: boolean;
  title: string;
}) {
  const [pending, startTransition] = useTransition();

  function handleClick() {
    startTransition(async () => {
      const result = await toggleTaskDone(taskId, !done);
      if (result.ok) {
        toast.success(result.message ?? "Tarea actualizada");
      } else {
        toast.error(result.message ?? "No se pudo actualizar la tarea.");
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
      aria-label={done ? `Reabrir tarea: ${title}` : `Marcar como hecha: ${title}`}
    >
      {done ? <RotateCcw data-icon="inline-start" /> : <Check data-icon="inline-start" />}
      {pending ? "…" : done ? "Reabrir" : "Hecha"}
    </Button>
  );
}
