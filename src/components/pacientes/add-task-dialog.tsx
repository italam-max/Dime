"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { createPatientTask } from "@/app/(app)/pacientes/actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// Botón "Agregar tarea" + diálogo para crear una tarea entre sesiones desde
// la ficha del paciente, sin necesidad de completar una sesión.
export function AddTaskDialog({ patientId }: { patientId: string }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [pending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    startTransition(async () => {
      const result = await createPatientTask(patientId, {
        title,
        dueDate: dueDate || undefined,
      });
      if (result.ok) {
        toast.success(result.message ?? "Tarea agregada");
        setTitle("");
        setDueDate("");
        setOpen(false);
      } else {
        toast.error(result.message ?? "No se pudo agregar la tarea.");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" size="sm">
          <Plus data-icon="inline-start" />
          Agregar tarea
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Nueva tarea entre sesiones</DialogTitle>
          <DialogDescription>
            Un encargo para el paciente entre una sesión y la siguiente. Aparecerá en su
            portal si tiene acceso.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="task-title">Tarea</Label>
            <Input
              id="task-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="p. ej. Registro diario de emociones"
              maxLength={200}
              autoFocus
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="task-due">Fecha límite (opcional)</Label>
            <Input
              id="task-due"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={pending || title.trim() === ""}>
              {pending ? "Agregando…" : "Agregar tarea"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
