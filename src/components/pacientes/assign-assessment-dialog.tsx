"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { addDays, format } from "date-fns";
import { Plus } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { assignAssessment } from "@/app/(app)/pacientes/assessment-actions";
import {
  ASSESSMENT_FREQUENCIES,
  FREQUENCY_LABELS,
  type AssessmentFrequency,
} from "@/lib/assessments/definitions";

// Fecha sugerida según la frecuencia: hoy para Única, +7 para Semanal,
// +14 para Quincenal. El terapeuta siempre puede ajustarla a mano.
function fechaSugerida(frequency: AssessmentFrequency): string {
  const dias: Record<AssessmentFrequency, number> = {
    UNICA: 0,
    SEMANAL: 7,
    QUINCENAL: 14,
  };
  return format(addDays(new Date(), dias[frequency]), "yyyy-MM-dd");
}

// Dialog de asignación: instrumento activo + frecuencia + próxima fecha.
export function AssignAssessmentDialog({
  patientId,
  instruments,
}: {
  patientId: string;
  instruments: { id: string; name: string }[];
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [instrumentId, setInstrumentId] = useState(instruments[0]?.id ?? "");
  const [frequency, setFrequency] = useState<AssessmentFrequency>("SEMANAL");
  const [nextDueAt, setNextDueAt] = useState(fechaSugerida("SEMANAL"));

  function handleFrequencyChange(value: AssessmentFrequency) {
    setFrequency(value);
    setNextDueAt(fechaSugerida(value));
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    startTransition(async () => {
      const result = await assignAssessment(patientId, instrumentId, frequency, nextDueAt);
      if (result.ok) {
        toast.success(result.message ?? "Evaluación asignada");
        setOpen(false);
      } else {
        toast.error(result.message ?? "No se pudo asignar la evaluación.");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" size="sm">
          <Plus data-icon="inline-start" />
          Asignar evaluación
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Asignar evaluación</DialogTitle>
          <DialogDescription>
            El paciente la verá en su portal cuando llegue la fecha indicada.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="instrumento">Instrumento</Label>
            <Select value={instrumentId} onValueChange={setInstrumentId}>
              <SelectTrigger id="instrumento" className="w-full">
                <SelectValue placeholder="Selecciona un instrumento" />
              </SelectTrigger>
              <SelectContent>
                {instruments.map((instrument) => (
                  <SelectItem key={instrument.id} value={instrument.id}>
                    {instrument.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="frecuencia">Frecuencia</Label>
            <Select
              value={frequency}
              onValueChange={(value) =>
                handleFrequencyChange(value as AssessmentFrequency)
              }
            >
              <SelectTrigger id="frecuencia" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ASSESSMENT_FREQUENCIES.map((f) => (
                  <SelectItem key={f} value={f}>
                    {FREQUENCY_LABELS[f]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="proxima-fecha">Próxima fecha</Label>
            <Input
              id="proxima-fecha"
              type="date"
              value={nextDueAt}
              onChange={(event) => setNextDueAt(event.target.value)}
              required
            />
          </div>

          <DialogFooter>
            <Button type="submit" disabled={pending || !instrumentId}>
              {pending ? "Asignando…" : "Asignar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
