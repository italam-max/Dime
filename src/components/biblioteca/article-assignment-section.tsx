"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { BookOpen, X } from "lucide-react";
import {
  assignArticle,
  unassignArticle,
} from "@/app/(app)/biblioteca/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export interface AssignmentPatient {
  id: string;
  nombre: string;
  apellidos: string;
}

export interface ExistingAssignment {
  id: string;
  assignedAt: Date;
  readAt: Date | null;
  patient: AssignmentPatient;
}

// Asignación de un artículo a pacientes desde su edición: checkboxes de
// pacientes activos, lista de asignaciones actuales con estado de lectura y
// botón para quitar. Las fechas viajan serializadas desde el servidor.
export function ArticleAssignmentSection({
  articleId,
  patients,
  assignments,
}: {
  articleId: string;
  patients: AssignmentPatient[];
  assignments: ExistingAssignment[];
}) {
  const [pending, startTransition] = useTransition();
  const [selected, setSelected] = useState<string[]>([]);

  const assignedPatientIds = new Set(assignments.map((a) => a.patient.id));
  const availablePatients = patients.filter((p) => !assignedPatientIds.has(p.id));

  function toggle(patientId: string) {
    setSelected((prev) =>
      prev.includes(patientId) ? prev.filter((id) => id !== patientId) : [...prev, patientId]
    );
  }

  function handleAssign() {
    startTransition(async () => {
      const result = await assignArticle(articleId, selected);
      if (result.ok) {
        toast.success(result.message ?? "Artículo asignado");
        setSelected([]);
      } else {
        toast.error(result.message ?? "No se pudo asignar el artículo.");
      }
    });
  }

  function handleUnassign(assignmentId: string, patientName: string) {
    if (!window.confirm(`¿Quitar la asignación de ${patientName}?`)) return;
    startTransition(async () => {
      const result = await unassignArticle(assignmentId);
      if (result.ok) {
        toast.success(result.message ?? "Asignación quitada");
      } else {
        toast.error(result.message ?? "No se pudo quitar la asignación.");
      }
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Asignar a pacientes</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {availablePatients.length === 0 ? (
          <p className="text-sm leading-relaxed text-muted-foreground">
            {patients.length === 0
              ? "No tienes pacientes activos. Los artículos se asignan desde la ficha de cada paciente o desde aquí."
              : "Todos tus pacientes activos ya tienen este artículo."}
          </p>
        ) : (
          <div className="space-y-3">
            <ul className="grid gap-2 sm:grid-cols-2">
              {availablePatients.map((patient) => (
                <li key={patient.id}>
                  <label className="flex items-center gap-2 rounded-control px-2 py-1.5 text-sm text-foreground hover:bg-surface-muted">
                    <input
                      type="checkbox"
                      className="size-4 accent-primary"
                      checked={selected.includes(patient.id)}
                      onChange={() => toggle(patient.id)}
                    />
                    {patient.nombre} {patient.apellidos}
                  </label>
                </li>
              ))}
            </ul>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAssign}
              disabled={pending || selected.length === 0}
            >
              <BookOpen data-icon="inline-start" />
              {pending ? "Asignando…" : selected.length > 0 ? `Asignar (${selected.length})` : "Asignar"}
            </Button>
          </div>
        )}

        {assignments.length > 0 && (
          <div className="space-y-2 border-t border-border pt-4">
            <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
              Asignaciones actuales
            </p>
            <ul className="divide-y divide-border">
              {assignments.map((assignment) => (
                <li
                  key={assignment.id}
                  className="flex items-center justify-between gap-4 py-2.5 first:pt-1 last:pb-0"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">
                      {assignment.patient.nombre} {assignment.patient.apellidos}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      Asignado el{" "}
                      {new Date(assignment.assignedAt).toLocaleDateString("es-MX", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <Badge variant={assignment.readAt ? "secondary" : "ghost"}>
                      {assignment.readAt
                        ? `Leído el ${new Date(assignment.readAt).toLocaleDateString("es-MX", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}`
                        : "Sin leer"}
                    </Badge>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        handleUnassign(
                          assignment.id,
                          `${assignment.patient.nombre} ${assignment.patient.apellidos}`
                        )
                      }
                      disabled={pending}
                      aria-label={`Quitar asignación de ${assignment.patient.nombre} ${assignment.patient.apellidos}`}
                      className="px-2 text-muted-foreground"
                    >
                      <X size={16} aria-hidden />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
