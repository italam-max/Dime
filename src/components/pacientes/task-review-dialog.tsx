"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { NotebookPen } from "lucide-react";
import { saveTaskNote } from "@/app/(app)/pacientes/actions";
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

// Diálogo para que el terapeuta revise una tarea y registre su evaluación.
export function TaskReviewDialog({
  taskId,
  title,
  meta,
  note,
}: {
  taskId: string;
  title: string;
  meta: string;
  note: string | null;
}) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(note ?? "");
  const [pending, startTransition] = useTransition();
  const hasNote = Boolean(note && note.trim());

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    startTransition(async () => {
      const result = await saveTaskNote(taskId, value);
      if (result.ok) {
        toast.success(result.message ?? "Nota guardada");
        setOpen(false);
      } else {
        toast.error(result.message ?? "No se pudo guardar la nota.");
      }
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) setValue(note ?? "");
      }}
    >
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className={cn(hasNote && "text-primary")}
          aria-label={hasNote ? `Ver nota de: ${title}` : `Revisar tarea: ${title}`}
        >
          <NotebookPen data-icon="inline-start" />
          {hasNote ? "Nota" : "Revisar"}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Revisar tarea</DialogTitle>
          <DialogDescription>{title}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <p className="text-xs text-muted-foreground">{meta}</p>
          <div className="space-y-2">
            <Label htmlFor="task-note">Notas del terapeuta</Label>
            <Textarea
              id="task-note"
              rows={5}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="Observaciones sobre el cumplimiento, la calidad del registro, temas a retomar en sesión…"
              maxLength={2000}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? "Guardando…" : "Guardar nota"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
