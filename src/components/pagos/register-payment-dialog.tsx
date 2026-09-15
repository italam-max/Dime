"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { format } from "date-fns";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  PAYMENT_METHODS,
  PAYMENT_STATUSES,
  type PaymentInput,
} from "@/lib/validations/payment";
import { createPayment, type PaymentActionState } from "@/app/(app)/pagos/actions";

const METHOD_LABELS: Record<PaymentInput["method"], string> = {
  EFECTIVO: "Efectivo",
  TRANSFERENCIA: "Transferencia",
  TARJETA: "Tarjeta",
  OTRO: "Otro",
};

const STATUS_LABELS: Record<PaymentInput["status"], string> = {
  PAGADO: "Pagado",
  PENDIENTE: "Pendiente",
  PARCIAL: "Parcial",
};

export interface PaymentPatientOption {
  id: string;
  label: string;
  isActive: boolean;
}

export interface PaymentAppointmentOption {
  id: string;
  label: string;
}

const initialState: PaymentActionState = {};

// Dialog para registrar un pago nuevo. Los pacientes y las citas elegibles
// llegan como props desde el server component (fuente única de datos).
export function RegisterPaymentDialog({
  patients,
  appointmentsByPatient,
}: {
  patients: PaymentPatientOption[];
  appointmentsByPatient: Record<string, PaymentAppointmentOption[]>;
}) {
  const [open, setOpen] = useState(false);
  const [patientId, setPatientId] = useState("");
  const [status, setStatus] = useState<PaymentInput["status"]>("PAGADO");
  const [appointmentId, setAppointmentId] = useState("");
  const today = format(new Date(), "yyyy-MM-dd");
  const [state, formAction, pending] = useActionState(createPayment, initialState);
  const handledId = useRef<string | undefined>(undefined);

  // Toast y cierre solo una vez por pago creado (el estado persiste al reabrir).
  useEffect(() => {
    if (state.ok && state.id && handledId.current !== state.id) {
      handledId.current = state.id;
      toast.success("Pago registrado");
      setOpen(false);
    }
  }, [state]);

  useEffect(() => {
    if (open) {
      setPatientId("");
      setStatus("PAGADO");
      setAppointmentId("");
    }
  }, [open]);

  const patientAppointments = patientId
    ? (appointmentsByPatient[patientId] ?? [])
    : [];
  const needsPaidAt = status === "PAGADO" || status === "PARCIAL";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus aria-hidden />
          Registrar pago
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Registrar pago</DialogTitle>
          <DialogDescription>
            Guarda un cobro o una deuda pendiente de un paciente.
          </DialogDescription>
        </DialogHeader>

        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="patientId">Paciente</Label>
            <Select
              name="patientId"
              value={patientId}
              onValueChange={(v) => {
                setPatientId(v);
                setAppointmentId("");
              }}
              required
            >
              <SelectTrigger id="patientId" className="w-full">
                <SelectValue placeholder="Selecciona un paciente" />
              </SelectTrigger>
              <SelectContent>
                {patients.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.label}
                    {!p.isActive ? " (proceso concluido)" : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {patientAppointments.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="appointmentId">Cita asociada (opcional)</Label>
              <Select
                name="appointmentId"
                value={appointmentId}
                onValueChange={setAppointmentId}
              >
                <SelectTrigger id="appointmentId" className="w-full">
                  <SelectValue placeholder="Sin cita asociada" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Sin cita asociada</SelectItem>
                  {patientAppointments.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="concept">Concepto</Label>
            <Input
              id="concept"
              name="concept"
              defaultValue="Sesión de terapia"
              placeholder="Sesión de terapia"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Monto</Label>
              <Input
                id="amount"
                name="amount"
                type="number"
                min="0"
                step="0.01"
                placeholder="700.00"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="method">Método</Label>
              <Select name="method" defaultValue="EFECTIVO">
                <SelectTrigger id="method" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAYMENT_METHODS.map((m) => (
                    <SelectItem key={m} value={m}>
                      {METHOD_LABELS[m]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="status">Estado</Label>
              <Select
                name="status"
                value={status}
                onValueChange={(v) => setStatus(v as PaymentInput["status"])}
              >
                <SelectTrigger id="status" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAYMENT_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {STATUS_LABELS[s]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="paidAt">Fecha de pago</Label>
              <Input
                id="paidAt"
                name="paidAt"
                type="date"
                defaultValue={today}
                disabled={!needsPaidAt}
                className="disabled:opacity-50"
              />
            </div>
          </div>
          {status === "PENDIENTE" && (
            <p className="text-xs text-muted-foreground">
              Al dejarlo pendiente, la fecha de pago queda vacía hasta que se cobre.
            </p>
          )}

          {state.message && (
            <p className="text-sm text-danger" role="alert">
              {state.message}
            </p>
          )}

          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? "Guardando…" : "Guardar pago"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
