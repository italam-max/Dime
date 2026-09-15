"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { togglePatientActive } from "@/app/(app)/pacientes/actions";

// Botón de baja lógica / reactivación con confirmación nativa.
export function ToggleActiveButton({
  patientId,
  isActive,
}: {
  patientId: string;
  isActive: boolean;
}) {
  const [pending, startTransition] = useTransition();

  function handleClick() {
    const message = isActive
      ? "¿Das de baja a este paciente? Su historial clínico y de pagos se conservará."
      : "¿Reactivas a este paciente? Volverá a aparecer como activo en tu listado.";
    if (!confirm(message)) return;

    startTransition(async () => {
      await togglePatientActive(patientId, !isActive);
      toast.success(isActive ? "Paciente dado de baja" : "Paciente reactivado");
    });
  }

  return (
    <Button
      type="button"
      variant={isActive ? "destructive" : "outline"}
      size="sm"
      onClick={handleClick}
      disabled={pending}
    >
      {pending ? "Guardando…" : isActive ? "Dar de baja" : "Reactivar"}
    </Button>
  );
}
