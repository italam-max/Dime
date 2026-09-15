"use client";

import { useActionState, useEffect, useState } from "react";
import { toast } from "sonner";
import { CalendarIcon, Plus } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { createAppointment, type AppointmentActionState } from "@/app/(app)/agenda/actions";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn, patientFullName } from "@/lib/utils";
import { toLocalISODate } from "./utils";

export type AgendaPatient = { id: string; nombre: string; apellidos: string };

const initialState: AppointmentActionState = { ok: false };

const DURATIONS = [
  { value: "30", label: "30 minutos" },
  { value: "45", label: "45 minutos" },
  { value: "60", label: "1 hora" },
  { value: "90", label: "1 hora 30 min" },
];

// Botón "Nueva cita" + diálogo con el formulario de alta.
export function NewAppointmentDialog({ patients }: { patients: AgendaPatient[] }) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(createAppointment, initialState);
  const [patientId, setPatientId] = useState("");
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [duration, setDuration] = useState("60");
  const [type, setType] = useState("PRESENCIAL");

  useEffect(() => {
    if (state.ok) {
      toast.success(state.message);
      setOpen(false);
    } else if (state.message && !state.fieldErrors) {
      toast.error(state.message);
    }
  }, [state]);

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) {
          // Reinicia el formulario cada vez que se abre.
          setPatientId("");
          setDate(new Date());
          setDuration("60");
          setType("PRESENCIAL");
        }
      }}
    >
      <DialogTrigger asChild>
        <Button>
          <Plus data-icon="inline-start" />
          Nueva cita
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Agendar una cita</DialogTitle>
          <DialogDescription>
            Elige paciente, fecha y hora. Revisaremos que no se cruce con otra sesión.
          </DialogDescription>
        </DialogHeader>

        <form action={action} className="space-y-4">
          <input type="hidden" name="patientId" value={patientId} />
          <input type="hidden" name="date" value={date ? toLocalISODate(date) : ""} />
          <input type="hidden" name="duration" value={duration} />
          <input type="hidden" name="type" value={type} />

          <div className="space-y-2">
            <Label>Paciente</Label>
            <Select value={patientId} onValueChange={setPatientId}>
              <SelectTrigger className="w-full" aria-invalid={Boolean(state.fieldErrors?.patientId)}>
                <SelectValue placeholder="Selecciona un paciente" />
              </SelectTrigger>
              <SelectContent>
                {patients.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {patientFullName(p)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {state.fieldErrors?.patientId && (
              <p className="text-xs text-danger">{state.fieldErrors.patientId[0]}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Fecha</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start font-normal",
                      !date && "text-muted-foreground"
                    )}
                    aria-invalid={Boolean(state.fieldErrors?.date)}
                  >
                    <CalendarIcon />
                    {date ? format(date, "d 'de' MMM yyyy", { locale: es }) : "Elige un día"}
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
              <Label htmlFor="time">Hora de inicio</Label>
              <Input
                id="time"
                name="time"
                type="time"
                defaultValue="10:00"
                aria-invalid={Boolean(state.fieldErrors?.time)}
              />
              {state.fieldErrors?.time && (
                <p className="text-xs text-danger">{state.fieldErrors.time[0]}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Duración</Label>
              <Select value={duration} onValueChange={setDuration}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DURATIONS.map((d) => (
                    <SelectItem key={d.value} value={d.value}>
                      {d.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Tipo de sesión</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PRESENCIAL">Presencial</SelectItem>
                  <SelectItem value="ONLINE">En línea</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="fee">Tarifa (opcional)</Label>
            <Input
              id="fee"
              name="fee"
              type="number"
              min="0"
              step="any"
              placeholder="p. ej. 700"
              aria-invalid={Boolean(state.fieldErrors?.fee)}
            />
            {state.fieldErrors?.fee && (
              <p className="text-xs text-danger">{state.fieldErrors.fee[0]}</p>
            )}
          </div>

          {state.message && !state.fieldErrors && (
            <p className="text-sm text-danger" role="alert">
              {state.message}
            </p>
          )}

          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? "Agendando…" : "Agendar cita"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
