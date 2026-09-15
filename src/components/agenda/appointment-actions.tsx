"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { CalendarIcon, ChevronDown, X } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  cancelAppointment,
  completeAppointment,
  confirmAppointment,
  noShowAppointment,
  rescheduleAppointment,
  type AppointmentActionState,
} from "@/app/(app)/agenda/actions";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { toLocalISODate } from "./utils";

export type ActionableAppointment = {
  id: string;
  status: string;
  startAt: Date;
  endAt: Date;
  patientName: string;
  sessionNotes: string | null;
  sessionTasks: string | null;
};

const initialState: AppointmentActionState = { ok: false };

type DraftTask = { title: string; dueDate: string };

type DialogKind = "complete" | "reschedule" | "notes" | null;

// Acciones disponibles según el estado de la cita.
export function AppointmentActions({ appointment }: { appointment: ActionableAppointment }) {
  const [dialog, setDialog] = useState<DialogKind>(null);
  const [pending, startTransition] = useTransition();

  const { status } = appointment;
  const isOpen = status === "PENDIENTE" || status === "CONFIRMADA";

  function runQuick(action: (fd: FormData) => Promise<AppointmentActionState>) {
    const fd = new FormData();
    fd.append("id", appointment.id);
    startTransition(async () => {
      const result = await action(fd);
      if (result.ok) {
        toast.success(result.message);
      } else {
        toast.error(result.message ?? "No se pudo completar la acción.");
      }
    });
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" disabled={pending}>
            Acciones
            <ChevronDown />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {status === "PENDIENTE" && (
            <DropdownMenuItem onSelect={() => runQuick(confirmAppointment)}>
              Confirmar cita
            </DropdownMenuItem>
          )}
          {isOpen && (
            <>
              <DropdownMenuItem onSelect={() => setDialog("complete")}>
                Completar sesión
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setDialog("reschedule")}>
                Reprogramar
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={() => runQuick(noShowAppointment)}>
                No asistió
              </DropdownMenuItem>
              <DropdownMenuItem
                variant="destructive"
                onSelect={() => runQuick(cancelAppointment)}
              >
                Cancelar cita
              </DropdownMenuItem>
            </>
          )}
          {status === "COMPLETADA" && (
            <DropdownMenuItem onSelect={() => setDialog("notes")}>Ver notas</DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <CompleteDialog
        appointment={appointment}
        open={dialog === "complete"}
        onOpenChange={(open) => setDialog(open ? "complete" : null)}
      />
      <RescheduleDialog
        appointment={appointment}
        open={dialog === "reschedule"}
        onOpenChange={(open) => setDialog(open ? "reschedule" : null)}
      />
      <NotesDialog
        appointment={appointment}
        open={dialog === "notes"}
        onOpenChange={(open) => setDialog(open ? "notes" : null)}
      />
    </>
  );
}

function CompleteDialog({
  appointment,
  open,
  onOpenChange,
}: {
  appointment: ActionableAppointment;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [state, action, pending] = useActionState(completeAppointment, initialState);

  useEffect(() => {
    if (state.ok) {
      toast.success(state.message);
      onOpenChange(false);
    }
  }, [state, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Completar sesión</DialogTitle>
          <DialogDescription>
            Guarda el resumen clínico y los acuerdos para {appointment.patientName}.
          </DialogDescription>
        </DialogHeader>

        <form action={action} className="space-y-4">
          <input type="hidden" name="id" value={appointment.id} />

          <div className="space-y-2">
            <Label htmlFor="sessionNotes">Resumen de la sesión</Label>
            <Textarea
              id="sessionNotes"
              name="sessionNotes"
              rows={4}
              placeholder="Avances, temas trabajados, observaciones clínicas…"
            />
          </div>

          <TaskListEditor key={open ? "abierto" : "cerrado"} />

          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? "Guardando…" : "Guardar y completar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function TaskListEditor() {
  const [tasks, setTasks] = useState<DraftTask[]>([{ title: "", dueDate: "" }]);

  function update(index: number, patch: Partial<DraftTask>) {
    setTasks((prev) => prev.map((task, i) => (i === index ? { ...task, ...patch } : task)));
  }

  function remove(index: number) {
    setTasks((prev) => prev.filter((_, i) => i !== index));
  }

  // Solo las tareas con título se envían; viajan como JSON en un campo oculto.
  const value = JSON.stringify(
    tasks
      .filter((task) => task.title.trim() !== "")
      .map((task) => ({ title: task.title.trim(), dueDate: task.dueDate }))
  );

  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between">
        <Label>Tareas / acuerdos</Label>
        <span className="text-xs text-muted-foreground">
          El paciente las verá en su portal como una lista para marcar.
        </span>
      </div>

      <div className="space-y-2">
        {tasks.map((task, index) => (
          <div key={index} className="flex items-center gap-2">
            <Input
              value={task.title}
              onChange={(event) => update(index, { title: event.target.value })}
              placeholder="Ej. Practicar la respiración 5 minutos al día"
              aria-label={`Tarea ${index + 1}`}
            />
            <Input
              type="date"
              value={task.dueDate}
              onChange={(event) => update(index, { dueDate: event.target.value })}
              className="w-40 shrink-0"
              aria-label={`Vencimiento de la tarea ${index + 1} (opcional)`}
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => remove(index)}
              disabled={tasks.length === 1}
              aria-label={`Quitar tarea ${index + 1}`}
              className="shrink-0 px-2 text-muted-foreground"
            >
              <X size={16} aria-hidden />
            </Button>
          </div>
        ))}
      </div>

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setTasks((prev) => [...prev, { title: "", dueDate: "" }])}
      >
        Agregar tarea
      </Button>

      <input type="hidden" name="tasksJson" value={value} />
    </div>
  );
}

function RescheduleDialog({
  appointment,
  open,
  onOpenChange,
}: {
  appointment: ActionableAppointment;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [state, action, pending] = useActionState(rescheduleAppointment, initialState);
  const [date, setDate] = useState<Date | undefined>(appointment.startAt);

  useEffect(() => {
    if (open) setDate(appointment.startAt);
  }, [open, appointment.startAt]);

  useEffect(() => {
    if (state.ok) {
      toast.success(state.message);
      onOpenChange(false);
    } else if (state.message && !state.fieldErrors) {
      toast.error(state.message);
    }
  }, [state, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Reprogramar cita</DialogTitle>
          <DialogDescription>
            Elige la nueva fecha y hora para {appointment.patientName}. Se conserva la duración
            y el estado actuales.
          </DialogDescription>
        </DialogHeader>

        <form action={action} className="space-y-4">
          <input type="hidden" name="id" value={appointment.id} />
          <input type="hidden" name="date" value={date ? toLocalISODate(date) : ""} />

          <div className="space-y-2">
            <Label>Nueva fecha</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn("w-full justify-start font-normal")}
                  aria-invalid={Boolean(state.fieldErrors?.date)}
                >
                  <CalendarIcon />
                  {date ? format(date, "EEEE, d 'de' MMM yyyy", { locale: es }) : "Elige un día"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  locale={es}
                />
              </PopoverContent>
            </Popover>
            {state.fieldErrors?.date && (
              <p className="text-xs text-danger">{state.fieldErrors.date[0]}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="reschedule-time">Nueva hora</Label>
            <Input
              id="reschedule-time"
              name="time"
              type="time"
              defaultValue={format(appointment.startAt, "HH:mm")}
              aria-invalid={Boolean(state.fieldErrors?.time)}
            />
            {state.fieldErrors?.time && (
              <p className="text-xs text-danger">{state.fieldErrors.time[0]}</p>
            )}
          </div>

          {state.message && !state.fieldErrors && (
            <p className="text-sm text-danger" role="alert">
              {state.message}
            </p>
          )}

          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? "Reprogramando…" : "Reprogramar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function NotesDialog({
  appointment,
  open,
  onOpenChange,
}: {
  appointment: ActionableAppointment;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Notas de la sesión</DialogTitle>
          <DialogDescription>
            {appointment.patientName} ·{" "}
            {format(appointment.startAt, "d 'de' MMM yyyy, h:mm a", { locale: es })}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Resumen de la sesión
            </p>
            <p className="text-sm whitespace-pre-line text-foreground">
              {appointment.sessionNotes?.trim() || "No se registró un resumen para esta sesión."}
            </p>
          </div>
          <div className="space-y-1.5">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Tareas / acuerdos
            </p>
            <p className="text-sm whitespace-pre-line text-foreground">
              {appointment.sessionTasks?.trim() || "No se registraron acuerdos."}
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
